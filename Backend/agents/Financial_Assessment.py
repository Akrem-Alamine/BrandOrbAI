import os
import logging
from dotenv import load_dotenv
from groq import Groq
from .prompts import FINANCIAL_ASSESSMENT_PROMPT


load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class FinancialAssessmentAgent:
    def __init__(self):
        self.groq_client = None
        if GROQ_API_KEY:
            self.groq_client = Groq(api_key=GROQ_API_KEY)
            logging.info("✅ Groq Llama3 API configured successfully")
        else:
            logging.warning("⚠️ Groq API key not found")

    def summarize_business_idea(self, state) -> str:
        if not hasattr(state, "business_idea"):
            raise ValueError("Input must be a State object with a 'business_idea' attribute.")
        prompt = FINANCIAL_ASSESSMENT_PROMPT + state.business_idea.strip()

        if not self.groq_client:
            raise RuntimeError("Groq client not initialized or API key missing.")

        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.2,
        )
        content = response.choices[0].message.content.strip()

        logging.debug(f"Model output before JSON parsing: {content}")

        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.join(output_dir, "assessment_output.txt")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)

        state.financial_assessment = filename
        return filename