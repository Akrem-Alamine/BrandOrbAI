# 🚀 BrandOrbAI Pipeline Documentation

## Overview

BrandOrbAI is an end-to-end AI-powered platform that guides users through the complete journey of designing and launching a new brand. This document outlines the comprehensive pipeline architecture, workflows, and technical implementation.

---

## 📊 Pipeline Architecture

The BrandOrbAI pipeline consists of **5 main stages**, each powered by specialized AI agents and orchestrators:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BrandOrbAI Pipeline                           │
└─────────────────────────────────────────────────────────────────────┘

Stage 1: IDEATION
    ↓
Stage 2: BUSINESS ANALYSIS
    ↓
Stage 3: BRAND IDENTITY CREATION
    ↓
Stage 4: CONTENT GENERATION
    ↓
Stage 5: LAUNCH & AUTOMATION
```

---

## 🎯 Stage 1: Ideation

### Purpose
Capture and validate the initial business idea through an AI-guided questionnaire.

### Workflow
```
User Input → 5-Question Framework → AI Summarization → Concept Validation
```

### Components

#### 1.1 Question Generation
- **Agent**: `ideation_agents.py`
- **Function**: `generate_next_question()`
- **Input**: User's initial business description
- **Output**: Context-aware questions

#### 1.2 Answer Processing
- **Agent**: `ideation_agents.py`
- **Function**: `generate_answer()` & `check_if_satisfactory()`
- **Features**:
  - Keyword extraction
  - Answer validation
  - Suggestion generation

#### 1.3 Summary Generation
- **Agent**: `ideation_agents.py`
- **Function**: `generate_summary()`
- **Output**: Comprehensive business summary

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ideation/init` | POST | Initialize ideation session |
| `/ideation/answer` | POST | Submit answer to question |
| `/ideation/keywords` | POST | Generate keywords for suggestions |
| `/ideation/suggest-answer` | POST | Get AI-suggested answer |
| `/ideation/summary` | POST | Generate final summary |
| `/ideation/reset` | POST | Reset specific question |

### Data Flow
```json
{
  "session_id": "unique_session_id",
  "description": "Initial business idea",
  "questions": [
    {
      "question": "What problem does your business solve?",
      "response": "User's answer",
      "keywords": ["keyword1", "keyword2"],
      "satisfaction": "yes"
    }
  ],
  "summary": "AI-generated business summary"
}
```

---

## 📈 Stage 2: Business Analysis Suite

### Purpose
Comprehensive analysis of the business idea across multiple dimensions.

### Workflow
```
Business Summary → Multi-Agent Analysis → Consolidated Reports
```

### Components

#### 2.1 Financial Assessment
- **Agent**: `Financial_Assessment.py`
- **Function**: `FinancialAssessmentAgent.summarize_business_idea()`
- **Analysis**:
  - Revenue projections
  - Cost structure
  - Break-even analysis
  - Financial viability

#### 2.2 Market Analysis
- **Agent**: `marketAnalysis_competitors_Agents.py`
- **Function**: `run_market_analysis_competitors()`
- **Analysis**:
  - Market size and trends
  - Target audience
  - Competitive landscape
  - Market positioning

#### 2.3 Legal Analysis
- **Agent**: `legal_agent.py`
- **Function**: `LegalAgent.run()`
- **Analysis**:
  - Business structure recommendations
  - Legal requirements
  - Compliance considerations
  - Intellectual property

#### 2.4 SWOT Analysis
- **Agent**: `swot_agent.py`
- **Function**: `run_swot_agent()`
- **Analysis**:
  - Strengths
  - Weaknesses
  - Opportunities
  - Threats

#### 2.5 Viability Assessment
- **Agent**: `viability_agent.py`
- **Function**: `run_viability_assessment()`
- **Output**: Overall business viability score and recommendations

#### 2.6 Business Model Canvas (BMC)
- **Agent**: `bmc_agent.py`
- **Function**: `extract_bmc_parts()`
- **Components**:
  - Key Partners
  - Key Activities
  - Key Resources
  - Value Propositions
  - Customer Relationships
  - Channels
  - Customer Segments
  - Cost Structure
  - Revenue Streams

