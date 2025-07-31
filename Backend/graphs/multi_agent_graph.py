# import sys
# import os
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
# from Backend.agents.Financial_Assessment import FinancialAssessmentAgent
# from Backend.agents.legal_agent import LegalAgent
# from Backend.agents.marketAnalysis_competitors_Agents import run_market_analysis_competitors
# from Backend.agents.opportunities_agent import run_opportunities_agent
# import asyncio

# from fastapi import FastAPI, HTTPException, Query
# from pydantic import BaseModel
# import uuid

# app = FastAPI()

# # In-memory storage for runs (replace with DB/cache in production)
# runs = {}

# class RunRequest(BaseModel):
#     business_idea: str

# class State:
#     def __init__(self, business_idea: str):
#         self.business_idea = business_idea

#         self.financial_assessment = None
#         self.legal_analysis = None
#         self.partners_suppliers_investors = None
#         self.market_analysis = None
#         self.competitor_analysis = None 

#     def to_dict(self):
#         return {
#             "business_idea": self.business_idea,
#             "financial_assessment": self.financial_assessment,
#             "legal_analysis": self.legal_analysis,
#             "partners_suppliers_investors": self.partners_suppliers_investors,
#             "market_analysis": self.market_analysis,
#             "competitor_analysis": self.competitor_analysis,
#         }

# @app.post("/run-all")
# async def run_all_agents(request: RunRequest):
#     run_id = str(uuid.uuid4())
#     state = State(request.business_idea)
#     financial_agent = FinancialAssessmentAgent()
#     state.financial_assessment = financial_agent.summarize_business_idea(state)
#     legal_agent = LegalAgent()
#     state = legal_agent.run(state)
#     state = run_market_analysis_competitors(state)
#     # Add opportunities agent run
#     state.partners_suppliers_investors = run_opportunities_agent(state.business_idea)
#     runs[run_id] = state.to_dict()
#     return {"message": "done"}

# @app.get("/agent-output")
# async def get_agent_output(agent: str = Query(...)):
#     agent_file_map = {
#         "market_analysis_competitors": os.path.join(
#             os.path.dirname(__file__),
#             "..", "agents", "output", "market_analysis_competitors_output.txt"
#         ),
#         "financial_assessment": os.path.join(
#             os.path.dirname(__file__),
#             "..", "agents", "output", "assessment_output.txt"
#         ),
#         "legal_analysis": os.path.join(
#             os.path.dirname(__file__),
#             "..", "agents", "output", "legal_output.txt"
#         ),
#         "opportunities": os.path.join(
#             os.path.dirname(__file__),
#             "..", "agents", "output", "opportunities_output.txt"
#         ),
#     }
#     if agent not in agent_file_map:
#         raise HTTPException(status_code=404, detail="Agent output file not found")
#     file_path = os.path.abspath(agent_file_map[agent])
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Output file does not exist")
#     with open(file_path, "r", encoding="utf-8") as f:
#         content = f.read()
#     return {"output": content}


import sys
import os
import json # Import the json library
import asyncio
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import uuid

# Add the path to your first script to be able to import it
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from Backend.agents.Financial_Assessment import FinancialAssessmentAgent
from Backend.agents.legal_agent import LegalAgent
from Backend.agents.marketAnalysis_competitors_Agents import run_market_analysis_competitors
from Backend.agents.opportunities_agent import run_opportunities_agent

# Import the main function from your structuring script
from Backend.structured_output import main as structure_data

app = FastAPI()

# In-memory storage for runs (replace with DB/cache in production)
runs = {}


from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Financial Data Models
class FundingBreakdownItem(BaseModel):
    category: str
    amount: float

class ThreeYearProjections(BaseModel):
    estimated_annual_revenue_y3: float
    estimated_annual_profit_y3: float
    expected_roi_3_years_percent: float

class CashFlowProjection(BaseModel):
    year: int
    inflow: float
    outflow: float
    net_cash_flow: float

class RevenueStream(BaseModel):
    stream_name: str
    description: str
    estimated_annual_revenue_y3: str
    assumptions: str

class RiskItem(BaseModel):
    risk: str
    impact: str
    description: str

class MitigationStrategy(BaseModel):
    risk: str
    strategy: str

class FinancialSuccessLikelihood(BaseModel):
    rating: str
    justification: str

