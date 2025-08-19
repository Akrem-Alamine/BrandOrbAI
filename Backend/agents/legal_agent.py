import os
from groq import Groq
from dotenv import load_dotenv
from .prompts import LEGAL_AGENT_DEFAULT_PROMPT, LEGAL_AGENT_FULL_PROMPT

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

class LegalAgent:
    def __init__(self, model="llama3-70b-8192"):
        self.model = model
        self.default_prompt = LEGAL_AGENT_DEFAULT_PROMPT

    def run(self, state):
        description = state.business_idea
        full_prompt = LEGAL_AGENT_FULL_PROMPT.format(
            default_prompt=self.default_prompt,
            description=description
        )
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.3,
            max_tokens=1024,
        )
        output = response.choices[0].message.content.strip()
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
        os.makedirs(output_dir, exist_ok=True)
        filename = f"{output_dir}/legal_output.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(output)
        state.legal_analysis = filename
        return state