#### 2.7 Investor Analysis
- **Agent**: `investor_agent.py`
- **Function**: `analyze_business_for_investors()`
- **Output**: Matched investors and readiness score

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/run-all` | POST | Run all agents simultaneously |
| `/agent-output` | GET | Get specific agent output |
| `/save-business-summary` | POST | Save business summary |
| `/run-viability` | POST | Run viability assessment |
| `/viability-output` | GET | Get viability results |
| `/run-swot` | POST | Run SWOT analysis |
| `/swot-output` | GET | Get SWOT results |
| `/bmc/run` | POST | Generate BMC |
| `/bmc/output` | GET | Get BMC output |
| `/investors/analyze` | POST | Analyze for investors |
| `/investors/recommendations` | GET | Get investor matches |

### Multi-Agent Orchestration

```python
class MultiAgentState:
    business_idea: str
    financial_assessment: dict
    legal_analysis: dict
    partners_suppliers_investors: dict
    market_analysis: dict
    competitor_analysis: dict
    background_image: dict
```

### Data Flow
```
Input: Business Summary
    ↓
Parallel Execution:
├── Financial Agent
├── Legal Agent
├── Market Analysis Agent
├── Opportunities Agent
└── Image Generation Agent
    ↓
Aggregation & Storage
    ↓
Output: Comprehensive Business Analysis
```

---

## 🎨 Stage 3: Brand Identity Creation

### Purpose
Create complete brand identity including visual elements and brand personality.

### Workflow
```
Business Analysis → Brand Discovery → Identity Generation → Asset Creation
```

### Components

#### 3.1 Brand Discovery
- **Agent**: `brand_discovery_agent.py`
- **Function**: `BrandDiscoveryAgent`
- **Process**:
  - Interactive questionnaire
  - Brand values exploration
  - Target audience definition
  - Brand personality assessment
  - Visual preferences

#### 3.2 Brand Identity Orchestrator
- **Orchestrator**: `identity_orchestrator.py`
- **Function**: `IdentityOrchestrator`
- **Coordinates**:
  - Logo generation
  - Color palette creation
  - Flyer design
  - Brand book compilation

#### 3.3 Logo Generation
- **Agent**: `identity/logo_agent.py`
- **Features**:
  - Multiple logo concepts
  - AI-powered design
  - Color integration
  - Brand-consistent styling

#### 3.4 Color Palette
- **Agent**: `brand_identity_agent.py`
- **Function**: `generate_color_palettes()`
- **Output**: Brand-consistent color schemes

#### 3.5 Flyer Generation
- **Agent**: `identity/flyer_agent.py`
- **Features**:
  - Professional flyer designs
  - Brand-consistent layouts
  - Multiple templates

#### 3.6 Vectorization Service
- **API**: `identity/vectorization_api.py`
- **Features**:
  - Logo vectorization
  - AI-powered enhancement
  - Multiple format support

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/brand-discovery/init` | POST | Initialize discovery session |
| `/brand-discovery/respond` | POST | Submit discovery response |
| `/brand-discovery/suggestions/{session_id}` | GET | Get suggestions |
| `/brand-discovery/complete` | POST | Complete discovery |
| `/brand-identity/comprehensive` | POST | Generate complete identity |
| `/brand-identity/logo` | POST | Generate logo only |
| `/brand-identity/colors` | POST | Generate color palette |
| `/brand-identity/flyer` | POST | Generate flyer only |
| `/brand-identity/generate-logo` | POST | Via orchestrator |
| `/brand-identity/generate-flyer` | POST | Via orchestrator |
| `/brand-identity/services-status` | GET | Check service availability |
| `/vectorize/upload` | POST | Upload logo for vectorization |
| `/vectorize/status/{job_id}` | GET | Check vectorization status |
| `/vectorize/download/{job_id}` | GET | Download vectorized logo |

### Brand Discovery Session Structure

```json
{
  "session_id": "discovery_session_id",
  "business_summary": "Business context",
  "questions": [
    {
      "id": "brand_name",
      "question": "What is your brand name?",
      "type": "text",
      "response": "User's answer"
    },
    {
      "id": "brand_values",
      "question": "What are your core brand values?",
      "type": "multiple_choice",
      "options": ["Innovation", "Trust", "Quality"],
      "response": ["Innovation", "Trust"]
    }
  ],
  "progress": 75,
  "completed": false
}
```

### Brand Identity Output

