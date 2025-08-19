import os
import json
import logging
from typing import Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ViabilityAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama3-8b-8192"  # Smaller, faster model
        
    def extract_business_details(self, business_summary: str) -> Dict[str, Any]:
        """Extract key business details from the business summary using AI"""
        # Default fallback values
        default_details = {
            "business_type": "Digital Platform",
            "industry": "Technology",
            "target_market": "Local Market",
            "product_category": "Digital Services",
            "budget": 300,
            "currency": "DT",
            "target_demographic": "general audience",
            "location": "Local",
            "fulfillment": "Digital"
        }
        
        if not business_summary:
            return default_details
        
        # Use AI to extract business details
        extraction_prompt = f"""
        Extract business details from this summary and return ONLY a valid JSON object with these exact keys:
        
        BUSINESS SUMMARY:
        {business_summary}
        
        Extract and return this JSON format:
        {{
            "business_type": "Type of business (e.g., Healthcare Platform, E-commerce Platform, SaaS, etc.)",
            "industry": "Industry category (e.g., Mental Health/Healthcare, Fashion/Retail, Technology, etc.)",
            "target_market": "Geographic market (e.g., Tunisian Market, Italian Market, etc.)",
            "product_category": "Product/service category (e.g., Group Therapy Services, Men's Clothing, etc.)",
            "budget": <numerical_amount_in_smallest_units>,
            "currency": "currency type (euros, dollars, DT, etc.)",
            "target_demographic": "target audience description",
            "location": "primary location",
            "fulfillment": "how services/products are delivered (Online, Physical, Hybrid, etc.)"
        }}
        
        Important notes:
        - For budget, extract the EXACT numerical amount mentioned (do not multiply or add zeros)
        - If you see "300 DT" extract exactly 300, not 300000 or 3000
        - For DT (Tunisian Dinar), keep as DT and note conversion rate (1 EUR = 3.3 DT)
        - For USD, keep as USD and note conversion rate
        - For other currencies, preserve the original currency
        - Be specific and extract actual details from the text
        - Return ONLY the JSON object, no additional text
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a business analyst expert at extracting structured data. Return only valid JSON."
                    },
                    {
                        "role": "user", 
                        "content": extraction_prompt
                    }
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            if result_text.startswith("```"):
                result_text = result_text[3:-3].strip()
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()
            
            # Extract JSON from response
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_text = result_text[json_start:json_end]
                extracted_details = json.loads(json_text)
                
                # Merge with defaults for any missing keys
                for key in default_details:
                    if key not in extracted_details:
                        extracted_details[key] = default_details[key]
                
                logger.info(f"AI extracted business details: {extracted_details}")
                return extracted_details
            else:
                logger.warning("Failed to extract JSON from AI response, using defaults")
                return default_details
                
        except Exception as e:
            logger.error(f"Error in AI business detail extraction: {e}")
            return default_details

    def calculate_viability_scores(self, financial_data: str, market_data: str, legal_data: str, business_summary: str = "") -> Dict[str, Any]:
        """
        Calculate comprehensive viability scores based on financial, market, and legal analysis
        """
        try:
            # Extract business details dynamically from the summary
            business_details = self.extract_business_details(business_summary)
            
            # Use AI to extract insights from analysis data instead of hardcoded patterns
            insights_prompt = f"""
            Analyze the following business analysis data and extract key insights in one sentence each:
            
            FINANCIAL DATA:
            {financial_data[:1000] if financial_data else 'No financial data available'}
            
            MARKET DATA:
            {market_data[:1000] if market_data else 'No market data available'}
            
            LEGAL DATA:
            {legal_data[:1000] if legal_data else 'No legal data available'}
            
            Extract key insights and return in this format:
            Financial Insights: [key financial findings]
            Market Insights: [key market findings]
            Legal Insights: [key legal findings]
            """
            
            try:
                insights_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "Extract key business insights from analysis data. Be concise."},
                        {"role": "user", "content": insights_prompt}
                    ],
                    temperature=0.2,
                    max_tokens=300
                )
                
                insights_text = insights_response.choices[0].message.content.strip()
                
                # Parse insights
                financial_insights = ""
                market_insights = ""
                legal_insights = ""
                
                for line in insights_text.split('\n'):
                    if line.lower().startswith('financial'):
                        financial_insights = line.split(':', 1)[1].strip() if ':' in line else ""
                    elif line.lower().startswith('market'):
                        market_insights = line.split(':', 1)[1].strip() if ':' in line else ""
                    elif line.lower().startswith('legal'):
                        legal_insights = line.split(':', 1)[1].strip() if ':' in line else ""
                        
            except Exception as e:
                logger.warning(f"Failed to extract AI insights, using fallback: {e}")
                financial_insights = "Financial analysis data available" if financial_data else "Limited financial data"
                market_insights = "Market analysis data available" if market_data else "Limited market data"
                legal_insights = "Legal analysis data available" if legal_data else "Limited legal data"
            
            # Create dynamic, context-aware prompt
            prompt = f"""Conduct a comprehensive viability analysis for this REAL business:

