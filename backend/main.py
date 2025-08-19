import sys
import os
import json
import logging
import uuid
import base64
import requests
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from io import BytesIO
import sys
import os
import logging

# Add paths for imports
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse, HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Import agents
from agents.Financial_Assessment import FinancialAssessmentAgent
from agents.legal_agent import LegalAgent
from agents.marketAnalysis_competitors_Agents import run_market_analysis_competitors
from agents.opportunities_agent import run_opportunities_agent
from agents.bmc_agent import extract_bmc_parts, read_multiple_files
from agents.image_agent import run_image_generation_agent
from agents.swot_agent import SWOTAgent, run_swot_agent
from agents.viability_agent import run_viability_assessment
from agents.brand_identity_agent import BrandIdentityAgent, run_brand_identity_analysis
from agents.brand_discovery_agent import BrandDiscoveryAgent, BrandDiscoverySession, run_brand_discovery_analysis
from agents.brand_orchestrator import BrandOrchestrator, run_brand_orchestration
from agents.identity_orchestrator import IdentityOrchestrator, run_comprehensive_brand_identity, run_comprehensive_brand_identity
from agents.investor_agent import analyze_business_for_investors, get_investor_recommendations, load_investors, get_all_investors_for_table

# Import ideation agents
from agents.ideation_structs import State, QuestionEntry
from agents.ideation_agents import (
    Keywords,
    check_if_satisfactory,
    generate_answer,
    generate_keywords,
    generate_next_question,
    generate_summary,
    reset_questions,
)

# Import vectorization service
from agents.identity.vectorization_api import vectorization_router

# Import social media agents  
from agents.social_media_agent import SocialMediaAgent, social_media_agent
from agents.linkedin_agent import LinkedInAgent, linkedin_agent
from agents.website_generator_agent import WebsiteGeneratorAgent
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('api.log')
    ]
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(title="BrandOrbAI Unified API", version="1.0.0")

