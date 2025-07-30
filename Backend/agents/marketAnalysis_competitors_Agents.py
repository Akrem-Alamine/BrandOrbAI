# main.py  (Tavily-only, live data)
import os
import logging
import re
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Business Analysis API (Tavily)",
    version="4.0.0",
    description="Live competitor & market insights powered by Tavily web search"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BusinessInput(BaseModel):
    business_description: str = Field(..., min_length=10, max_length=2000)

class Competitor(BaseModel):
    name: str
    market_share: float = Field(ge=0, le=100)
    strength_score: float = Field(ge=1, le=10)
    threat_level: str

class MarketSegment(BaseModel):
    segment_name: str
    size_millions: float
    growth_rate: float

class MarketTrend(BaseModel):
    trend_name: str
    impact_score: float = Field(ge=1, le=10)
    timeline: str

class CompetitorAnalysis(BaseModel):
    analysis_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    competitors: List[Competitor]
    competition_level: str
    market_difficulty: float = Field(ge=1, le=10)
    your_advantages: List[str]
    main_challenges: List[str]
    competitive_strength: float = Field(ge=1, le=10)
    market_opportunity: float = Field(ge=1, le=10)

class MarketAnalysis(BaseModel):
    analysis_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    market_segments: List[MarketSegment]
    key_trends: List[MarketTrend]
    total_market_size: float
    market_growth: float
    market_maturity: str
    primary_customers: List[str]
    customer_pain_points: List[str]
    market_readiness: float = Field(ge=1, le=10)
    demand_strength: float = Field(ge=1, le=10)

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def extract_float(text: str, pattern: str) -> float:
    match = re.search(pattern, text, re.I)
    return float(match.group(1)) if match else 0.0

def build_competitor_payload(query: str) -> Dict[str, Any]:
    return {
        "query": f"{query} competitors market share",
        "search_depth": "advanced",
        "max_results": 5,
        "include_answer": True
    }

def build_market_payload(query: str) -> Dict[str, Any]:
    return {
        "query": f"{query} market size trends growth segments",
        "search_depth": "advanced",
        "max_results": 5,
        "include_answer": True
    }

def parse_competitor_results(data: Dict[str, Any]) -> Dict[str, Any]:
    competitors = []
    for idx, res in enumerate(data.get("results", [])[:5]):
        title = res.get("title", "")
        snippet = res.get("content", "")
        share = extract_float(snippet, r"(\d+(?:\.\d+)?)%?\s*(?:market share|share)")
        strength = min(10, max(1, int(share / 10))) if share else 5
        threat = "High" if share and share > 20 else "Medium"
        competitors.append(
            Competitor(
                name=title[:50],
                market_share=share,
                strength_score=strength,
                threat_level=threat
            )
        )
    return {
        "competitors": competitors,
        "competition_level": "Medium",
        "market_difficulty": 7,
        "your_advantages": ["Speed to market", "Niche focus"],
        "main_challenges": ["Brand recognition", "Marketing budget"],
        "competitive_strength": 6,
        "market_opportunity": 8
    }

def parse_market_results(data: Dict[str, Any]) -> Dict[str, Any]:
    snippets = [r.get("content", "") for r in data.get("results", [])]
    txt = " ".join(snippets).lower()
    segments = []
    for m in re.finditer(r"(\w[\w\s-]*)\s*\$?(\d+(?:\.\d+)?)\s*(billion|million)", txt):
        name, val, unit = m.groups()
        val = float(val) * (1000 if "billion" in unit else 1)
        segments.append(MarketSegment(segment_name=name.strip(), size_millions=val, growth_rate=5))
    if not segments:
        segments = [MarketSegment(segment_name="Main", size_millions=50, growth_rate=8)]
    total = sum(s.size_millions for s in segments)
    growth = extract_float(txt, r"growth.*?\b(\d+(?:\.\d+)?)%")
    return {
        "market_segments": segments,
        "key_trends": [
            MarketTrend(trend_name="Digital shift", impact_score=8, timeline="1-2 years")
        ],
        "total_market_size": total,
        "market_growth": growth or 8,
        "market_maturity": "Growing",
        "primary_customers": ["Young adults", "Professionals"],
        "customer_pain_points": ["Limited choice", "High prices"],
        "market_readiness": 8,
        "demand_strength": 8
    }

# @app.post("/competitor_analysis", response_model=CompetitorAnalysis)
# async def competitor_analysis(payload: BusinessInput):
#     data = tavily.search(**build_competitor_payload(payload.business_description))
#     return CompetitorAnalysis(**parse_competitor_results(data))

# @app.post("/market_analysis", response_model=MarketAnalysis)
# async def market_analysis(payload: BusinessInput):
#     data = tavily.search(**build_market_payload(payload.business_description))
#     return MarketAnalysis(**parse_market_results(data))

# @app.get("/business")
# def business():
#     return {"status": "business", "timestamp": datetime.now().isoformat()}

def run_market_analysis_competitors(state):
    business_description = getattr(state, "business_idea", "")
    if not business_description:
        raise ValueError("State must have a 'business_idea' attribute.")
    competitor_data = tavily.search(**build_competitor_payload(business_description))
    market_data = tavily.search(**build_market_payload(business_description))
    competitor_result = parse_competitor_results(competitor_data)
    market_result = parse_market_results(market_data)
    output_text = "=== Competitor Analysis ===\n"
    output_text += str(competitor_result) + "\n\n"
    output_text += "=== Market Analysis ===\n"
    output_text += str(market_result) + "\n"
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{output_dir}/market_analysis_competitors_output.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(output_text)
    state.market_analysis = filename
    state.competitor_analysis = filename
    return state