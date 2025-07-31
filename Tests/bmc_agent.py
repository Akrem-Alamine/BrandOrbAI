import json
import os
from dotenv import load_dotenv
import requests
from groq import Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
# Define the nine BMC parts
BMC_PARTS = [
    "Key Partners",
    "Key Activities",
    "Key Resources",
    "Value Propositions",
    "Customer Relationships",
    "Channels",
    "Customer Segments",
    "Cost Structure",
    "Revenue Streams"
]

def extract_bmc_parts(report_text):
    # Load API key
    load_dotenv()
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in .env file")

    # Prepare prompt for LLM
    prompt = (
        "Given the following critical report, extract as much information as possible for each of the nine Business Model Canvas (BMC) parts. "
        "If a part cannot be determined, leave it empty. "
        "Return the result as a JSON object with these keys: "
        f"{BMC_PARTS}. "
        "Critical report:\n"
        f"{report_text}\n"
        "JSON:"
    )

    # Call Groq LLM API
    response = requests.post(
        "https://api.groq.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "mixtral-8x7b-32768",
            "messages": [
                {"role": "system", "content": "You are an expert in business analysis."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 2024,
            "temperature": 0.2
        }
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    # Try to parse the JSON from the LLM response
    try:
        bmc = json.loads(content)
    except Exception:
        # If parsing fails, return empty BMC parts
        bmc = {part: "" for part in BMC_PARTS}
    # Ensure all parts are present
    for part in BMC_PARTS:
        bmc.setdefault(part, "")
    return bmc

def main():
    # Read critical report (replace with actual input method)
    with open("critical_report.txt", "r", encoding="utf-8") as f:
        report_text = f.read()
    bmc = extract_bmc_parts(report_text)
    # Output to JSON
    with open("bmc_output.json", "w", encoding="utf-8") as f:
        json.dump(bmc, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
