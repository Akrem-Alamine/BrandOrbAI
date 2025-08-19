import os
import logging
import re
from dotenv import load_dotenv
from groq import Groq
from .prompts import FINANCIAL_ASSESSMENT_PROMPT


load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class FinancialAssessmentAgent:
    def __init__(self):
        self.groq_client = None
        if GROQ_API_KEY:
            self.groq_client = Groq(api_key=GROQ_API_KEY)
            logging.info("✅ Groq Llama3 API configured successfully")
        else:
            logging.warning("⚠️ Groq API key not found")
    
    def read_business_summary(self) -> str:
        """Read business summary for context-aware financial analysis"""
        try:
            output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
            summary_path = os.path.join(output_dir, "business_summary.txt")
            
            if os.path.exists(summary_path):
                with open(summary_path, "r", encoding="utf-8") as f:
                    return f.read()
            else:
                logging.warning("Business summary file not found")
                return ""
        except Exception as e:
            logging.warning(f"Error reading business summary: {e}")
            return ""
    
    def extract_financial_context(self, business_summary: str, business_idea: str) -> dict:
        """Extract financial context from business summary and idea"""
        context = {
            "budget": 100000,  # Default budget in euros
            "currency": "euros",
            "business_type": "E-commerce Platform",
            "target_market": "Italian Market",
            "product_category": "Men's Clothing",
            "scale": "small_to_medium"
        }
        
        if not business_summary:
            return context
        
        text = (business_summary + " " + business_idea).lower()
        
        # Extract budget information - look for DT, euros, dollars
        budget_patterns = [
            r'(\d{1,6})\s*dt\b',  # Tunisian Dinar
            r'(\d{1,6})\s*dinars?\b',
            r'(\d{1,6}(?:,\d{3})*)\s*euros?\b',
            r'€\s*(\d{1,6}(?:,\d{3})*)',
            r'budget.*?(\d{1,6}(?:,\d{3})*)',
            r'funding.*?(\d{1,6}(?:,\d{3})*)',
            r'capital.*?(\d{1,6}(?:,\d{3})*)'
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, text)
            if match:
                amount = int(match.group(1).replace(',', ''))
                
                # Convert DT to euros (approximate rate: 1 EUR = 3.3 DT)
                if 'dt' in pattern or 'dinar' in pattern:
                    context["budget"] = int(amount / 3.3)
                    context["currency"] = "euros (converted from DT)"
                else:
                    context["budget"] = amount
                    context["currency"] = "euros"
                break
        
        # Extract business type
        if "ecommerce" in text or "e-commerce" in text:
            context["business_type"] = "E-commerce Platform"
        elif "app" in text or "application" in text:
            context["business_type"] = "Mobile Application"
        elif "service" in text:
            context["business_type"] = "Service Business"
        
        # Extract market and product info
        if "italy" in text or "italian" in text:
            context["target_market"] = "Italian Market"
        elif "tunisia" in text or "tunisian" in text:
            context["target_market"] = "Tunisian Market"
        
        if "clothing" in text or "fashion" in text:
            context["product_category"] = "Fashion/Clothing"
        elif "men" in text:
            context["product_category"] = "Men's Clothing"
        
        # Determine scale based on budget
        if context["budget"] < 1000:
            context["scale"] = "micro"
        elif context["budget"] < 10000:
            context["scale"] = "small"
        elif context["budget"] < 100000:
            context["scale"] = "medium"
        else:
            context["scale"] = "large"
        
        return context

    def summarize_business_idea(self, state) -> str:
        if not hasattr(state, "business_idea"):
            raise ValueError("Input must be a State object with a 'business_idea' attribute.")
        
        # Read business summary for context
        business_summary = self.read_business_summary()
        
        # Extract financial context
        financial_context = self.extract_financial_context(business_summary, state.business_idea)
        
        # Create context-aware prompt
        context_prompt = f"""
BUSINESS CONTEXT:
- Business Type: {financial_context['business_type']}
- Product Category: {financial_context['product_category']}
- Target Market: {financial_context['target_market']}
- Available Budget: {financial_context['currency']} {financial_context['budget']:,}
- Business Scale: {financial_context['scale']}

BUSINESS SUMMARY:
{business_summary[:1000] if business_summary else 'No detailed summary available'}

BUSINESS IDEA:
{state.business_idea.strip()}

Based on the SPECIFIC budget of {financial_context['currency']} {financial_context['budget']:,} and the business context above, provide a realistic financial assessment. 

IMPORTANT: 
- All financial projections must be proportional to the stated budget of {financial_context['budget']:,} {financial_context['currency']}
- For a {financial_context['scale']} scale {financial_context['business_type']}, provide realistic startup costs, monthly expenses, and revenue projections
- Consider the {financial_context['target_market']} market conditions
- Provide practical, achievable financial milestones

"""
        
        prompt = FINANCIAL_ASSESSMENT_PROMPT + context_prompt

        if not self.groq_client:
            raise RuntimeError("Groq client not initialized or API key missing.")

        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.2,
        )
        content = response.choices[0].message.content.strip()

        logging.debug(f"Model output before JSON parsing: {content}")

        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.join(output_dir, "assessment_output.txt")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)

        state.financial_assessment = filename
        return filename