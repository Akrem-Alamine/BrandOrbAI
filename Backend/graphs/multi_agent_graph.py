import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from Backend.agents.Financial_Assessment import FinancialAssessmentAgent
from Backend.agents.legal_agent import LegalAgent
from Backend.agents.marketAnalysis_competitors_Agents import run_market_analysis_competitors
from Backend.agents.opportunities_agent import run_opportunities_agent
import asyncio

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import uuid

app = FastAPI()

# In-memory storage for runs (replace with DB/cache in production)
runs = {}

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
    financial_agent = FinancialAssessmentAgent()
    state.financial_assessment = financial_agent.summarize_business_idea(state)
    legal_agent = LegalAgent()
    state = legal_agent.run(state)
    state = run_market_analysis_competitors(state)
    # Add opportunities agent run
    state.partners_suppliers_investors = run_opportunities_agent(state.business_idea)
    runs[run_id] = state.to_dict()
    return {"message": "done"}

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
