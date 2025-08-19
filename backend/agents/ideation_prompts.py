"""Prompts used by the agent."""

# Prompt 1: Generate questions to understand the business idea better
QUESTION_GENERATOR_PROMPT = """
You are a business analyst helping to understand a new business idea. Your task is to either generate relevant questions to gather more information or determine if enough information has been collected.

Business Idea: {business_idea}

Previous Questions and Answers:
{qa_history}

Instructions:
1. Review the business idea and all previous questions and answers
2. Focus on understanding these key areas:
   - Budget: How much money they have to start or grow this business
   - Place: Where they plan to run this business (location, online, etc.)
   - Need: What problem this business solves for customers
   - Solution: How their product or service fixes that problem
   - Stage: Is this a brand new idea or something already running
   - Resources/Constraints: What they have available (time, skills, help) and what might hold them back

3. You may combine related questions into a single question when appropriate. For example:
   - "What is the current stage of your business and what resources or constraints do you have?"
   - "What problem are you solving and how does your solution address this need?"

4. Keep in mind that you can ask a maximum of FIVE questions in total so make sure to ask about the place first. Try to gather the most important information in fewer questions.

5. If you believe enough information has been gathered about these key areas to give helpful business advice, respond with: "NO_MORE_QUESTIONS_NEEDED"

Format your response as either:
- A single, combined question that addresses multiple related areas
- "NO_MORE_QUESTIONS_NEEDED"
"""

# Prompt 2: Generate relevant keywords based on the question and previous answers
KEYWORD_GENERATOR_PROMPT = """
You are a keyword research specialist. Based on a specific question about a business idea and the context of previous answers, generate relevant keywords that could help answer the question.

Business Idea: {business_idea}

Current Question: {current_question}

Previous Questions and Answers:
{qa_history}

Instructions:
1. Review the business idea, current question, and previous Q&A context
2. Generate a maximum of 6 relevant keywords that would help answer the current question
3. Each keyword should be concise and specific
4. Avoid repetition - do not include variations of the same word or very similar concepts
5. Focus on keywords that would help provide a comprehensive answer
6. Use lowercase for all keywords

Format your response as a JSON array of strings:
["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"]
"""

# Prompt 3: Generate comprehensive answer using selected keywords
ANSWER_GENERATOR_PROMPT = """
You are responding as someone who is developing this business idea and has personal experience with it. Using the context provided, give a natural, first-person response to the question.

Business Idea: {business_idea}
Question: {question}
Context Keywords: {selected_keywords}

Instructions:
1. Respond naturally as if you are the person developing this business idea
2. Use the context keywords to inform your answer but don't explicitly mention them
4. Provide practical, experience-based insights
5. Keep your response concise and to the point
6. Build upon previous conversations naturally
7. Share specific details from your situation when they help answer the question

Your response should be:
- Written in first person ("I have...", "In my experience...", "I'm planning to...")
- Natural and conversational
- Informed by your actual circumstances and resources
- Practical and actionable
- Brief 5 lines max or less, always keep it short

Example context: If your keywords include ["400dt","personal saving","100dt a month"].
a good response would be: i currently have 400dt in my personal saving and i am recieving 100dt a month to support the project.
"""

CHECK_ANSWER = """
Question: {question}
Answer: {response}

Does this answer adequately address the question? 
Consider if the answer is:
- Directly relevant to the question
- Be lenient in your evaluation as long as the answer is relevant it is satisfactory.

Evaluate the satisfaction level and provide a reason for your assessment.
"""

# Example usage and helper function
def format_qa_history(qa_pairs):
    """Format question-answer pairs for use in prompts.
    
    Args:
        qa_pairs: List of tuples [(question1, answer1), (question2, answer2), ...]
    
    Returns:
        Formatted string of Q&A history
    """
    if not qa_pairs:
        return "No previous questions and answers."
    
    formatted_history = []
    for i, (question, answer) in enumerate(qa_pairs, 1):
        formatted_history.append(f"Q{i}: {question}")
        formatted_history.append(f"A{i}: {answer}")
        formatted_history.append("")  # Empty line for separation
    
    return "\n".join(formatted_history)

# Add this to your prompts.py file:

SUMMARY_GENERATOR_PROMPT = """
You are an expert business analyst tasked with creating a comprehensive summary of a business idea based on detailed Q&A analysis.

BUSINESS IDEA:
{business_idea}

Q&A ANALYSIS:
{qa_history}

Based on the business idea description and the comprehensive Q&A analysis above, generate a detailed and insightful summary with the following structure:

**IMPORTANT: Start your response with these two title lines:**
**Business Title:** [Original detailed business idea title]
**Short Title:** [Concise 3-5 word version of the business idea]

Then continue with the full summary that covers:

1. **Business Overview**: Clear description of what the business does and its core value proposition
2. **Market Analysis**: Target market, market size, customer segments, and competitive landscape
3. **Business Model**: Revenue streams, pricing strategy, and operational approach  
4. **Strengths & Opportunities**: Key advantages, unique selling points, and growth opportunities
5. **Challenges & Risks**: Main obstacles, potential risks, and areas of concern
6. **Strategic Recommendations**: Actionable next steps and key considerations for success
7. **Financial Outlook**: Revenue potential, funding requirements, and profitability timeline

The summary should be:
- Well-structured with clear sections
- Based entirely on the information gathered through the Q&A process
- Professional and business-focused
- Actionable with specific insights and recommendations

Focus on synthesizing all the information gathered to provide a holistic view of the business opportunity, its viability, and the path forward.
"""
