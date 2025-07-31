import json
import os
import logging
from dotenv import load_dotenv
from groq import Groq
from .prompts import BMC_EXTRACTION_PROMPT
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse

load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
if groq_client:
    logging.info("✅ Groq Llama3 API configured successfully")
else:
    logging.warning("⚠️ Groq API key not found")

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

def extract_bmc_parts(report_text, file_contents_map):
    if not groq_client:
        raise RuntimeError("Groq client not initialized or API key missing.")

    files_section = "You are provided with the contents of several files. Each file is shown with its filename and its content below:\n"
    for filename, content in file_contents_map.items():
        files_section += f"\n--- FILE: {filename} ---\n{content}\n"

    bmc_parts_str = str(BMC_PARTS)
    prompt = BMC_EXTRACTION_PROMPT.replace("{", "{{").replace("}", "}}")
    prompt = prompt.replace("{{files_section}}", "{files_section}").replace("{{bmc_parts}}", "{bmc_parts}")
    prompt = prompt.format(files_section=files_section, bmc_parts=bmc_parts_str)

    response = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": "You are an expert in business analysis."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2024,
        temperature=0.2,
    )
    content = response.choices[0].message.content.strip()
    try:
        bmc = json.loads(content)
    except Exception:
        import re
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            try:
                bmc = json.loads(match.group(0))
            except Exception:
                bmc = {part: "" for part in BMC_PARTS}
        else:
            bmc = {part: "" for part in BMC_PARTS}
    for part in BMC_PARTS:
        bmc.setdefault(part, "")
    return bmc

def read_multiple_files(file_paths):
    file_contents_map = {}
    for path in file_paths:
        with open(path, "r", encoding="utf-8") as f:
            file_contents_map[os.path.basename(path)] = f.read()
    return None, file_contents_map  # report_text is not used

app = FastAPI()

@app.post("/bmc/run")
def run_bmc_extraction():
    input_files = [
        r"output\opportunities_output.txt",
        r"output\market_analysis_competitors_output.txt",
        r"output\assessment_output.txt",
    ]
    input_files = [os.path.join(os.path.dirname(__file__), f) for f in input_files]
    _, file_contents_map = read_multiple_files(input_files)
    report_text = ""  # Not used, kept for compatibility
    bmc = extract_bmc_parts(report_text, file_contents_map)
    output_path = os.path.join(os.path.dirname(__file__), "output/bmc_output.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        for part in BMC_PARTS:
            f.write(f"{part}:\n{bmc.get(part, '')}\n\n")
    return {"status": "BMC extraction completed", "output_file": output_path}

@app.get("/bmc/output", response_class=PlainTextResponse)
def get_bmc_output():
    output_path = os.path.join(os.path.dirname(__file__), "output", "bmc_output.txt")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="BMC output not found")
    with open(output_path, "r", encoding="utf-8") as f:
        return f.read()