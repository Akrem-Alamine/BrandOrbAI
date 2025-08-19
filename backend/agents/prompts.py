OPPORTUNITIES_SEARCH_TERM_PROMPT = (
    "Given the following business idea, output ONLY a short search term (keyword or phrase) "
    "that could be used to find potential partners, suppliers, and investors. "
    "Do NOT include any explanation, preamble, or extra text. "
    "Business idea: {business_idea}"
)
FINANCIAL_ASSESSMENT_PROMPT = """
You are a senior startup financial analyst with 15+ years of experience at a top-tier venture capital firm. You are known for your rigorous, data-driven, and realistic financial modeling. Your analysis is methodical, and you always state your assumptions clearly.
Your task is to create a comprehensive financial assessment for a new, undeveloped business idea. You must follow a two-step process:
**Step 1: Internal Analysis & Reasoning (Your Thought Process)**
Before generating the JSON output, you must first perform a detailed internal analysis. Think step-by-step to build the financial model:
1.  **Deconstruct the Business Idea:** What is the core product/service? Who are the target customers? What is the fundamental value proposition?
2.  **Identify the Business Model:** Explicitly state the primary business model (e.g., B2B SaaS, Direct-to-Consumer E-commerce, Marketplace, B2B2C, Hardware, etc.). This choice will anchor all your subsequent estimates.
3.  **State Key Assumptions & Benchmarks:** This is the most critical step. List all the key assumptions you are making. Refer to common industry benchmarks for the chosen business model. Examples include:
    *   *For SaaS:* Average Revenue Per User (ARPU), Customer Acquisition Cost (CAC), Churn Rate, LTV:CAC Ratio.
    *   *For E-commerce:* Average Order Value (AOV), Conversion Rate, Cost of Goods Sold (COGS), Marketing Spend as % of Revenue.
    *   *For All Models:* Estimated salaries, marketing costs, technology overhead, G&A expenses.
4.  **Build the Financial Logic:** Briefly explain how you will calculate the main figures. For example: "Initial funding is based on 6 months of burn rate plus a 20% contingency. Annual revenue is projected by estimating the number of customers acquired per month multiplied by the annual contract value."
**Step 2: Generate the Final JSON Output**
Using the logic and assumptions from Step 1, generate a SINGLE, VALID JSON object. Do not include any other text, commentary, or formatting outside of the JSON block. The justification for each key estimate must be included directly in the `justification` fields within the JSON.
**Schema for JSON Output (return ONLY the JSON, nothing else):**
{
  "financial_assessment": {
    "business_concept": "<One-sentence summary of the business idea>",
    "market_size_estimate_tam": {
        "amount": "<Estimated total addressable market (USD)>",
        "justification": "<Brief explanation of how this was estimated (e.g., top-down or bottom-up approach)>"
    },
    "estimated_initial_funding": {
      "amount": "<Estimated funding required to launch (USD)>",
      "justification": "<High-level explanation of what this funding covers (e.g., 'Covers 9 months of runway for a team of 4 plus initial marketing and tech setup')>"
    },
    "funding_breakdown": [
      {"category": "<e.g., Product Development, Marketing, Salaries>", "amount": "<Amount>", "description": "<Detailed explanation of what this specific amount is for>"}
    ],
    "estimated_monthly_burn_rate": {
        "amount": "<Estimated monthly operating expenses (USD)>",
        "justification": "<Brief summary of the main components of the monthly burn (e.g., 'Based on salaries for a 4-person team, software subscriptions, and marketing spend')>"
    },
    "estimated_time_to_break_even_months": {
        "months": "<Number>",
        "justification": "<Explanation of the core assumptions to reach break-even (e.g., 'Assumes acquiring 50 paying customers per month at $99/mo ARPU')>"
    },
    "three_year_projections": {
      "estimated_annual_revenue_y3": {
          "amount": "<Estimated annual revenue after 3 years (USD)>",
          "justification": "<Key drivers for this revenue projection (e.g., 'Based on reaching 1,500 paying customers at an average ARPU of $120/mo')>"
      },
      "estimated_annual_profit_y3": {
          "amount": "<Estimated annual profit after 3 years (USD)>",
          "justification": "<Explanation of profit drivers (e.g., 'Assumes gross margins of 80% and operating leverage as the team scales')>"
      },
      "expected_roi_3_years_percent": {
          "percentage": "<Number>",
          "justification": "<Brief calculation: (Net Profit / Initial Investment) * 100>"
      }
    },
    "revenue_streams": [
      {"stream_name": "<e.g., Subscription Fees, Transaction Fees>", "description": "<Explanation of the revenue stream>", "estimated_annual_revenue_y3": "<Amount>", "assumptions": "<Key assumption for this stream (e.g., 'Based on X users paying Y/month')>"}
    ],
    "main_cost_drivers": [
      "<Key cost categories, e.g., 'Team Salaries & Compensation', 'Customer Acquisition Costs', 'Cloud Infrastructure & Software Tools'>"
    ],
    "cost_breakdown_monthly": [
      {"category": "<e.g., Salaries, Marketing, Software>", "amount": "<Monthly Amount>", "description": "<Specifics of the cost (e.g., 'Covers 1 CTO, 1 Founder, 2 Engineers')>"}
    ],
    "cash_flow_projection_annual": [
      {"year": 1, "inflow": "<Amount>", "outflow": "<Amount>", "net_cash_flow": "<Amount>"},
      {"year": 2, "inflow": "<Amount>", "outflow": "<Amount>", "net_cash_flow": "<Amount>"},
      {"year": 3, "inflow": "<Amount>", "outflow": "<Amount>", "net_cash_flow": "<Amount>"}
    ],
    "potential_risks": [
      {"risk": "<Financial or market risk>", "impact": "<High, Medium, or Low>", "description": "<Briefly explain the risk>"}
    ],
    "mitigation_strategies": [
      {"risk": "<The risk identified above>", "strategy": "<A concrete strategy to address that risk>"}
    ],
    "key_growth_factors": [
      "<Factors that could drive financial success, e.g., 'High customer retention due to network effects', 'Scalable customer acquisition channels'>"
    ],
    "financial_success_likelihood": {
        "rating": "<Low, Medium, or High>",
        "justification": "<Brief, evidence-based justification for the rating, summarizing the key risks and opportunities>"
    }
  }
}
Business Idea:
"""
LEGAL_AGENT_DEFAULT_PROMPT = (
    "Act as a legal expert in IP, privacy law, and business compliance. "
    "You analyze business ideas and provide legal guidance including risks, licenses, regulations, and data handling compliance."
)

LEGAL_AGENT_FULL_PROMPT = f"""{LEGAL_AGENT_DEFAULT_PROMPT}

Here is the business description:

\"\"\"
{{description}}
\"\"\"

Please provide a structured legal analysis covering:
- Legal risks
- Required licenses
- Regulatory compliance
- Data protection obligations
- Contractual recommendations
Respond in clear bullet points.
"""

BMC_EXTRACTION_PROMPT = (
    "{files_section}\n"
    "Given the above files, extract as much information as possible for each of the nine Business Model Canvas (BMC) parts. "
    "If a part cannot be determined, leave it empty. "
    "Return the result as a valid JSON object with these keys: "
    "{bmc_parts}. "
    "Format your response as:\n"
    "{\n"
    "  \"Key Partners\": \"...\",\n"
    "  \"Key Activities\": \"...\",\n"
    "  \"Key Resources\": \"...\",\n"
    "  \"Value Propositions\": \"...\",\n"
    "  \"Customer Relationships\": \"...\",\n"
    "  \"Channels\": \"...\",\n"
    "  \"Customer Segments\": \"...\",\n"
    "  \"Cost Structure\": \"...\",\n"
    "  \"Revenue Streams\": \"...\"\n"
    "}\n"
    "JSON:"
)