```json
{
  "brand_identity": {
    "name": "Brand Name",
    "tagline": "Brand Tagline",
    "mission": "Mission statement",
    "vision": "Vision statement",
    "values": ["Value1", "Value2"],
    "personality": "Brand personality description",
    "voice": "Brand voice description",
    "colors": {
      "primary": "#2563EB",
      "secondary": "#7C3AED",
      "accent": "#059669",
      "palettes": [...]
    },
    "logos": {
      "concepts": [...],
      "selected_logo": {...},
      "variations": [...]
    },
    "typography": {
      "primary_font": "Font name",
      "secondary_font": "Font name"
    },
    "visual_style": {
      "style": "Modern",
      "mood": "Professional"
    },
    "flyers": [...],
    "brand_book_url": "url_to_brand_book"
  }
}
```

---

## 📱 Stage 4: Content Generation & Marketing

### Purpose
Generate marketing content and manage social media presence.

### Workflow
```
Brand Identity → Content Generation → Platform Distribution → Scheduling
```

### Components

#### 4.1 Social Media Content Generation
- **Agent**: `social_media_agent.py`
- **Function**: `SocialMediaAgent.generate_marketing_posts()`
- **Platforms**:
  - LinkedIn
  - Facebook
  - Instagram
  - TikTok
  - X (Twitter)

#### 4.2 Platform-Specific Agents

##### LinkedIn Agent
- **Agent**: `linkedin_agent.py`
- **Features**:
  - OAuth authentication
  - Post creation with images
  - Profile integration
  - Analytics access

##### TikTok Insights
- **Agent**: `tiktok_insights_agent.py`
- **Features**:
  - Trend analysis
  - Engagement patterns
  - Optimal posting times

#### 4.3 Content Templates
- Post variations per platform
- Hashtag generation
- Call-to-action optimization
- Image generation

#### 4.4 Image Generation
- **Agent**: `image_agent.py`
- **Function**: `run_image_generation_agent()`
- **Features**:
  - Brand-consistent images
  - Platform-optimized dimensions
  - AI-powered generation via Groq + Pollinations

#### 4.5 Smart Scheduling
- **Function**: `generate_smart_scheduling()`
- **Features**:
  - Marketing strategy insights
  - Engagement optimization
  - Time zone consideration
  - Platform-specific timing

#### 4.6 Website Generation
- **Agent**: `website_generator_agent.py`
- **Features**:
  - Complete landing page
  - Business data integration
  - Responsive design
  - Version management

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/social-media/generate-posts` | POST | Generate posts for platform |
| `/social-media/schedule-posts` | POST | Schedule posts |
| `/social-media/post-now` | POST | Post immediately |
| `/social-media/upcoming-posts` | GET | Get scheduled posts |
| `/social-media/post/{post_id}/cancel` | DELETE | Cancel scheduled post |
| `/social-media/post/{post_id}/reschedule` | PUT | Reschedule post |
| `/social-media/post/{post_id}/regenerate-media` | PUT | Regenerate image |
| `/social-media/post/{post_id}/regenerate-content` | PUT | Regenerate text |
| `/social-media/platforms/status` | GET | Get platform status |
| `/social-media/platforms/{platform}/configure` | POST | Configure platform |
| `/social-media/platforms/{platform}/help` | GET | Get setup help |
| `/social-media/load-business-data` | GET | Load business context |
| `/linkedin/auth` | GET | LinkedIn OAuth URL |
| `/social/linkedin/callback` | GET | OAuth callback |
| `/linkedin/status` | GET | Check LinkedIn status |
| `/linkedin/post` | POST | Post to LinkedIn |
| `/website-generator/generate` | POST | Generate website |
| `/website-generator/regenerate` | POST | Regenerate with feedback |
| `/website-generator/versions/{website_id}` | GET | Get versions |
| `/website-generator/publish` | POST | Publish website |
| `/company-profile/{website_id}` | GET | Serve published site |

### Content Generation Flow

```
Input: {
  business_summary: "Business description",
  marketing_insights: {...},
  platform: "linkedin",
  count: 5,
  brand_identity: {...}
}
    ↓
AI Content Generation
    ↓
Image Generation (Parallel)
    ↓
Smart Scheduling
    ↓