class FinancialTextData(BaseModel):
    business_concept: str
    justifications: Dict[str, str]
    revenue_streams: List[RevenueStream]
    main_cost_drivers: List[str]
    potential_risks: List[RiskItem]
    mitigation_strategies: List[MitigationStrategy]
    key_growth_factors: List[str]
    financial_success_likelihood: FinancialSuccessLikelihood

class FinancialChiffres(BaseModel):
    market_size_estimate_tam: float
    estimated_initial_funding: float
    funding_breakdown: List[FundingBreakdownItem]
    estimated_monthly_burn_rate: float
    estimated_time_to_break_even_months: int
    three_year_projections: ThreeYearProjections
    cash_flow_projection_annual: List[CashFlowProjection]

class FinancialData(BaseModel):
    chiffres: FinancialChiffres
    text: FinancialTextData

# Legal Analysis Models
class LegalAnalysis(BaseModel):
    introduction: List[str]
    legal_risks: List[str]
    required_licenses: List[str]
    regulatory_compliance: List[str]
    data_protection_obligations: List[str]
    contractual_recommendations: List[str]

# Competitor Analysis Models
class Competitor(BaseModel):
    name: str
    market_share: float
    strength_score: float
    threat_level: str

class CompetitorAnalysis(BaseModel):
    competitors: List[Competitor]
    competition_level: str
    market_difficulty: int
    your_advantages: List[str]
    main_challenges: List[str]
    competitive_strength: int
    market_opportunity: int

# Market Analysis Models
class MarketSegment(BaseModel):
    segment_name: str
    size_millions: float
    growth_rate: float

class MarketTrend(BaseModel):
    trend_name: str
    impact_score: float
    timeline: str

class MarketAnalysis(BaseModel):
    market_segments: List[MarketSegment]
    key_trends: List[MarketTrend]
    total_market_size: float
    market_growth: int
    market_maturity: str
    primary_customers: List[str]
    customer_pain_points: List[str]
    market_readiness: int
    demand_strength: int

# Supplier Models
class Supplier(BaseModel):
    name: str
    description: str
    city: Optional[str] = None
    email: Optional[str] = None
    homepage: Optional[str] = None
    logoUrl: Optional[str] = None
    phoneNumber: Optional[str] = None

# Main Response Model
class BusinessAnalysisResponse(BaseModel):
    financial_data: FinancialData
    legal_analysis: LegalAnalysis
    competitor_analysis: CompetitorAnalysis
    market_analysis: MarketAnalysis
    suppliers: List[Supplier]



class RunRequest(BaseModel):
    business_idea: str

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

@app.post("/run-all")
async def run_all_agents(request: RunRequest):
    run_id = str(uuid.uuid4())
    state = State(request.business_idea)

    # Run all agents
    financial_agent = FinancialAssessmentAgent()
    state.financial_assessment = financial_agent.summarize_business_idea(state)
    legal_agent = LegalAgent()
    state = legal_agent.run(state)
    state = run_market_analysis_competitors(state)
    state.partners_suppliers_investors = run_opportunities_agent(state.business_idea)

    runs[run_id] = state.to_dict()

    # Generate structured data
    structure_data()

    # Read and return the JSON file
    output_filename = "structured_business_analysis.json"
    
    if not os.path.exists(output_filename):
        raise HTTPException(
            status_code=500,
            detail="Structured analysis file not found after generation."
        )

    try:
        with open(output_filename, 'r', encoding='utf-8') as f:
            structured_content = json.load(f)
            return structured_content
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse JSON output: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@app.get("/agent-output")
async def get_agent_output(agent: str = Query(...)):
    agent_file_map = {
        "market_analysis_competitors": os.path.join(
            os.path.dirname(__file__),
            "..", "agents", "output", "market_analysis_competitors_output.txt"
        ),
        "financial_assessment": os.path.join(
            os.path.dirname(__file__),
            "..", "agents", "output", "assessment_output.txt"
        ),
        "legal_analysis": os.path.join(
            os.path.dirname(__file__),
            "..", "agents", "output", "legal_output.txt"
        ),
        "opportunities": os.path.join(
            os.path.dirname(__file__),
            "..", "agents", "output", "opportunities_output.txt"
        ),
    }
    if agent not in agent_file_map:
        raise HTTPException(status_code=404, detail="Agent output file not found")

    file_path = os.path.abspath(agent_file_map[agent])

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Output file does not exist")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {"output": content}