import requests
import os
from pdf_utils import extract_pdf_text

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PDF_PATH = "The_Matrix__CDC_VFINAL.pdf"

# Extraction du texte complet
full_text = extract_pdf_text(PDF_PATH)

def chunk_text(text, chunk_size=1500, overlap=300):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

chunks = chunk_text(full_text)

def find_relevant_chunk(question, chunks):
    import difflib
    if not chunks:
        return None
    scores = [difflib.SequenceMatcher(None, question.lower(), chunk.lower()).ratio() for chunk in chunks]
    best_idx = scores.index(max(scores))
    return chunks[best_idx]

def ask_llm(question):
    relevant_chunk = find_relevant_chunk(question, chunks)
    if not relevant_chunk:
        return "❌ Impossible de trouver un passage pertinent (PDF vide ou illisible)."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = (
        "You are an intelligent and helpful assistant. Using ONLY the information from the following passage, "
        "write a clear, well-structured and complete answer to the user's question. "
        "Do not just quote or list information verbatim — instead, synthesize and paraphrase the content, "
        "expand a bit to make the explanation natural and easy to understand. "
        "If the answer is not in the passage, reply politely with 'I don't know.'\n\n"
        f"Passage:\n{relevant_chunk}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]

    payload = {
        "model": "llama3-8b-8192",
        "messages": messages,
        "stream": False
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.ok:
            return response.json()["choices"][0]["message"]["content"]
        else:
            return f"LLM response error. Code: {response.status_code} - {response.text}"
    except requests.exceptions.RequestException as e:
        return f"Erreur de connexion à l'API : {e}"