BUSINESS OVERVIEW:
- Type: {business_details['business_type']}
- Industry: {business_details['industry']}
- Product/Service: {business_details['product_category']}
- Target Market: {business_details['target_market']}
- Target Demographic: {business_details['target_demographic']}
- Budget: {business_details['currency']} {business_details['budget']:,}
- Operations: {business_details['fulfillment']} fulfillment

ANALYSIS CONTEXT:
Financial Insights: {financial_insights or 'Limited financial data available'}
Market Insights: {market_insights or 'Limited market data available'}
Legal Insights: {legal_insights or 'Limited legal data available'}

BUSINESS SUMMARY:
{business_summary[:500]}...

Based on this SPECIFIC business context, provide a realistic viability assessment as VALID JSON:
{{
    "market_difficulty": <integer 1-10, considering {business_details['target_market']} conditions>,
    "success_probability": <integer 0-100, realistic for {business_details['industry']} in {business_details['location']}>,
    "risk_level": "<low|medium|high>",
    "funding_difficulty": <integer 1-10, based on {business_details['currency']} {business_details['budget']:,} budget>,
    "time_to_profitability": <integer months, realistic for {business_details['business_type']}>,
    "market_opportunity_score": <integer 1-10, for {business_details['product_category']} in {business_details['target_market']}>,
    "competition_intensity": <integer 1-10, in {business_details['industry']} sector>,
    "regulatory_complexity": <integer 1-10, for {business_details['location']} market>,
    "overall_viability_score": <integer 1-100, comprehensive realistic assessment>,
    "startup_budget_amount": {business_details['budget']},
    "startup_budget_currency": "{business_details['currency']}",
    "budget_adequacy": "<insufficient|adequate|generous>",
    "key_success_factors": ["factor1", "factor2", "factor3"],
    "major_risks": ["risk1", "risk2", "risk3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "financial_health": {{
        "startup_cost_assessment": "<low|medium|high>",
        "revenue_potential": "<low|medium|high>",
        "break_even_feasibility": "<excellent|good|fair|poor>"
    }},
    "market_position": {{
        "competitive_advantage": "<strong|moderate|weak>",
        "market_timing": "<excellent|good|fair|poor>",
        "target_market_size": "<large|medium|small>"
    }},
    "execution_difficulty": {{
        "technical_complexity": "<low|medium|high>",
        "operational_complexity": "<low|medium|high>",
        "skill_requirements": "<low|medium|high>"
    }},
    "currency_info": {{
        "primary_currency": "{business_details['currency']}",
        "currency_symbol": "{business_details['currency']}",
        "conversion_notes": "relevant currency conversion info"
    }}
}}

