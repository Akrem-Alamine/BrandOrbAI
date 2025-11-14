# ⚡ BrandOrbAI Pipeline - Quick Reference

A quick reference guide for developers working with the BrandOrbAI pipeline.

---

## 🚀 Quick Start Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd front
npm install
npm run dev
```

### Access
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
- Frontend: http://localhost:3000

---

## 📋 5-Stage Pipeline Overview

| Stage | Purpose | Key Components | Entry Endpoint |
|-------|---------|----------------|----------------|
| **1. Ideation** | Capture business idea | 5-Question AI Framework | `/ideation/init` |
| **2. Analysis** | Multi-dimensional analysis | 8 Specialized Agents | `/run-all` |
| **3. Brand Identity** | Visual brand creation | Logo, Colors, Flyer | `/brand-discovery/init` |
| **4. Content** | Marketing materials | Posts, Images, Website | `/social-media/generate-posts` |
| **5. Launch** | Deploy & automate | Scheduling, Publishing | `/social-media/schedule-posts` |

---

## 🎯 Stage 1: Ideation - Key Endpoints

```bash
# Initialize session
POST /ideation/init
{ "session_id": "abc123", "description": "My business idea" }

# Answer question
POST /ideation/answer
{ "session_id": "abc123", "question_index": 0, "response": "My answer" }

# Generate summary
POST /ideation/summary
{ "session_id": "abc123" }
```

---

## 📊 Stage 2: Business Analysis - Key Endpoints

```bash
# Run all agents at once
POST /run-all
{ "business_idea": "My validated business summary" }

# Individual analyses
POST /run-viability          # Viability assessment
POST /run-swot              # SWOT analysis
POST /bmc/run               # Business Model Canvas
POST /investors/analyze     # Investor matching

# Get results
GET /agent-output?agent=financial_assessment
GET /agent-output?agent=market_analysis_competitors
GET /viability-output
GET /swot-output
GET /bmc/output
```

---

## 🎨 Stage 3: Brand Identity - Key Endpoints

```bash
# Start brand discovery
POST /brand-discovery/init
{ "session_id": "brand123", "business_summary": "..." }

# Answer discovery questions
POST /brand-discovery/respond
{ "session_id": "brand123", "response": {...} }

# Complete brand identity
POST /brand-discovery/complete
{ "session_id": "brand123", "responses": {...} }

# Generate specific assets
POST /brand-identity/generate-logo
POST /brand-identity/generate-flyer
POST /brand-identity/comprehensive
```

---

## 📱 Stage 4: Content Generation - Key Endpoints

```bash
# Generate social media posts
POST /social-media/generate-posts
{
  "business_summary": "...",
  "marketing_insights": {...},
  "platform": "linkedin",  # or "all", "instagram", "tiktok"
  "count": 10,
  "brand_identity": {...}
}

# Generate website
POST /website-generator/generate
{
  "user_prompt": "Modern clean design",
  "style_preferences": "professional"
}

# Generate business image
POST /generate-image
{
  "business_idea": "...",
  "business_summary": "..."
}
```

---

## 🚀 Stage 5: Launch & Automation - Key Endpoints

```bash
# Schedule posts
POST /social-media/schedule-posts
{
  "posts": [...],
  "platform": "linkedin",
  "schedule_type": "optimal"
}

# Post immediately
POST /social-media/post-now
{
  "post_id": "post123",
  "platform": "linkedin",
  "immediate": true
}

# Publish website
POST /website-generator/publish
{ "version_id": "v1_abc123" }

# View scheduled posts
GET /social-media/upcoming-posts?platform=linkedin&limit=50
```

---

## 🔐 LinkedIn OAuth Setup

```bash
# 1. Get authorization URL
GET /linkedin/auth
# Returns: { "auth_url": "https://..." }

# 2. User authorizes (browser redirect)

# 3. Callback handled automatically
GET /social/linkedin/callback?code=...

# 4. Check status
GET /linkedin/status

# 5. Post content
POST /linkedin/post
{
  "content": "My post content",
  "image_data": "base64_image..."
}
```

---

## 🛠️ Common Agent Operations

### Financial Analysis
```python
from agents.Financial_Assessment import FinancialAssessmentAgent
agent = FinancialAssessmentAgent()
result = agent.summarize_business_idea(state)
```

### SWOT Analysis
```python
from agents.swot_agent import run_swot_agent
result = run_swot_agent(business_idea)
```

### Brand Identity
```python
from agents.brand_identity_agent import run_brand_identity_analysis
result = run_brand_identity_analysis(
    business_summary=summary,
    chatbot_data=data
)
```

### Social Media
```python
from agents.social_media_agent import SocialMediaAgent
agent = SocialMediaAgent()
posts = agent.generate_marketing_posts(
    business_summary=summary,
    marketing_insights=insights,
    platform="linkedin",
    count=5
)
```

---

## 📁 Key File Locations

### Output Files
```
backend/agents/output/
├── business_summary.txt           # Stage 1 output
├── assessment_output.txt          # Financial analysis
├── legal_output.txt               # Legal analysis
├── market_analysis_competitors_output.txt
├── swot_complete.json             # SWOT results
├── viability_assessment_output.json
├── bmc_output.txt                 # Business Model Canvas
├── investor_recommendations.json
├── scheduled_posts.json           # Scheduled content
└── images/                        # Generated images
```

### Generated Assets
```
backend/
├── generated_websites/
│   ├── published/
│   └── versions/
└── website_versions/
```

---

## 🔑 Environment Variables

```bash
# AI Models
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
TAVILY_API_KEY=...

# LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback

# Optional Social Media
FACEBOOK_ACCESS_TOKEN=...
INSTAGRAM_ACCESS_TOKEN=...
TIKTOK_API_KEY=...
```

---

## 🐛 Quick Troubleshooting

### Issue: LinkedIn OAuth not working
```bash
# Check credentials
GET /linkedin/status

# Verify .env file
cat backend/.env | grep LINKEDIN

# Re-authenticate
GET /linkedin/auth
```

### Issue: Agent execution fails
```bash
# Check logs
tail -f backend/api.log

# Verify API keys
echo $OPENAI_API_KEY
echo $GROQ_API_KEY
```

### Issue: Missing output files
```bash
# List output directory
ls -la backend/agents/output/

# Check if agents ran
GET /agent-output?agent=financial_assessment
```

### Issue: Image generation fails
```bash
# Test image endpoint
POST /generate-image
{
  "business_idea": "test",
  "business_summary": "test summary"
}

# Check Groq API key
echo $GROQ_API_KEY
```

---

## 📊 API Response Examples

### Successful Ideation
```json
{
  "success": true,
  "session_id": "abc123",
  "questions": [...],
  "summary": "Generated business summary..."
}
```

### Successful Analysis
```json
{
  "message": "done",
  "run_id": "run123",
  "data": {
    "financial_assessment": {...},
    "legal_analysis": {...},
    "market_analysis": {...}
  }
}
```

### Successful Post Generation
```json
{
  "posts": [
    {
      "id": "post123",
      "platform": "linkedin",
      "title": "Exciting Launch!",
      "content": "We're thrilled to announce...",
      "hashtags": ["#Business", "#Innovation"],
      "scheduled_time": "2025-11-15T09:00:00Z",
      "engagement_prediction": "high"
    }
  ]
}
```

---

## 🎯 Complete Workflow Example

```bash
# 1. IDEATION
curl -X POST http://localhost:8001/ideation/init \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","description":"Sustainable fashion"}'

# Answer 5 questions...
curl -X POST http://localhost:8001/ideation/answer \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","question_index":0,"response":"My answer"}'

curl -X POST http://localhost:8001/ideation/summary \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123"}'

# 2. ANALYSIS
curl -X POST http://localhost:8001/save-business-summary \
  -H "Content-Type: application/json" \
  -d '{"summary":"Business summary..."}'

curl -X POST http://localhost:8001/run-all \
  -H "Content-Type: application/json" \
  -d '{"business_idea":"Business summary..."}'

curl -X POST http://localhost:8001/run-viability
curl -X POST http://localhost:8001/run-swot
curl -X POST http://localhost:8001/bmc/run

# 3. BRAND IDENTITY
curl -X POST http://localhost:8001/brand-discovery/init \
  -H "Content-Type: application/json" \
  -d '{"session_id":"brand123","business_summary":"..."}'

# Answer brand questions...
curl -X POST http://localhost:8001/brand-discovery/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id":"brand123","responses":{...}}'

# 4. CONTENT GENERATION
curl -X POST http://localhost:8001/social-media/generate-posts \
  -H "Content-Type: application/json" \
  -d '{
    "business_summary":"...",
    "marketing_insights":{},
    "platform":"linkedin",
    "count":5,
    "brand_identity":{...}
  }'

# 5. LAUNCH
curl -X POST http://localhost:8001/social-media/schedule-posts \
  -H "Content-Type: application/json" \
  -d '{"posts":[...],"platform":"linkedin","schedule_type":"optimal"}'
```

---

## 📚 Documentation Links

- **[PIPELINE.md](./PIPELINE.md)** - Complete pipeline documentation
- **[PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md)** - Architecture diagrams
- **[README.md](./README.md)** - Project overview
- **API Documentation** - http://localhost:8001/docs (when server running)

---

## 🏆 Key Features Summary

✅ 5-stage AI-powered brand development pipeline  
✅ Multi-agent business analysis system  
✅ Automated brand identity generation  
✅ Social media content creation & scheduling  
✅ Website generation with version control  
✅ LinkedIn OAuth integration  
✅ Smart scheduling with engagement optimization  
✅ Comprehensive documentation & API  

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0  
**Part of**: BrandOrbAI Platform
