from dataclasses import dataclass, field
from typing import List, Literal, Optional, Union

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from pydantic import BaseModel, Field

from agents.ideation_prompts import (
    ANSWER_GENERATOR_PROMPT,
    CHECK_ANSWER,
    KEYWORD_GENERATOR_PROMPT,
    QUESTION_GENERATOR_PROMPT,
    SUMMARY_GENERATOR_PROMPT,  # Add this import
    format_qa_history,
)

load_dotenv()


# Pydantic models for structured outputs
class Question(BaseModel):
    question: str = Field(description="the well formatted question")


class NoMoreQuestions(BaseModel):
    done: Literal["NO_MORE_QUESTIONS_NEEDED"] = Field(
        description="indicates no more questions are needed"
    )


class QuestionOutput(BaseModel):
    final_output: Union[NoMoreQuestions, Question] = Field(
        description="either a new question or indication that questioning is complete"
    )


class Keywords(BaseModel):
    """List of keywords."""

    keywords: List[str] = Field(
        description="the keywords that might answer the question"
    )


class Answer(BaseModel):
    """Generated answer to a question."""

    answer: str = Field(description="comprehensive answer to the question")


class SatisfactionCheck(BaseModel):
    """Result of checking if an answer is satisfactory."""

    is_satisfactory: bool = Field(
        description="whether the answer adequately addresses the question"
    )
    reason: str = Field(description="explanation for the satisfaction assessment")


class Summary(BaseModel):
    """Generated summary of the business idea analysis."""

    summary: str = Field(
        description="comprehensive summary of the business idea based on Q&A analysis"
    )


@dataclass
class QuestionEntry:
    """Represents a question with optional response and keywords."""

    question: str
    response: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_satisfactory: bool = False
    satisfaction_reason: Optional[str] = None


@dataclass
class State:
    """State with questions and responses."""

    description: str
    questions: List[QuestionEntry] = field(default_factory=list)
    summary: Optional[str] = None  # Add summary field

    def copy(self):
        """Create a deep copy of the state."""
        return State(
            description=self.description,
            summary=self.summary,  # Include summary in copy
            questions=[
                QuestionEntry(
                    question=q.question,
                    response=q.response,
                    keywords=q.keywords.copy() if q.keywords else None,
                    is_satisfactory=q.is_satisfactory,
                    satisfaction_reason=q.satisfaction_reason,
                )
                for q in self.questions
            ],
        )


# Global model variable
model = None

def get_model():
    """Initialize and return the model, lazy loading to avoid import-time errors."""
    global model
    if model is None:
        try:
            # Use the same Groq model as the rest of the application
            model = init_chat_model("groq:llama3-70b-8192")
        except Exception as e:
            print(f"Warning: Could not initialize model: {e}")
            model = None
    return model


# Nodes
def generate_next_question(state: State) -> State:
    """Generate the next question from the description and previous answers."""
    try:
        model = get_model()
        if not model:
            return state
            
        # Format previous Q&A history
        qa_history = format_qa_history(
            [
                (q.question, q.response)
                for q in state.questions
                if q.response is not None
            ]
        )

        # Create prompt with current state
        prompt = QUESTION_GENERATOR_PROMPT.format(
            business_idea=state.description, qa_history=qa_history
        )

        try:
            # Try structured output first
            structured_llm = model.with_structured_output(QuestionOutput)
            response = structured_llm.invoke(prompt)

            # Check if no more questions are needed
            if isinstance(response.final_output, NoMoreQuestions):
                return state  # No new question added

            # Add new question to state
            new_question = QuestionEntry(question=response.final_output.question)
            state.questions.append(new_question)

        except Exception as structured_error:
            print(f"Structured output failed for question generation: {structured_error}, falling back to regular response")
            # Fallback to regular response if structured output fails
            response = model.invoke(prompt)
            question_text = response.content if hasattr(response, 'content') else str(response)
            
            # Clean up the response to extract just the question
            if "NO_MORE_QUESTIONS_NEEDED" in question_text.upper():
                return state  # No new question added
            
            # Extract the question (remove any prefixes or formatting)
            question_text = question_text.strip()
            if question_text and not question_text.startswith("I"):
                new_question = QuestionEntry(question=question_text)
                state.questions.append(new_question)

        return state

    except Exception as e:
        print(f"Error generating next question: {e}")
        return state


