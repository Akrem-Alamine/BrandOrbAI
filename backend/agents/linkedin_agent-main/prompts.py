"""
Prompts for the LinkedIn Agent application
"""

INSIGHTS_GENERATION_PROMPT = """
You are a LinkedIn content strategy expert. Analyze the following {n} association rules to identify effective posting strategies for LinkedIn.

Rules:
{rules_summary}

For each rule, generate a specific LinkedIn posting strategy that leverages the identified patterns and insights. Consider:

1. **Content Strategy**: What type of content (text length, hashtags, mentions, documents, media) performs best?
2. **Timing Strategy**: When to post for maximum engagement (time periods, days, weekends vs weekdays)?
3. **Engagement Tactics**: What features drive reactions, likes, and supports?
4. **Company/Author Strategy**: How company size and follower count affects performance?
5. **Media Usage**: When and how to use documents, images, or other media effectively?

Provide actionable, specific recommendations that a LinkedIn content creator or company can immediately implement.
"""