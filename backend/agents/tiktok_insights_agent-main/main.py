"""
TikTok Profile Analysis API

This API provides endpoints for scraping TikTok profiles and analyzing engagement patterns
using association rule mining.
"""

import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import logging
from dotenv import load_dotenv
from groq import Groq

# Import our custom modules
from data_finder import TikTokProfileScraper
from trend_tiktok import TikTokEngagementMiner
from prompts import INSIGHTS_GENERATION_PROMPT

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TikTok Profile Analysis API",
    description="API for scraping TikTok profiles and analyzing engagement patterns",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for session data (in production, use a database)
sessions: Dict[str, Dict[str, Any]] = {}

def initialize_sessions_from_files():
    """Initialize sessions from existing data files in tiktok_scraping_results directory"""
    results_dir = "tiktok_scraping_results"
    if not os.path.exists(results_dir):
        return
    
    logger.info("Initializing sessions from existing data files...")
    
    for filename in os.listdir(results_dir):
        if filename.endswith('.json') and filename.startswith('session_'):
            try:
                # Extract session ID from filename: session_{session_id}_data.json
                session_id = filename.replace('session_', '').replace('_data.json', '')
                
                # Load the data
                filepath = os.path.join(results_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Get file modification time as created_at
                file_stat = os.stat(filepath)
                created_at = datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                
                # Extract profile names from data if available
                profile_names = []
                if data:
                    authors = set()
                    for video in data:
                        author = video.get('authorMeta.name', '')
                        if author:
                            authors.add(author)
                    profile_names = list(authors)
                
                # Initialize session
                sessions[session_id] = {
                    "status": "completed",
                    "message": f"Restored session with {len(data)} videos (mining not performed)",
                    "profile_names": profile_names,
                    "created_at": created_at,
                    "data": data,
                    "videos_scraped": len(data),
                    "miner": None,
                    "mining_results": None
                }
                
                logger.info(f"Restored session {session_id} with {len(data)} videos")
                
            except Exception as e:
                logger.warning(f"Failed to restore session from {filename}: {str(e)}")
    
    logger.info(f"Initialized {len(sessions)} sessions from existing files")

# Initialize sessions on startup
initialize_sessions_from_files()

# Pydantic models for request/response
class ProfileScrapeRequest(BaseModel):
    profile_names: List[str] = Field(..., description="List of TikTok profile names to scrape")
    results_per_page: int = Field(default=50, ge=1, le=100, description="Number of results per page (1-100)")
    api_token: Optional[str] = Field(default=None, description="Apify API token (optional if set in environment)")
    proxy_country_code: str = Field(default="TN", description="Proxy country code")
    profile_sorting: str = Field(default="latest", description="Profile sorting method")
    min_support: float = Field(default=0.05, ge=0.01, le=0.5, description="Minimum support threshold")
    min_confidence: float = Field(default=0.5, ge=0.1, le=1.0, description="Minimum confidence threshold")
    min_lift: float = Field(default=1.2, ge=1.0, le=5.0, description="Minimum lift threshold")

class ProfileScrapeResponse(BaseModel):
    session_id: str = Field(..., description="Session ID for tracking the scraping job")
    status: str = Field(..., description="Status of the scraping job")
    message: str = Field(..., description="Status message")

class RulesRequest(BaseModel):
    session_id: str = Field(..., description="Session ID from the scraping job")
    targets: List[str] = Field(..., description="List of target variables for rule mining")
    top_n: int = Field(default=10, ge=1, le=50, description="Number of top rules to return")

class AssociationRule(BaseModel):
    rule: str = Field(..., description="Human-readable rule description")
    antecedent: List[str] = Field(..., description="Rule antecedent (if-part)")
    consequent: List[str] = Field(..., description="Rule consequent (then-part)")
    support: float = Field(..., description="Support value")
    confidence: float = Field(..., description="Confidence value")
    lift: float = Field(..., description="Lift value")

class RulesResponse(BaseModel):
    session_id: str = Field(..., description="Session ID")
    targets: List[str] = Field(..., description="Target variables used")
    rules: List[AssociationRule] = Field(..., description="List of association rules")
    total_videos: int = Field(..., description="Total number of videos analyzed")
    total_rules_found: int = Field(..., description="Total number of rules found")

class SessionStatusResponse(BaseModel):
    session_id: str = Field(..., description="Session ID")
    status: str = Field(..., description="Current status")
    message: str = Field(..., description="Status message")
    videos_scraped: Optional[int] = Field(default=None, description="Number of videos scraped")
    created_at: str = Field(..., description="Session creation timestamp")

class InsightsRequest(BaseModel):
    session_id: str = Field(..., description="Session ID from the scraping job")
    targets: List[str] = Field(..., description="List of target variables for rule mining")
    n: int = Field(default=10, ge=1, le=50, description="Number of top rules to analyze")

class InsightsResponse(BaseModel):
    session_id: str = Field(..., description="Session ID")
    targets: List[str] = Field(..., description="Target variables used")
    insights: str = Field(..., description="Generated insights from Groq")
    rules_analyzed: int = Field(..., description="Number of rules analyzed")
    total_videos: int = Field(..., description="Total number of videos in the dataset")

def get_api_token() -> str:
    """Get API token from environment or use default"""
    return os.getenv("APIFY_API_TOKEN", "apify_api_OwpXbVteuoFNgHZ3gyCWTXjuPxK6rz4omWRn")

async def scrape_profiles_background(
    session_id: str,
    profile_names: List[str],
    results_per_page: int,
    api_token: str,
    proxy_country_code: str,
    profile_sorting: str,
    min_support: float,
    min_confidence: float,
    min_lift: float
):
    """Background task for scraping TikTok profiles"""
    try:
        logger.info(f"Starting scraping job for session {session_id}")
        sessions[session_id]["status"] = "scraping"
        sessions[session_id]["message"] = "Scraping TikTok profiles..."
        
        # Initialize scraper
        scraper = TikTokProfileScraper(api_token)
        
        # Scrape profiles
        results = scraper.scrape_profile_videos(
            profile_names=profile_names,
            results_per_page=results_per_page,
            proxy_country_code=proxy_country_code,
            profile_sorting=profile_sorting,
            save_locally=True,
            output_filename=f"session_{session_id}_data.json"
        )
        
        # Initialize engagement miner and mine patterns
        logger.info(f"Mining engagement patterns for session {session_id}")
        try:
            miner = TikTokEngagementMiner(
                min_support=min_support,
                min_confidence=min_confidence,
                min_lift=min_lift
            )
            
            # Mine engagement patterns with timeout protection
            logger.info(f"Starting pattern mining for {len(results)} videos...")
            mining_results = miner.mine_engagement_patterns(results)
            logger.info(f"Pattern mining completed successfully")
            
            # Update session with results
            sessions[session_id]["status"] = "completed"
            sessions[session_id]["message"] = f"Successfully scraped {len(results)} videos and mined engagement patterns"
            sessions[session_id]["data"] = results
            sessions[session_id]["videos_scraped"] = len(results)
            sessions[session_id]["miner"] = miner
            sessions[session_id]["mining_results"] = mining_results
            
            logger.info(f"Completed scraping and mining for session {session_id}: {len(results)} videos")
            
        except Exception as mining_error:
            logger.error(f"Error during mining for session {session_id}: {str(mining_error)}")
            # Still save the scraped data even if mining fails
            sessions[session_id]["status"] = "completed_with_mining_error"
            sessions[session_id]["message"] = f"Successfully scraped {len(results)} videos but mining failed: {str(mining_error)}"
            sessions[session_id]["data"] = results
            sessions[session_id]["videos_scraped"] = len(results)
            sessions[session_id]["miner"] = None
            sessions[session_id]["mining_results"] = None
        
    except Exception as e:
        logger.error(f"Error in scraping job for session {session_id}: {str(e)}")
        sessions[session_id]["status"] = "error"
        sessions[session_id]["message"] = f"Error occurred: {str(e)}"

@app.post("/generate-insights", response_model=InsightsResponse)
async def generate_insights(request: InsightsRequest):
    """
    Generate insights using Groq based on top N association rules for specified targets
    
    This endpoint analyzes the top N association rules from a completed session
    and uses Groq to generate strategic insights for content creators.
    """
    try:
        # Check if session exists
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[request.session_id]
        
        # Check if session is completed
        if session["status"] not in ["completed", "completed_with_mining_error"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Session status is '{session['status']}'. Can only analyze completed sessions."
            )
        
        # Check if data exists
        if not session.get("data"):
            raise HTTPException(status_code=400, detail="No data available for this session")
        
        # Check if miner exists
        if not session.get("miner"):
            raise HTTPException(status_code=400, detail="No mining results available for this session")
        
        data = session["data"]
        miner = session["miner"]
        
        logger.info(f"Generating insights for session {request.session_id} with {len(data)} videos")
        
        # Validate targets
        valid_targets = {
            "high_views", "high_likes", "high_shares", "high_comments",
            "viral", "high_engagement_rate", "highly_shareable"
        }
        
        invalid_targets = [t for t in request.targets if t not in valid_targets]
        if invalid_targets:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid targets: {invalid_targets}. Valid targets are: {list(valid_targets)}"
            )
        
        # Get rules for specified targets
        rules = miner.get_rules_for_targets(request.targets, top_n=request.n)
        
        if not rules:
            raise HTTPException(
                status_code=404,
                detail=f"No rules found for targets: {request.targets}"
            )
        
        # Format rules for the prompt
        rules_summary = []
        for i, rule in enumerate(rules, 1):
            rule_text = f"{i}. {rule['rule']}\n"
            rule_text += f"   Support: {rule['support']:.3f}, Confidence: {rule['confidence']:.3f}, Lift: {rule['lift']:.3f}"
            rules_summary.append(rule_text)
        
        rules_text = "\n".join(rules_summary)
        
        # Get Groq API key
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY environment variable is not set"
            )
        
        # Initialize Groq client and generate insights
        groq_client = Groq(api_key=groq_api_key)
        prompt = INSIGHTS_GENERATION_PROMPT.format(n=request.n, rules_summary=rules_text)
        
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.4,
        )
        
        insights = response.choices[0].message.content
        
        logger.info(f"Generated insights for session {request.session_id} using {len(rules)} rules")
        
        return InsightsResponse(
            session_id=request.session_id,
            targets=request.targets,
            insights=insights,
            rules_analyzed=len(rules),
            total_videos=len(data)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights for session {request.session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@app.post("/scrape-profiles", response_model=ProfileScrapeResponse)
async def scrape_profiles(request: ProfileScrapeRequest, background_tasks: BackgroundTasks):
    """
    Start a TikTok profile scraping job
    
    This endpoint starts a background scraping job and returns a session ID
    for tracking the progress and retrieving results.
    """
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get API token
        api_token = request.api_token or get_api_token()
        
        # Initialize session
        sessions[session_id] = {
            "status": "queued",
            "message": "Scraping job queued",
            "profile_names": request.profile_names,
            "created_at": datetime.now().isoformat(),
            "data": None,
            "videos_scraped": None,
            "miner": None,
            "mining_results": None
        }
        
        # Start background task
        background_tasks.add_task(
            scrape_profiles_background,
            session_id,
            request.profile_names,
            request.results_per_page,
            api_token,
            request.proxy_country_code,
            request.profile_sorting,
            request.min_support,
            request.min_confidence,
            request.min_lift
        )
        
        logger.info(f"Started scraping job {session_id} for profiles: {request.profile_names}")
        
        return ProfileScrapeResponse(
            session_id=session_id,
            status="queued",
            message=f"Scraping job started for {len(request.profile_names)} profiles"
        )
        
    except Exception as e:
        logger.error(f"Error starting scraping job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start scraping job: {str(e)}")

@app.post("/session/{session_id}/mine-patterns")
async def mine_patterns_for_session(
    session_id: str, 
    background_tasks: BackgroundTasks,
    min_support: float = 0.05,
    min_confidence: float = 0.5,
    min_lift: float = 1.2
):
    """
    Perform mining on an existing session that has data but no mining results
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if not session.get("data"):
        raise HTTPException(status_code=400, detail="No data available for this session")
    
    if session.get("miner"):
        raise HTTPException(status_code=400, detail="Mining already completed for this session")
    
    # Start mining in background
    background_tasks.add_task(
        mine_patterns_background,
        session_id,
        min_support,
        min_confidence,
        min_lift
    )
    
    # Update session status
    sessions[session_id]["status"] = "mining"
    sessions[session_id]["message"] = "Mining engagement patterns..."
    
    return {
        "session_id": session_id,
        "status": "mining",
        "message": "Started mining patterns for existing data"
    }

async def mine_patterns_background(
    session_id: str,
    min_support: float,
    min_confidence: float,
    min_lift: float
):
    """Background task for mining patterns on existing data"""
    try:
        logger.info(f"Starting mining job for session {session_id}")
        
        data = sessions[session_id]["data"]
        
        # Initialize engagement miner and mine patterns
        logger.info(f"Mining engagement patterns for session {session_id}")
        miner = TikTokEngagementMiner(
            min_support=min_support,
            min_confidence=min_confidence,
            min_lift=min_lift
        )
        
        # Mine engagement patterns
        mining_results = miner.mine_engagement_patterns(data)
        
        # Update session with mining results
        sessions[session_id]["status"] = "completed"
        sessions[session_id]["message"] = f"Successfully mined engagement patterns for {len(data)} videos"
        sessions[session_id]["miner"] = miner
        sessions[session_id]["mining_results"] = mining_results
        
        logger.info(f"Completed mining for session {session_id}: {len(data)} videos")
        
    except Exception as e:
        logger.error(f"Error in mining job for session {session_id}: {str(e)}")
        sessions[session_id]["status"] = "error"
        sessions[session_id]["message"] = f"Mining error: {str(e)}"

@app.get("/session/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """
    Get the status of a scraping session
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    return SessionStatusResponse(
        session_id=session_id,
        status=session["status"],
        message=session["message"],
        videos_scraped=session.get("videos_scraped"),
        created_at=session["created_at"]
    )

@app.post("/analyze-rules", response_model=RulesResponse)
async def analyze_rules(request: RulesRequest):
    """
    Analyze engagement patterns and get association rules for specified targets
    
    This endpoint uses the data from a completed scraping session to perform
    association rule mining and return patterns that lead to the specified
    engagement targets.
    """
    try:
        # Check if session exists
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[request.session_id]
        
        # Check if session is completed
        if session["status"] not in ["completed", "completed_with_mining_error"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Session status is '{session['status']}'. Can only analyze completed sessions."
            )
        
        # Check if data exists
        if not session.get("data"):
            raise HTTPException(status_code=400, detail="No data available for this session")
        
        # Check if miner exists
        if not session.get("miner"):
            if session["status"] == "completed_with_mining_error":
                # Try to re-mine with more conservative parameters
                logger.info(f"Re-attempting mining for session {request.session_id} with conservative parameters")
                data = session["data"]
                try:
                    miner = TikTokEngagementMiner(
                        min_support=max(0.1, 0.05),  # Use higher support for faster processing
                        min_confidence=0.5,
                        min_lift=1.2
                    )
                    mining_results = miner.mine_engagement_patterns(data)
                    # Update session with new miner
                    sessions[request.session_id]["miner"] = miner
                    sessions[request.session_id]["mining_results"] = mining_results
                    sessions[request.session_id]["status"] = "completed"
                    sessions[request.session_id]["message"] = f"Successfully scraped {len(data)} videos and mined engagement patterns (retry)"
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Mining failed again: {str(e)}")
            else:
                raise HTTPException(status_code=400, detail="No mining results available for this session")
        
        data = session["data"]
        miner = session["miner"]
        logger.info(f"Starting rule analysis for session {request.session_id} with {len(data)} videos")
        
        # Validate targets
        valid_targets = {
            "high_views", "high_likes", "high_shares", "high_comments",
            "viral", "high_engagement_rate", "highly_shareable"
        }
        
        invalid_targets = [t for t in request.targets if t not in valid_targets]
        if invalid_targets:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid targets: {invalid_targets}. Valid targets are: {list(valid_targets)}"
            )
        
        # Get rules for specified targets using the saved miner
        if len(request.targets) == 1:
            # Single target
            rules = miner.get_rules_for_targets(request.targets, top_n=request.top_n)
        else:
            # Multiple targets - get rules for the combination
            rules = miner.get_rules_for_targets(request.targets, top_n=request.top_n)
        
        # Convert rules to response format
        rule_responses = []
        for rule in rules:
            rule_responses.append(AssociationRule(
                rule=rule["rule"],
                antecedent=list(rule["antecedent"]),
                consequent=list(rule["consequent"]),
                support=rule["support"],
                confidence=rule["confidence"],
                lift=rule["lift"]
            ))
        
        logger.info(f"Found {len(rule_responses)} rules for session {request.session_id}")
        
        return RulesResponse(
            session_id=request.session_id,
            targets=request.targets,
            rules=rule_responses,
            total_videos=len(data),
            total_rules_found=len(rule_responses)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing rules for session {request.session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze rules: {str(e)}")

@app.get("/available-targets")
async def get_available_targets():
    """
    Get the list of available target variables for rule mining
    """
    targets = [
        {
            "name": "high_views",
            "description": "Videos with high view count (top 25%)"
        },
        {
            "name": "high_likes", 
            "description": "Videos with high like count (top 25%)"
        },
        {
            "name": "high_shares",
            "description": "Videos with high share count (top 25%)"
        },
        {
            "name": "high_comments",
            "description": "Videos with high comment count (top 25%)"
        },
        {
            "name": "viral",
            "description": "Viral content (top 10% in total engagement)"
        },
        {
            "name": "high_engagement_rate",
            "description": "High engagement rate (top 25%)"
        },
        {
            "name": "highly_shareable",
            "description": "Highly shareable content (high share-to-view ratio)"
        }
    ]
    
    return {"targets": targets}

@app.get("/sessions")
async def list_sessions():
    """
    List all scraping sessions
    """
    session_list = []
    for session_id, session_data in sessions.items():
        session_list.append({
            "session_id": session_id,
            "status": session_data["status"],
            "profile_names": session_data["profile_names"],
            "created_at": session_data["created_at"],
            "videos_scraped": session_data.get("videos_scraped")
        })
    
    return {"sessions": session_list}

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session and its data
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Remove session data
    del sessions[session_id]
    
    # Try to remove saved file
    try:
        file_path = f"tiktok_scraping_results/session_{session_id}_data.json"
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        logger.warning(f"Could not remove file for session {session_id}: {str(e)}")
    
    return {"message": f"Session {session_id} deleted successfully"}

@app.get("/")
async def root():
    """
    API root endpoint with basic information
    """
    return {
        "message": "TikTok Profile Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "POST /scrape-profiles": "Start a TikTok profile scraping job",
            "GET /session/{session_id}/status": "Get session status",
            "POST /session/{session_id}/mine-patterns": "Mine patterns for existing session data",
            "POST /analyze-rules": "Analyze engagement rules from scraped data",
            "POST /generate-insights": "Generate AI insights using Groq based on top N rules",
            "GET /available-targets": "Get available target variables",
            "GET /sessions": "List all sessions",
            "DELETE /session/{session_id}": "Delete a session"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
