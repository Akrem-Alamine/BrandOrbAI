import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from Backend.agents.Financial_Assessment import FinancialAssessmentAgent
from Backend.agents.legal_agent import LegalAgent
from Backend.agents.marketAnalysis_competitors_Agents import run_market_analysis_competitors
#from Backend.agents.opportunities_agent import run_opportunities_agent
import asyncio

class State:
    def __init__(self, business_idea: str):
        self.business_idea = business_idea

        self.financial_assessment = None
        self.legal_analysis = None
        self.partners_suppliers_investors = None
        self.market_analysis = None
        self.competitor_analysis = None 

    def to_dict(self):
        return {
            "business_idea": self.business_idea,
            "financial_assessment": self.financial_assessment,
            "legal_analysis": self.legal_analysis,
            "partners_suppliers_investors": self.partners_suppliers_investors,
            "market_analysis": self.market_analysis,
            "competitor_analysis": self.competitor_analysis,
        }
if __name__ == "__main__":
    async def main():
        business_idea = "A subscription-based service delivering eco-friendly household products."
        state = State(business_idea)
        financial_agent = FinancialAssessmentAgent()
        state.financial_assessment = financial_agent.summarize_business_idea(state)
        legal_agent = LegalAgent()
        state = legal_agent.run(state)
        # state.partners_suppliers_investors = run_opportunities_agent(state.business_idea)
        state = run_market_analysis_competitors(state)
    asyncio.run(main())
