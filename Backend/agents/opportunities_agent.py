import streamlit as st
import re
import json
import os
from apify_client import ApifyClient
from groq import Groq
from .prompts import OPPORTUNITIES_SEARCH_TERM_PROMPT  # Import prompt constant

APIFY_API_TOKEN = os.environ.get("APIFY_API_TOKEN")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def run_opportunities_agent(business_idea: str) -> str:
    """
    Takes a business idea, generates opportunities, writes them to opportunities_output.txt,
    and returns the file path.
    """
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
    else:
        # Use the new Apify actor and input format
        client = ApifyClient(APIFY_API_TOKEN)
        search_url = f"https://www.europages.co.uk/en/search?cserpRedirect=1&q={search_term.replace(' ', '+')}"
        run_input = {
            "searchUrls": [search_url],
            "maxItems": 50,
            "proxyConfiguration": { "useApifyProxy": False },
        }
        run = client.actor("uQcrX2IkqDyZSaKQB").call(run_input=run_input)
        results = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            results.append(item)
        # No Company class needed, just output the results as-is
        output = {
            "search_term": search_term,
            "companies": results
        }
    output_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "output/opportunities_output.txt"))
    with open(output_file_path, "w", encoding="utf-8") as f:
        if isinstance(output, str):
            f.write(output)
        else:
            json.dump(output, f, indent=2, ensure_ascii=False)
    return output_file_path

# --- Streamlit UI remains unchanged below ---
st.title("Idea Analyzer & Partner Finder")
idea = st.text_area("Enter your business idea:")
if st.button("Analyze & Search"):
    if not idea.strip():
        st.warning("Please enter your idea.")
    else:
        file_path = run_opportunities_agent(idea)
        st.success(f"Results written to: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            st.code(f.read(), language="json")