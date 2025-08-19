from dataclasses import dataclass, field
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field


# Pydantic models for structured outputs
class Question(BaseModel):
    question: str = Field(description="the well formatted question")

class NoMoreQuestions(BaseModel):
    done: Literal["NO_MORE_QUESTIONS_NEEDED"] = Field(description="indicates no more questions are needed")

class QuestionOutput(BaseModel):
    final_output: Union[NoMoreQuestions, Question] = Field(description="either a new question or indication that questioning is complete")

class Keywords(BaseModel):
    """List of keywords."""
    keywords: List[str] = Field(description="the keywords that might answer the question")

class Answer(BaseModel):
    """Generated answer to a question."""
    answer: str = Field(description="comprehensive answer to the question")

class SatisfactionCheck(BaseModel):
    """Result of checking if an answer is satisfactory."""
    is_satisfactory: bool = Field(description="whether the answer adequately addresses the question")
    reason: str = Field(description="explanation for the satisfaction assessment")

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
    summary: Optional[str] = None
    
    def copy(self):
        """Create a deep copy of the state."""
        return State(
            description=self.description,
            questions=[
                QuestionEntry(
                    question=q.question,
                    response=q.response,
                    keywords=q.keywords.copy() if q.keywords else None,
                    is_satisfactory=q.is_satisfactory,
                    satisfaction_reason=q.satisfaction_reason
                )
                for q in self.questions
            ],
            summary=self.summary
        )
