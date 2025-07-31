import re
import os
from apify_client import ApifyClient
from groq import Groq
from .prompts import OPPORTUNITIES_SEARCH_TERM_PROMPT
from dotenv import load_dotenv

load_dotenv()
APIFY_API_TOKEN = os.environ.get("APIFY_API_TOKEN")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def run_opportunities_agent(business_idea: str) -> str:
    groq_client = Groq(api_key=GROQ_API_KEY)
    prompt = OPPORTUNITIES_SEARCH_TERM_PROMPT.format(business_idea=business_idea)
    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=30,
        temperature=0.7,
    )
    search_term_raw = response.choices[0].message.content.strip()
    match = re.search(r'["“](.+?)["”]', search_term_raw)
    if match:
        search_term = match.group(1)
    else:
        match = re.search(r'(?:Keyword\s*[:-]\s*|:\s*)([^\n]+)', search_term_raw)
        if match:
            search_term = match.group(1).strip()
        else:
            search_term = search_term_raw if len(search_term_raw.split()) <= 4 else ""
    if not search_term:
        output = "No valid search term could be extracted."
        results = []
    else:
        # Use the new Apify actor and input format (new scrapper)
        client = ApifyClient(APIFY_API_TOKEN)
        run_input = {
            "search_type": "company",
            "search_term": search_term,
            "max_pages": 0,
            "start_page": 1,
            "only_verified_companies": False,
            "include_company_details": False,
        }
        run = client.actor("MrUWjMel0oGyzwTxY").call(run_input=run_input)
        results = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            results.append(item)
    filtered_results = extract_company_fields(results)

    output_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "output/opportunities_output.txt"))
    with open(output_file_path, "w", encoding="utf-8") as f:
        # Write the filtered results as JSON
        import json
        f.write(json.dumps(filtered_results, ensure_ascii=False, indent=2))
    return output_file_path

def extract_company_fields(companies):
    extracted = []
    for company in companies:
        extracted.append({
            "name": company.get("name", "") or "",
            "description": company.get("description", "") or "",
            "city": company.get("address", {}).get("city", "") if company.get("address") else "",
            "email": company.get("email", "") or "",
            "homepage": company.get("homepage", "") or "",
            "logoUrl": company.get("logoUrl", "") or "",
            "phoneNumber": company.get("phoneNumber", "") or ""
        })
    return extracted