Output: {
  posts: [...],
  scheduled_posts: [...],
  generated_images: {...}
}
```

### Scheduling Strategy

```python
# Marketing Strategy Integration
strategy_data = load_marketing_strategy_data()
engagement_heatmap = strategy_data['engagement_heatmap']

# Platform-specific optimal times
platform_schedules = {
    'linkedin': [(9, 0), (13, 0), (17, 0)],  # Business hours
    'instagram': [(11, 0), (14, 0), (20, 0)],  # Visual engagement
    'tiktok': [(12, 0), (16, 0), (21, 0)],     # Peak video times
    'x': [(8, 0), (12, 0), (18, 0)]            # News cycles
}

# Engagement prediction
engagement_level = "high" if score > 0.8 else "medium" if score > 0.6 else "low"
```

### Post Structure

```json
{
  "id": "post_id",
  "platform": "linkedin",
  "title": "Post title",
  "content": "Post content with hashtags",
  "hashtags": ["#tag1", "#tag2"],
  "image_url": "generated_image_url",
  "scheduled_time": "2025-11-15T09:00:00Z",
  "optimal_time": "9:00 AM",
  "status": "scheduled",
  "engagement_prediction": "high",
  "call_to_action": "Visit our website",
  "has_media": true,
  "content_type": "image",
  "suggested_date": "November 15, 2025",
  "suggested_time": "09:00 AM",
  "optimal_reason": "High engagement time for LinkedIn"
}
```

---

## 🚀 Stage 5: Launch & Automation

### Purpose
Deploy content across platforms with automated scheduling and monitoring.

### Workflow
```
Scheduled Posts → Platform APIs → Automated Posting → Analytics → Optimization
```

### Components

#### 5.1 Post Management
- **Storage**: `scheduled_posts.json`
- **Features**:
  - Persistent storage
  - Post versioning
  - Status tracking
  - Cleanup automation

#### 5.2 Platform Integration

##### LinkedIn Integration
```python
# OAuth Flow
1. Get auth URL: /linkedin/auth
2. User authorizes
3. Callback: /social/linkedin/callback
4. Store access token
5. Post: /linkedin/post
```

##### Multi-Platform Support
- Configuration management
- Credential storage
- API rate limiting
- Error handling

#### 5.3 Automation Features
- Scheduled posting
- Retry mechanism
- Status monitoring
- Analytics tracking

#### 5.4 Website Deployment
- Version control
- Publishing workflow
- Custom URLs
- SEO optimization

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/social-media/storage-status` | GET | Check storage system |
| `/generate-image` | POST | Generate business image |
| `/image-output` | GET | Get generated image |
| `/images/{filename}` | GET | Serve image file |

### Deployment Flow

```
Scheduled Posts Storage
    ↓
Cleanup Past Posts
    ↓
Load Active Posts
    ↓
For Each Platform:
    ├── Check Configuration
    ├── Validate Credentials
    ├── Post Content
    └── Track Status
    ↓
Update Post Status
    ↓
Store Results
```

### Storage Structure

```json
{
  "scheduled_posts": [
    {
      "id": "post_id",
      "platform": "linkedin",
      "title": "Post title",
      "content": "Post content",
      "scheduled_time": "2025-11-15T09:00:00Z",
      "status": "scheduled",
      "created_at": "2025-11-14T10:00:00Z"
    }
  ],
  "last_updated": "2025-11-14T17:40:00Z",
  "total_posts": 25
}
```

---

## 🛠️ Technical Stack

### Backend Architecture

#### Core Framework
- **FastAPI**: High-performance API framework
- **Python 3.10+**: Core backend logic
- **Uvicorn**: ASGI server

#### AI & Machine Learning
- **LangChain**: AI application framework
- **LangGraph**: Workflow orchestration
- **OpenAI**: GPT models
- **Google Generative AI**: Gemini models
- **Groq**: Fast inference
- **Tavily**: Web search

#### Image Processing
- **Pillow**: Image manipulation
- **OpenCV**: Computer vision
- **rembg**: Background removal
- **scikit-image**: Image processing
- **ONNX Runtime**: Model inference

#### Data & Storage
- **JSON**: Data persistence
- **Pydantic**: Data validation
- **aiofiles**: Async file I/O

#### Social Media APIs
- **LinkedIn API**: OAuth & posting
- **Apify Client**: TikTok scraping
- **httpx**: HTTP client