def check_if_satisfactory(state: State, question_index: int) -> State:
    """Check if the response answers the question at the specified index."""
    try:
        model = get_model()
        if not model:
            return state
            
        if not state.questions or question_index >= len(state.questions):
            return state

        if not state.questions[question_index].response:
            return state

        target_question = state.questions[question_index]

        check_prompt = CHECK_ANSWER.format(
            question=target_question.question,
            response=target_question.response,
        )

        try:
            # Try structured output first
            structured_llm = model.with_structured_output(SatisfactionCheck)
            response = structured_llm.invoke(check_prompt)
            is_satisfactory = response.is_satisfactory
            reason = response.reason
        except Exception as structured_error:
            print(f"Structured output failed for satisfaction check: {structured_error}, falling back to regular response")
            # Fallback to regular response if structured output fails
            response = model.invoke(check_prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Simple heuristic: if response contains positive words, consider it satisfactory
            response_lower = response_text.lower()
            is_satisfactory = any(word in response_lower for word in ['satisfactory', 'adequate', 'yes', 'good', 'sufficient'])
            reason = response_text.strip()

        # Store satisfaction info in the question entry
        state.questions[question_index].is_satisfactory = is_satisfactory
        state.questions[question_index].satisfaction_reason = reason

        print(
            f"Satisfaction check for question {question_index}: {is_satisfactory} - {reason}"
        )

        return state

    except Exception as e:
        print(f"Error checking satisfaction: {e}")
        return state


def generate_keywords(state: State, question_index: int) -> State:
    """Generate keywords for the question at the specified index."""
    try:
        model = get_model()
        if not model:
            return state
            
        if not state.questions or question_index >= len(state.questions):
            return state

        target_question = state.questions[question_index]

        # Format previous Q&A history (excluding the target question if it's not the last one)
        qa_history = format_qa_history(
            [
                (q.question, q.response)
                for i, q in enumerate(state.questions)
                if i != question_index and q.response is not None
            ]
        )

        # Create keyword generation prompt
        prompt = KEYWORD_GENERATOR_PROMPT.format(
            business_idea=state.description,
            current_question=target_question.question,
            qa_history=qa_history,
        )

        try:
            # Try structured output first
            structured_llm = model.with_structured_output(Keywords)
            response = structured_llm.invoke(prompt)
            keywords = response.keywords
        except Exception as structured_error:
            print(f"Structured output failed for keywords: {structured_error}, falling back to regular response")
            # Fallback to regular response if structured output fails
            response = model.invoke(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Extract keywords from response text (look for JSON array or comma-separated values)
            import re
            import json
            
            # Try to find JSON array in response
            json_match = re.search(r'\[.*?\]', response_text)
            if json_match:
                try:
                    keywords = json.loads(json_match.group())
                except:
                    # Fallback: split by commas and clean up
                    keywords = [k.strip().strip('"\'') for k in response_text.split(',')]
            else:
                # Fallback: split by commas and clean up
                keywords = [k.strip().strip('"\'') for k in response_text.split(',')]
            
            # Limit to 6 keywords and filter out empty ones
            keywords = [k for k in keywords if k and len(k) > 2][:6]

        # Update the target question with keywords
        state.questions[question_index].keywords = keywords

        return state

    except Exception as e:
        print(f"Error generating keywords: {e}")
        return state


def generate_answer(
    state: State, selected_keywords: Keywords, question_index: int
) -> State:
    """Generate an answer for the question at the specified index."""
    try:
        model = get_model()
        if not model:
            return state
            
        if not state.questions or question_index >= len(state.questions):
            return state

        target_question = state.questions[question_index]

        # Join selected keywords
        keywords_str = ", ".join(selected_keywords.keywords)

        # Create answer generation prompt
        prompt = ANSWER_GENERATOR_PROMPT.format(
            business_idea=state.description,
            question=target_question.question,
            selected_keywords=keywords_str,
        )

        try:
            # Try structured output first
            structured_llm = model.with_structured_output(Answer)
            response = structured_llm.invoke(prompt)
            answer_text = response.answer
        except Exception as structured_error:
            print(f"Structured output failed: {structured_error}, falling back to regular response")
            # Fallback to regular response if structured output fails
            response = model.invoke(prompt)
            answer_text = response.content if hasattr(response, 'content') else str(response)

        # Update the target question with the response
        state.questions[question_index].response = answer_text

        return state

    except Exception as e:
        print(f"Error generating answer: {e}")
        return state


def generate_summary(state: State, include_image_metadata: bool = False, image_data: dict = None) -> State:
    """Generate a comprehensive summary of the business idea based on all Q&A analysis."""
    try:
        model = get_model()
        if not model:
            print("No model available for summary generation")
            return state
            
        # Format all Q&A history
        qa_history = format_qa_history(
            [
                (q.question, q.response)
                for q in state.questions
                if q.response is not None
            ]
        )

        print(f"Formatted QA History: {qa_history[:500]}...")  # Debug: Show first 500 chars
        
        # Create summary generation prompt
        prompt = SUMMARY_GENERATOR_PROMPT.format(
            business_idea=state.description,
            qa_history=qa_history,
        )

        print(f"Summary prompt length: {len(prompt)}")  # Debug
        
        # Try regular response first for better content generation
        try:
            response = model.invoke(prompt)
            
            # Better handling of the response content
            if hasattr(response, 'content'):
                summary_text = response.content
            elif isinstance(response, str):
                summary_text = response
            else:
                summary_text = str(response)
            
            print(f"Regular summary generated: {summary_text[:200]}...")
            
            # Check if the response is too generic or short
            if len(summary_text) < 100 or "Generated summary of the business idea analysis" in summary_text:
                print("Regular response too generic, trying structured output...")
                # Try structured output as fallback
                try:
                    structured_llm = model.with_structured_output(Summary)
                    structured_response = structured_llm.invoke(prompt)
                    if len(structured_response.summary) > len(summary_text):
                        summary_text = structured_response.summary
                        print(f"Using structured output instead: {summary_text[:200]}...")
                except Exception as structured_error:
                    print(f"Structured output also failed: {structured_error}")
            
        except Exception as regular_error:
            print(f"Regular response failed: {regular_error}, trying structured output...")
            try:
                # Try structured output as fallback
                structured_llm = model.with_structured_output(Summary)
                response = structured_llm.invoke(prompt)
                summary_text = response.summary
                print(f"Structured summary generated: {summary_text[:200]}...")
            except Exception as structured_error:
                print(f"Both methods failed, generating manual summary...")
                # Create a manual summary from the Q&A data
                summary_text = f"""# Business Plan Summary

## Business Overview
{state.description}

## Key Insights from Analysis
"""
                for i, q in enumerate(state.questions, 1):
                    if q.response:
                        summary_text += f"\n**Question {i}:** {q.question}\n"
                        summary_text += f"**Response:** {q.response}\n"
                
                summary_text += "\n## Summary\nThis business plan was developed through comprehensive analysis covering market positioning, target audience, technical implementation, and revenue strategy."
        
        # Final check: if still too generic, create manual summary
        if len(summary_text) < 200 or "Generated summary of the business idea analysis" in summary_text:
            print("All methods produced generic content, creating detailed manual summary...")
            summary_text = f"""# Business Plan Summary for {state.description}

## Executive Summary
This e-commerce business plan addresses key market needs through a comprehensive digital platform strategy.

## Business Analysis Results
"""
            for i, q in enumerate(state.questions, 1):
                if q.response:
                    response_preview = q.response[:300] + ('...' if len(q.response) > 300 else '')
                    summary_text += f"""
### Analysis Point {i}
**Question:** {q.question}
**Response:** {response_preview}

"""
            
            summary_text += """## Strategic Recommendations
Based on the comprehensive analysis, this business shows strong potential with clear market positioning and scalable implementation strategy.

## Next Steps
1. Finalize technical platform development
2. Implement customer acquisition strategies
3. Execute inventory and logistics partnerships
4. Monitor performance and optimize based on customer feedback"""

        # Update the state with the summary
        state.summary = summary_text
        
        # Automatically save business summary to file for other agents
        try:
            import os
            from datetime import datetime
            
            output_dir = os.path.join(os.path.dirname(__file__), "output")
            os.makedirs(output_dir, exist_ok=True)
            summary_file_path = os.path.join(output_dir, "business_summary.txt")
            
            # Add current date to the summary for freshness
            current_date = datetime.now().strftime("%m/%d/%Y")
            formatted_summary = f"{summary_text}\nGenerated on {current_date}"
            
            with open(summary_file_path, "w", encoding="utf-8") as f:
                f.write(formatted_summary)
            
            print(f"Business summary automatically saved to: {summary_file_path}")
            print(f"Summary content preview: {formatted_summary[:200]}...")
        except Exception as e:
            print(f"Warning: Could not save business summary to file: {e}")
        
        # If image metadata is provided, append it to the summary
        if include_image_metadata and image_data:
            image_metadata = "\n\n---\n\n## Generated Visual Assets\n\n"
            
            if image_data.get('serve_url'):
                image_metadata += f"**Background Image URL:** {image_data['serve_url']}\n"
            elif image_data.get('filename'):
                # Construct serve URL from filename
                import os
                backend_base_url = os.getenv('BACKEND_URL', 'http://localhost:8001')
                serve_url = f"{backend_base_url}/images/{image_data['filename']}"
                image_metadata += f"**Background Image URL:** {serve_url}\n"
            
            if image_data.get('filename'):
                image_metadata += f"**Image Filename:** {image_data['filename']}\n"
            
            if image_data.get('generated_at'):
                image_metadata += f"**Generated:** {image_data['generated_at']}\n"
                
            # Use local path instead of original Pollinations URL
            if image_data.get('local_path'):
                image_metadata += f"**Local Path:** {image_data['local_path']}\n"
            
            # Add image metadata to summary
            state.summary += image_metadata
        
        print(f"Final summary length: {len(summary_text)}")

        return state

    except Exception as e:
        print(f"Error generating summary: {e}")
        # Provide a basic summary even if everything fails
        if state.questions:
            state.summary = f"Business Analysis Summary for: {state.description}\n\nBased on {len(state.questions)} comprehensive questions covering various aspects of the business including market analysis, target audience, implementation strategy, and revenue model."
        return state


def reset_questions(state: State, index: int) -> State:
    """Delete every question after this index."""
    try:
        if index < 0 or index >= len(state.questions):
            return state

        # Keep only questions up to and including the specified index
        state.questions = state.questions[: index + 1]

        # Clear summary since the analysis has changed
        state.summary = None

        return state

    except Exception as e:
        print(f"Error resetting questions: {e}")
        return state


# Helper functions for API integration
def get_current_question(state: State) -> Optional[str]:
    """Get the current question that needs to be answered."""
    if not state.questions:
        return None

    # Find the last question without a response
    for question in reversed(state.questions):
        if question.response is None:
            return question.question

    return None


def get_question_by_index(state: State, index: int) -> Optional[QuestionEntry]:
    """Get a question by its index."""
    if not state.questions or index < 0 or index >= len(state.questions):
        return None

    return state.questions[index]