# Include routers
app.include_router(vectorization_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session storage for marketing analysis
sessions: Dict[str, Any] = {}

# Middleware for request/response logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    body = await request.body()
    logger.info("=== INCOMING REQUEST ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"URL: {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    if body:
        try:
            body_json = json.loads(body)
            logger.info(f"Request Body: {json.dumps(body_json, indent=2)}")
        except:
            logger.info(f"Request Body (raw): {body.decode()}")
    else:
        logger.info("Request Body: Empty")
    
    response = await call_next(request)
    logger.info(f"Response Status: {response.status_code}")
    logger.info("=== END REQUEST ===\n")
    return response

# In-memory storage
runs = {}  # For multi-agent runs
sessions = {}  # For ideation sessions
brand_identity_storage = {}  # For brand identity results

# Initialize website generator agent
website_generator_agent = WebsiteGeneratorAgent()
brand_discovery_sessions = {}  # For brand discovery sessions

# =============================================================================
# SOCIAL MEDIA STORAGE FUNCTIONS
# =============================================================================

def get_scheduled_posts_file_path():
    """Get the path for the scheduled posts JSON file"""
    output_dir = os.path.join(os.path.dirname(__file__), "agents", "output")
    os.makedirs(output_dir, exist_ok=True)
    return os.path.join(output_dir, "scheduled_posts.json")

def load_marketing_strategy_data():
    """Load marketing strategy insights for optimal post scheduling"""
    try:
        # Check if we have any marketing strategy sessions with insights
        for analysis_id, analysis_data in sessions.items():
            if "business_context" in analysis_data:
                # Try to get insights for this analysis
                try:
                    # Get LinkedIn insights
                    linkedin_insights = None
                    if analysis_data.get("linkedin_analysis") and "session_id" in analysis_data["linkedin_analysis"]:
                        linkedin_insights = get_linkedin_insights_sync(
                            analysis_data["linkedin_analysis"]["session_id"],
                            ["high_engagement_rate", "viral", "popular_post"]
                        )
                    
                    # Get TikTok insights  
                    tiktok_insights = None
                    if analysis_data.get("tiktok_analysis") and "session_id" in analysis_data["tiktok_analysis"]:
                        tiktok_insights = get_tiktok_insights_sync(
                            analysis_data["tiktok_analysis"]["session_id"],
                            ["high_engagement_rate", "viral", "highly_shareable"]
                        )
                    
                    # Generate combined insights
                    insights = {
                        "linkedin_insights": linkedin_insights,
                        "tiktok_insights": tiktok_insights,
                        "combined_strategy": None,
                        "posting_calendar": None,
                        "engagement_heatmap": None
                    }
                    
                    insights["combined_strategy"] = _generate_combined_strategy(insights, analysis_data["business_context"])
                    insights["posting_calendar"] = _generate_posting_calendar(insights)
                    insights["engagement_heatmap"] = _generate_engagement_heatmap(insights)
                    
                    return insights
                except Exception as e:
                    logger.warning(f"Failed to load insights for analysis {analysis_id}: {e}")
                    continue
        
        # Return default strategy if no marketing strategy data is available
        return get_default_marketing_strategy()
        
    except Exception as e:
        logger.error(f"Error loading marketing strategy data: {e}")
        return get_default_marketing_strategy()

def get_default_marketing_strategy():
    """Return default marketing strategy when no analysis is available"""
    return {
        "engagement_heatmap": {
            "best_times": {
                "linkedin": {"9": 0.9, "13": 0.8, "17": 0.7},
                "facebook": {"10": 0.8, "15": 0.9, "19": 0.7},
                "instagram": {"11": 0.8, "14": 0.9, "20": 0.8},
                "tiktok": {"12": 0.7, "16": 0.8, "21": 0.9},
                "x": {"8": 0.8, "12": 0.9, "18": 0.7}
            },
            "best_days": {
                "linkedin": {"tuesday": 0.9, "wednesday": 0.9, "thursday": 0.8},
                "facebook": {"wednesday": 0.8, "friday": 0.9, "saturday": 0.8},
                "instagram": {"monday": 0.8, "tuesday": 0.8, "friday": 0.9},
                "tiktok": {"friday": 0.9, "saturday": 0.9, "sunday": 0.8},
                "x": {"monday": 0.8, "tuesday": 0.9, "wednesday": 0.8}
            }
        },
        "posting_calendar": {
            "optimal_times": {
                "linkedin": {"best_times": ["9:00 AM", "1:00 PM", "5:00 PM"]},
                "facebook": {"best_times": ["10:00 AM", "3:00 PM", "7:00 PM"]},
                "instagram": {"best_times": ["11:00 AM", "2:00 PM", "8:00 PM"]},
                "tiktok": {"best_times": ["12:00 PM", "4:00 PM", "9:00 PM"]},
                "x": {"best_times": ["8:00 AM", "12:00 PM", "6:00 PM"]}
            }
        },
        "combined_strategy": {
            "timing_strategy": {
                "linkedin_optimal_time": "Business hours (9 AM - 5 PM)",
                "facebook_optimal_time": "Afternoon and evening",
                "instagram_optimal_time": "Morning and evening",
                "tiktok_optimal_time": "Evening (6-9 PM)",
                "x_optimal_time": "Business hours and lunch time"
            }
        }
    }

def get_linkedin_insights_sync(session_id: str, metrics: list):
    """Synchronous version of get_linkedin_insights for strategy loading"""
    try:
        # Implementation would call the actual LinkedIn insights function
        # For now, return None to use defaults
        return None
    except Exception:
        return None

def get_tiktok_insights_sync(session_id: str, metrics: list):
    """Synchronous version of get_tiktok_insights for strategy loading"""
    try:
        # Implementation would call the actual TikTok insights function
        # For now, return None to use defaults
        return None
    except Exception:
        return None

def load_scheduled_posts():
    """Load scheduled posts from JSON file"""
    file_path = get_scheduled_posts_file_path()
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('scheduled_posts', [])
        except Exception as e:
            logger.error(f"Error loading scheduled posts: {e}")
            return []
    return []

def save_scheduled_posts(posts):
    """Save scheduled posts to JSON file"""
    file_path = get_scheduled_posts_file_path()
    try:
        # Load existing posts first
        existing_posts = load_scheduled_posts()
        
        # Add new posts to existing ones (avoid duplicates)
        existing_ids = {post.get('id') for post in existing_posts}
        new_posts = [post for post in posts if post.get('id') not in existing_ids]
        
        all_posts = existing_posts + new_posts
        
        # Save to file
        data = {
            'scheduled_posts': all_posts,
            'last_updated': datetime.now().isoformat(),
            'total_posts': len(all_posts)
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Saved {len(new_posts)} new posts, total: {len(all_posts)}")
        return True
    except Exception as e:
        logger.error(f"Error saving scheduled posts: {e}")
        return False

def remove_scheduled_post(post_id):
    """Remove a scheduled post from storage"""
    try:
        posts = load_scheduled_posts()
        updated_posts = [post for post in posts if post.get('id') != post_id]
        
        data = {
            'scheduled_posts': updated_posts,
            'last_updated': datetime.now().isoformat(),
            'total_posts': len(updated_posts)
        }
        
        file_path = get_scheduled_posts_file_path()
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return len(posts) != len(updated_posts)  # True if post was found and removed
    except Exception as e:
        logger.error(f"Error removing scheduled post: {e}")
        return False

def cleanup_past_posts():
    """Remove posts that are in the past"""
    try:
        posts = load_scheduled_posts()
        current_time = datetime.now()
        
        # Keep posts that are scheduled for the future or recently posted (within 24 hours)
        active_posts = []
        for post in posts:
            if post.get('scheduled_time'):
                try:
                    # Handle both timestamp and ISO format
                    if isinstance(post['scheduled_time'], str):
                        scheduled_time = datetime.fromisoformat(post['scheduled_time'].replace('Z', '+00:00'))
                    else:
                        scheduled_time = datetime.fromtimestamp(post['scheduled_time'])
                    
                    # Keep if future or posted within last 24 hours
                    if scheduled_time > current_time - timedelta(days=1):
                        active_posts.append(post)
                except Exception as e:
                    logger.error(f"Error parsing scheduled time for post {post.get('id')}: {e}")
                    # Keep post if we can't parse the time
                    active_posts.append(post)
        
        if len(active_posts) != len(posts):
            data = {
                'scheduled_posts': active_posts,
                'last_updated': datetime.now().isoformat(),
                'total_posts': len(active_posts)
            }
            
            file_path = get_scheduled_posts_file_path()
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Cleaned up {len(posts) - len(active_posts)} past posts")
        
        return active_posts
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        return load_scheduled_posts()  # Return original posts if cleanup fails

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

# Multi-agent models
class RunRequest(BaseModel):
    business_idea: str

class MultiAgentState:
    def __init__(self, business_idea: str):
        self.business_idea = business_idea
        self.financial_assessment = None
        self.legal_analysis = None
        self.partners_suppliers_investors = None
        self.market_analysis = None
        self.competitor_analysis = None 
        self.background_image = None  # Add image data to state

    def to_dict(self):
        return {
            "business_idea": self.business_idea,
            "financial_assessment": self.financial_assessment,
            "legal_analysis": self.legal_analysis,
            "partners_suppliers_investors": self.partners_suppliers_investors,
            "market_analysis": self.market_analysis,
            "competitor_analysis": self.competitor_analysis,
            "background_image": self.background_image,  # Include image in output
        }

# Ideation models
class InitSessionRequest(BaseModel):
    session_id: str
    description: str

class AnswerRequest(BaseModel):
    session_id: str
    question_index: int
    response: str

class SuggestAnswerRequest(BaseModel):
    session_id: str
    question_index: int
    selected_keywords: List[str]

class ResetRequest(BaseModel):
    session_id: str
    index: int

class SessionResponse(BaseModel):
    session_id: str
    description: str
    questions: List[dict]
    summary: Optional[str] = None

class AnswerResponse(BaseModel):
    question: Optional[str]
    has_more_questions: bool
    question_satisfaction: dict

class KeywordsResponse(BaseModel):
    keywords: List[str]

class SuggestAnswerResponse(BaseModel):
    answer: str

class SummaryResponse(BaseModel):
    summary: str

# Brand Identity models
class BrandChatbotData(BaseModel):
    company_name: Optional[str] = None
    brand_values: Optional[List[str]] = []
    target_audience: Optional[str] = None
    brand_personality: Optional[str] = None
    visual_preferences: Optional[dict] = {}
    voice_tone_preferences: Optional[str] = None
    mission_input: Optional[str] = None
    vision_input: Optional[str] = None

class BrandIdentityRequest(BaseModel):
    business_summary: str
    chatbot_data: Optional[BrandChatbotData] = None

class LogoGenerationRequest(BaseModel):
    brand_name: str
    logo_concept: dict
    colors: List[str]

class BrandAssetsRequest(BaseModel):
    brand_book: dict
    logo_data: dict

# Brand Discovery models
class BrandDiscoveryInitRequest(BaseModel):
    session_id: str
    business_summary: str

class BrandDiscoveryResponseRequest(BaseModel):
    session_id: str
    response: Any

class BrandDiscoveryCompleteRequest(BaseModel):
    session_id: str
    responses: Dict[str, Any]
    include_existing_data: Optional[bool] = True

# Social Media Analysis models
class SocialMediaAnalysisRequest(BaseModel):
    competitors: List[str]  # List of competitor URLs/names
    business_summary: str
    brand_identity: str
    viability_data: dict

class LinkedInInsightsRequest(BaseModel):
    company_urls: List[str]
    limit: int = 20
    min_support: float = 0.05
    min_confidence: float = 0.5
    min_lift: float = 1.2

class TikTokInsightsRequest(BaseModel):
    profile_names: List[str]
    results_per_page: int = 50
    min_support: float = 0.05
    min_confidence: float = 0.5
    min_lift: float = 1.2

class SocialMediaInsightsResponse(BaseModel):
    session_id: str
    status: str
    platform: str
    message: str
    insights: Optional[str] = None
    engagement_patterns: Optional[dict] = None
    posting_schedule: Optional[dict] = None

# Social Media Management Models
class SocialMediaPostRequest(BaseModel):
    business_summary: str
    marketing_insights: dict
    platform: str = 'all'  # 'all', 'linkedin', 'tiktok', 'facebook', 'instagram', 'x'
    count: int = 5
    generate_images: bool = True
    brand_identity: Optional[dict] = None  # Brand identity data including colors, personality, logo, etc.
    include_scheduling: bool = True
    staggered_loading: bool = False  # For progressive loading

class SocialMediaPostResponse(BaseModel):
    posts: List[dict]
    scheduled_posts: List[dict]
    generated_images: dict

class SchedulePostRequest(BaseModel):
    posts: List[dict]
    platform: str
    schedule_type: str = 'optimal'  # 'optimal' or 'manual'
    start_date: Optional[str] = None

class PlatformConfigRequest(BaseModel):
    config: dict

class PostToSocialMediaRequest(BaseModel):
    post_id: str
    platform: str
    schedule_time: Optional[int] = None
    immediate: bool = False
    posting_schedule: Optional[dict] = None
    # Optional content for posts not yet saved to storage
    content: Optional[str] = None
    image_data: Optional[str] = None
    title: Optional[str] = None

# Website Generator Models
class WebsiteGenerationRequest(BaseModel):
    user_prompt: Optional[str] = ""
    style_preferences: Optional[str] = "modern"
    regenerate: Optional[bool] = False
    website_id: Optional[str] = None

class WebsiteRegenerationRequest(BaseModel):
    website_id: str
    user_feedback: str
    style_preferences: Optional[str] = "modern"

class WebsiteResponse(BaseModel):
    success: bool
    message: str
    website_id: Optional[str] = None
    html_code: Optional[str] = None
    analysis: Optional[dict] = None
    version_info: Optional[dict] = None
    company_name: Optional[str] = None
    generation_time: Optional[str] = None
    error: Optional[str] = None

class PublishWebsiteRequest(BaseModel):
    version_id: str

# =============================================================================
# MULTI-AGENT ENDPOINTS
# =============================================================================

@app.post("/run-all")
async def run_all_agents(request: RunRequest):
    """Run all agents for business analysis including background image generation"""
    run_id = str(uuid.uuid4())
    state = MultiAgentState(request.business_idea)
    
    try:
        # Financial Assessment
        financial_agent = FinancialAssessmentAgent()
        state.financial_assessment = financial_agent.summarize_business_idea(state)
        
        # Legal Analysis
        legal_agent = LegalAgent()
        state = legal_agent.run(state)
        
        # Market Analysis & Competitors
        state = run_market_analysis_competitors(state)
        
        # Opportunities
        state.partners_suppliers_investors = run_opportunities_agent(state.business_idea)
        
        runs[run_id] = state.to_dict()
        
        # Return the complete state without image generation (handled separately by frontend)
        return {
            "message": "done", 
            "run_id": run_id,
            "data": state.to_dict()
        }
    
    except Exception as e:
        logger.error(f"Error running agents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

@app.get("/agent-output")
async def get_agent_output(agent: str = Query(...)):
    """Get output from specific agent"""
    agent_file_map = {
        "market_analysis_competitors": os.path.join(
            os.path.dirname(__file__),
            "agents", "output", "market_analysis_competitors_output.txt"
        ),
        "financial_assessment": os.path.join(
            os.path.dirname(__file__),
            "agents", "output", "assessment_output.txt"
        ),
        "legal_analysis": os.path.join(
            os.path.dirname(__file__),
            "agents", "output", "legal_output.txt"
        ),
        "opportunities": os.path.join(
            os.path.dirname(__file__),
            "agents", "output", "opportunities_output.txt"
        ),
        "business_summary": os.path.join(
            os.path.dirname(__file__),
            "agents", "output", "business_summary.txt"
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

# =============================================================================
# BMC ENDPOINTS
# =============================================================================

BMC_PARTS = [
    "Key Partners",
    "Key Activities", 
    "Key Resources",
    "Value Propositions",
    "Customer Relationships",
    "Channels",
    "Customer Segments",
    "Cost Structure",
    "Revenue Streams"
]

@app.post("/bmc/run")
def run_bmc_extraction():
    """Run BMC extraction using existing agent outputs"""
    input_files = [
        os.path.join(os.path.dirname(__file__), "agents", "output", "opportunities_output.txt"),
        os.path.join(os.path.dirname(__file__), "agents", "output", "market_analysis_competitors_output.txt"),
        os.path.join(os.path.dirname(__file__), "agents", "output", "assessment_output.txt"),
        os.path.join(os.path.dirname(__file__), "agents", "output", "legal_output.txt"),
    ]
    
    try:
        _, file_contents_map = read_multiple_files(input_files)
        report_text = ""  # Not used, kept for compatibility
        bmc = extract_bmc_parts(report_text, file_contents_map)
        
        # Save BMC output
        output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "bmc_output.txt")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            for part in BMC_PARTS:
                f.write(f"{part}:\n{bmc.get(part, '')}\n\n")
        
        return {"status": "BMC extraction completed", "output_file": output_path}
    except Exception as e:
        logger.error(f"BMC extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"BMC extraction failed: {str(e)}")

@app.get("/bmc/output", response_class=PlainTextResponse)
def get_bmc_output():
    """Get BMC output content"""
    output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "bmc_output.txt")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="BMC output not found")
    with open(output_path, "r", encoding="utf-8") as f:
        return f.read()

# =============================================================================
# IMAGE GENERATION ENDPOINTS
# =============================================================================

class ImageGenerationRequest(BaseModel):
    business_idea: str
    business_summary: str

class ImageGenerationResponse(BaseModel):
    image_url: str
    business_idea: str
    generated_at: str
    status: str
    base64_data: Optional[str] = None
    local_path: Optional[str] = None
    filename: Optional[str] = None
    file_size: Optional[int] = None
    serve_url: Optional[str] = None  # Direct URL to serve the image

@app.post("/generate-image", response_model=ImageGenerationResponse)
async def generate_business_image(request: ImageGenerationRequest):
    """Generate a background image for business idea using Groq + Pollinations AI"""
    try:
        logger.info(f"Generating image for business idea: {request.business_idea}")
        
        result = run_image_generation_agent(request.business_summary, request.business_idea)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=f"Image generation failed: {result.get('error', 'Unknown error')}")
        
        return ImageGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Image generation endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@app.get("/image-output")
async def get_image_output():
    """Get the latest generated image information"""
    output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "image_generation_output.json")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="No image generation output found")
    
    try:
        with open(output_path, "r", encoding="utf-8") as f:
            import json
            content = json.load(f)
        return content
    except Exception as e:
        logger.error(f"Error reading image output: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to read image output")

@app.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve generated images directly"""
    image_path = os.path.join(os.path.dirname(__file__), "agents", "output", "images", filename)
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        path=image_path,
        media_type="image/jpeg",
        filename=filename
    )

# =============================================================================
# VIABILITY ASSESSMENT ENDPOINTS
# =============================================================================

@app.post("/save-business-summary")
async def save_business_summary(request: dict):
    """Save business summary for use by other agents"""
    try:
        business_summary = request.get("summary", "")
        if not business_summary:
            raise HTTPException(status_code=400, detail="Business summary is required")
        
        # Save to output directory
        output_dir = os.path.join(os.path.dirname(__file__), "agents", "output")
        os.makedirs(output_dir, exist_ok=True)
        
        summary_path = os.path.join(output_dir, "business_summary.txt")
        with open(summary_path, "w", encoding="utf-8") as f:
            f.write(business_summary)
        
        logger.info(f"Business summary saved to: {summary_path}")
        return {"message": "Business summary saved successfully", "path": summary_path}
        
    except Exception as e:
        logger.error(f"Error saving business summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save business summary: {str(e)}")

@app.post("/run-viability")
async def run_viability_analysis():
    """Generate comprehensive viability assessment based on existing agent outputs"""
    try:
        logger.info("Starting viability assessment")
        
        # Run viability assessment
        result = run_viability_assessment()
        
        if result.get("success", False):
            logger.info("Viability assessment completed successfully")
            return {"message": "Viability assessment completed", "status": "success", "data": result.get("data")}
        else:
            logger.error(f"Viability assessment failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"Viability assessment failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        logger.error(f"Error in viability assessment endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Viability assessment failed: {str(e)}")

@app.get("/viability-output")
async def get_viability_output():
    """Get the latest viability assessment output"""
    output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "viability_assessment_output.json")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="No viability assessment output found")
    
    try:
        with open(output_path, "r", encoding="utf-8") as f:
            content = json.load(f)
        return {"data": content}
    except Exception as e:
        logger.error(f"Error reading viability output: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to read viability output")

# =============================================================================
# SWOT ANALYSIS ENDPOINTS
# =============================================================================

@app.post("/run-swot")
async def run_swot_analysis():
    """Generate SWOT analysis based on existing agent outputs"""
    try:
        logger.info("Starting SWOT analysis")
        
        # Read business summary for the business idea
        business_idea = ""
        business_summary_path = os.path.join(os.path.dirname(__file__), "agents", "output", "business_summary.txt")
        if os.path.exists(business_summary_path):
            with open(business_summary_path, "r", encoding="utf-8") as f:
                raw_summary = f.read()
                # Extract business idea from summary, remove date line
                if "\nGenerated on" in raw_summary:
                    business_idea = raw_summary.split("\nGenerated on")[0][:200]
                else:
                    business_idea = raw_summary[:200]  # Get first 200 chars as business idea
        else:
            # Fallback: generic description
            business_idea = "Digital business platform"
        
        # Run complete SWOT analysis
        result = run_swot_agent(business_idea)
        
        if result.get("status") == "success":
            logger.info("SWOT analysis completed successfully")
            return {"message": "SWOT analysis completed", "status": "success", "data": result}
        else:
            logger.error(f"SWOT analysis failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"SWOT analysis failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        logger.error(f"Error in SWOT analysis endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SWOT analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"SWOT analysis failed: {str(e)}")

@app.get("/swot-output")
async def get_swot_output():
    """Get the latest SWOT analysis output"""
    # Try to read from the complete JSON file first
    complete_path = os.path.join(os.path.dirname(__file__), "agents", "output", "swot_complete.json")
    
    if os.path.exists(complete_path):
        try:
            with open(complete_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Return the SWOT analysis data directly
            return {"content": data.get("swot_analysis", {})}
        except Exception as e:
            logger.error(f"Error reading SWOT complete file: {str(e)}")
    
    # Fallback: try the old format
    output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "swot_output.txt")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="No SWOT analysis output found. Please run SWOT analysis first.")
    
    try:
        with open(output_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        logger.error(f"Error reading SWOT output: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to read SWOT output")

# =============================================================================
# COMPREHENSIVE BRAND IDENTITY ENDPOINTS (New Orchestrator)
# =============================================================================

@app.post("/brand-identity/logo")
async def create_logo_only(request: dict):
    """Create logo only"""
    try:
        business_data = request.get("business_data", {})
        requirements = request.get("requirements", "")
        
        orchestrator = IdentityOrchestrator()
        
        # Generate logo
        logo_result = orchestrator.logo_agent.generate_comprehensive_logo(
            business_context=business_data.get("summary", ""),
            business_model_data=business_data.get("bmc", {}),
            brand_requirements=requirements
        )
        
        return {
            "success": True,
            "type": "logo",
            "options": ["Modern Logo", "Classic Logo", "Creative Logo"],
            "download_urls": logo_result.get("logo_urls", [])
        }
        
    except Exception as e:
        logger.error(f"Error in logo creation: {e}")
        return {"success": False, "error": str(e)}

@app.post("/brand-identity/colors")
async def create_colors_only(request: dict):
    """Create color palette only"""
    try:
        business_data = request.get("business_data", {})
        requirements = request.get("requirements", "")
        
        # Simple color palette generation
        palette = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#EA580C"]
        
        return {
            "success": True,
            "type": "colors",
            "palette": palette
        }
        
    except Exception as e:
        logger.error(f"Error in color creation: {e}")
        return {"success": False, "error": str(e)}

@app.post("/brand-identity/flyer")
async def create_flyer_only(request: dict):
    """Create flyer only"""
    try:
        business_data = request.get("business_data", {})
        requirements = request.get("requirements", "")
        
        orchestrator = IdentityOrchestrator()
        
        # Generate flyer
        flyer_result = orchestrator.flyer_agent.generate_comprehensive_flyer(
            business_context=business_data.get("summary", ""),
            business_model_data=business_data.get("bmc", {}),
            brand_requirements=requirements
        )
        
        return {
            "success": True,
            "type": "flyer",
            "designs": ["Business Flyer", "Marketing Flyer"],
            "download_urls": flyer_result.get("flyer_urls", [])
        }
        
    except Exception as e:
        logger.error(f"Error in flyer creation: {e}")
        return {"success": False, "error": str(e)}

@app.post("/brand-identity/comprehensive")
async def create_comprehensive_brand_identity(request: dict):
    """Create comprehensive brand identity using the identity orchestrator"""
    try:
        business_summary = request.get("business_summary", "")
        brand_discovery_data = request.get("brand_discovery_data")
        existing_business_data = request.get("existing_business_data")
        
        if not business_summary:
            raise HTTPException(status_code=400, detail="Business summary is required")
        
        logger.info("Starting comprehensive brand identity creation with orchestrator")
        
        # Load existing business data if not provided
        if not existing_business_data:
            try:
                existing_business_data = await _load_existing_business_data()
            except Exception as e:
                logger.warning(f"Could not load existing business data: {e}")
                existing_business_data = {}
        
        # Run comprehensive brand identity creation
        result = run_comprehensive_brand_identity(
            business_summary,
            brand_discovery_data,
            existing_business_data
        )
        
        if result.get("success"):
            # Store the result
            analysis_id = f"comprehensive_{int(datetime.now().timestamp())}"
            brand_identity_storage[analysis_id] = {
                "content": result["brand_identity"],
                "metadata": result.get("generation_metadata", {}),
                "created_at": datetime.now().isoformat()
            }
            
            # Save to file for persistence
            try:
                output_dir = os.path.join(os.path.dirname(__file__), "agents", "output")
                os.makedirs(output_dir, exist_ok=True)
                
                output_file = os.path.join(output_dir, f"comprehensive_brand_identity_{analysis_id}.json")
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(brand_identity_storage[analysis_id], f, indent=2)
                    
            except Exception as e:
                logger.warning(f"Could not save comprehensive brand identity to file: {e}")
            
            return {
                "success": True,
                "analysis_id": analysis_id,
                "brand_identity": result["brand_identity"],
                "metadata": result.get("generation_metadata", {})
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Comprehensive brand identity creation failed")
            }
            
    except Exception as e:
        logger.error(f"Error in comprehensive brand identity endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand-identity/services-status")
async def get_brand_identity_services_status():
    """Get status of all brand identity services"""
    try:
        orchestrator = IdentityOrchestrator()
        services_status = orchestrator._get_services_status()
        
        return {
            "services": services_status,
            "orchestrator_available": True,
            "identity_agents_path": os.path.join(os.path.dirname(__file__), "agents", "identity"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error checking services status: {e}")
        return {
            "services": {"error": str(e)},
            "orchestrator_available": False,
            "timestamp": datetime.now().isoformat()
        }

@app.post("/brand-identity/generate-logo")
async def generate_logo_via_orchestrator(request: dict):
    """Generate logo using the identity orchestrator"""
    try:
        business_description = request.get("business_description", "")
        logo_description = request.get("logo_description", "modern and professional")
        selected_colors = request.get("selected_colors", ["#2563EB", "#FFFFFF"])
        
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        orchestrator = IdentityOrchestrator()
        
        if not orchestrator.logo_agent:
            raise HTTPException(status_code=503, detail="Logo generation service not available")
        
        logo_result = orchestrator.logo_agent.generate_logo(
            business_description,
            logo_description,
            selected_colors
        )
        
        if logo_result and logo_result.get("success"):
            # Store the logo
            logo_id = f"logo_{int(datetime.now().timestamp())}"
            brand_identity_storage[logo_id] = {
                "type": "logo",
                "content": logo_result,
                "created_at": datetime.now().isoformat()
            }
            
            return {
                "success": True,
                "logo_id": logo_id,
                "logo_data": logo_result
            }
        else:
            return {
                "success": False,
                "error": "Logo generation failed"
            }
            
    except Exception as e:
        logger.error(f"Error in logo generation endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/brand-identity/generate-flyer")
async def generate_flyer_via_orchestrator(request: dict):
    """Generate flyer using the identity orchestrator"""
    try:
        business_description = request.get("business_description", "")
        flyer_content = request.get("flyer_content", "")
        
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        orchestrator = IdentityOrchestrator()
        
        if not orchestrator.flyer_agent:
            raise HTTPException(status_code=503, detail="Flyer generation service not available")
        
        flyer_result = orchestrator.flyer_agent.generate_comprehensive_flyer(
            business_description,
            flyer_content or f"Professional flyer for {business_description}"
        )
        
        if flyer_result:
            # Store the flyer
            flyer_id = f"flyer_{int(datetime.now().timestamp())}"
            brand_identity_storage[flyer_id] = {
                "type": "flyer",
                "content": flyer_result,
                "created_at": datetime.now().isoformat()
            }
            
            return {
                "success": True,
                "flyer_id": flyer_id,
                "flyer_data": flyer_result
            }
        else:
            return {
                "success": False,
                "error": "Flyer generation failed"
            }
            
    except Exception as e:
        logger.error(f"Error in flyer generation endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand-identity/assets/{asset_id}")
async def get_brand_identity_asset(asset_id: str):
    """Get a specific brand identity asset (logo, flyer, etc.)"""
    try:
        if asset_id in brand_identity_storage:
            return {
                "success": True,
                "asset": brand_identity_storage[asset_id]
            }
        else:
            raise HTTPException(status_code=404, detail="Asset not found")
            
    except Exception as e:
        logger.error(f"Error retrieving asset {asset_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# BRAND DISCOVERY ENDPOINTS
# =============================================================================

@app.post("/brand-discovery/init")
async def init_brand_discovery_session(request: BrandDiscoveryInitRequest):
    """Initialize a new brand discovery session"""
    try:
        logger.info(f"Initializing brand discovery session: {request.session_id}")
        
        # Create new discovery session
        session = BrandDiscoverySession(request.session_id, request.business_summary)
        brand_discovery_sessions[request.session_id] = session
        
        # Get first question
        current_question = session.get_current_question()
        
        return {
            "success": True,
            "session_id": request.session_id,
            "session_structure": session.agent.get_discovery_session_structure(),
            "current_question": current_question,
            "existing_analysis": session.analysis
        }
        
    except Exception as e:
        logger.error(f"Error initializing brand discovery session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/brand-discovery/respond")
async def respond_to_brand_discovery_question(request: BrandDiscoveryResponseRequest):
    """Submit response to current brand discovery question"""
    try:
        if request.session_id not in brand_discovery_sessions:
            raise HTTPException(status_code=404, detail="Brand discovery session not found")
        
        session = brand_discovery_sessions[request.session_id]
        result = session.submit_response(request.response)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "next_question": result["next_question"],
            "progress": session._calculate_progress()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to brand discovery question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand-discovery/suggestions/{session_id}")
async def get_brand_discovery_suggestions(session_id: str, question_type: str = Query(...)):
    """Get suggestions for specific question types (e.g., business names)"""
    try:
        if session_id not in brand_discovery_sessions:
            raise HTTPException(status_code=404, detail="Brand discovery session not found")
        
        session = brand_discovery_sessions[session_id]
        
        if question_type == "business_name":
            suggestions = session.agent.generate_business_name_suggestions(session.business_summary)
            return {"suggestions": suggestions}
        
        return {"suggestions": []}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting brand discovery suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/brand-discovery/complete")
async def complete_brand_discovery(request: BrandDiscoveryCompleteRequest):
    """Complete brand discovery and create comprehensive brand identity"""
    try:
        logger.info(f"Completing brand discovery for session: {request.session_id}")
        
        if request.session_id not in brand_discovery_sessions:
            raise HTTPException(status_code=404, detail="Brand discovery session not found")
        
        session = brand_discovery_sessions[request.session_id]
        
        # Run brand discovery analysis
        discovery_result = run_brand_discovery_analysis(
            request.session_id, 
            session.business_summary, 
            request.responses
        )
        
        if not discovery_result["success"]:
            return {
                "success": False,
                "errors": discovery_result.get("errors", []),
                "warnings": discovery_result.get("warnings", [])
            }
        
        # Gather existing business data if requested
        existing_data = {}
        if request.include_existing_data:
            try:
                # Load existing analysis files
                existing_data = await _load_existing_business_data()
            except Exception as e:
                logger.warning(f"Could not load existing data: {e}")
        
        # Run brand orchestration
        orchestration_result = run_brand_orchestration(
            discovery_result["brand_brief"],
            existing_data
        )
        
        if not orchestration_result["success"]:
            return {
                "success": False,
                "error": orchestration_result.get("error", "Brand orchestration failed")
            }
        
        # Store result
        analysis_id = f"discovery_{request.session_id}_{int(datetime.now().timestamp())}"
        brand_identity_storage[analysis_id] = {
            "content": orchestration_result["brand_identity"],
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "session_id": request.session_id,
                "discovery_data": discovery_result["brand_brief"],
                "orchestration_version": "2.0"
            }
        }
        
        # Save to file for persistence
        try:
            output_dir = os.path.join(os.path.dirname(__file__), "agents", "output")
            os.makedirs(output_dir, exist_ok=True)
            
            output_file = os.path.join(output_dir, f"brand_identity_{analysis_id}.json")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(brand_identity_storage[analysis_id], f, indent=2)
                
        except Exception as e:
            logger.warning(f"Could not save brand identity to file: {e}")
        
        # Clean up session
        if request.session_id in brand_discovery_sessions:
            del brand_discovery_sessions[request.session_id]
        
        return {
            "success": True,
            "analysis_id": analysis_id,
            "brand_identity": orchestration_result["brand_identity"],
            "discovery_data": discovery_result["brand_brief"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing brand discovery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand-discovery/session/{session_id}")
async def get_brand_discovery_session(session_id: str):
    """Get current brand discovery session state"""
    try:
        if session_id not in brand_discovery_sessions:
            raise HTTPException(status_code=404, detail="Brand discovery session not found")
        
        session = brand_discovery_sessions[session_id]
        current_question = session.get_current_question()
        
        return {
            "session_id": session_id,
            "current_question": current_question,
            "responses": session.responses,
            "progress": session._calculate_progress(),
            "created_at": session.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting brand discovery session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def _load_existing_business_data() -> Dict[str, Any]:
    """Load existing business analysis data from files"""
    existing_data = {}
    output_dir = os.path.join(os.path.dirname(__file__), "agents", "output")
    
    # Load business summary
    business_summary_path = os.path.join(output_dir, "business_summary.txt")
    if os.path.exists(business_summary_path):
        with open(business_summary_path, "r", encoding="utf-8") as f:
            existing_data["business_summary"] = f.read()
    
    # Load SWOT analysis
    swot_path = os.path.join(output_dir, "swot_complete.json")
    if os.path.exists(swot_path):
        with open(swot_path, "r", encoding="utf-8") as f:
            existing_data["swot_analysis"] = json.load(f)
    
    # Load viability assessment
    viability_path = os.path.join(output_dir, "viability_assessment_output.json")
    if os.path.exists(viability_path):
        with open(viability_path, "r", encoding="utf-8") as f:
            existing_data["viability_assessment"] = json.load(f)
    
    # Load market analysis
    market_path = os.path.join(output_dir, "market_analysis_competitors_output.txt")
    if os.path.exists(market_path):
        with open(market_path, "r", encoding="utf-8") as f:
            existing_data["market_analysis"] = f.read()
    
    # Load BMC data
    bmc_path = os.path.join(output_dir, "bmc_output.txt")
    if os.path.exists(bmc_path):
        with open(bmc_path, "r", encoding="utf-8") as f:
            existing_data["bmc_data"] = f.read()
    
    return existing_data

# =============================================================================
# BRAND IDENTITY ENDPOINTS (Enhanced)
# =============================================================================

@app.post("/run-brand-identity")
async def run_brand_identity_analysis_endpoint(request: BrandIdentityRequest):
    """Run comprehensive brand identity analysis with chatbot integration"""
    try:
        # Convert chatbot data to dict if provided
        chatbot_data_dict = None
        if request.chatbot_data:
            chatbot_data_dict = request.chatbot_data.model_dump()
        
        logger.info("Starting brand identity analysis...")
        
        # Run the brand identity analysis
        result = run_brand_identity_analysis(
            business_summary=request.business_summary,
            chatbot_data=chatbot_data_dict
        )
        
        if result.get("success"):
            # Store the result with a unique ID
            analysis_id = str(uuid.uuid4())
            brand_identity_storage[analysis_id] = result
            
            logger.info("Brand identity analysis completed successfully")
            return {
                "message": "Brand identity analysis completed", 
                "status": "success", 
                "analysis_id": analysis_id,
                "data": result
            }
        else:
            logger.error(f"Brand identity analysis failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"Brand identity analysis failed: {result.get('error', 'Unknown error')}"
            )
            
    except Exception as e:
        logger.error(f"Error in brand identity analysis endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Brand identity analysis failed: {str(e)}")

@app.get("/brand-identity-output")
async def get_brand_identity_output(analysis_id: Optional[str] = None):
    """Get brand identity analysis output"""
    try:
        if analysis_id and analysis_id in brand_identity_storage:
            # Return specific analysis
            return {"content": brand_identity_storage[analysis_id]}
        elif brand_identity_storage:
            # Return the most recent analysis
            latest_id = max(brand_identity_storage.keys())
            return {"content": brand_identity_storage[latest_id]}
        else:
            # Return empty content instead of error when no analysis exists
            logger.info("No brand identity analysis found - returning empty content")
            return {"content": None, "message": "No brand identity analysis found"}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error retrieving brand identity output: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve brand identity output")

@app.post("/generate-brand-palettes")
async def generate_brand_color_palettes(request: dict):
    """Generate color palettes for brand identity"""
    try:
        brand_context = request.get('brand_context', {})
        
        agent = BrandIdentityAgent()
        palettes = agent.generate_color_palettes(brand_context)
        
        return {"palettes": palettes}
        
    except Exception as e:
        logger.error(f"Error generating color palettes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate color palettes: {str(e)}")

@app.post("/generate-logo-concepts")
async def generate_brand_logo_concepts(request: dict):
    """Generate logo concepts for brand identity"""
    try:
        brand_context = request.get('brand_context', {})
        selected_colors = request.get('selected_colors', [])
        
        agent = BrandIdentityAgent()
        concepts = agent.generate_logo_concepts(brand_context, selected_colors)
        
        return {"concepts": concepts}
        
    except Exception as e:
        logger.error(f"Error generating logo concepts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logo concepts: {str(e)}")

@app.post("/generate-logo-image")
async def generate_brand_logo_image(request: LogoGenerationRequest):
    """Generate actual logo image from concept"""
    try:
        agent = BrandIdentityAgent()
        logo_result = agent.generate_logo_image(
            brand_name=request.brand_name,
            logo_concept=request.logo_concept,
            colors=request.colors
        )
        
        if logo_result.get("success"):
            # Store the logo with unique ID
            logo_id = str(uuid.uuid4())
            brand_identity_storage[f"logo_{logo_id}"] = logo_result
            
            return {
                "success": True,
                "logo_id": logo_id,
                "logo_data": logo_result
            }
        else:
            raise HTTPException(status_code=500, detail=logo_result.get("error", "Logo generation failed"))
        
    except Exception as e:
        logger.error(f"Error generating logo image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logo image: {str(e)}")

@app.post("/generate-brand-assets")
async def generate_brand_assets_endpoint(request: BrandAssetsRequest):
    """Generate additional brand assets like business cards, letterheads"""
    try:
        agent = BrandIdentityAgent()
        assets = agent.generate_brand_assets(
            brand_book=request.brand_book,
            logo_data=request.logo_data
        )
        
        # Store assets with unique ID
        assets_id = str(uuid.uuid4())
        brand_identity_storage[f"assets_{assets_id}"] = assets
        
        return {
            "success": True,
            "assets_id": assets_id,
            "assets": assets
        }
        
    except Exception as e:
        logger.error(f"Error generating brand assets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate brand assets: {str(e)}")

@app.get("/brand-identity-list")
async def list_brand_identity_analyses():
    """List all brand identity analyses"""
    try:
        analyses = []
        for key, value in brand_identity_storage.items():
            if not key.startswith(('logo_', 'assets_')):
                analyses.append({
                    "analysis_id": key,
                    "generation_time": value.get("generation_time", "Unknown"),
                    "success": value.get("success", False)
                })
        
        return {"analyses": analyses}
        
    except Exception as e:
        logger.error(f"Error listing brand identity analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list brand identity analyses")

# =============================================================================
# REVISION ENDPOINTS
# =============================================================================

@app.post("/brand-identity/revise")
async def revise_brand_identity(request: dict):
    """Expert revision of a brand identity section. Body: { current_identity, section, instruction }."""
    try:
        current_identity = request.get("current_identity")
        section = request.get("section")
        instruction = request.get("instruction", "")
        if not current_identity or not section:
            raise HTTPException(status_code=400, detail="current_identity and section are required")
        agent = BrandIdentityAgent()
        result = agent.revise_brand_identity(current_identity, section, instruction)
        return {"success": True, **result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revision error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# IDEATION ENDPOINTS
# =============================================================================

def all_questions_answered(state: State) -> bool:
    """Check if all questions have satisfactory answers."""
    if not state.questions:
        logger.info("No questions in state")
        return False
    
    result = all(
        q.response is not None and q.is_satisfactory == True 
        for q in state.questions
    )
    logger.info(f"All questions answered: {result}")
    return result

@app.post("/init", response_model=SessionResponse)
async def init_session(request: InitSessionRequest):
    """Initialize a new session with a business idea description and provided session ID."""
    logger.info("=== INIT SESSION ===")
    logger.info(f"Session ID: {request.session_id}")
    logger.info(f"Description: {request.description}")
    
    if request.session_id in sessions:
        logger.error(f"Session already exists: {request.session_id}")
        raise HTTPException(status_code=400, detail="Session ID already exists")
    
    # Create new state
    state = State(description=request.description)
    logger.info(f"Created initial state: {state}")
    
    # Generate first question
    logger.info("Generating first question...")
    state = generate_next_question(state)
    logger.info(f"State after generating question: {state}")
    
    # Store session
    sessions[request.session_id] = state
    logger.info(f"Stored session. Total sessions: {len(sessions)}")
    
    # Convert to response format
    questions_data = []
    for q in state.questions:
        questions_data.append({
            "question": q.question,
            "response": q.response,
            "keywords": q.keywords,
            "is_satisfactory": q.is_satisfactory,
            "satisfaction_reason": q.satisfaction_reason,
        })
    
    response_data = SessionResponse(
        session_id=request.session_id,
        description=state.description,
        summary=state.summary,
        questions=questions_data
    )
    
    logger.info(f"INIT RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END INIT SESSION ===\n")
    
    return response_data

@app.post("/respond", response_model=AnswerResponse)
async def respond_to_question(request: AnswerRequest):
    """Receive a response to any question by index and generate next question if needed."""
    logger.info("=== RESPOND TO QUESTION ===")
    logger.info(f"Session ID: {request.session_id}")
    logger.info(f"Question Index: {request.question_index}")
    logger.info(f"Response: {request.response}")
    
    if request.session_id not in sessions:
        logger.error(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[request.session_id]
    logger.info(f"Current state: {state}")
    
    if not state.questions or request.question_index >= len(state.questions):
        logger.error(f"Invalid question index: {request.question_index}, total questions: {len(state.questions) if state.questions else 0}")
        raise HTTPException(status_code=400, detail="Invalid question index")
    
    # Set the response for the specified question
    logger.info(f"Setting response for question {request.question_index}")
    state.questions[request.question_index].response = request.response
    
    # Check if the response is satisfactory
    logger.info("Checking if response is satisfactory...")
    state = check_if_satisfactory(state, request.question_index)
    
    logger.info(f"Satisfaction check result: {state.questions[request.question_index].is_satisfactory}")
    logger.info(f"Satisfaction reason: {state.questions[request.question_index].satisfaction_reason}")
    
    question_satisfaction = {
        "is_satisfactory": state.questions[request.question_index].is_satisfactory,
        "reason": state.questions[request.question_index].satisfaction_reason,
    }
    
    # Generate next question ONLY if current answer is satisfactory and we haven't reached the limit
    new_question = None
    has_more = False
    
    if state.questions[request.question_index].is_satisfactory and len(state.questions) < 5:
        logger.info("Answer is satisfactory, generating next question...")
        state = generate_next_question(state)
        logger.info(f"State after generating next question: {state}")
        
        # Check if a new question was added
        if len(state.questions) > request.question_index + 1:
            new_question = state.questions[-1].question
            has_more = True
    elif not state.questions[request.question_index].is_satisfactory:
        logger.info("Answer is not satisfactory, allowing user to edit their response")
    else:
        logger.info("Maximum number of questions (5) reached")
    
    # Update the session
    sessions[request.session_id] = state
    
    logger.info(f"New question count: {len(state.questions)}")
    logger.info(f"Has more questions: {has_more}")
    logger.info(f"New question: {new_question}")
    
    response_data = AnswerResponse(
        question=new_question,
        has_more_questions=has_more,
        question_satisfaction=question_satisfaction
    )
    
    logger.info(f"RESPOND RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END RESPOND TO QUESTION ===\n")
    
    return response_data

@app.post("/suggest", response_model=SuggestAnswerResponse)
async def suggest_answer(request: SuggestAnswerRequest):
    """Generate a suggested response using selected keywords for any question by index."""
    logger.info("=== SUGGEST ANSWER ===")
    logger.info(f"Session ID: {request.session_id}")
    logger.info(f"Question Index: {request.question_index}")
    logger.info(f"Selected Keywords: {request.selected_keywords}")
    
    if request.session_id not in sessions:
        logger.error(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[request.session_id]
    logger.info(f"Current state: {state}")
    
    if not state.questions or request.question_index >= len(state.questions):
        logger.error(f"Invalid question index: {request.question_index}, total questions: {len(state.questions) if state.questions else 0}")
        raise HTTPException(status_code=400, detail="Invalid question index")
    
    # Create Keywords object from selected keywords
    selected_keywords = Keywords(keywords=request.selected_keywords)
    logger.info(f"Created Keywords object: {selected_keywords}")
    
    # Generate answer directly in the state
    logger.info("Generating answer...")
    state = generate_answer(state, selected_keywords, request.question_index)
    logger.info(f"State after generating answer: {state}")
    
    # Update the session with the new answer
    sessions[request.session_id] = state
    
    # Return the generated answer
    generated_answer = state.questions[request.question_index].response or ""
    logger.info(f"Generated answer: {generated_answer}")
    
    response_data = SuggestAnswerResponse(answer=generated_answer)
    logger.info(f"SUGGEST RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END SUGGEST ANSWER ===\n")
    
    return response_data

@app.get("/keywords/{session_id}/{question_index}", response_model=KeywordsResponse)
async def get_keywords(session_id: str, question_index: int):
    """Get keywords for any question by index."""
    logger.info("=== GET KEYWORDS ===")
    logger.info(f"Session ID: {session_id}")
    logger.info(f"Question Index: {question_index}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    logger.info(f"Current state: {state}")
    
    if not state.questions or question_index >= len(state.questions):
        logger.error(f"Invalid question index: {question_index}, total questions: {len(state.questions) if state.questions else 0}")
        raise HTTPException(status_code=400, detail="Invalid question index")
    
    # Generate keywords for the specified question if not already generated
    if not state.questions[question_index].keywords:
        logger.info("Keywords not found, generating...")
        state = generate_keywords(state, question_index)
        sessions[session_id] = state
        logger.info(f"Generated keywords: {state.questions[question_index].keywords}")
    else:
        logger.info(f"Using existing keywords: {state.questions[question_index].keywords}")
    
    keywords = state.questions[question_index].keywords or []
    response_data = KeywordsResponse(keywords=keywords)
    logger.info(f"KEYWORDS RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END GET KEYWORDS ===\n")
    
    return response_data

@app.get("/summary/{session_id}", response_model=SummaryResponse)
async def get_summary(session_id: str):
    """Generate and return a comprehensive summary of the business idea analysis."""
    logger.info("=== GET SUMMARY ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    logger.info(f"Current state: {state}")
    
    # Check if there are any answered questions
    answered_questions = [q for q in state.questions if q.response is not None]
    if not answered_questions:
        logger.error("No answered questions found for summary generation")
        raise HTTPException(status_code=400, detail="No answered questions available for summary generation")
    
    # Generate summary if not already generated
    if not state.summary:
        logger.info("Summary not found, generating...")
        state = generate_summary(state)
        sessions[session_id] = state
        logger.info(f"Generated summary: {state.summary}")
    else:
        logger.info(f"Using existing summary: {state.summary}")
    
    response_data = SummaryResponse(summary=state.summary or "Summary generation failed")
    logger.info(f"SUMMARY RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END GET SUMMARY ===\n")
    
    return response_data


@app.post("/summary-with-image/{session_id}", response_model=SummaryResponse)
async def get_summary_with_image(session_id: str):
    """Generate and return a comprehensive summary with embedded image metadata."""
    logger.info("=== GET SUMMARY WITH IMAGE ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    logger.info(f"Current state: {state}")
    
    # Check if there are any answered questions
    answered_questions = [q for q in state.questions if q.response is not None]
    if not answered_questions:
        logger.error("No answered questions found for summary generation")
        raise HTTPException(status_code=400, detail="No answered questions available for summary generation")
    
    # Generate image for the business idea
    logger.info("Generating business image...")
    try:
        # Create a simple business summary for image generation
        business_summary = f"Business plan for {state.description}"
        for q in answered_questions[:3]:  # Use first 3 answers for context
            business_summary += f" {q.response[:100]}"  # Truncate for brevity
        
        image_result = run_image_generation_agent(business_summary, state.description)
        logger.info(f"Image generation result: {image_result}")
        
        # Generate summary with image metadata included
        logger.info("Generating summary with image metadata...")
        state = generate_summary(state, include_image_metadata=True, image_data=image_result)
        sessions[session_id] = state
        logger.info(f"Generated enhanced summary with image data")
        
    except Exception as e:
        logger.error(f"Error generating image for summary: {e}")
        # Fall back to regular summary if image generation fails
        if not state.summary:
            state = generate_summary(state)
            sessions[session_id] = state
    
    response_data = SummaryResponse(summary=state.summary or "Summary generation failed")
    logger.info(f"ENHANCED SUMMARY RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END GET SUMMARY WITH IMAGE ===\n")
    
    return response_data

@app.post("/reset", response_model=SessionResponse)
async def reset_session(request: ResetRequest):
    """Reset questions after a specific index."""
    logger.info("=== RESET SESSION ===")
    logger.info(f"Session ID: {request.session_id}")
    logger.info(f"Reset Index: {request.index}")
    
    if request.session_id not in sessions:
        logger.error(f"Session not found: {request.session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[request.session_id]
    logger.info(f"State before reset: {state}")
    
    # Reset questions
    state = reset_questions(state, request.index)
    logger.info(f"State after reset: {state}")
    
    # Update session
    sessions[request.session_id] = state
    
    # Convert to response format
    questions_data = []
    for q in state.questions:
        questions_data.append({
            "question": q.question,
            "response": q.response,
            "keywords": q.keywords,
            "is_satisfactory": q.is_satisfactory,
            "satisfaction_reason": q.satisfaction_reason,
        })
    
    response_data = SessionResponse(
        session_id=request.session_id,
        description=state.description,
        summary=state.summary,
        questions=questions_data
    )
    
    logger.info(f"RESET RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END RESET SESSION ===\n")
    
    return response_data

@app.get("/session/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get the current state of a session."""
    logger.info("=== GET SESSION ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    logger.info(f"Retrieved state: {state}")
    
    # Convert to response format
    questions_data = []
    for q in state.questions:
        questions_data.append({
            "question": q.question,
            "response": q.response,
            "keywords": q.keywords,
            "is_satisfactory": q.is_satisfactory,
            "satisfaction_reason": q.satisfaction_reason,
        })
    
    response_data = SessionResponse(
        session_id=session_id,
        description=state.description,
        summary=state.summary,
        questions=questions_data
    )
    
    logger.info(f"GET SESSION RESPONSE JSON: {json.dumps(response_data.dict(), indent=2)}")
    logger.info("=== END GET SESSION ===\n")
    
    return response_data

@app.get("/summary/{session_id}", response_model=SummaryResponse)
async def get_summary(session_id: str):
    """Generate and get summary for a session, automatically saving to business_summary.txt."""
    logger.info("=== GET SUMMARY ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    logger.info(f"Generating summary for state: {state}")
    
    # Generate summary (this will automatically save to business_summary.txt)
    updated_state = generate_summary(state)
    sessions[session_id] = updated_state  # Update the session with the summary
    
    if not updated_state.summary:
        logger.error("Failed to generate summary")
        raise HTTPException(status_code=500, detail="Failed to generate summary")
    
    response_data = SummaryResponse(summary=updated_state.summary)
    logger.info(f"SUMMARY RESPONSE: Generated summary of length {len(updated_state.summary)}")
    logger.info("=== END GET SUMMARY ===\n")
    
    return response_data

@app.post("/summary-with-image/{session_id}", response_model=SummaryResponse)
async def get_summary_with_image(session_id: str):
    """Generate summary with image metadata, automatically saving to business_summary.txt."""
    logger.info("=== GET SUMMARY WITH IMAGE ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = sessions[session_id]
    
    # Read existing image data if available
    image_data = {}
    try:
        image_output_path = os.path.join(os.path.dirname(__file__), "agents", "output", "image_generation_output.json")
        if os.path.exists(image_output_path):
            with open(image_output_path, "r", encoding="utf-8") as f:
                image_data = json.load(f)
    except Exception as e:
        logger.warning(f"Could not read image data: {e}")
    
    # Generate summary with image metadata (this will automatically save to business_summary.txt)
    updated_state = generate_summary(state, include_image_metadata=True, image_data=image_data)
    sessions[session_id] = updated_state  # Update the session with the summary
    
    if not updated_state.summary:
        logger.error("Failed to generate summary")
        raise HTTPException(status_code=500, detail="Failed to generate summary")
    
    response_data = SummaryResponse(summary=updated_state.summary)
    logger.info(f"SUMMARY WITH IMAGE RESPONSE: Generated summary of length {len(updated_state.summary)}")
    logger.info("=== END GET SUMMARY WITH IMAGE ===\n")
    
    return response_data

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    logger.info("=== DELETE SESSION ===")
    logger.info(f"Session ID: {session_id}")
    
    if session_id not in sessions:
        logger.error(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    logger.info(f"Session deleted. Remaining sessions: {len(sessions)}")
    
    response_data = {"message": "Session deleted successfully"}
    logger.info(f"DELETE RESPONSE JSON: {json.dumps(response_data, indent=2)}")
    logger.info("=== END DELETE SESSION ===\n")
    
    return response_data

# =============================================================================
# LOGO GENERATION ENDPOINTS
# =============================================================================

@app.post("/logo/generate-palettes")
async def generate_logo_color_palettes(request: dict):
    """Generate color palettes for logo design"""
    try:
        from agents.identity.main import LogoGeneratorAgent
        
        business_description = request.get("business_description", "")
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        agent = LogoGeneratorAgent()
        palettes = agent.generate_color_palette(business_description)
        
        if palettes:
            return {
                "success": True,
                "palettes": palettes
            }
        else:
            return {
                "success": False,
                "error": "Failed to generate color palettes"
            }
            
    except Exception as e:
        logger.error(f"Error generating color palettes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logo/generate")
async def generate_logo(request: dict):
    """Generate a logo using Pollinations AI"""
    try:
        from agents.identity.main import LogoGeneratorAgent
        
        business_description = request.get("business_description", "")
        logo_description = request.get("logo_description", "modern logo")
        selected_colors = request.get("color_palette", request.get("selected_colors", ["#2563EB", "#1F2937"]))
        
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        agent = LogoGeneratorAgent()
        logo_result = agent.generate_logo(business_description, logo_description, selected_colors)
        
        if logo_result and logo_result.get('success'):
            # Return URL for frontend to display
            return {
                "success": True,
                "url": logo_result.get('image_url') or logo_result.get('url'),
                "logo": logo_result
            }
        else:
            error_msg = logo_result.get('error', 'Failed to generate logo') if logo_result else 'Failed to generate logo'
            return {
                "success": False,
                "error": error_msg
            }
            
    except Exception as e:
        logger.error(f"Error generating logo: {e}")
        # Return error response instead of raising exception to avoid 500 errors
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/logo/generate-3d")
async def generate_3d_logo(request: dict):
    """Generate a 3D version of a logo"""
    try:
        from agents.identity.main import LogoGeneratorAgent
        
        business_description = request.get("business_description", "")
        logo_description = request.get("logo_description", "modern logo")
        selected_colors = request.get("color_palette", request.get("selected_colors", ["#2563EB", "#1F2937"]))
        base_logo_prompt = request.get("base_logo_prompt", None)
        
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        agent = LogoGeneratorAgent()
        logo_result = agent.generate_3d_logo(business_description, logo_description, selected_colors, base_logo_prompt)
        
        if logo_result and logo_result.get('success'):
            return {
                "success": True,
                "logo_3d": logo_result
            }
        else:
            return {
                "success": False,
                "error": logo_result.get('error', 'Failed to generate 3D logo')
            }
            
    except Exception as e:
        logger.error(f"Error generating 3D logo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logo/suggestions")
async def get_logo_suggestions(request: dict):
    """Get suggested keywords for logo design"""
    try:
        from agents.identity.main import LogoGeneratorAgent
        
        business_description = request.get("business_description", "")
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        agent = LogoGeneratorAgent()
        suggestions = agent.generate_suggested_keywords(business_description)
        
        if suggestions:
            return {
                "success": True,
                "suggestions": suggestions
            }
        else:
            return {
                "success": False,
                "error": "Failed to generate suggestions"
            }
            
    except Exception as e:
        logger.error(f"Error generating logo suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# BRAND NAME GENERATION ENDPOINT
# =============================================================================

@app.post("/logo/generate-names")
async def generate_brand_names(request: dict):
    """Generate brand name suggestions using AI"""
    try:
        from agents.identity.main import LogoGeneratorAgent
        
        business_description = request.get("business_description", "")
        if not business_description:
            raise HTTPException(status_code=400, detail="Business description is required")
        
        agent = LogoGeneratorAgent()
        
        # Use AI to generate brand name suggestions
        name_prompt = f"""
        Based on this business description: "{business_description}"
        
        Generate 8 creative, brandable business names that are:
        - Short (1-3 words max)
        - Memorable and catchy
        - Professional sounding
        - Relevant to the business
        - Easy to pronounce
        - Suitable for branding
        
        Return the response in this exact JSON format:
        {{
            "names": ["Name1", "Name2", "Name3", "Name4", "Name5", "Name6", "Name7", "Name8"]
        }}
        """
        
        response = agent.client.chat.completions.create(
            model=agent.model,
            messages=[{"role": "user", "content": name_prompt}],
            temperature=0.8
        )
        
        content = response.choices[0].message.content
        # Extract JSON from the response
        import json
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                name_data = json.loads(json_match.group())
                if 'names' in name_data and len(name_data['names']) > 0:
                    return {
                        "success": True,
                        "names": name_data['names']
                    }
            except json.JSONDecodeError:
                pass
        
        # Fallback if JSON parsing fails
        return {
            "success": False,
            "error": "Failed to generate brand names",
            "names": []
        }
        
    except Exception as e:
        logger.error(f"Error generating brand names: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# HEALTH & ROOT ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    logger.info("=== ROOT ENDPOINT ===")
    
    response_data = {
        "message": "BrandOrbAI Unified API",
        "version": "1.0.0",
        "endpoints": {
            "multi_agent": "/run-all, /agent-output",
            "bmc": "/bmc/run, /bmc/output",
            "image_generation": "/generate-image, /image-output",
            "swot_analysis": "/run-swot, /swot-output",
            "brand_identity": "/run-brand-identity, /brand-identity/revise, /generate-brand-palettes",
            "brand_discovery": "/brand-discovery/init, /brand-discovery/respond, /brand-discovery/suggestions, /brand-discovery/complete",
            "logo_generation": "/logo/generate-palettes, /logo/generate, /logo/generate-3d, /logo/suggestions",
            "logo_vectorization": "/vectorize-logo",
            "vectorization": "/vectorization/vectorize, /vectorization/vectorize/upload/autotrace, /vectorization/vectorize/upload/potrace, /vectorization/health",
            "ideation": {
                "POST /init": "Initialize a new session",
                "POST /respond": "Submit response to any question by index and get next question",
                "POST /suggest": "Get suggested answer using keywords for any question by index",
                "GET /keywords/{session_id}/{question_index}": "Get keywords for any question by index",
                "GET /summary/{session_id}": "Get comprehensive summary of business idea analysis",
                "POST /reset": "Reset questions after specified index",
                "GET /session/{session_id}": "Get session state",
                "DELETE /session/{session_id}": "Delete session",
            }
        },
        "status": "All services active and ready"
    }
    
    logger.info(f"ROOT RESPONSE JSON: {json.dumps(response_data, indent=2)}")
    logger.info("=== END ROOT ENDPOINT ===\n")
    
    return response_data

@app.get("/health")
def health_check():
    """Health check endpoint."""
    logger.info("=== HEALTH CHECK ===")
    
    response_data = {"status": "healthy", "service": "BrandOrbAI Unified API"}
    logger.info(f"HEALTH RESPONSE JSON: {json.dumps(response_data, indent=2)}")
    logger.info("=== END HEALTH CHECK ===\n")
    
    return response_data

# =============================================================================
# STOCK IMAGES API ENDPOINTS
# =============================================================================

class StockImageRequest(BaseModel):
    query: str
    perPage: int = 8
    page: int = 1
    orientation: str = "landscape"

@app.post("/stock-images")
async def get_stock_images(request: StockImageRequest):
    """Get stock images from Pexels API"""
    logger.info(f"=== STOCK IMAGES REQUEST: {request.query} ===")
    
    try:
        headers = {
            'Authorization': 't2kXItoCsRYzjXRMm2muPOVE0fanryzMiD13aywXH7o6RPAmphADpkeh'
        }
        
        params = {
            'query': request.query,
            'per_page': request.perPage,
            'page': request.page,
            'orientation': request.orientation
        }
        
        logger.info(f"Calling Pexels API with query: '{request.query}'")
        
        response = requests.get(
            'https://api.pexels.com/v1/search',
            headers=headers,
            params=params,
            timeout=30
        )
        
        logger.info(f"Pexels API response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            photo_count = len(result.get("photos", []))
            logger.info(f"✅ Stock images successful! Found {photo_count} photos")
            return result
        else:
            error_msg = f"Failed to fetch stock images: {response.status_code}"
            if response.text:
                error_msg += f" - {response.text[:200]}"
            logger.error(error_msg)
            raise HTTPException(status_code=response.status_code, detail=error_msg)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stock images error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# LOGO VECTORIZATION API ENDPOINTS
# =============================================================================

class VectorizeLogoRequest(BaseModel):
    logoUrl: str
    method: str = "autotrace"  # autotrace or potrace
    colorCount: Optional[int] = 8  # Number of colors to extract from SVG
    threshold: Optional[str] = "60%"  # Threshold for potrace
    generateVariations: bool = True  # Generate meaningful color variations
    preprocessImage: bool = False  # NEW: Disabled for direct approach
    aiSeparation: bool = False  # NEW: Disabled for direct approach
    noBackgroundRemoval: Optional[bool] = True  # NEW: Keep background intact
    createPngVariations: Optional[bool] = True  # NEW: Create PNG versions

class VectorizeLogoResponse(BaseModel):
    success: bool
    vectorizedLogoUrl: Optional[str] = None
    svgContent: Optional[str] = None
    vectorizationStatus: str
    metadata: Optional[Dict[str, Any]] = None
    logoVariations: Optional[Dict[str, Any]] = None  # Logo variations
    error: Optional[str] = None

@app.post("/vectorize-logo", response_model=VectorizeLogoResponse)
async def vectorize_logo(request: VectorizeLogoRequest):
    """🎯 PURE PYTHON logo vectorization with meaningful color variations"""
    logger.info(f"=== 🎯 PURE PYTHON VECTORIZE LOGO REQUEST: {request.logoUrl[:100]}... ===")
    logger.info(f"Pure Python Method: {request.method}, Colors: {request.colorCount}")
    
    try:
        # Use PURE PYTHON vectorization approach
        logger.info(f"🎯 Starting PURE PYTHON vectorization (no external dependencies)...")
        
        vectorized_logo_url = None
        svg_content = None
        vectorization_status = "pending"
        metadata = {}
        logo_variations = {}
        
        try:
            # Use our pure Python vectorization service
            from agents.identity.vectorization_service import create_vectorization_service
            
            logger.info(f"🎯 Processing logo with PURE PYTHON approach...")
            
            # Create vectorization service instance
            vectorization_service = create_vectorization_service()
            
            # ENHANCED APPROACH: Pure Python vectorization with upscaling and pixel-to-vector conversion
            logger.info("🎯 ENHANCED VECTORIZATION: Upscaling + Pixel-to-Vector + 7 Variations (incl. Grayscale)")
            result = vectorization_service.vectorize_image_with_ai_separation(
                image_url=request.logoUrl,
                method="python_svg",
                target_size=1200,  # Higher resolution for better vectors
                upscale_factor=2.0,  # Minimum 2x upscaling
                color_count=request.colorCount or 12,  # More colors for better analysis
                generate_variations=request.generateVariations,
                create_png_variations=getattr(request, 'createPngVariations', True)
            )
            
            logger.info(f"🎯 Enhanced vectorization result: {result.get('success', False)} - Grayscale variation included")
            
            if result.get("success"):
                # Get SVG content
                svg_content = result.get("svg_content")
                if svg_content:
                    # Convert SVG to data URL
                    vectorized_logo_url = vectorization_service.get_svg_as_data_url(svg_content)
                    vectorization_status = "success_enhanced_upscaled_vector"
                    metadata = result.get("metadata", {})
                    
                    # Get variations created by SVG processing
                    if result.get("variations"):
                        logo_variations = result["variations"]
                        colors_found = metadata.get("colors_found", 0)
                        meaningful_variations = metadata.get("meaningful_variations", 0)
                        
                        logger.info(f"✅ Enhanced vectorization successful! Upscaled with {result['metadata']['colors_found']} colors + Grayscale variation")
                        logger.info(f"🎯 Found {colors_found} colors, created {meaningful_variations} meaningful variations")
                        logger.info(f"📊 No external dependencies, preserves original image integrity")
                        
                else:
                    vectorization_status = "no_svg_content"
                    logger.warning("Pure Python vectorization successful but no SVG content returned")
            else:
                error_msg = result.get("error", "Unknown error")
                vectorization_status = f"pure_python_failed"
                logger.warning(f"Pure Python vectorization failed: {error_msg}")
                
        except ImportError as e:
            vectorization_status = "vectorization_service_not_available"
            logger.warning(f"Pure Python vectorization service not available: {e}")
        except Exception as e:
            vectorization_status = f"pure_python_error_{type(e).__name__}"
            logger.warning(f"Pure Python vectorization error: {str(e)}")
        
        logger.info(f"✅ Pure Python vectorization complete - status: {vectorization_status}")
        
        return VectorizeLogoResponse(
            success=bool(vectorized_logo_url),
            vectorizedLogoUrl=vectorized_logo_url,
            svgContent=svg_content,
            vectorizationStatus=vectorization_status,
            metadata=metadata,
            logoVariations=logo_variations if logo_variations else None,
            error=None if vectorized_logo_url else f"Pure Python vectorization failed: {vectorization_status}"
        )
        
    except Exception as e:
        logger.error(f"Pure Python logo vectorization error: {str(e)}")
        return VectorizeLogoResponse(
            success=False,
            vectorizedLogoUrl=None,
            svgContent=None,
            vectorizationStatus="error",
            metadata=None,
            logoVariations=None,
            error=f"Failed to vectorize logo: {str(e)}"
        )

# =============================================================================
# LOGO VARIATIONS GENERATION FUNCTIONS
# =============================================================================

async def generate_logo_variations(svg_content: str, vectorization_service=None):
    """Generate different logo variations from SVG content"""
    try:
        variations = {}
        
        # Parse SVG to get dimensions and elements
        import xml.etree.ElementTree as ET
        from io import StringIO
        import re
        
        # Clean SVG content and parse
        svg_root = ET.fromstring(svg_content)
        
        # Get original dimensions
        width = svg_root.get('width', '1024')
        height = svg_root.get('height', '1024')
        viewbox = svg_root.get('viewBox', f'0 0 {width} {height}')
        
        # Extract numeric values from dimensions
        width_num = int(re.search(r'\d+', str(width)).group()) if re.search(r'\d+', str(width)) else 1024
        height_num = int(re.search(r'\d+', str(height)).group()) if re.search(r'\d+', str(height)) else 1024
        
        # 1. Primary Logo (Original)
        variations['primary'] = {
            'name': 'Primary Logo',
            'description': 'Main logo version for general use',
            'svg_content': svg_content,
            'data_url': vectorization_service.get_svg_as_data_url(svg_content) if vectorization_service else None,
            'dimensions': {'width': width_num, 'height': height_num},
            'usage': 'Headers, business cards, primary branding'
        }
        
        # 2. Horizontal Version (if not already horizontal)
        if height_num > width_num * 0.6:  # If logo is more square/vertical
            horizontal_svg = create_horizontal_variation(svg_content, svg_root, width_num, height_num)
            variations['horizontal'] = {
                'name': 'Horizontal Logo',
                'description': 'Wide format logo for headers and banners',
                'svg_content': horizontal_svg,
                'data_url': vectorization_service.get_svg_as_data_url(horizontal_svg) if vectorization_service else None,
                'dimensions': {'width': width_num * 1.5, 'height': height_num * 0.7},
                'usage': 'Website headers, email signatures, letterheads'
            }
        
        # 3. Vertical/Stacked Version
        vertical_svg = create_vertical_variation(svg_content, svg_root, width_num, height_num)
        variations['vertical'] = {
            'name': 'Vertical Logo',
            'description': 'Stacked logo for narrow spaces',
            'svg_content': vertical_svg,
            'data_url': vectorization_service.get_svg_as_data_url(vertical_svg) if vectorization_service else None,
            'dimensions': {'width': width_num * 0.8, 'height': height_num * 1.3},
            'usage': 'Social media profiles, mobile apps, narrow layouts'
        }
        
        # 4. Icon/Brandmark Only (extract main graphic element)
        icon_svg = create_icon_variation(svg_content, svg_root, width_num, height_num)
        variations['icon'] = {
            'name': 'Icon/Brandmark',
            'description': 'Graphic element only, no text',
            'svg_content': icon_svg,
            'data_url': vectorization_service.get_svg_as_data_url(icon_svg) if vectorization_service else None,
            'dimensions': {'width': min(width_num, height_num), 'height': min(width_num, height_num)},
            'usage': 'Favicons, app icons, social media avatars'
        }
        
        # 5. Wordmark/Logotype (text elements only)
        wordmark_svg = create_wordmark_variation(svg_content, svg_root, width_num, height_num)
        if wordmark_svg:
            variations['wordmark'] = {
                'name': 'Wordmark/Logotype',
                'description': 'Text-only version of the logo',
                'svg_content': wordmark_svg,
                'data_url': vectorization_service.get_svg_as_data_url(wordmark_svg) if vectorization_service else None,
                'dimensions': {'width': width_num * 1.2, 'height': height_num * 0.4},
                'usage': 'Minimal applications, fine print, watermarks'
            }
        
        # 6. One-Color (Black) Version
        onecolor_svg = create_onecolor_variation(svg_content, svg_root, '#000000')
        variations['onecolor_black'] = {
            'name': 'One-Color (Black)',
            'description': 'Single black color version',
            'svg_content': onecolor_svg,
            'data_url': vectorization_service.get_svg_as_data_url(onecolor_svg) if vectorization_service else None,
            'dimensions': {'width': width_num, 'height': height_num},
            'usage': 'Photocopying, fax, single-color printing'
        }
        
        # 7. Reversed Out (White) Version
        reversed_svg = create_onecolor_variation(svg_content, svg_root, '#FFFFFF')
        variations['reversed_white'] = {
            'name': 'Reversed Out (White)',
            'description': 'White version for dark backgrounds',
            'svg_content': reversed_svg,
            'data_url': vectorization_service.get_svg_as_data_url(reversed_svg) if vectorization_service else None,
            'dimensions': {'width': width_num, 'height': height_num},
            'usage': 'Dark backgrounds, merchandise, packaging'
        }
        
        logger.info(f"Generated {len(variations)} logo variations successfully")
        return variations
        
    except Exception as e:
        logger.error(f"Error generating logo variations: {str(e)}")
        return {}

async def generate_png_logo_variations(png_bytes: bytes):
    """Generate logo variations from PNG with transparent background"""
    try:
        variations = {}
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Load the original PNG
        original_image = Image.open(io.BytesIO(png_bytes)).convert('RGBA')
        width, height = original_image.size
        
        # 1. Primary Logo (Original PNG)
        buffer = io.BytesIO()
        original_image.save(buffer, format='PNG')
        variations['primary'] = {
            'name': 'Primary Logo',
            'description': 'Main PNG logo with transparent background',
            'data_url': f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}",
            'dimensions': {'width': width, 'height': height},
            'usage': 'Digital use, websites, presentations'
        }
        
        # 2. Horizontal Version (if logo is tall)
        if height > width * 0.6:
            horizontal_img = create_horizontal_png(original_image)
            buffer = io.BytesIO()
            horizontal_img.save(buffer, format='PNG')
            variations['horizontal'] = {
                'name': 'Horizontal Logo',
                'description': 'Wide format PNG for headers',
                'data_url': f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}",
                'dimensions': {'width': horizontal_img.size[0], 'height': horizontal_img.size[1]},
                'usage': 'Website headers, banners'
            }
        
        # 3. Icon Version (square crop of main element)
        icon_img = create_icon_png(original_image)
        buffer = io.BytesIO()
        icon_img.save(buffer, format='PNG')
        variations['icon'] = {
            'name': 'Icon/Brandmark',
            'description': 'Square icon version',
            'data_url': f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}",
            'dimensions': {'width': icon_img.size[0], 'height': icon_img.size[1]},
            'usage': 'App icons, social media avatars'
        }
        
        # 4. One-Color Black Version
        black_img = create_onecolor_png(original_image, (0, 0, 0, 255))
        buffer = io.BytesIO()
        black_img.save(buffer, format='PNG')
        variations['onecolor_black'] = {
            'name': 'One-Color (Black)',
            'description': 'Black version for single-color printing',
            'data_url': f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}",
            'dimensions': {'width': black_img.size[0], 'height': black_img.size[1]},
            'usage': 'Photocopying, single-color print'
        }
        
        # 5. White Version
        white_img = create_onecolor_png(original_image, (255, 255, 255, 255))
        buffer = io.BytesIO()
        white_img.save(buffer, format='PNG')
        variations['reversed_white'] = {
            'name': 'Reversed Out (White)',
            'description': 'White version for dark backgrounds',
            'data_url': f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}",
            'dimensions': {'width': white_img.size[0], 'height': white_img.size[1]},
            'usage': 'Dark backgrounds, merchandise'
        }
        
        logger.info(f"Generated {len(variations)} PNG-based logo variations")
        return variations
        
    except Exception as e:
        logger.error(f"Error generating PNG logo variations: {str(e)}")
        return {}

def create_horizontal_variation(svg_content: str, svg_root, width: int, height: int):
    """Create horizontal layout variation"""
    try:
        # Simple approach: adjust viewBox to make it wider
        new_viewbox = f"0 0 {width * 1.5} {height * 0.7}"
        horizontal_svg = svg_content.replace(
            svg_root.get('viewBox', f'0 0 {width} {height}'),
            new_viewbox
        )
        return horizontal_svg
    except:
        return svg_content

def create_vertical_variation(svg_content: str, svg_root, width: int, height: int):
    """Create vertical/stacked layout variation"""
    try:
        # Simple approach: adjust viewBox to make it taller
        new_viewbox = f"0 0 {width * 0.8} {height * 1.3}"
        vertical_svg = svg_content.replace(
            svg_root.get('viewBox', f'0 0 {width} {height}'),
            new_viewbox
        )
        return vertical_svg
    except:
        return svg_content

def create_icon_variation(svg_content: str, svg_root, width: int, height: int):
    """Create icon-only variation by focusing on graphic elements"""
    try:
        # Create a square viewBox focusing on the center
        size = min(width, height)
        offset_x = (width - size) // 2
        offset_y = (height - size) // 2
        new_viewbox = f"{offset_x} {offset_y} {size} {size}"
        
        icon_svg = svg_content.replace(
            svg_root.get('viewBox', f'0 0 {width} {height}'),
            new_viewbox
        )
        return icon_svg
    except:
        return svg_content

def create_wordmark_variation(svg_content: str, svg_root, width: int, height: int):
    """Create text-only variation"""
    try:
        # This is a simplified approach - in a real implementation,
        # you'd parse SVG elements and extract text elements only
        import re
        
        # Look for text elements in SVG
        if '<text' in svg_content or 'font' in svg_content.lower():
            # Create a wider, shorter viewBox for text
            new_viewbox = f"0 0 {width * 1.2} {height * 0.4}"
            wordmark_svg = svg_content.replace(
                svg_root.get('viewBox', f'0 0 {width} {height}'),
                new_viewbox
            )
            return wordmark_svg
        return None
    except:
        return None

def create_onecolor_variation(svg_content: str, svg_root, color: str):
    """Create single-color variation"""
    try:
        import re
        
        # Replace all fill colors with the specified color
        onecolor_svg = re.sub(r'fill="[^"]*"', f'fill="{color}"', svg_content)
        onecolor_svg = re.sub(r'stroke="[^"]*"', f'stroke="{color}"', onecolor_svg)
        
        # Handle style attributes
        onecolor_svg = re.sub(r'fill:[^;]*;', f'fill:{color};', onecolor_svg)
        onecolor_svg = re.sub(r'stroke:[^;]*;', f'stroke:{color};', onecolor_svg)
        
        return onecolor_svg
    except:
        return svg_content

def create_horizontal_png(image):
    """Create horizontal PNG variation"""
    try:
        from PIL import Image
        
        # Create a wider canvas
        new_width = int(image.width * 1.5)
        new_height = int(image.height * 0.8)
        
        horizontal_img = Image.new('RGBA', (new_width, new_height), (255, 255, 255, 0))
        
        # Paste original image in center
        x_offset = (new_width - image.width) // 2
        y_offset = (new_height - image.height) // 2
        horizontal_img.paste(image, (x_offset, y_offset), image)
        
        return horizontal_img
    except:
        return image

def create_icon_png(image):
    """Create square icon PNG"""
    try:
        from PIL import Image
        
        # Create square dimensions
        size = min(image.width, image.height)
        icon_img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        
        # Crop to center square
        left = (image.width - size) // 2
        top = (image.height - size) // 2
        cropped = image.crop((left, top, left + size, top + size))
        
        icon_img.paste(cropped, (0, 0), cropped)
        return icon_img
    except:
        return image

def create_onecolor_png(image, color):
    """Create single-color PNG variation"""
    try:
        from PIL import Image
        
        # Convert to grayscale first to get the alpha mask
        grayscale = image.convert('LA')
        
        # Create new image with specified color
        onecolor_img = Image.new('RGBA', image.size, (255, 255, 255, 0))
        
        # Apply color based on original image's alpha
        pixels = list(image.getdata())
        new_pixels = []
        
        for pixel in pixels:
            if len(pixel) == 4:  # RGBA
                if pixel[3] > 0:  # If not transparent
                    new_pixels.append((color[0], color[1], color[2], pixel[3]))
                else:
                    new_pixels.append((255, 255, 255, 0))
            else:
                new_pixels.append(color)
        
        onecolor_img.putdata(new_pixels)
        return onecolor_img
    except:
        return image

# =============================================================================
# BRAND GUIDELINES EXPORT ENDPOINTS
# =============================================================================

class BrandGuidelinesExportRequest(BaseModel):
    brandData: Dict[str, Any]
    format: str = "pdf"

class BrandGuidelinesExportResponse(BaseModel):
    success: bool
    downloadUrl: Optional[str] = None
    error: Optional[str] = None

@app.post("/brand-guidelines/export", response_model=BrandGuidelinesExportResponse)
async def export_brand_guidelines(request: BrandGuidelinesExportRequest):
    """Export brand guidelines to various formats"""
    logger.info(f"=== BRAND GUIDELINES EXPORT: {request.format} ===")
    
    try:
        brand_data = request.brandData
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if request.format == "json":
            filename = f"brand_guidelines_{timestamp}.json"
            filepath = os.path.join("agents", "output", filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w') as f:
                json.dump(brand_data, f, indent=2)
            
            return BrandGuidelinesExportResponse(
                success=True,
                downloadUrl=f"/download/{filename}"
            )
            
        elif request.format == "html":
            # Generate HTML brand guidelines
            html_content = generate_html_guidelines(brand_data)
            filename = f"brand_guidelines_{timestamp}.html"
            filepath = os.path.join("agents", "output", filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            return BrandGuidelinesExportResponse(
                success=True,
                downloadUrl=f"/download/{filename}"
            )
            
        else:  # PDF format
            # For PDF generation, you would need a library like reportlab or weasyprint
            # For now, return a text format
            text_content = generate_text_guidelines(brand_data)
            filename = f"brand_guidelines_{timestamp}.txt"
            filepath = os.path.join("agents", "output", filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            return BrandGuidelinesExportResponse(
                success=True,
                downloadUrl=f"/download/{filename}"
            )
            
    except Exception as e:
        logger.error(f"Brand guidelines export error: {str(e)}")
        return BrandGuidelinesExportResponse(
            success=False,
            error=str(e)
        )

def generate_html_guidelines(brand_data: Dict[str, Any]) -> str:
    """Generate HTML brand guidelines"""
    colors_html = ""
    if brand_data.get("colors"):
        colors_html = "<div class='colors'>"
        for color in brand_data["colors"]:
            colors_html += f'<div class="color-swatch" style="background-color: {color}"><span>{color}</span></div>'
        colors_html += "</div>"
    
    personality_html = ""
    if brand_data.get("personality"):
        personality_html = "<ul>"
        for trait in brand_data["personality"]:
            personality_html += f"<li>{trait}</li>"
        personality_html += "</ul>"
    
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{brand_data.get('name', 'Brand')} Guidelines</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }}
            h2 {{ color: #666; margin-top: 30px; }}
            .colors {{ display: flex; gap: 20px; margin: 20px 0; }}
            .color-swatch {{ 
                width: 100px; height: 100px; border-radius: 8px; 
                display: flex; align-items: center; justify-content: center;
                color: white; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
            }}
            .logo {{ text-align: center; margin: 20px 0; }}
            .logo img {{ max-width: 300px; max-height: 200px; }}
        </style>
    </head>
    <body>
        <h1>{brand_data.get('name', 'Brand')} Brand Guidelines</h1>
        
        <h2>Brand Logo</h2>
        <div class="logo">
            {f'<img src="{brand_data["logoUrl"]}" alt="Brand Logo" />' if brand_data.get("logoUrl") else '<p>Logo not available</p>'}
        </div>
        
        <h2>Color Palette</h2>
        {colors_html}
        
        <h2>Brand Personality</h2>
        {personality_html}
        
        <h2>Brand Description</h2>
        <p>{brand_data.get('customDescription', 'No description provided')}</p>
        
        <h2>Usage Guidelines</h2>
        <ul>
            <li>Maintain proper logo clear space</li>
            <li>Use brand colors consistently</li>
            <li>Follow typography guidelines</li>
            <li>Ensure brand voice consistency</li>
        </ul>
        
        <p><em>Generated on {datetime.now().strftime("%B %d, %Y")}</em></p>
    </body>
    </html>
    """
    
    return html_template

def generate_text_guidelines(brand_data: Dict[str, Any]) -> str:
    """Generate text brand guidelines"""
    text = f"""
{brand_data.get('name', 'Brand')} Brand Guidelines
{'='*50}

Brand Colors:
{chr(10).join([f'- {color}' for color in brand_data.get('colors', [])])}

Brand Personality:
{chr(10).join([f'- {trait}' for trait in brand_data.get('personality', [])])}

Brand Description:
{brand_data.get('customDescription', 'No description provided')}

Logo Usage Guidelines:
- Maintain minimum clear space around logo
- Use on appropriate backgrounds for visibility
- Never distort or stretch the logo
- Use vector formats when possible

Typography Guidelines:
- Use consistent font families
- Maintain proper hierarchy
- Ensure readability across all media

Generated on: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
    """
    
    return text.strip()

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated files"""
    filepath = os.path.join("agents", "output", filename)
    
    if os.path.exists(filepath):
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/octet-stream'
        )
    else:
        raise HTTPException(status_code=404, detail="File not found")

# =============================================================================
# INVESTOR RECOMMENDATION ENDPOINTS
# =============================================================================

class InvestorAnalysisRequest(BaseModel):
    business_summary: str

class InvestorAnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str = ""

@app.post("/investors/analyze", response_model=InvestorAnalysisResponse)
async def analyze_for_investors_endpoint(request: InvestorAnalysisRequest):
    """
    Analyze business for investor recommendations.
    """
    try:
        logger.info(f"🔍 Analyzing business for investors: {request.business_summary[:100]}...")
        
        result = analyze_business_for_investors(request.business_summary)
        
        logger.info(f"✅ Investor analysis completed with {len(result.get('recommendations', []))} matches")
        
        return InvestorAnalysisResponse(
            success=True,
            data=result,
            message=f"Found {len(result.get('recommendations', []))} top investor matches"
        )
        
    except Exception as e:
        logger.error(f"❌ Error in investor analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze for investors: {e}")

@app.get("/investors/recommendations", response_model=InvestorAnalysisResponse)
async def get_investor_recommendations_endpoint():
    """
    Get existing investor recommendations from output file.
    """
    try:
        # Try to read from output file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        output_file = os.path.join(current_dir, "output", "investor_analysis_output.json")
        
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Extract the data we need
            result = {
                "recommendations": data.get("investor_recommendations", []),
                "readiness_score": data.get("investment_readiness_score", 0.7),
                "total_investors_analyzed": data.get("total_investors_analyzed", 6089)
            }
            
            return InvestorAnalysisResponse(
                success=True,
                data=result,
                message=f"Retrieved {len(result['recommendations'])} existing recommendations"
            )
        else:
            return InvestorAnalysisResponse(
                success=False,
                data={"recommendations": [], "readiness_score": 0, "total_investors_analyzed": 0},
                message="No existing analysis found"
            )
            
    except Exception as e:
        logger.error(f"❌ Error getting investor recommendations: {e}")
        return InvestorAnalysisResponse(
            success=False,
            data={"recommendations": [], "readiness_score": 0, "total_investors_analyzed": 0},
            message=f"Failed to get recommendations: {e}"
        )

@app.get("/investors/all")
async def get_all_investors_endpoint():
    """
    Get all investors for table display.
    """
    try:
        logger.info("📊 Getting all investors for table display")
        
        investors = get_all_investors_for_table()
        
        logger.info(f"✅ Retrieved {len(investors)} investors for table")
        
        return {
            "success": True,
            "data": investors,
            "total": len(investors),
            "message": f"Retrieved {len(investors)} investors"
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting all investors: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get investors: {e}")

@app.post("/investors/save")
async def save_investor_analysis_endpoint(data: Dict[str, Any]):
    """
    Save investor analysis to files.
    """
    try:
        from agents.investor_agent import save_investor_analysis_to_file
        
        result = save_investor_analysis_to_file(data, data.get("business_summary", ""))
        
        return {
            "success": result.get("success", False),
            "message": "Analysis saved successfully" if result.get("success") else "Failed to save analysis",
            "files": result.get("files_created", [])
        }
        
    except Exception as e:
        logger.error(f"❌ Error saving investor analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {e}")

# =============================================================================
# SOCIAL MEDIA ANALYSIS ENDPOINTS
# =============================================================================

@app.post("/marketing-strategy/add-competitor")
async def add_competitor_for_analysis(request: dict):
    """Add a new competitor to the marketing analysis"""
    try:
        competitor_url = request.get("url", "")
        platform = request.get("platform", "")
        
        if not competitor_url or not platform:
            raise HTTPException(status_code=400, detail="URL and platform are required")
        
        # Validate URL format
        if platform == "linkedin" and "linkedin.com/company/" not in competitor_url:
            raise HTTPException(status_code=400, detail="Invalid LinkedIn company URL format")
        elif platform == "tiktok" and "tiktok.com/@" not in competitor_url:
            raise HTTPException(status_code=400, detail="Invalid TikTok profile URL format")
        
        # Extract competitor name
        if platform == "linkedin":
            competitor_name = competitor_url.split('/company/')[1].split('/')[0]
        else:  # TikTok
            competitor_name = competitor_url.split('@')[1].split('/')[0]
        
        # Store competitor for later analysis
        competitor_data = {
            "id": str(uuid.uuid4()),
            "url": competitor_url,
            "platform": platform,
            "name": competitor_name,
            "added_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "competitor": competitor_data,
            "message": f"{competitor_name} added successfully for {platform} analysis"
        }
        
    except Exception as e:
        logger.error(f"Error adding competitor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/marketing-strategy/get-top-posts")
async def get_top_engaging_posts():
    """Get top engaging posts from LinkedIn and TikTok analysis results"""
    try:
        posts_data = {
            "linkedin_posts": [],
            "tiktok_posts": []
        }
        
        # Read LinkedIn data from results file if exists
        linkedin_results_dir = Path("agents/linkedin_agent-main/linkedin_scraping_results")
        if linkedin_results_dir.exists():
            for file in linkedin_results_dir.glob("*.json"):
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        linkedin_data = json.load(f)
                    
                    # Process LinkedIn posts and extract top 5
                    if isinstance(linkedin_data, list) and len(linkedin_data) > 0:
                        # Sort by total reactions (engagement)
                        sorted_posts = sorted(
                            linkedin_data,
                            key=lambda x: x.get("stats", {}).get("total_reactions", 0),
                            reverse=True
                        )[:5]
                        
                        for post in sorted_posts:
                            processed_post = {
                                "id": post.get("activity_urn", ""),
                                "platform": "linkedin",
                                "company": post.get("author", {}).get("name", "Unknown Company"),
                                "content": post.get("text", "")[:200] + "..." if len(post.get("text", "")) > 200 else post.get("text", ""),
                                "engagement": {
                                    "likes": post.get("stats", {}).get("like", 0),
                                    "comments": post.get("stats", {}).get("comment", 0),
                                    "shares": post.get("stats", {}).get("share", 0),
                                    "total_reactions": post.get("stats", {}).get("total_reactions", 0),
                                    "engagement_rate": f"{min(99.9, (post.get('stats', {}).get('total_reactions', 0) / max(1, post.get('author', {}).get('follower_count', 1000)) * 100)):.1f}"
                                },
                                "posted_date": post.get("posted_at", {}).get("date", "").split(" ")[0] if post.get("posted_at") else "",
                                "content_type": "Document" if post.get("document") else "Text Post",
                                "has_document": bool(post.get("document")),
                                "hashtags": [tag for tag in post.get("text", "").split() if tag.startswith("#")][:4],
                                "url": post.get("post_url", "")
                            }
                            posts_data["linkedin_posts"].append(processed_post)
                        break  # Use only the first file found
                    
                except Exception as e:
                    logger.warning(f"Failed to process LinkedIn file {file}: {e}")
        
        # Read TikTok data from results file if exists
        tiktok_results_dir = Path("agents/tiktok_insights_agent-main/tiktok_scraping_results")
        if tiktok_results_dir.exists():
            for file in tiktok_results_dir.glob("*.json"):
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        tiktok_data = json.load(f)
                    
                    # Process TikTok posts and extract top 5
                    if isinstance(tiktok_data, list) and len(tiktok_data) > 0:
                        # Sort by total engagement (likes + shares + comments)
                        sorted_videos = sorted(
                            tiktok_data,
                            key=lambda x: x.get("diggCount", 0) + x.get("shareCount", 0) + x.get("commentCount", 0),
                            reverse=True
                        )[:5]
                        
                        for video in sorted_videos:
                            total_engagement = video.get("diggCount", 0) + video.get("shareCount", 0) + video.get("commentCount", 0)
                            engagement_rate = (total_engagement / max(1, video.get("playCount", 1)) * 100)
                            
                            processed_post = {
                                "id": video.get("webVideoUrl", "").split("/")[-1] if video.get("webVideoUrl") else "",
                                "platform": "tiktok",
                                "company": video.get("authorMeta.name", "Unknown Profile"),
                                "content": video.get("text", "")[:200] + "..." if len(video.get("text", "")) > 200 else video.get("text", ""),
                                "engagement": {
                                    "likes": video.get("diggCount", 0),
                                    "comments": video.get("commentCount", 0),
                                    "shares": video.get("shareCount", 0),
                                    "views": video.get("playCount", 0),
                                    "engagement_rate": f"{min(99.9, engagement_rate):.1f}"
                                },
                                "posted_date": video.get("createTimeISO", "").split("T")[0] if video.get("createTimeISO") else "",
                                "content_type": "Video",
                                "duration": video.get("videoMeta.duration", 0),
                                "hashtags": [tag for tag in video.get("text", "").split() if tag.startswith("#")][:4],
                                "url": video.get("webVideoUrl", "")
                            }
                            posts_data["tiktok_posts"].append(processed_post)
                        break  # Use only the first file found
                        
                except Exception as e:
                    logger.warning(f"Failed to process TikTok file {file}: {e}")
        
        # If no real data found, generate simulated data based on Talan Tunisia
        if not posts_data["linkedin_posts"] and not posts_data["tiktok_posts"]:
            posts_data = _generate_simulated_top_posts()
        
        return {
            "success": True,
            "data": posts_data,
            "total_linkedin_posts": len(posts_data["linkedin_posts"]),
            "total_tiktok_posts": len(posts_data["tiktok_posts"])
        }
        
    except Exception as e:
        logger.error(f"Error getting top posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/social-media/linkedin/analyze", response_model=SocialMediaInsightsResponse)
async def analyze_linkedin_competitor(request: LinkedInInsightsRequest):
    """Start LinkedIn analysis for competitor insights"""
    try:
        # Check if LinkedIn agent is available
        linkedin_path = Path("agents/linkedin_agent-main")
        if not linkedin_path.exists():
            raise HTTPException(status_code=500, detail="LinkedIn agent not found")
        
        # Start LinkedIn analysis by calling the separate service
        analysis_data = {
            "company_urls": request.company_urls,
            "limit": request.limit,
            "min_support": request.min_support,
            "min_confidence": request.min_confidence,
            "min_lift": request.min_lift
        }
        
        # Make request to LinkedIn service (assuming it runs on port 8002)
        try:
            response = requests.post(
                "http://localhost:8002/scrape-posts",
                json=analysis_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return SocialMediaInsightsResponse(
                    session_id=result["session_id"],
                    status=result["status"],
                    platform="LinkedIn",
                    message=result["message"]
                )
            else:
                raise HTTPException(status_code=500, detail="LinkedIn service error")
                
        except requests.exceptions.ConnectionError:
            raise HTTPException(status_code=503, detail="LinkedIn analysis service unavailable")
            
    except Exception as e:
        logger.error(f"LinkedIn analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/social-media/tiktok/analyze", response_model=SocialMediaInsightsResponse)
async def analyze_tiktok_competitor(request: TikTokInsightsRequest):
    """Start TikTok analysis for competitor insights"""
    try:
        # Check if TikTok agent is available
        tiktok_path = Path("agents/tiktok_insights_agent-main")
        if not tiktok_path.exists():
            raise HTTPException(status_code=500, detail="TikTok agent not found")
        
        # Start TikTok analysis by calling the separate service
        analysis_data = {
            "profile_names": request.profile_names,
            "results_per_page": request.results_per_page,
            "min_support": request.min_support,
            "min_confidence": request.min_confidence,
            "min_lift": request.min_lift
        }
        
        # Make request to TikTok service (assuming it runs on port 8003)
        try:
            response = requests.post(
                "http://localhost:8003/scrape-profiles",
                json=analysis_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return SocialMediaInsightsResponse(
                    session_id=result["session_id"],
                    status=result["status"],
                    platform="TikTok",
                    message=result["message"]
                )
            else:
                raise HTTPException(status_code=500, detail="TikTok service error")
                
        except requests.exceptions.ConnectionError:
            raise HTTPException(status_code=503, detail="TikTok analysis service unavailable")
            
    except Exception as e:
        logger.error(f"TikTok analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/social-media/linkedin/session/{session_id}/status")
async def get_linkedin_session_status(session_id: str):
    """Get LinkedIn analysis session status"""
    try:
        response = requests.get(f"http://localhost:8002/session/{session_id}/status")
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="LinkedIn service unavailable")

@app.get("/social-media/tiktok/session/{session_id}/status")
async def get_tiktok_session_status(session_id: str):
    """Get TikTok analysis session status"""
    try:
        response = requests.get(f"http://localhost:8003/session/{session_id}/status")
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="TikTok service unavailable")

@app.post("/social-media/linkedin/session/{session_id}/insights")
async def get_linkedin_insights(session_id: str, targets: List[str] = None):
    """Get LinkedIn insights from completed analysis"""
    try:
        if targets is None:
            targets = ["high_engagement_rate", "viral"]
            
        insight_data = {
            "session_id": session_id,
            "targets": targets
        }
        
        response = requests.post(
            "http://localhost:8002/generate-insights",
            json=insight_data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=400, detail="Cannot generate insights")
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="LinkedIn service unavailable")

@app.post("/social-media/tiktok/session/{session_id}/insights")
async def get_tiktok_insights(session_id: str, targets: List[str] = None):
    """Get TikTok insights from completed analysis"""
    try:
        if targets is None:
            targets = ["high_engagement_rate", "viral"]
            
        insight_data = {
            "session_id": session_id,
            "targets": targets
        }
        
        response = requests.post(
            "http://localhost:8003/generate-insights",
            json=insight_data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=400, detail="Cannot generate insights")
            
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="TikTok service unavailable")

@app.post("/marketing-strategy/comprehensive-analysis")
async def comprehensive_marketing_analysis(request: SocialMediaAnalysisRequest):
    """Comprehensive marketing strategy analysis using both LinkedIn and TikTok data"""
    try:
        # Read existing analysis files from output directory
        base_path = Path("agents/output")
        
        # Read business summary
        business_summary = ""
        business_summary_path = base_path / "business_summary.txt"
        if business_summary_path.exists():
            with open(business_summary_path, "r", encoding="utf-8") as f:
                raw_summary = f.read()
                # Remove the "Generated on" date line for cleaner processing
                business_summary = raw_summary.split("\nGenerated on")[0] if "\nGenerated on" in raw_summary else raw_summary
        else:
            business_summary = request.business_summary or "No business summary available"
        
        # Read brand identity data
        brand_identity = {}
        brand_identity_files = [
            "brand_discovery_output.json",
            "brand_identity_output.json", 
            "identity_output.json"
        ]
        
        for filename in brand_identity_files:
            file_path = base_path / filename
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        brand_identity.update(json.load(f))
                    break
                except Exception as e:
                    logger.warning(f"Failed to read {filename}: {e}")
        
        # Read viability assessment
        viability_data = {}
        viability_path = base_path / "viability_assessment_output.json"
        if viability_path.exists():
            try:
                with open(viability_path, "r", encoding="utf-8") as f:
                    viability_data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read viability assessment: {e}")
        
        # Read market analysis
        market_data = ""
        market_path = base_path / "market_analysis_competitors_output.txt"
        if market_path.exists():
            with open(market_path, "r", encoding="utf-8") as f:
                market_data = f.read()
        
        # Read financial assessment
        financial_data = ""
        financial_path = base_path / "assessment_output.txt"
        if financial_path.exists():
            with open(financial_path, "r", encoding="utf-8") as f:
                financial_data = f.read()
        
        # Read SWOT analysis
        swot_data = {}
        swot_path = base_path / "swot_complete.json"
        if swot_path.exists():
            try:
                with open(swot_path, "r", encoding="utf-8") as f:
                    swot_data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read SWOT analysis: {e}")
        
        # Read BMC (Business Model Canvas)
        bmc_data = ""
        bmc_path = base_path / "bmc_output.txt"
        if bmc_path.exists():
            with open(bmc_path, "r", encoding="utf-8") as f:
                bmc_data = f.read()
        
        # Extract competitor information
        linkedin_companies = []
        tiktok_profiles = []
        
        for competitor in request.competitors:
            if "linkedin.com/company/" in competitor:
                linkedin_companies.append(competitor)
            elif "tiktok.com/@" in competitor:
                # Extract profile name from TikTok URL
                profile_name = competitor.split("@")[-1].split("/")[0]
                tiktok_profiles.append(profile_name)
        
        results = {
            "analysis_id": str(uuid.uuid4()),
            "status": "initiated",
            "linkedin_analysis": None,
            "tiktok_analysis": None,
            "business_context": {
                "summary": business_summary,
                "brand_identity": brand_identity,
                "viability": viability_data,
                "market_analysis": market_data[:500] + "..." if len(market_data) > 500 else market_data,
                "financial_assessment": financial_data[:500] + "..." if len(financial_data) > 500 else financial_data,
                "swot_analysis": swot_data,
                "business_model": bmc_data[:500] + "..." if len(bmc_data) > 500 else bmc_data
            }
        }
        
        # Start LinkedIn analysis if we have LinkedIn competitors
        if linkedin_companies:
            linkedin_request = LinkedInInsightsRequest(
                company_urls=linkedin_companies,
                limit=30,
                min_support=0.05,
                min_confidence=0.5,
                min_lift=1.2
            )
            
            try:
                linkedin_response = await analyze_linkedin_competitor(linkedin_request)
                results["linkedin_analysis"] = {
                    "session_id": linkedin_response.session_id,
                    "status": linkedin_response.status,
                    "companies": linkedin_companies
                }
            except Exception as e:
                logger.error(f"LinkedIn analysis failed: {e}")
                results["linkedin_analysis"] = {"error": str(e)}
        
        # Start TikTok analysis if we have TikTok profiles
        if tiktok_profiles:
            tiktok_request = TikTokInsightsRequest(
                profile_names=tiktok_profiles,
                results_per_page=50,
                min_support=0.05,
                min_confidence=0.5,
                min_lift=1.2
            )
            
            try:
                tiktok_response = await analyze_tiktok_competitor(tiktok_request)
                results["tiktok_analysis"] = {
                    "session_id": tiktok_response.session_id,
                    "status": tiktok_response.status,
                    "profiles": tiktok_profiles
                }
            except Exception as e:
                logger.error(f"TikTok analysis failed: {e}")
                results["tiktok_analysis"] = {"error": str(e)}
        
        # Store the analysis for later retrieval
        sessions[results["analysis_id"]] = results
        
        return results
        
    except Exception as e:
        logger.error(f"Comprehensive marketing analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/marketing-strategy/analysis/{analysis_id}/status")
async def get_marketing_analysis_status(analysis_id: str):
    """Get comprehensive marketing analysis status"""
    if analysis_id not in sessions:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = sessions[analysis_id]
    
    # Check LinkedIn status
    if analysis.get("linkedin_analysis") and "session_id" in analysis["linkedin_analysis"]:
        try:
            linkedin_status = await get_linkedin_session_status(analysis["linkedin_analysis"]["session_id"])
            analysis["linkedin_analysis"]["current_status"] = linkedin_status
        except Exception as e:
            analysis["linkedin_analysis"]["status_error"] = str(e)
    
    # Check TikTok status
    if analysis.get("tiktok_analysis") and "session_id" in analysis["tiktok_analysis"]:
        try:
            tiktok_status = await get_tiktok_session_status(analysis["tiktok_analysis"]["session_id"])
            analysis["tiktok_analysis"]["current_status"] = tiktok_status
        except Exception as e:
            analysis["tiktok_analysis"]["status_error"] = str(e)
    
    return analysis

@app.get("/marketing-strategy/analysis/{analysis_id}/insights")
async def get_comprehensive_marketing_insights(analysis_id: str):
    """Get comprehensive marketing insights from completed analysis"""
    if analysis_id not in sessions:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = sessions[analysis_id]
    insights = {
        "analysis_id": analysis_id,
        "linkedin_insights": None,
        "tiktok_insights": None,
        "combined_strategy": None,
        "posting_calendar": None,
        "engagement_heatmap": None
    }
    
    # Get LinkedIn insights
    if analysis.get("linkedin_analysis") and "session_id" in analysis["linkedin_analysis"]:
        try:
            linkedin_insights = await get_linkedin_insights(
                analysis["linkedin_analysis"]["session_id"],
                ["high_engagement_rate", "viral", "popular_post"]
            )
            insights["linkedin_insights"] = linkedin_insights
        except Exception as e:
            insights["linkedin_insights"] = {"error": str(e)}
    
    # Get TikTok insights
    if analysis.get("tiktok_analysis") and "session_id" in analysis["tiktok_analysis"]:
        try:
            tiktok_insights = await get_tiktok_insights(
                analysis["tiktok_analysis"]["session_id"],
                ["high_engagement_rate", "viral", "highly_shareable"]
            )
            insights["tiktok_insights"] = tiktok_insights
        except Exception as e:
            insights["tiktok_insights"] = {"error": str(e)}
    
    # Generate combined strategy and posting calendar
    insights["combined_strategy"] = _generate_combined_strategy(insights, analysis["business_context"])
    insights["posting_calendar"] = _generate_posting_calendar(insights)
    insights["engagement_heatmap"] = _generate_engagement_heatmap(insights)
    
    return insights

def _generate_combined_strategy(insights: dict, business_context: dict) -> dict:
    """Generate combined marketing strategy from LinkedIn and TikTok insights"""
    strategy = {
        "content_strategy": {},
        "timing_strategy": {},
        "engagement_tactics": {},
        "platform_specific": {
            "linkedin": {},
            "tiktok": {}
        },
        "business_alignment": {}
    }
    
    # Extract business information from context
    business_summary = business_context.get("summary", "")
    brand_identity = business_context.get("brand_identity", {})
    viability_data = business_context.get("viability", {})
    swot_analysis = business_context.get("swot_analysis", {})
    
    # Analyze LinkedIn insights
    if insights.get("linkedin_insights") and "insights" in insights["linkedin_insights"]:
        linkedin_text = insights["linkedin_insights"]["insights"]
        
        # Extract key points from LinkedIn insights
        if "morning" in linkedin_text.lower():
            strategy["timing_strategy"]["linkedin_optimal_time"] = "Morning (6-12 AM)"
        if "weekend" in linkedin_text.lower():
            strategy["timing_strategy"]["linkedin_weekend"] = "Higher engagement on weekends"
        if "document" in linkedin_text.lower():
            strategy["content_strategy"]["linkedin_documents"] = "Include documents/PDFs for 2.3x higher engagement"
        if "professional" in linkedin_text.lower():
            strategy["content_strategy"]["linkedin_tone"] = "Professional, industry-focused content"
        
        strategy["platform_specific"]["linkedin"] = {
            "focus": "Professional networking and B2B audience",
            "optimal_content": "Industry insights, thought leadership, company updates, whitepapers",
            "hashtag_strategy": "2-3 relevant professional hashtags",
            "post_frequency": "3-5 posts per week",
            "engagement_tactics": "Ask questions, share industry news, comment on industry leaders' posts"
        }
    
    # Analyze TikTok insights  
    if insights.get("tiktok_insights") and "insights" in insights["tiktok_insights"]:
        tiktok_text = insights["tiktok_insights"]["insights"]
        
        # Extract key points from TikTok insights
        if "evening" in tiktok_text.lower():
            strategy["timing_strategy"]["tiktok_optimal_time"] = "Evening posting (6-9 PM)"
        if "short" in tiktok_text.lower():
            strategy["content_strategy"]["tiktok_duration"] = "15-60 second videos perform best"
        if "trending" in tiktok_text.lower():
            strategy["engagement_tactics"]["tiktok_hashtags"] = "Use trending hashtags and challenges"
        if "authentic" in tiktok_text.lower():
            strategy["content_strategy"]["tiktok_style"] = "Authentic, behind-the-scenes content"
        
        strategy["platform_specific"]["tiktok"] = {
            "focus": "Creative storytelling and brand personality",
            "optimal_content": "Behind-the-scenes, educational content, trending challenges, user testimonials",
            "hashtag_strategy": "Mix of trending (60%) and niche industry hashtags (40%)",
            "post_frequency": "1-2 posts daily",
            "engagement_tactics": "Respond to comments, create duets, participate in trends"
        }
    
    # Business alignment based on context
    if brand_identity:
        brand_values = brand_identity.get("core_values", [])
        if brand_values:
            strategy["business_alignment"]["brand_values"] = f"Ensure content reflects: {', '.join(brand_values[:3])}"
    
    if viability_data:
        target_market = viability_data.get("business_context", {}).get("target_market", "")
        if target_market:
            strategy["business_alignment"]["target_market"] = f"Focus content for {target_market} audience"
        
        budget_info = viability_data.get("startup_budget_currency", "")
        if budget_info:
            strategy["business_alignment"]["budget_consideration"] = f"Cost-effective content creation within {budget_info} budget constraints"
    
    if swot_analysis:
        strengths = swot_analysis.get("strengths", [])
        if strengths:
            strategy["business_alignment"]["leverage_strengths"] = f"Highlight: {', '.join(strengths[:2])}"
        
        opportunities = swot_analysis.get("opportunities", [])
        if opportunities:
            strategy["business_alignment"]["market_opportunities"] = f"Target: {', '.join(opportunities[:2])}"
    
    # Extract industry-specific recommendations from business summary
    if "healthcare" in business_summary.lower():
        strategy["content_strategy"]["industry_focus"] = "Healthcare compliance, patient privacy, educational content"
        strategy["platform_specific"]["linkedin"]["compliance"] = "Ensure HIPAA compliance in content"
    elif "fintech" in business_summary.lower() or "financial" in business_summary.lower():
        strategy["content_strategy"]["industry_focus"] = "Financial literacy, security, regulatory compliance"
        strategy["platform_specific"]["linkedin"]["compliance"] = "Financial regulations compliance"
    elif "e-commerce" in business_summary.lower() or "retail" in business_summary.lower():
        strategy["content_strategy"]["industry_focus"] = "Product showcases, customer reviews, seasonal content"
        strategy["platform_specific"]["tiktok"]["product_focus"] = "Product demos and unboxing videos"
    elif "saas" in business_summary.lower() or "software" in business_summary.lower():
        strategy["content_strategy"]["industry_focus"] = "Feature highlights, tutorials, customer success stories"
        strategy["platform_specific"]["linkedin"]["b2b_focus"] = "Enterprise case studies and ROI content"
    
    return strategy

def _generate_posting_calendar(insights: dict) -> dict:
    """Generate optimal posting calendar based on insights and business context"""
    calendar = {
        "weekly_schedule": {
            "monday": {"linkedin": "Morning professional update", "tiktok": "Monday motivation content"},
            "tuesday": {"linkedin": "Industry insights sharing", "tiktok": "Tutorial Tuesday"},
            "wednesday": {"linkedin": "Mid-week engagement post", "tiktok": "Behind-the-scenes content"},
            "thursday": {"linkedin": "Thought leadership content", "tiktok": "Educational content"},
            "friday": {"linkedin": "Weekly recap/achievements", "tiktok": "Fun Friday content"},
            "saturday": {"linkedin": "Community engagement", "tiktok": "Weekend lifestyle content"},
            "sunday": {"linkedin": "Week ahead preview", "tiktok": "Sunday inspiration"}
        },
        "content_themes": {
            "monday": "Motivation & Goals",
            "tuesday": "Education & Tips",
            "wednesday": "Behind the Scenes",
            "thursday": "Industry Leadership",
            "friday": "Community & Fun",
            "saturday": "Lifestyle & Values",
            "sunday": "Inspiration & Vision"
        },
        "optimal_times": {
            "linkedin": {
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "best_times": ["8:00-10:00 AM", "12:00-1:00 PM", "5:00-6:00 PM"],
                "timezone": "Business hours in target market"
            },
            "tiktok": {
                "best_days": ["Friday", "Saturday", "Sunday"],  
                "best_times": ["6:00-9:00 PM", "9:00-12:00 AM"],
                "timezone": "Evening entertainment hours"
            }
        },
        "posting_frequency": {
            "linkedin": "3-5 posts per week",
            "tiktok": "1-2 posts per day",
            "cross_promotion": "Share TikTok highlights on LinkedIn weekly"
        }
    }
    
    # Adjust based on insights
    if insights.get("linkedin_insights"):
        linkedin_text = insights["linkedin_insights"].get("insights", "").lower()
        if "morning" in linkedin_text:
            calendar["optimal_times"]["linkedin"]["priority_time"] = "Morning (6:00-10:00 AM)"
        if "document" in linkedin_text:
            calendar["content_themes"]["tuesday"] = "Document Sharing & Industry Reports"
    
    if insights.get("tiktok_insights"):
        tiktok_text = insights["tiktok_insights"].get("insights", "").lower()
        if "evening" in tiktok_text:
            calendar["optimal_times"]["tiktok"]["priority_time"] = "Evening (6:00-9:00 PM)"
        if "authentic" in tiktok_text:
            calendar["content_themes"]["wednesday"] = "Authentic Behind-the-Scenes"
    
    return calendar

def _generate_engagement_heatmap(insights: dict) -> dict:
    """Generate engagement heatmap data"""
    heatmap = {
        "best_times": {
            "linkedin": {
                "morning": 0.8,
                "afternoon": 0.6,
                "evening": 0.4,
                "night": 0.2
            },
            "tiktok": {
                "morning": 0.4,
                "afternoon": 0.6,
                "evening": 0.9,
                "night": 0.7
            }
        },
        "best_days": {
            "linkedin": {
                "monday": 0.7,
                "tuesday": 0.8,
                "wednesday": 0.9,
                "thursday": 0.8,
                "friday": 0.6,
                "saturday": 0.8,
                "sunday": 0.7
            },
            "tiktok": {
                "monday": 0.6,
                "tuesday": 0.7,
                "wednesday": 0.8,
                "thursday": 0.8,
                "friday": 0.9,
                "saturday": 0.9,
                "sunday": 0.8
            }
        }
    }
    
    return heatmap

# =============================================================================
# SOCIAL MEDIA MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/social-media/generate-posts")
async def generate_social_media_posts(request: SocialMediaPostRequest):
    """Generate AI-powered social media posts with brand identity integration and smart scheduling"""
    try:
        # Extract brand identity information
        brand_name = request.brand_identity.get('name', 'Your Brand') if request.brand_identity else 'Your Brand'
        brand_colors = request.brand_identity.get('colors', []) if request.brand_identity else []
        brand_personality = request.brand_identity.get('personality', []) if request.brand_identity else []
        brand_voice = ', '.join(brand_personality) if brand_personality else 'professional and engaging'
        
        # Create brand-aware prompt enhancement
        brand_context = f"""
Brand Identity Context:
- Brand Name: {brand_name}
- Brand Colors: {', '.join(brand_colors) if brand_colors else 'Not specified'}
- Brand Personality: {brand_voice}
- Brand Voice: Maintain {brand_voice} tone throughout all posts
"""
        
        # Generate posts using the social media agent with brand context
        enhanced_business_summary = f"{request.business_summary}\n\n{brand_context}"
        
        posts = []
        platforms = ['linkedin', 'instagram', 'facebook', 'tiktok', 'x'] if request.platform == 'all' else [request.platform]
        
        logger.info(f"Generating posts for platforms: {platforms}, count per platform: {request.count // len(platforms) + (1 if len(platforms) == 1 else 0)}")
        
        # Generate posts for each platform with brand-specific prompts
        for platform in platforms:
            platform_count = request.count // len(platforms) + (1 if len(platforms) == 1 else 0)
            if platform_count < 1:
                platform_count = 1
                
            logger.info(f"Generating {platform_count} posts for {platform}")
            
            platform_posts = await generate_brand_aware_posts(
                business_summary=enhanced_business_summary,
                platform=platform,
                brand_identity=request.brand_identity,
                marketing_insights=request.marketing_insights,
                count=platform_count
            )
            
            if platform_posts:
                posts.extend(platform_posts)
                logger.info(f"Added {len(platform_posts)} posts for {platform}")
            else:
                logger.warning(f"No posts generated for {platform}, creating fallback")
                fallback_posts = create_fallback_posts(platform, request.brand_identity or {}, platform_count)
                posts.extend(fallback_posts)
        
        # Ensure we have at least some posts
        if not posts:
            logger.error("No posts were generated by any method, creating emergency fallback posts")
            emergency_posts = create_fallback_posts('linkedin', request.brand_identity or {}, max(3, request.count))
            posts.extend(emergency_posts)
        
        logger.info(f"Total posts generated: {len(posts)}")
        
        # Generate smart scheduling suggestions
        scheduled_posts = []
        if request.include_scheduling:
            scheduled_posts = generate_smart_scheduling(posts, request.marketing_insights)
        
        # Generate images if requested with brand colors
        generated_images = {}
        if request.generate_images:
            for post in posts:
                if not post.get('has_media'):
                    image_data = await generate_brand_consistent_image(
                        post, 
                        enhanced_business_summary,
                        brand_colors,
                        brand_name
                    )
                    if image_data:
                        generated_images[post['id']] = image_data
                        post['image_url'] = image_data.get('url')
                        post['has_media'] = True
                        post['content_type'] = 'image'
        
        # Final validation - ensure we have posts to return
        if not posts or len(posts) == 0:
            logger.error("Critical error: No posts generated despite fallbacks")
            # Create absolute emergency posts
            brand_name = (request.brand_identity and request.brand_identity.get('name')) or 'Your Business'
            emergency_post = {
                'id': f"emergency_post_{int(time.time() * 1000)}",
                'platform': platforms[0] if platforms else 'linkedin',
                'content_type': 'text',
                'title': f"Welcome to {brand_name}",
                'content': f"Discover what {brand_name} can offer you. We're committed to delivering excellent solutions and exceptional service to help you achieve your goals.",
                'hashtags': ['#Business', '#Innovation', '#Excellence'],
                'optimal_time': '12:00 PM',
                'scheduled_time': (datetime.now() + timedelta(days=1)).isoformat(),
                'engagement_prediction': 'medium',
                'call_to_action': 'Learn more about our services',
                'has_media': False,
                'status': 'draft',
                'image_prompt': f"Professional image for {brand_name}",
                'suggested_date': (datetime.now() + timedelta(days=1)).strftime("%B %d, %Y"),
                'suggested_time': '12:00 PM',
                'optimal_reason': 'Peak engagement time'
            }
            posts = [emergency_post]
        
        return SocialMediaPostResponse(
            posts=posts,
            scheduled_posts=scheduled_posts,
            generated_images=generated_images
        )
        
    except Exception as e:
        logger.error(f"Error generating social media posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate posts: {str(e)}")

async def generate_brand_aware_posts(business_summary: str, platform: str, brand_identity: dict, marketing_insights: dict, count: int):
    """Generate posts with brand identity awareness using enhanced social media agent"""
    try:
        logger.info(f"Generating {count} posts for {platform} platform with marketing strategy integration")
        
        # Use the enhanced social media agent with marketing strategy
        posts = social_media_agent.generate_marketing_posts(
            business_summary=business_summary,
            marketing_insights=marketing_insights,
            platform=platform,
            count=count
        )
        
        if not posts:
            logger.warning(f"Social media agent returned no posts for {platform}, creating fallback posts")
            return create_fallback_posts(platform, brand_identity, count)
        
        # Enhance posts with brand identity information
        brand_name = brand_identity.get('name', 'Your Brand') if brand_identity else 'Your Brand'
        brand_colors = brand_identity.get('colors', []) if brand_identity else []
        
        for i, post in enumerate(posts):
            # Ensure each post has required fields
            post['id'] = post.get('id', f"post_{platform}_{i+1}_{int(time.time() * 1000)}")
            post['platform'] = platform
            post['status'] = 'draft'
            post['created_at'] = datetime.now().isoformat()
            post['has_media'] = post.get('content_type') != 'text'
            
            # Add brand-specific enhancements to image prompts
            if post.get('image_prompt') and brand_colors:
                color_scheme = ', '.join(brand_colors[:3])  # Use top 3 colors
                post['image_prompt'] = f"{post['image_prompt']} using brand colors: {color_scheme}"
                
            # Enhance call-to-action with brand name
            if post.get('call_to_action') and brand_name != 'Your Brand':
                cta = post['call_to_action']
                if not any(brand_word in cta.lower() for brand_word in brand_name.lower().split()):
                    post['call_to_action'] = f"{cta} with {brand_name}"
            
            # Add scheduling metadata
            post['suggested_date'] = (datetime.now() + timedelta(days=i)).strftime("%B %d, %Y")
            post['suggested_time'] = post.get('optimal_time', '12:00 PM')
            post['optimal_reason'] = post.get('optimal_reason', f'Optimized for {platform} engagement')
        
        logger.info(f"Successfully generated and enhanced {len(posts)} posts for {platform}")
        return posts
        
    except Exception as e:
        logger.error(f"Error generating brand-aware posts for {platform}: {str(e)}")
        # Return fallback posts instead of empty array
        return create_fallback_posts(platform, brand_identity, count)

def create_fallback_posts(platform: str, brand_identity: dict, count: int) -> list:
    """Create fallback posts when AI generation fails"""
    import time
    import random
    from datetime import datetime, timedelta
    
    brand_name = brand_identity.get('name', 'Your Brand') if brand_identity else 'Your Brand'
    
    post_templates = [
        {
            'title': f"Transform Your Business with {brand_name}",
            'content': f"Ready to take your business to the next level? {brand_name} offers innovative solutions designed to help you succeed. Our expertise and commitment to excellence make us the perfect partner for your growth journey. #Innovation #Business #Success",
            'cta': "Contact us today to get started"
        },
        {
            'title': f"Why Choose {brand_name}?",
            'content': f"At {brand_name}, we understand that every business is unique. That's why we provide customized solutions tailored to your specific needs. Join the growing number of businesses that trust us to deliver results. #CustomSolutions #TrustedPartner",
            'cta': "Learn more about our services"
        },
        {
            'title': f"Success Stories from {brand_name}",
            'content': f"Our clients' success is our success. {brand_name} has helped countless businesses achieve their goals through innovative strategies and dedicated support. What could we help you accomplish? #ClientSuccess #Results",
            'cta': "See our case studies"
        },
        {
            'title': f"Innovation Meets Excellence at {brand_name}",
            'content': f"Stay ahead of the competition with {brand_name}. We combine cutting-edge technology with proven strategies to deliver solutions that drive real results for your business. #Innovation #Excellence #Technology",
            'cta': "Discover our solutions"
        },
        {
            'title': f"Partner with {brand_name} Today",
            'content': f"Looking for a reliable partner to help grow your business? {brand_name} offers the expertise, tools, and support you need to succeed in today's competitive market. #Partnership #Growth #Business",
            'cta': "Get in touch with us"
        }
    ]
    
    posts = []
    actual_count = min(count, len(post_templates))
    
    for i in range(actual_count):
        post_id = f"post_{platform}_{i + 1}_{int(time.time() * 1000) + i}"
        template = post_templates[i]
        
        # Generate optimal time based on platform
        optimal_times = {
            'linkedin': ['9:00 AM', '12:00 PM', '5:00 PM'],
            'instagram': ['11:00 AM', '1:00 PM', '7:00 PM'],
            'facebook': ['1:00 PM', '6:00 PM', '8:00 PM'],
            'tiktok': ['6:00 AM', '7:00 PM', '9:00 PM'],
            'x': ['8:00 AM', '12:00 PM', '7:00 PM']
        }
        
        optimal_time = random.choice(optimal_times.get(platform, ['12:00 PM']))
        
        # Generate scheduling
        base_date = datetime.now() + timedelta(days=1)
        scheduled_date = base_date + timedelta(days=i, hours=int(optimal_time.split(':')[0]))
        
        post = {
            'id': post_id,
            'platform': platform,
            'content_type': 'text',
            'title': template['title'],
            'content': template['content'],
            'hashtags': generate_platform_hashtags(platform, brand_identity),
            'optimal_time': optimal_time,
            'scheduled_time': scheduled_date.isoformat(),
            'engagement_prediction': random.choice(['high', 'medium', 'medium']),  # Bias towards medium
            'call_to_action': template['cta'],
            'has_media': False,
            'status': 'draft',
            'image_prompt': f"Professional {platform} image for {brand_name}",
            'suggested_date': scheduled_date.strftime("%B %d, %Y"),
            'suggested_time': scheduled_date.strftime("%I:%M %p"),
            'optimal_reason': f"Optimal engagement time for {platform.title()}"
        }
        
        posts.append(post)
    
    logger.info(f"Created {len(posts)} fallback posts for {platform}")
    return posts

def parse_generated_posts(content: str, platform: str, brand_identity: dict) -> list:
    """Parse AI-generated content into structured posts with proper error handling"""
    import json
    import re
    import time
    
    posts = []
    brand_name = brand_identity.get('name', 'Your Brand') if brand_identity else 'Your Brand'
    
    try:
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group())
            ai_posts = parsed_data.get('posts', [])
            
            for i, ai_post in enumerate(ai_posts):
                if i >= 5:  # Limit to 5 posts max
                    break
                    
                post_id = f"post_{platform}_{i + 1}_{int(time.time() * 1000)}"
                
                # Generate optimal time based on platform
                optimal_times = {
                    'linkedin': ['9:00 AM', '12:00 PM', '5:00 PM'],
                    'instagram': ['11:00 AM', '1:00 PM', '7:00 PM'], 
                    'facebook': ['1:00 PM', '6:00 PM', '8:00 PM'],
                    'tiktok': ['6:00 AM', '7:00 PM', '9:00 PM'],
                    'x': ['8:00 AM', '12:00 PM', '7:00 PM']
                }
                
                import random
                optimal_time = random.choice(optimal_times.get(platform, ['12:00 PM']))
                
                # Generate smart scheduling with actual dates
                from datetime import datetime, timedelta
                base_date = datetime.now() + timedelta(days=1)
                scheduled_date = base_date + timedelta(days=i, hours=int(optimal_time.split(':')[0]))
                
                post = {
                    'id': post_id,
                    'platform': platform,
                    'content_type': 'text',
                    'title': ai_post.get('title', f"{brand_name} - Engaging Content"),
                    'content': ai_post.get('content', f"Discover what {brand_name} can do for you! Join thousands of satisfied customers who trust our innovative solutions."),
                    'hashtags': ai_post.get('hashtags', generate_platform_hashtags(platform, brand_identity)),
                    'optimal_time': optimal_time,
                    'scheduled_time': scheduled_date.isoformat(),
                    'engagement_prediction': ai_post.get('engagement_prediction', 'medium'),
                    'call_to_action': ai_post.get('call_to_action', "Learn more about our services"),
                    'has_media': False,
                    'status': 'draft',
                    'image_prompt': ai_post.get('image_description', f"Professional image for {brand_name} showcasing innovation and quality"),
                    'suggested_date': scheduled_date.strftime("%B %d, %Y"),
                    'suggested_time': scheduled_date.strftime("%I:%M %p"),
                    'optimal_reason': f"Optimal engagement time for {platform.title()}"
                }
                
                posts.append(post)
        
        # Fallback: If JSON parsing fails, create default posts
        if not posts:
            logger.warning(f"JSON parsing failed for {platform}, generating fallback posts")
            raise ValueError("JSON parsing failed")
            
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Could not parse JSON response, creating fallback posts: {str(e)}")
        
        # Generate fallback posts with meaningful content
        post_templates = [
            {
                'title': f"Transform Your Business with {brand_name}",
                'content': f"Ready to take your business to the next level? {brand_name} offers innovative solutions designed to help you succeed. Our expertise and commitment to excellence make us the perfect partner for your growth journey.",
                'cta': "Contact us today to get started"
            },
            {
                'title': f"Why Choose {brand_name}?",
                'content': f"At {brand_name}, we understand that every business is unique. That's why we provide customized solutions tailored to your specific needs. Join the growing number of businesses that trust us to deliver results.",
                'cta': "Learn more about our services"
            },
            {
                'title': f"Success Stories from {brand_name}",
                'content': f"Our clients' success is our success. {brand_name} has helped countless businesses achieve their goals through innovative strategies and dedicated support. What could we help you accomplish?",
                'cta': "See our case studies"
            },
            {
                'title': f"Innovation Meets Excellence at {brand_name}",
                'content': f"Stay ahead of the competition with {brand_name}. We combine cutting-edge technology with proven strategies to deliver solutions that drive real results for your business.",
                'cta': "Discover our solutions"
            },
            {
                'title': f"Partner with {brand_name} Today",
                'content': f"Looking for a reliable partner to help grow your business? {brand_name} offers the expertise, tools, and support you need to succeed in today's competitive market.",
                'cta': "Get in touch with us"
            }
        ]
        
        # Generate at least 3 posts even if AI fails
        min_posts = min(5, max(3, len(post_templates)))
        
        for i in range(min_posts):
            post_id = f"post_{platform}_{i + 1}_{int(time.time() * 1000) + i}"
            template = post_templates[i % len(post_templates)]
            
            # Generate optimal time based on platform
            optimal_times = {
                'linkedin': ['9:00 AM', '12:00 PM', '5:00 PM'],
                'instagram': ['11:00 AM', '1:00 PM', '7:00 PM'],
                'facebook': ['1:00 PM', '6:00 PM', '8:00 PM'],
                'tiktok': ['6:00 AM', '7:00 PM', '9:00 PM'],
                'x': ['8:00 AM', '12:00 PM', '7:00 PM']
            }
            
            import random
            optimal_time = random.choice(optimal_times.get(platform, ['12:00 PM']))
            
            # Generate scheduling
            from datetime import datetime, timedelta
            base_date = datetime.now() + timedelta(days=1)
            scheduled_date = base_date + timedelta(days=i, hours=int(optimal_time.split(':')[0]))
            
            post = {
                'id': post_id,
                'platform': platform,
                'content_type': 'text',
                'title': template['title'],
                'content': template['content'],
                'hashtags': generate_platform_hashtags(platform, brand_identity),
                'optimal_time': optimal_time,
                'scheduled_time': scheduled_date.isoformat(),
                'engagement_prediction': random.choice(['high', 'medium', 'low']),
                'call_to_action': template['cta'],
                'has_media': False,
                'status': 'draft',
                'image_prompt': f"Professional {platform} image for {brand_name}",
                'suggested_date': scheduled_date.strftime("%B %d, %Y"),
                'suggested_time': scheduled_date.strftime("%I:%M %p"),
                'optimal_reason': f"Optimal engagement time for {platform.title()}"
            }
            
            posts.append(post)
    
    logger.info(f"Successfully generated {len(posts)} posts for {platform}")
    return posts

def generate_platform_hashtags(platform: str, brand_identity: dict) -> list:
    """Generate platform-appropriate hashtags"""
    brand_name = brand_identity.get('name', 'Brand') if brand_identity else 'Brand'
    
    hashtag_sets = {
        'linkedin': ['#Professional', '#Business', '#Innovation', f'#{brand_name.replace(" ", "")}', '#Leadership'],
        'instagram': ['#Business', '#Entrepreneur', '#Success', '#Innovation', f'#{brand_name.replace(" ", "")}', '#Motivation', '#Growth'],
        'facebook': ['#Business', '#Community', f'#{brand_name.replace(" ", "")}'],
        'tiktok': ['#Business', '#Entrepreneur', '#Success', f'#{brand_name.replace(" ", "")}', '#Tips'],
        'x': ['#Business', '#Innovation', f'#{brand_name.replace(" ", "")}']
    }
    
    return hashtag_sets.get(platform, hashtag_sets['linkedin'])

def generate_smart_scheduling(posts: list, marketing_insights: dict) -> list:
    """Generate intelligent scheduling suggestions using marketing strategy insights"""
    from datetime import datetime, timedelta
    
    scheduled_posts = []
    base_date = datetime.now() + timedelta(days=1)  # Start tomorrow
    
    # Load marketing strategy insights for optimal scheduling
    strategy_data = load_marketing_strategy_data()
    
    # Get platform-specific optimal times from marketing strategy
    heatmap_data = strategy_data.get('engagement_heatmap', {}).get('best_times', {})
    
    # Default platform-specific optimal times (fallback)
    default_platform_schedules = {
        'linkedin': [(9, 0), (13, 0), (17, 0)],  # 9 AM, 1 PM, 5 PM
        'instagram': [(11, 0), (14, 0), (20, 0)],  # 11 AM, 2 PM, 8 PM
        'facebook': [(10, 0), (15, 0), (19, 0)],   # 10 AM, 3 PM, 7 PM
        'tiktok': [(12, 0), (16, 0), (21, 0)],      # 12 PM, 4 PM, 9 PM
        'x': [(8, 0), (12, 0), (18, 0)]            # 8 AM, 12 PM, 6 PM
    }
    
    for i, post in enumerate(posts):
        platform = post['platform']
        
        # Get optimal times from marketing strategy or use defaults
        if heatmap_data.get(platform):
            # Extract hours with high engagement scores from marketing strategy
            platform_times_data = heatmap_data[platform]
            optimal_hours = []
            for hour_str, engagement_score in platform_times_data.items():
                if engagement_score > 0.7:  # Only use high-engagement times
                    optimal_hours.append((int(hour_str), 0))
            
            # Sort by engagement score (if available) or use top 3
            if optimal_hours:
                platform_schedule = optimal_hours[:3]  # Use top 3 times
            else:
                platform_schedule = default_platform_schedules.get(platform, [(12, 0)])
        else:
            platform_schedule = default_platform_schedules.get(platform, [(12, 0)])
        
        # Distribute posts across different times and days to avoid spam
        day_offset = i // len(platform_schedule)
        time_index = i % len(platform_schedule)
        hour, minute = platform_schedule[time_index]
        
        scheduled_time = base_date + timedelta(days=day_offset, hours=hour, minutes=minute)
        
        # Get engagement prediction based on marketing strategy
        engagement_score = 0.5  # Default
        if heatmap_data.get(platform) and str(hour) in heatmap_data[platform]:
            engagement_score = heatmap_data[platform][str(hour)]
        
        engagement_level = "high" if engagement_score > 0.8 else "medium" if engagement_score > 0.6 else "low"
        
        # Get strategy-based optimal reason
        optimal_reason = f"Optimized for {platform} using marketing strategy analysis"
        if engagement_score > 0.8:
            optimal_reason += f" (high engagement: {engagement_score:.1f})"
        elif engagement_score > 0.6:
            optimal_reason += f" (good engagement: {engagement_score:.1f})"
        else:
            optimal_reason += " (standard timing)"
        
        scheduled_post = {
            'post_id': post['id'],
            'platform': platform,
            'scheduled_time': scheduled_time.isoformat(),
            'optimal_reason': optimal_reason,
            'suggested_date': scheduled_time.strftime("%B %d, %Y"),
            'suggested_time': scheduled_time.strftime("%I:%M %p"),
            'engagement_prediction': engagement_level,
            'marketing_strategy_applied': bool(heatmap_data.get(platform))
        }
        
        scheduled_posts.append(scheduled_post)
    
    return scheduled_posts

async def generate_brand_consistent_image(post: dict, business_summary: str, brand_colors: list, brand_name: str):
    """Generate images that are consistent with brand identity"""
    try:
        # Create brand-aware image prompt
        color_guidance = f"using brand colors {', '.join(brand_colors)}" if brand_colors else "using professional color palette"
        
        image_prompt = f"""
Create a professional 1:1 aspect ratio social media image for {brand_name} with these specifications:

Content Context: "{post['content'][:100]}..."
Business: {business_summary[:200]}...
Platform: {post['platform']}

Visual Requirements:
- 1:1 square format (1080x1080px)
- {color_guidance}
- Clean, modern design aesthetic
- Professional and engaging
- No text overlay (text will be added separately)
- Brand-consistent visual style
- High contrast and readability
- Suitable for {post['platform']} audience

Style: Modern, professional, clean composition with good visual hierarchy
"""
        
        # Generate using Pollinations API
        import urllib.parse
        base_url = "https://image.pollinations.ai/prompt/"
        encoded_prompt = urllib.parse.quote(image_prompt)
        
        params = {
            'width': 1080,
            'height': 1080,
            'seed': hash(post['id']) % 1000000,
            'model': 'flux',
            'enhance': 'true',
            'nologo': 'true'
        }
        
        param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{base_url}{encoded_prompt}?{param_string}"
        
        return {
            'url': full_url,
            'prompt': image_prompt,
            'dimensions': {'width': 1080, 'height': 1080},
            'brand_colors': brand_colors
        }
        
    except Exception as e:
        logger.error(f"Error generating brand-consistent image: {str(e)}")
        return None

@app.get("/social-media/platforms/status")
async def get_platforms_status():
    """Get the configuration status of all social media platforms"""
    try:
        status = social_media_agent.get_platform_status()
        return {"platforms": status}
    except Exception as e:
        logger.error(f"Error getting platform status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get platform status: {str(e)}")

@app.get("/social-media/platforms/{platform}/help")
async def get_platform_help(platform: str):
    """Get setup help for a specific social media platform"""
    try:
        help_info = social_media_agent.get_platform_help(platform)
        return help_info
    except Exception as e:
        logger.error(f"Error getting platform help: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get platform help: {str(e)}")

@app.post("/social-media/platforms/{platform}/configure")
async def configure_platform(platform: str, request: PlatformConfigRequest):
    """Configure API credentials for a social media platform"""
    try:
        logger.info(f"🔧 Configuring platform: {platform}")
        logger.info(f"📋 Config keys received: {list(request.config.keys())}")
        
        # Check if platform is supported
        if platform not in social_media_agent.platform_configs:
            logger.error(f"❌ Platform {platform} not supported. Available platforms: {list(social_media_agent.platform_configs.keys())}")
            raise HTTPException(status_code=400, detail=f"Platform {platform} not supported")
        
        # Validate that we received some configuration
        if not request.config:
            logger.error("❌ No configuration provided")
            raise HTTPException(status_code=400, detail="No configuration provided")
        
        # Special handling for LinkedIn
        if platform == 'linkedin':
            logger.info("🔷 Special LinkedIn configuration handling")
            
            # Save LinkedIn credentials to .env file persistently
            env_path = Path(__file__).parent / '.env'
            
            # Read existing .env content
            env_content = ""
            if env_path.exists():
                with open(env_path, 'r') as f:
                    env_content = f.read()
            
            # Parse existing .env lines
            lines = env_content.split('\n')
            
            # Remove existing LinkedIn entries
            filtered_lines = [line for line in lines if not line.startswith('LINKEDIN_')]
            
            # Add new LinkedIn credentials to .env file
            filtered_lines.extend(['', '# LinkedIn OAuth Credentials (Updated via Frontend)'])
            
            for key, value in request.config.items():
                if value:  # Only set non-empty values
                    if key == 'client_id':
                        filtered_lines.append(f'LINKEDIN_CLIENT_ID={value}')
                        os.environ['LINKEDIN_CLIENT_ID'] = value
                        logger.info("✅ Set LinkedIn Client ID")
                    elif key == 'client_secret':
                        filtered_lines.append(f'LINKEDIN_CLIENT_SECRET={value}')
                        os.environ['LINKEDIN_CLIENT_SECRET'] = value
                        logger.info("✅ Set LinkedIn Client Secret")
                    elif key == 'access_token':
                        filtered_lines.append(f'LINKEDIN_ACCESS_TOKEN={value}')
                        os.environ['LINKEDIN_ACCESS_TOKEN'] = value
                        logger.info("✅ Set LinkedIn Access Token")
            
            # Add redirect URI
            filtered_lines.append('LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback')
            os.environ['LINKEDIN_REDIRECT_URI'] = 'http://localhost:8001/social/linkedin/callback'
            
            # Write back to .env file
            try:
                with open(env_path, 'w') as f:
                    f.write('\n'.join(filtered_lines))
                logger.info("💾 LinkedIn credentials saved to .env file")
            except Exception as e:
                logger.error(f"Failed to write to .env file: {e}")
            
            # Reinitialize LinkedIn agent with new credentials
            linkedin_agent.__init__()
            logger.info("🔄 LinkedIn agent reinitialized")
        
        # Update platform configuration for all platforms
        social_media_agent.platform_configs[platform].update(request.config)
        logger.info(f"✅ Updated {platform} configuration in memory")
        
        # For non-LinkedIn platforms, save to environment variables
        if platform != 'linkedin':
            for key, value in request.config.items():
                if value:  # Only set non-empty values
                    env_var = f"{platform.upper()}_{key.upper()}"
                    os.environ[env_var] = value
                    logger.info(f"🔑 Set environment variable: {env_var}")
        
        return {"success": True, "message": f"{platform.capitalize()} configured successfully"}
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"❌ Error configuring platform {platform}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to configure platform: {str(e)}")

@app.post("/social-media/schedule-posts")
async def schedule_posts(request: SchedulePostRequest):
    """Schedule posts for a specific platform with persistent storage and marketing strategy optimization"""
    try:
        logger.info(f"Scheduling {len(request.posts)} posts for {request.platform}")
        
        # Load marketing strategy insights for optimal scheduling
        marketing_strategy = load_marketing_strategy_data()
        logger.info(f"Loaded marketing strategy data: {bool(marketing_strategy)}")
        
        if request.schedule_type == 'manual' and request.start_date:
            start_date = datetime.fromisoformat(request.start_date)
        else:
            start_date = datetime.now() + timedelta(hours=1)
        
        # Clean up old posts before adding new ones
        cleanup_past_posts()
        
        # Generate optimal scheduling times using marketing strategy
        scheduled_posts = []
        for i, post in enumerate(request.posts):
            # **REMOVE THE PROBLEMATIC SCHEDULING LOGIC**
            # Use the optimal time that's already calculated in the post generation
            if post.get('scheduled_time'):
                # If post already has a scheduled time, use it
                try:
                    schedule_time = datetime.fromisoformat(post['scheduled_time'].replace('Z', ''))
                except:
                    # Fallback if parsing fails
                    schedule_time = start_date + timedelta(hours=i * 2)
            else:
                # Manual scheduling with specified intervals
                schedule_time = start_date + timedelta(hours=i * 2)
            
            # Ensure the time is in the future
            if schedule_time <= datetime.now():
                schedule_time += timedelta(days=1)
            
            # Use the engagement prediction from the original post
            engagement_level = post.get('engagement_prediction', 'medium')
            optimal_reason = post.get('optimal_reason', f'Optimized for {request.platform}')
            
            # Create the scheduled post object - preserve original optimal times
            scheduled_post = {
                'id': post.get('id', f"post_{request.platform}_{i+1}_{int(datetime.now().timestamp())}"),
                'platform': request.platform,
                'title': post.get('title', f'Post #{i+1}'),
                'content': post.get('content', ''),
                'hashtags': post.get('hashtags', []),
                'image_url': post.get('image_url'),
                'scheduled_time': schedule_time.isoformat(),
                'optimal_time': post.get('optimal_time', f"{schedule_time.hour}:00 {'AM' if schedule_time.hour < 12 else 'PM'}"),
                'status': 'scheduled',
                'engagement_prediction': engagement_level,
                'call_to_action': post.get('call_to_action', ''),
                'has_media': post.get('has_media', False),
                'content_type': post.get('content_type', 'text'),
                'created_at': datetime.now().isoformat(),
                'suggested_date': schedule_time.strftime('%B %d, %Y'),
                'suggested_time': schedule_time.strftime('%I:%M %p'),
                'optimal_reason': optimal_reason
            }
            scheduled_posts.append(scheduled_post)
        
        # Save to persistent storage
        success = save_scheduled_posts(scheduled_posts)
        if not success:
            raise Exception("Failed to save posts to storage")
        
        logger.info(f"Successfully scheduled {len(scheduled_posts)} posts for {request.platform}")
        
        return {
            "success": True,
            "scheduled_posts": scheduled_posts,
            "platform": request.platform,
            "message": f"Successfully scheduled {len(scheduled_posts)} posts for {request.platform}",
            "storage_saved": success,
            "marketing_strategy_applied": bool(marketing_strategy.get('engagement_heatmap'))
        }
        
    except Exception as e:
        logger.error(f"Error scheduling posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule posts: {str(e)}")

@app.post("/social-media/post-now")
async def post_to_social_media(request: PostToSocialMediaRequest):
    """Post content immediately to a social media platform"""
    try:
        # First, try to load the post data using the post_id from scheduled posts
        logger.info(f"Loading post data for post_id: {request.post_id}")
        posts = load_scheduled_posts()
        
        # Find the specific post by ID
        post_data = None
        for post in posts:
            if post.get('id') == request.post_id:
                post_data = post
                break
        
        # If post is not found in scheduled posts, use content from request
        if not post_data:
            logger.info(f"Post {request.post_id} not found in scheduled posts, using content from request")
            
            if not request.content:
                logger.error(f"Post {request.post_id} not found in storage and no content provided in request")
                raise HTTPException(status_code=400, detail=f"Post {request.post_id} not found and no content provided")
            
            # Use content from request
            post_content = request.content
            post_image_data = request.image_data
            logger.info(f"Using content from request: {post_content[:100]}...")
        else:
            logger.info(f"Found post data in storage: {post_data.get('content', '')[:100]}...")
            
            # Extract content and image data from the stored post
            post_content = post_data.get('content', '')
            post_image_data = post_data.get('image_data')
        
        if not post_content:
            logger.error(f"No content available for post {request.post_id}")
            raise HTTPException(status_code=400, detail=f"No content available for post {request.post_id}")
        
        # Check platform configuration
        platform_status = social_media_agent.get_platform_status()
        if not platform_status[request.platform]['configured']:
            missing_fields = platform_status[request.platform]['missing_fields']
            raise HTTPException(
                status_code=400, 
                detail=f"Platform {request.platform} not properly configured. Missing: {', '.join(missing_fields)}"
            )
        
        # Actually post to the platforms
        if request.platform == 'linkedin':
            # Get access token from environment or storage
            access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
            if not access_token:
                raise HTTPException(
                    status_code=400, 
                    detail="LinkedIn access token not configured. Please complete LinkedIn authentication first."
                )
            
            logger.info(f"Posting to LinkedIn with content: {post_content[:100]}...")
            
            # Post to LinkedIn with the content and image
            linkedin_result = linkedin_agent.post_to_linkedin(
                message=post_content,
                access_token=access_token,
                image_data=post_image_data
            )
            
            logger.info(f"LinkedIn posting successful: {linkedin_result}")
            
            result = {
                "success": True,
                "post_id": linkedin_result.get("post_id", request.post_id),
                "platform": request.platform,
                "posted_at": linkedin_result.get("posted_at", datetime.now().isoformat()),
                "message": f"Successfully posted to LinkedIn",
                "linkedin_post_id": linkedin_result.get("post_id"),
                "original_post_id": request.post_id,
                "content_source": "scheduled_storage" if post_data else "request_content"
            }
            
        else:
            # For other platforms, return simulation for now
            # TODO: Implement Facebook, Instagram, TikTok, X posting
            result = {
                "success": True,
                "post_id": request.post_id,
                "platform": request.platform,
                "posted_at": datetime.now().isoformat(),
                "message": f"Successfully posted to {request.platform} (simulated)",
                "post_url": f"https://{request.platform}.com/posts/{request.post_id}",
                "note": "This is a simulated post. Actual API integration needed for this platform.",
                "content": post_content[:100] + "..." if len(post_content) > 100 else post_content,
                "content_source": "scheduled_storage" if post_data else "request_content"
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error posting to social media: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to post to social media: {str(e)}")

@app.get("/social-media/upcoming-posts")
async def get_upcoming_posts(platform: Optional[str] = None, limit: int = 50):
    """Get upcoming scheduled posts from persistent storage"""
    try:
        logger.info(f"Fetching upcoming posts - platform: {platform}, limit: {limit}")
        
        # Clean up old posts first
        all_posts = cleanup_past_posts()
        
        # Filter by platform if specified
        if platform:
            filtered_posts = [post for post in all_posts if post.get('platform') == platform]
        else:
            filtered_posts = all_posts
        
        # Sort by scheduled time
        def sort_key(post):
            try:
                if isinstance(post.get('scheduled_time'), str):
                    return datetime.fromisoformat(post['scheduled_time'].replace('Z', '+00:00'))
                else:
                    return datetime.fromtimestamp(post.get('scheduled_time', 0))
            except:
                return datetime.now()
        
        filtered_posts.sort(key=sort_key)
        
        # Limit results
        upcoming_posts = filtered_posts[:limit]
        
        logger.info(f"Returning {len(upcoming_posts)} upcoming posts")
        
        return {
            "upcoming_posts": upcoming_posts,
            "total_count": len(filtered_posts),
            "platform_filter": platform,
            "loaded_from_storage": True
        }
        
    except Exception as e:
        logger.error(f"Error getting upcoming posts: {str(e)}")
        # Return empty list if there's an error rather than failing completely
        return {
            "upcoming_posts": [],
            "total_count": 0,
            "platform_filter": platform,
            "error": str(e)
        }

@app.get("/social-media/storage-status")
async def get_storage_status():
    """Get the status of the scheduled posts storage system"""
    try:
        file_path = get_scheduled_posts_file_path()
        posts = load_scheduled_posts()
        
        return {
            "storage_file": file_path,
            "file_exists": os.path.exists(file_path),
            "total_posts": len(posts),
            "posts_by_platform": {
                platform: len([p for p in posts if p.get('platform') == platform])
                for platform in ['linkedin', 'facebook', 'instagram', 'tiktok', 'x']
            },
            "recent_posts": posts[:5]  # Show first 5 for debugging
        }
    except Exception as e:
        return {
            "error": str(e),
            "storage_file": get_scheduled_posts_file_path(),
            "file_exists": False
        }

@app.delete("/social-media/posts/{post_id}/cancel")
async def cancel_scheduled_post(post_id: str):
    """Cancel a scheduled social media post"""
    try:
        logger.info(f"Cancelling scheduled post: {post_id}")
        
        success = remove_scheduled_post(post_id)
        if success:
            return {
                "success": True,
                "post_id": post_id,
                "message": "Post cancelled successfully",
                "cancelled_at": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "post_id": post_id,
                "message": "Post not found or already cancelled",
                "cancelled_at": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error cancelling post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel post: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error cancelling post: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel post: {str(e)}")

@app.get("/social-media/load-business-data")
async def load_business_data():
    """Load business data from output files and brand identity storage"""
    try:
        business_data = social_media_agent.load_business_data()
        
        return {
            "success": True,
            "data": business_data,
            "has_business_summary": bool(business_data.get("business_summary")),
            "has_financial_data": bool(business_data.get("financial_data")),
            "has_market_data": bool(business_data.get("market_data")),
            "has_legal_data": bool(business_data.get("legal_data")),
            "has_brand_identity_data": bool(business_data.get("brand_identity_data"))
        }
        
    except Exception as e:
        logger.error(f"Error loading business data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load business data: {str(e)}")

@app.get("/social-media/post/{post_id}")
async def get_scheduled_post(post_id: str):
    """Get details of a specific scheduled post"""
    try:
        data = load_scheduled_posts()
        posts = data.get("scheduled_posts", [])
        
        post = next((p for p in posts if p.get("id") == post_id), None)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return {
            "success": True,
            "post": post
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post {post_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get post: {str(e)}")

@app.put("/social-media/post/{post_id}/reschedule")
async def reschedule_post(post_id: str, request: dict):
    """Reschedule a specific post"""
    try:
        new_time = request.get("new_time")
        if not new_time:
            raise HTTPException(status_code=400, detail="new_time is required")
            
        data = load_scheduled_posts()
        posts = data.get("scheduled_posts", [])
        
        post_index = next((i for i, p in enumerate(posts) if p.get("id") == post_id), None)
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Parse the new time
        try:
            new_schedule_time = datetime.fromisoformat(new_time)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")
        
        # Update the post
        posts[post_index]["scheduled_time"] = new_schedule_time.isoformat()
        posts[post_index]["suggested_date"] = new_schedule_time.strftime('%B %d, %Y')
        posts[post_index]["suggested_time"] = new_schedule_time.strftime('%I:%M %p')
        posts[post_index]["optimal_reason"] = "Manually rescheduled by user"
        
        # Save back to storage
        success = save_scheduled_posts(posts)
        if not success:
            raise Exception("Failed to save rescheduled post")
        
        return {
            "success": True,
            "message": "Post rescheduled successfully",
            "post": posts[post_index]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rescheduling post {post_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reschedule post: {str(e)}")

@app.put("/social-media/post/{post_id}/regenerate-media")
async def regenerate_post_media(post_id: str):
    """Regenerate media for a specific post while keeping the text content"""
    try:
        data = load_scheduled_posts()
        posts = data.get("scheduled_posts", [])
        
        post_index = next((i for i, p in enumerate(posts) if p.get("id") == post_id), None)
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post = posts[post_index]
        
        # Generate new image using the existing content
        business_summary = f"Post content: {post.get('content', '')}"
        image_data = social_media_agent.generate_post_image(post, business_summary)
        
        if image_data:
            posts[post_index]["image_url"] = image_data
            posts[post_index]["has_media"] = True
            posts[post_index]["content_type"] = "image"
        
        # Save back to storage
        success = save_scheduled_posts(posts)
        if not success:
            raise Exception("Failed to save post with new media")
        
        return {
            "success": True,
            "message": "Media regenerated successfully",
            "post": posts[post_index],
            "new_image_url": image_data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating media for post {post_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate media: {str(e)}")

@app.put("/social-media/post/{post_id}/regenerate-content")
async def regenerate_post_content(post_id: str):
    """Regenerate content for a specific post while keeping the media"""
    try:
        data = load_scheduled_posts()
        posts = data.get("scheduled_posts", [])
        
        post_index = next((i for i, p in enumerate(posts) if p.get("id") == post_id), None)
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        post = posts[post_index]
        platform = post.get("platform", "linkedin")
        
        # Load marketing strategy for content generation
        marketing_strategy = load_marketing_strategy_data()
        
        # Generate new content using the social media agent
        new_posts = social_media_agent.generate_marketing_posts(
            business_summary="Generate new content for existing post",
            marketing_insights=marketing_strategy,
            platform=platform,
            count=1
        )
        
        if new_posts and len(new_posts) > 0:
            new_post = new_posts[0]
            # Keep the existing media but update content
            posts[post_index].update({
                "title": new_post.get("title", post.get("title")),
                "content": new_post.get("content", post.get("content")),
                "hashtags": new_post.get("hashtags", post.get("hashtags", [])),
                "call_to_action": new_post.get("call_to_action", post.get("call_to_action"))
            })
            
            # Save back to storage
            success = save_scheduled_posts(posts)
            if not success:
                raise Exception("Failed to save post with new content")
        
        return {
            "success": True,
            "message": "Content regenerated successfully",
            "post": posts[post_index]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating content for post {post_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate content: {str(e)}")

# =============================================================================
# LINKEDIN SPECIFIC ENDPOINTS
# =============================================================================

@app.get("/linkedin/auth")
def linkedin_auth():
    """Initiate LinkedIn OAuth flow"""
    try:
        auth_url = linkedin_agent.get_auth_url()
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"LinkedIn auth error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/linkedin/status")
async def get_linkedin_status():
    """Get LinkedIn configuration and authentication status"""
    try:
        has_client_id = bool(os.getenv('LINKEDIN_CLIENT_ID'))
        has_client_secret = bool(os.getenv('LINKEDIN_CLIENT_SECRET'))
        has_access_token = bool(os.getenv('LINKEDIN_ACCESS_TOKEN'))
        
        status = {
            "configured": {
                "client_id": has_client_id,
                "client_secret": has_client_secret,
                "access_token": has_access_token
            },
            "redirect_uri": os.getenv('LINKEDIN_REDIRECT_URI', 'http://localhost:8001/social/linkedin/callback'),
            "ready_to_post": has_access_token
        }
        
        # Test access token if available
        if has_access_token:
            try:
                person_id = linkedin_agent.get_person_id()
                status["person_id_valid"] = bool(person_id)
                if person_id:
                    status["person_id"] = person_id
            except Exception as e:
                status["person_id_valid"] = False
                status["token_error"] = str(e)
        
        return status
        
    except Exception as e:
        logger.error(f"LinkedIn status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get LinkedIn status: {str(e)}")

@app.get("/social/linkedin/callback")
def linkedin_callback(code: str = None, error: str = None):
    """Handle LinkedIn OAuth callback"""
    if error or not code:
        return {"error": error or "missing_code"}
    
    try:
        token_data = linkedin_agent.exchange_code_for_token(code)
        return {
            "success": True,
            "access_token": token_data["access_token"],
            "expires_in": token_data["expires_in"],
            "token_type": token_data.get("token_type", "Bearer")
        }
    except Exception as e:
        logger.error(f"LinkedIn callback error: {str(e)}")
        return {"error": "token_exchange_failed", "details": str(e)}

@app.post("/linkedin/post")
async def post_to_linkedin(request: dict):
    """Post content directly to LinkedIn"""
    try:
        content = request.get("content", "")
        image_data = request.get("image_data")
        access_token = request.get("access_token")
        
        if not content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        result = linkedin_agent.post_to_linkedin(
            message=content,
            access_token=access_token,
            image_data=image_data
        )
        
        return {
            "success": True,
            "platform": "linkedin",
            **result
        }
        
    except Exception as e:
        logger.error(f"LinkedIn posting error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to post to LinkedIn: {str(e)}")

@app.post("/linkedin/test")
async def test_linkedin_connection():
    """Test LinkedIn connection without posting"""
    try:
        has_credentials = bool(os.getenv('LINKEDIN_CLIENT_ID')) and bool(os.getenv('LINKEDIN_CLIENT_SECRET'))
        has_token = bool(os.getenv('LINKEDIN_ACCESS_TOKEN'))
        
        result = {
            "credentials_configured": has_credentials,
            "access_token_available": has_token
        }
        
        if has_token:
            # Test the token by getting person ID
            person_id = linkedin_agent.get_person_id()
            result["person_id_valid"] = bool(person_id)
            if person_id:
                result["person_id"] = person_id
                result["ready_to_post"] = True
        else:
            result["ready_to_post"] = False
            if has_credentials:
                result["auth_url"] = linkedin_agent.get_auth_url()
                result["message"] = "Complete OAuth flow using the auth_url to get access token"
            else:
                result["message"] = "LinkedIn credentials not configured. Run setup_linkedin.py first."
        
        return result
        
    except Exception as e:
        logger.error(f"LinkedIn test error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LinkedIn test failed: {str(e)}")

# =============================================================================
# INVESTOR RECOMMENDATION ENDPOINTS
# =============================================================================

class InvestorRequest(BaseModel):
    business_summary: str

@app.post("/investors/analyze")
async def analyze_for_investors(request: InvestorRequest):
    """
    Analyze business summary and get investor recommendations
    """
    try:
        if not request.business_summary:
            raise HTTPException(status_code=400, detail="Business summary is required")
        
        result = analyze_business_for_investors(request.business_summary)
        
        return {
            "success": True,
            "data": result,
            "message": f"Found {len(result['recommendations'])} investor recommendations"
        }
        
    except Exception as e:
        logger.error(f"Investor analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze for investors: {str(e)}")

@app.get("/investors/recommendations")
async def get_investor_recommendations_endpoint():
    """
    Get saved investor recommendations
    """
    try:
        # Try to load from file or return empty if not found
        output_file = os.path.join(output_dir, "investor_recommendations.json")
        
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {
                    "success": True,
                    "data": data,
                    "message": "Investor recommendations loaded successfully"
                }
        else:
            return {
                "success": False,
                "data": {"recommendations": [], "readiness_score": 0.0},
                "message": "No investor recommendations found. Please analyze your business first."
            }
            
    except Exception as e:
        logger.error(f"Error loading investor recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load investor recommendations: {str(e)}")

@app.get("/investors/all")
async def get_all_investors():
    """
    Get all available investors in the database
    """
    try:
        investors_data = load_investors()
        
        return {
            "success": True,
            "data": {
                "investors": investors_data,
                "total": len(investors_data)
            },
            "message": f"Loaded {len(investors_data)} investors"
        }
        
    except Exception as e:
        logger.error(f"Error loading investors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load investors: {str(e)}")

@app.post("/investors/save")
async def save_investor_analysis(request: dict):
    """
    Save investor analysis results to file
    """
    try:
        output_file = os.path.join(output_dir, "investor_recommendations.json")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(request, f, ensure_ascii=False, indent=2)
        
        return {
            "success": True,
            "message": "Investor analysis saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving investor analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save investor analysis: {str(e)}")

# =============================================================================
# LINKEDIN OAUTH ENDPOINTS
# =============================================================================

@app.get("/linkedin/auth")
async def linkedin_get_auth_url():
    """
    Get LinkedIn OAuth authorization URL
    """
    try:
        auth_url = linkedin_agent.get_auth_url()
        logger.info(f"Generated LinkedIn auth URL: {auth_url}")
        
        return {
            "success": True,
            "auth_url": auth_url,
            "message": "Visit this URL to authorize the LinkedIn integration"
        }
        
    except Exception as e:
        logger.error(f"Error generating LinkedIn auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate auth URL: {str(e)}")

@app.get("/social/linkedin/callback")
async def linkedin_oauth_callback(code: str = None, state: str = None, error: str = None):
    """
    Handle LinkedIn OAuth callback
    """
    try:
        if error:
            logger.error(f"LinkedIn OAuth error: {error}")
            return PlainTextResponse(f"LinkedIn authorization failed: {error}", status_code=400)
        
        if not code:
            logger.error("No authorization code received from LinkedIn")
            return PlainTextResponse("Missing authorization code", status_code=400)
        
        logger.info(f"Received LinkedIn authorization code: {code[:10]}...")
        
        # Exchange code for access token
        token_data = linkedin_agent.exchange_code_for_token(code)
        access_token = token_data.get('access_token')
        
        if not access_token:
            logger.error("No access token in LinkedIn response")
            return PlainTextResponse("Failed to get access token", status_code=400)
        
        logger.info("Successfully obtained LinkedIn access token")
        
        # Update environment variable (for this session)
        os.environ['LINKEDIN_ACCESS_TOKEN'] = access_token
        linkedin_agent.access_token = access_token
        
        # Update .env file for persistence
        env_path = Path(__file__).parent / '.env'
        if env_path.exists():
            with open(env_path, 'r') as f:
                env_content = f.read()
            
            # Remove existing LINKEDIN_ACCESS_TOKEN line
            lines = [line for line in env_content.split('\n') if not line.startswith('LINKEDIN_ACCESS_TOKEN=')]
            
            # Add new token
            lines.append(f'LINKEDIN_ACCESS_TOKEN={access_token}')
            
            with open(env_path, 'w') as f:
                f.write('\n'.join(lines))
            
            logger.info("Updated .env file with new LinkedIn access token")
        
        return PlainTextResponse(
            "✅ LinkedIn integration successful!\n\n"
            "Your LinkedIn access token has been saved. You can now:\n"
            "- Close this window\n"
            "- Return to your application\n"
            "- Start posting to LinkedIn!\n\n"
            f"Token expires in: {token_data.get('expires_in', 'unknown')} seconds",
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Error in LinkedIn OAuth callback: {str(e)}")
        return PlainTextResponse(f"OAuth callback failed: {str(e)}", status_code=500)

@app.get("/linkedin/status")
async def linkedin_check_status():
    """
    Check LinkedIn integration status
    """
    try:
        # First reload the access token from environment
        linkedin_agent.access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        
        if not linkedin_agent.access_token:
            return {
                "success": False,
                "authenticated": False,
                "message": "No LinkedIn access token configured",
                "setup_required": True
            }
        
        # Test the token by getting user info
        person_id = linkedin_agent.get_person_id()
        
        if person_id:
            return {
                "success": True,
                "authenticated": True,
                "person_id": person_id,
                "message": "LinkedIn integration is working correctly",
                "token_preview": linkedin_agent.access_token[:20] + "..." if linkedin_agent.access_token else "None"
            }
        else:
            return {
                "success": False,
                "authenticated": False,
                "message": "LinkedIn access token is invalid or expired",
                "refresh_required": True,
                "token_preview": linkedin_agent.access_token[:20] + "..." if linkedin_agent.access_token else "None"
            }
            
    except Exception as e:
        logger.error(f"Error checking LinkedIn status: {str(e)}")
        return {
            "success": False,
            "authenticated": False,
            "message": f"Error checking status: {str(e)}",
            "refresh_required": True,
            "token_preview": linkedin_agent.access_token[:20] + "..." if linkedin_agent.access_token else "None"
        }

@app.get("/linkedin/debug")
async def linkedin_debug():
    """
    Debug LinkedIn configuration and token
    """
    try:
        # Reload token from environment
        linkedin_agent.access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        
        return {
            "client_id": linkedin_agent.client_id,
            "client_secret": "***" + linkedin_agent.client_secret[-4:] if linkedin_agent.client_secret else None,
            "redirect_uri": linkedin_agent.redirect_uri,
            "token_length": len(linkedin_agent.access_token) if linkedin_agent.access_token else 0,
            "token_preview": linkedin_agent.access_token[:30] + "..." if linkedin_agent.access_token else None,
            "has_token": bool(linkedin_agent.access_token)
        }
    except Exception as e:
        return {"error": str(e)}

# =============================================================================
# WEBSITE GENERATOR ENDPOINTS
# =============================================================================

@app.get("/website-generator/business-data")
async def get_business_data_for_website():
    """
    Load business data for website generation
    """
    try:
        business_data = website_generator_agent.load_business_data()
        
        return {
            "success": True,
            "data": business_data,
            "has_business_summary": bool(business_data.get("business_summary")),
            "has_financial_data": bool(business_data.get("financial_data")),
            "has_market_data": bool(business_data.get("market_data")),
            "has_legal_data": bool(business_data.get("legal_data")),
            "has_brand_identity_data": bool(business_data.get("brand_identity_data")),
            "message": "Business data loaded successfully"
        }
        
    except Exception as e:
        logger.error(f"Error loading business data for website: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load business data: {str(e)}")

@app.post("/website-generator/generate", response_model=WebsiteResponse)
async def generate_website(request: WebsiteGenerationRequest):
    """
    Generate a professional website/landing page based on business data
    
    **Request Body:**
    - user_prompt: Optional user requirements and customizations
    - style_preferences: Design style preference (modern, professional, creative, etc.)
    - regenerate: Whether this is a regeneration of existing website
    - website_id: ID for regeneration (optional)
    
    **Response:**
    - Complete HTML code with embedded CSS/JS
    - Business analysis used for generation
    - Website ID for future reference
    - Version information
    """
    try:
        # Load business data
        business_data = website_generator_agent.load_business_data()
        
        if not any(business_data.values()):
            return WebsiteResponse(
                success=False,
                message="No business data available. Please complete business analysis first.",
                error="Business data not found"
            )
        
        # Generate website
        result = website_generator_agent.generate_website(
            business_data=business_data,
            user_prompt=request.user_prompt or "",
            style_preferences=request.style_preferences or "modern"
        )
        
        if result["success"]:
            return WebsiteResponse(
                success=True,
                message="Website generated successfully! 🎉",
                website_id=result["website_id"],
                html_code=result["html_code"],
                analysis=result["analysis"],
                version_info=result["version_info"],
                company_name=result["company_name"],
                generation_time=result["generation_time"]
            )
        else:
            return WebsiteResponse(
                success=False,
                message="Website generation failed",
                error="Generation failed"
            )
            
    except Exception as e:
        logger.error(f"Error generating website: {str(e)}")
        return WebsiteResponse(
            success=False,
            message="Server error occurred during website generation",
            error=str(e)
        )

@app.post("/website-generator/regenerate", response_model=WebsiteResponse)
async def regenerate_website(request: WebsiteRegenerationRequest):
    """
    Regenerate website with user feedback
    
    **Request Body:**
    - website_id: ID of website to regenerate
    - user_feedback: User feedback and requested changes
    - style_preferences: Updated style preferences
    
    **Response:**
    - Updated website with incorporated feedback
    """
    try:
        result = website_generator_agent.regenerate_website(
            website_id=request.website_id,
            user_feedback=request.user_feedback,
            style_preferences=request.style_preferences or "modern"
        )
        
        if result["success"]:
            return WebsiteResponse(
                success=True,
                message="Website regenerated successfully with your feedback! ✨",
                website_id=result["website_id"],
                html_code=result["html_code"],
                analysis=result["analysis"],
                version_info=result["version_info"],
                company_name=result["company_name"],
                generation_time=result["generation_time"]
            )
        else:
            return WebsiteResponse(
                success=False,
                message="Website regeneration failed",
                error="Regeneration failed"
            )
            
    except Exception as e:
        logger.error(f"Error regenerating website: {str(e)}")
        return WebsiteResponse(
            success=False,
            message="Server error occurred during website regeneration",
            error=str(e)
        )

@app.get("/website-generator/versions/{website_id}")
async def get_website_versions(website_id: str):
    """
    Get all versions of a website
    
    **Path Parameters:**
    - website_id: Website identifier
    
    **Response:**
    - List of all versions with metadata
    """
    try:
        versions = website_generator_agent.get_website_versions(website_id)
        
        return {
            "success": True,
            "website_id": website_id,
            "versions": versions,
            "total_versions": len(versions),
            "message": f"Found {len(versions)} versions"
        }
        
    except Exception as e:
        logger.error(f"Error getting website versions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get website versions: {str(e)}")

@app.get("/website-generator/version/{version_id}/html")
async def get_website_html(version_id: str):
    """
    Get HTML content for a specific website version
    
    **Path Parameters:**
    - version_id: Version identifier
    
    **Response:**
    - HTML content of the website version
    """
    try:
        html_content = website_generator_agent.get_website_html(version_id)
        
        if html_content:
            return {
                "success": True,
                "version_id": version_id,
                "html_code": html_content,
                "message": "HTML content retrieved successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Website version not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting website HTML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get website HTML: {str(e)}")

@app.get("/website-generator/version/{version_id}/metadata")
async def get_website_metadata(version_id: str):
    """
    Get metadata for a specific website version
    
    **Path Parameters:**
    - version_id: Version identifier
    
    **Response:**
    - Metadata including analysis data for TSX components
    """
    try:
        # Load metadata from file
        metadata_file = Path("website_versions") / f"{version_id}_metadata.json"
        
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            return {
                "success": True,
                "version_id": version_id,
                "metadata": metadata,
                "message": "Metadata retrieved successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Version metadata not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting website metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get website metadata: {str(e)}")

@app.post("/website-generator/publish")
async def publish_website(request: PublishWebsiteRequest):
    """
    Publish a website version
    
    **Request Body:**
    - version_id: Version to publish
    
    **Response:**
    - Publication confirmation and URL
    """
    try:
        result = website_generator_agent.publish_website(request.version_id)
        
        if result["success"]:
            return {
                "success": True,
                "message": "Website published successfully! 🚀",
                "published_url": result["published_url"],
                "version_id": result["version_id"]
            }
        else:
            return {
                "success": False,
                "message": "Failed to publish website",
                "error": result.get("error", "Unknown error")
            }
            
    except Exception as e:
        logger.error(f"Error publishing website: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to publish website: {str(e)}")

@app.get("/company-profile/{website_id}")
async def serve_published_website(website_id: str):
    """
    Serve published website at custom URL
    
    **Path Parameters:**
    - website_id: Published website identifier
    
    **Response:**
    - HTML page of the published website
    """
    try:
        # Check if it's a version_id or website_id
        html_content = website_generator_agent.get_website_html(website_id)
        
        if not html_content:
            # Try to find in published directory
            published_dir = Path("generated_websites/published")
            html_file = published_dir / f"{website_id}.html"
            
            if html_file.exists():
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
        
        if html_content:
            return HTMLResponse(content=html_content, status_code=200)
        else:
            raise HTTPException(status_code=404, detail="Published website not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving published website: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to serve website: {str(e)}")

@app.get("/website-generator/analyze")
async def analyze_business_for_website():
    """
    Analyze business data for website requirements
    
    **Response:**
    - Business analysis with website-specific insights
    """
    try:
        business_data = website_generator_agent.load_business_data()
        
        if not any(business_data.values()):
            return {
                "success": False,
                "message": "No business data available for analysis",
                "analysis": {}
            }
        
        analysis = website_generator_agent.analyze_business_for_website(business_data)
        
        return {
            "success": True,
            "message": "Business analysis completed successfully",
            "analysis": analysis,
            "data_sources": {
                "has_business_summary": bool(business_data.get("business_summary")),
                "has_financial_data": bool(business_data.get("financial_data")),
                "has_market_data": bool(business_data.get("market_data")),
                "has_legal_data": bool(business_data.get("legal_data")),
                "has_brand_identity": bool(business_data.get("brand_identity_data"))
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing business for website: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze business: {str(e)}")

# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting BrandOrbAI Unified API server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )