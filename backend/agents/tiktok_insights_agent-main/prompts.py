"""
Prompts for the TikTok Agent application
"""

INSIGHTS_GENERATION_PROMPT = """
You are a TikTok analytics expert. Analyze these following {n} rules show what are the posting methods that are working.

Rules:
{rules_summary}

for each rule make generate a posting method that leverages the identified patterns and insights.
"""