IMPORTANT: Return ONLY the JSON object above, no additional explanatory text."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a senior business analyst specializing in {business_details['industry']} and {business_details['business_type']} ventures. Analyze viability based on real market data for {business_details['target_market']}. Provide realistic, data-driven assessments considering actual market conditions, competition, and operational challenges specific to {business_details['location']}."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            result_text = response.choices[0].message.content.strip()
            logger.info(f"Dynamic viability analysis result: {result_text}")
            
            # Parse JSON response - handle markdown code blocks and additional text
            try:
                # Remove markdown code blocks if present
                if result_text.startswith("```") and result_text.endswith("```"):
                    result_text = result_text[3:-3].strip()
                    if result_text.startswith("json"):
                        result_text = result_text[4:].strip()
                
                # Extract JSON from response that may contain additional explanatory text
                json_start = result_text.find('{')
                json_end = result_text.rfind('}') + 1
                
                if json_start != -1 and json_end > json_start:
                    json_text = result_text[json_start:json_end]
                    viability_data = json.loads(json_text)
                else:
                    # Fallback: try to parse the entire response as JSON
                    viability_data = json.loads(result_text)
                
                # Add business context to the response
                viability_data["business_context"] = business_details
                
                return {
                    "success": True,
                    "data": viability_data,
                    "raw_response": result_text,
                    "business_details": business_details
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                return {
                    "success": False,
                    "error": f"Failed to parse viability analysis: {e}",
                    "raw_response": result_text
                }
                
        except Exception as e:
            logger.error(f"Error in viability analysis: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def generate_viability_report(self) -> Dict[str, Any]:
        """
        Generate a comprehensive viability assessment report
        """
        try:
            # Read existing analysis data
            base_path = os.path.join(os.path.dirname(__file__), "output")
            
            # Read financial data
            financial_path = os.path.join(base_path, "assessment_output.txt")
            financial_data = ""
            if os.path.exists(financial_path):
                with open(financial_path, "r", encoding="utf-8") as f:
                    financial_data = f.read()
            
            # Read market data
            market_path = os.path.join(base_path, "market_analysis_competitors_output.txt")
            market_data = ""
            if os.path.exists(market_path):
                with open(market_path, "r", encoding="utf-8") as f:
                    market_data = f.read()
            
            # Read legal data
            legal_path = os.path.join(base_path, "legal_output.txt")
            legal_data = ""
            if os.path.exists(legal_path):
                with open(legal_path, "r", encoding="utf-8") as f:
                    legal_data = f.read()
                    
            # Read business summary
            business_summary_path = os.path.join(base_path, "business_summary.txt")
            business_summary = ""
            if os.path.exists(business_summary_path):
                with open(business_summary_path, "r", encoding="utf-8") as f:
                    raw_summary = f.read()
                    # Remove the "Generated on" date line for cleaner processing
                    business_summary = raw_summary.split("\nGenerated on")[0] if "\nGenerated on" in raw_summary else raw_summary
            
            if not financial_data and not market_data and not legal_data:
                return {
                    "success": False,
                    "error": "No analysis data found to process"
                }
            
            # Calculate viability scores with enhanced data including business summary
            viability_result = self.calculate_viability_scores(financial_data, market_data, legal_data, business_summary)
            
            if not viability_result.get("success"):
                return viability_result
            
            # Save the viability assessment
            output_path = os.path.join(base_path, "viability_assessment_output.json")
            os.makedirs(base_path, exist_ok=True)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(viability_result["data"], f, indent=2)
            
            logger.info(f"Viability assessment saved to: {output_path}")
            
            return {
                "success": True,
                "output_file": output_path,
                "data": viability_result["data"]
            }
            
        except Exception as e:
            logger.error(f"Error generating viability report: {e}")
            return {
                "success": False,
                "error": str(e)
            }

def run_viability_assessment() -> Dict[str, Any]:
    """
    Main function to run the viability assessment
    """
    agent = ViabilityAgent()
    return agent.generate_viability_report()

if __name__ == "__main__":
    result = run_viability_assessment()
    print(json.dumps(result, indent=2))