### Frontend Architecture

#### Core Framework
- **Next.js 15.4**: React framework
- **React 19.1**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS 4**: Styling

#### UI Components
- **Radix UI**: Accessible components
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **Recharts**: Data visualization

#### State Management
- **React Hooks**: Local state
- **Next.js App Router**: Navigation

#### Additional Features
- **react-markdown**: Content rendering
- **Leaflet**: Maps integration
- **Lottie**: Animations
- **next-themes**: Dark mode

---

## 🔄 Agent Orchestration

### Multi-Agent System

```python
class BrandOrchestrator:
    """
    Central orchestrator for brand development workflow
    """
    
    def __init__(self):
        self.financial_agent = FinancialAssessmentAgent()
        self.legal_agent = LegalAgent()
        self.market_agent = MarketAnalysisAgent()
        self.swot_agent = SWOTAgent()
        self.brand_identity_agent = BrandIdentityAgent()
        self.social_media_agent = SocialMediaAgent()
        self.website_agent = WebsiteGeneratorAgent()
    
    def run_complete_workflow(self, business_idea: str):
        """Execute complete brand development pipeline"""
        
        # Stage 1: Ideation
        summary = self.generate_summary(business_idea)
        
        # Stage 2: Analysis
        analysis = self.run_business_analysis(summary)
        
        # Stage 3: Brand Identity
        brand_identity = self.create_brand_identity(analysis)
        
        # Stage 4: Content Generation
        content = self.generate_content(brand_identity)
        
        # Stage 5: Launch
        deployment = self.deploy_content(content)
        
        return {
            "summary": summary,
            "analysis": analysis,
            "brand_identity": brand_identity,
            "content": content,
            "deployment": deployment
        }
```

### Identity Orchestrator

```python
class IdentityOrchestrator:
    """
    Orchestrates brand identity creation
    """
    
    def __init__(self):
        self.logo_agent = LogoAgent()
        self.flyer_agent = FlyerAgent()
        self.color_agent = ColorAgent()
        self.typography_agent = TypographyAgent()
    
    def create_comprehensive_identity(self, brand_brief: dict):
        """Generate complete brand identity package"""
        
        # Parallel execution
        logo_result = self.logo_agent.generate_logo(brand_brief)
        colors = self.color_agent.generate_palette(brand_brief)
        flyer = self.flyer_agent.generate_flyer(brand_brief)
        typography = self.typography_agent.select_fonts(brand_brief)
        
        return {
            "logo": logo_result,
            "colors": colors,
            "flyer": flyer,
            "typography": typography,
            "brand_book": self.compile_brand_book(...)
        }
```

---

## 📋 Complete Workflow Example

### End-to-End Pipeline Execution

```python
# 1. IDEATION
POST /ideation/init
{
  "session_id": "session_123",
  "description": "A sustainable fashion brand for millennials"
}

# Answer 5 questions...
POST /ideation/answer (x5)

POST /ideation/summary
→ Business Summary Generated

# 2. BUSINESS ANALYSIS
POST /save-business-summary
{
  "summary": "Generated business summary..."
}

POST /run-all
→ All agents execute in parallel

GET /agent-output?agent=financial_assessment
GET /agent-output?agent=market_analysis_competitors
GET /agent-output?agent=legal_analysis

POST /run-viability
POST /run-swot
POST /bmc/run
POST /investors/analyze

# 3. BRAND IDENTITY
POST /brand-discovery/init
{
  "session_id": "discovery_123",
  "business_summary": "..."
}

# Interactive brand discovery...
POST /brand-discovery/respond (multiple)

POST /brand-discovery/complete
→ Brand Identity Package Created

# 4. CONTENT GENERATION
POST /social-media/generate-posts
{
  "business_summary": "...",
  "marketing_insights": {...},
  "platform": "linkedin",
  "count": 10,
  "brand_identity": {...}
}

POST /website-generator/generate
{
  "user_prompt": "Modern, clean design",
  "style_preferences": "professional"
}

# 5. LAUNCH
POST /social-media/schedule-posts
{
  "posts": [...],
  "platform": "linkedin",
  "schedule_type": "optimal"
}

POST /social-media/post-now
{
  "post_id": "post_123",
  "platform": "linkedin",
  "immediate": true
}

POST /website-generator/publish
{
  "version_id": "v1_website_123"
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────┐
│   User Input    │
│  (Business Idea)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IDEATION      │
│   - Questions   │
│   - Validation  │
│   - Summary     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      MULTI-AGENT ANALYSIS               │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │Financial │  │  Legal   │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  Market  │  │   SWOT   │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │Viability │  │   BMC    │            │
│  └──────────┘  └──────────┘            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      BRAND IDENTITY CREATION            │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │   Logo   │  │  Colors  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  Flyer   │  │Typography│            │
│  └──────────┘  └──────────┘            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      CONTENT GENERATION                 │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │  Posts   │  │  Images  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ Schedule │  │ Website  │            │
│  └──────────┘  └──────────┘            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      LAUNCH & DEPLOYMENT                │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │LinkedIn  │  │Instagram │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │ TikTok   │  │ Website  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

---

## 🔐 Security & Authentication

### API Security
- CORS middleware
- Environment variable management
- OAuth 2.0 for LinkedIn
- Token validation
- Rate limiting

### Data Protection
- Sensitive data encryption
- Secure storage
- Access control
- Audit logging

---

## 📝 Environment Configuration

### Required Environment Variables

```bash
# AI Models
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback

# Other Social Media APIs (optional)
FACEBOOK_ACCESS_TOKEN=your_token
INSTAGRAM_ACCESS_TOKEN=your_token
TIKTOK_API_KEY=your_key
```

---

## 🚀 Getting Started

### Prerequisites
```bash
# Python 3.10+
python --version

# Node.js 18+
node --version
```

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
cd front

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm run start
```

### Access Points
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Frontend**: http://localhost:3000

---

## 📊 Monitoring & Analytics

### Logging
- Request/response logging
- Agent execution tracking
- Error monitoring
- Performance metrics

### Storage
- Session data
- Analysis results
- Generated assets
- Scheduled posts
- Website versions

### File Structure
```
backend/
├── agents/
│   └── output/
│       ├── business_summary.txt
│       ├── assessment_output.txt
│       ├── market_analysis_competitors_output.txt
│       ├── legal_output.txt
│       ├── opportunities_output.txt
│       ├── swot_complete.json
│       ├── viability_assessment_output.json
│       ├── bmc_output.txt
│       ├── investor_recommendations.json
│       ├── scheduled_posts.json
│       └── images/
├── generated_websites/
│   ├── published/
│   └── versions/
└── website_versions/
```

---

## 🎓 Best Practices

### Development
1. Use environment variables for secrets
2. Follow REST API conventions
3. Implement proper error handling
4. Write comprehensive tests
5. Document API changes

### Deployment
1. Use production-ready servers (e.g., Gunicorn)
2. Implement SSL/TLS
3. Set up monitoring
4. Configure backups
5. Use CDN for static assets

### Scaling
1. Implement caching
2. Use async processing
3. Optimize database queries
4. Load balance API calls
5. Monitor rate limits

---

## 🐛 Troubleshooting

### Common Issues

#### 1. LinkedIn OAuth Not Working
```bash
# Check credentials
GET /linkedin/status

# Verify environment variables
echo $LINKEDIN_CLIENT_ID
echo $LINKEDIN_CLIENT_SECRET

# Re-authenticate
GET /linkedin/auth
```

#### 2. Image Generation Failing
```bash
# Check API keys
echo $GROQ_API_KEY

# Test image endpoint
POST /generate-image
```

#### 3. Agent Execution Errors
```bash
# Check logs
tail -f api.log

# Verify output files exist
ls -la backend/agents/output/
```

---

## 📚 Additional Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [LinkedIn API Documentation](https://docs.microsoft.com/linkedin/)

### Code Organization
- `backend/agents/`: All AI agents
- `backend/main.py`: Main API server
- `front/src/`: Frontend application
- `PIPELINE.md`: This document

---

## 🎉 Conclusion

The BrandOrbAI pipeline provides a comprehensive, AI-powered solution for brand development from ideation to launch. By leveraging specialized agents, intelligent orchestration, and multi-platform integration, the system enables users to create professional brands efficiently and effectively.

For questions or support, please refer to the main README.md or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: November 14, 2025  
**Developed for**: Talan Summer Camp 2025 🏆
