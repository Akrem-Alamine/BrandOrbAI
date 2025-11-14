# BrandOrbAI Pipeline Documentation

## Table of Contents
1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Stage 1: Ideation](#stage-1-ideation)
4. [Stage 2: Business Analysis](#stage-2-business-analysis)
5. [Stage 3: Brand Identity Creation](#stage-3-brand-identity-creation)
6. [Stage 4: Content Generation & Marketing](#stage-4-content-generation--marketing)
7. [Stage 5: Website Generation](#stage-5-website-generation)
8. [Stage 6: Launch & Automation](#stage-6-launch--automation)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Agents Overview](#agents-overview)

---

## Overview

BrandOrbAI is an end-to-end AI-powered platform that guides users through the complete journey of designing and launching a new brand. The pipeline consists of 6 major stages, each powered by specialized AI agents that work together to create a comprehensive brand development solution.

### Pipeline Flow
```
Ideation → Business Analysis → Brand Identity → Content Generation → Website Creation → Launch
```

Each stage builds upon the previous one, creating a cohesive brand development journey from initial idea to market launch.

---

## Pipeline Architecture

The BrandOrbAI pipeline is orchestrated through a FastAPI backend (`main.py`) that coordinates multiple specialized AI agents. The architecture follows a modular design where each stage can be executed independently or as part of the complete workflow.

### Key Components
- **FastAPI Backend**: Central orchestration layer (`backend/main.py`)
- **AI Agents**: Specialized agents for different tasks (`backend/agents/`)
- **State Management**: In-memory and file-based state storage
- **API Layer**: RESTful endpoints for frontend integration

---

## Stage 1: Ideation

### Purpose
Capture and refine the user's business idea through an interactive AI-driven questionnaire.

### Process Flow
1. **Session Initialization** - Create a new ideation session
2. **Question Generation** - AI generates contextual questions based on responses
3. **Answer Collection** - User provides answers with AI suggestions available
4. **Idea Refinement** - Iterative refinement until idea is satisfactory
5. **Summary Generation** - AI creates comprehensive business summary

### Key Agents
- **Ideation Agent** (`ideation_agents.py`)
  - Generates dynamic questions
  - Provides keyword suggestions
  - Creates business summaries
  - Validates idea completeness

### API Endpoints

#### Initialize Ideation Session
```http
POST /ideation/init
```
**Request Body:**
```json
{
  "session_id": "unique-session-id",
  "description": "Initial business idea description"
}
```

**Response:**
```json
{
  "session_id": "unique-session-id",
  "description": "Initial business idea",
  "questions": [
    {
      "index": 0,
      "question": "What problem does your business solve?",
      "response": null
    }
  ],
  "summary": null
}
```

#### Submit Answer
```http
POST /ideation/answer
```
**Request Body:**
```json
{
  "session_id": "unique-session-id",
  "question_index": 0,
  "response": "User's answer to the question"
}
```

#### Get Keyword Suggestions
```http
POST /ideation/keywords
```
**Request Body:**
```json
{
  "session_id": "unique-session-id",
  "question_index": 0
}
```

#### Generate Summary
```http
POST /ideation/summary
```
**Request Body:**
```json
{
  "session_id": "unique-session-id"
}
```

### Output
- **Business Summary**: Comprehensive text document saved to `agents/output/business_summary.txt`
- **Structured Data**: Session state with all Q&A pairs

---

## Stage 2: Business Analysis

### Purpose
Conduct comprehensive business analysis including financial assessment, legal considerations, market research, and competitive analysis.

### Process Flow
1. **Multi-Agent Execution** - Run all analysis agents in parallel
2. **Financial Assessment** - Revenue projections and cost analysis
3. **Legal Analysis** - Compliance and regulatory requirements
4. **Market Analysis** - Market size, trends, and opportunities
5. **Competitor Analysis** - Competitive landscape evaluation
6. **SWOT Analysis** - Strengths, Weaknesses, Opportunities, Threats
7. **Viability Assessment** - Overall business viability score
8. **BMC Generation** - Business Model Canvas creation

### Key Agents

#### Financial Assessment Agent
- **File**: `Financial_Assessment.py`
- **Purpose**: Financial projections and cost analysis
- **Output**: `agents/output/assessment_output.txt`

#### Legal Agent
- **File**: `legal_agent.py`
- **Purpose**: Legal compliance and regulatory analysis
- **Output**: `agents/output/legal_output.txt`

#### Market Analysis & Competitors Agent
- **File**: `marketAnalysis_competitors_Agents.py`
- **Purpose**: Market research and competitor analysis
- **Output**: `agents/output/market_analysis_competitors_output.txt`

#### Opportunities Agent
- **File**: `opportunities_agent.py`
- **Purpose**: Partners, suppliers, and investor identification
- **Output**: `agents/output/opportunities_output.txt`

#### SWOT Agent
- **File**: `swot_agent.py`
- **Purpose**: SWOT analysis generation
- **Output**: `agents/output/swot_complete.json`

#### Viability Agent
- **File**: `viability_agent.py`
- **Purpose**: Business viability assessment
- **Output**: `agents/output/viability_assessment_output.json`

#### BMC Agent
- **File**: `bmc_agent.py`
- **Purpose**: Business Model Canvas extraction
- **Output**: `agents/output/bmc_output.txt`

### API Endpoints

#### Run All Business Analysis Agents
```http
POST /run-all
```
**Request Body:**
```json
{
  "business_idea": "Business summary from ideation stage"
}
```

**Response:**
```json
{
  "message": "done",
  "run_id": "unique-run-id",
  "data": {
    "business_idea": "...",
    "financial_assessment": "...",
    "legal_analysis": "...",
    "market_analysis": "...",
    "competitor_analysis": "..."
  }
}
```

#### Save Business Summary
```http
POST /save-business-summary
```

#### Run SWOT Analysis
```http
POST /run-swot
```

#### Run Viability Assessment
```http
POST /run-viability
```

#### Run BMC Extraction
```http
POST /bmc/run
```

#### Get Agent Output
```http
GET /agent-output?agent={agent_name}
```
**Parameters:**
- `agent`: One of `market_analysis_competitors`, `financial_assessment`, `legal_analysis`, `opportunities`, `business_summary`

### Output Files
- `agents/output/business_summary.txt`
- `agents/output/assessment_output.txt`
- `agents/output/legal_output.txt`
- `agents/output/market_analysis_competitors_output.txt`
- `agents/output/opportunities_output.txt`
- `agents/output/swot_complete.json`
- `agents/output/viability_assessment_output.json`
- `agents/output/bmc_output.txt`

---

## Stage 3: Brand Identity Creation

### Purpose
Create comprehensive brand identity including logo, colors, typography, brand voice, and visual system.

### Process Flow
1. **Brand Discovery** - Interactive questionnaire for brand preferences
2. **Brand Strategy** - Define mission, vision, values, positioning
3. **Visual Identity** - Color palettes, logo concepts, typography
4. **Brand Voice** - Tone, messaging, personality definition
5. **Brand Book** - Comprehensive brand guidelines
6. **Asset Generation** - Logo files, business cards, templates

### Orchestration
The brand identity creation is orchestrated by two main components:

#### Brand Discovery Agent
- **File**: `brand_discovery_agent.py`
- **Purpose**: Interactive discovery session
- **Process**: Guides user through brand preference questions

#### Brand Orchestrator
- **File**: `brand_orchestrator.py`
- **Purpose**: Coordinates all brand creation activities
- **Process**: 
  1. Consolidates discovery data with business analysis
  2. Generates brand strategy
  3. Creates visual identity system
  4. Defines brand voice and messaging
  5. Compiles comprehensive brand book
  6. Generates brand assets

#### Identity Orchestrator
- **File**: `identity_orchestrator.py`
- **Purpose**: Manages specialized identity services
- **Services**:
  - Logo generation
  - Flyer creation
  - Color palette generation
  - Comprehensive brand identity

### API Endpoints

#### Initialize Brand Discovery
```http
POST /brand-discovery/init
```
**Request Body:**
```json
{
  "session_id": "brand-session-id",
  "business_summary": "Business summary from previous stages"
}
```

#### Submit Discovery Response
```http
POST /brand-discovery/respond
```
**Request Body:**
```json
{
  "session_id": "brand-session-id",
  "response": "User's response to current question"
}
```

#### Complete Brand Discovery & Generate Identity
```http
POST /brand-discovery/complete
```
**Request Body:**
```json
{
  "session_id": "brand-session-id",
  "responses": {
    "business_information": {...},
    "target_audience": {...},
    "brand_personality": {...},
    "visual_preferences": {...}
  },
  "include_existing_data": true
}
```

**Response:**
```json
{
  "success": true,
  "analysis_id": "discovery_session_timestamp",
  "brand_identity": {
    "brand_strategy": {...},
    "visual_identity": {...},
    "brand_voice": {...},
    "brand_book": {...},
    "brand_assets": {...}
  }
}
```

#### Generate Comprehensive Brand Identity
```http
POST /brand-identity/comprehensive
```

#### Generate Logo
```http
POST /brand-identity/generate-logo
```

#### Generate Flyer
```http
POST /brand-identity/generate-flyer
```

#### Generate Color Palettes
```http
POST /generate-brand-palettes
```

### Brand Identity Structure

#### Brand Strategy
- Brand Foundation (mission, vision, purpose, tagline)
- Brand Positioning (target audience, market position, UVP)
- Brand Personality (traits, archetype, tone)
- Brand Values (core values, cultural principles)

#### Visual Identity
- Color Palettes (primary, secondary, accent colors)
- Logo Concepts (multiple design variations)
- Typography System (primary/secondary fonts, hierarchy)
- Visual Style Guidelines

#### Brand Voice
- Tone and Personality
- Messaging Framework
- Communication Guidelines
- Voice Attributes

#### Brand Book
- Complete brand guidelines
- Usage examples
- Dos and Don'ts
- Application guidelines

### Output Files
- `agents/output/brand_identity_*.json`
- Logo files in various formats
- Brand book PDF
- Asset templates

---

## Stage 4: Content Generation & Marketing

### Purpose
Generate marketing content and social media posts optimized for multiple platforms with intelligent scheduling.

### Process Flow
1. **Platform Analysis** - Analyze competitor social media presence
2. **Insights Generation** - Extract engagement patterns and best practices
3. **Content Creation** - Generate platform-specific posts
4. **Image Generation** - Create brand-consistent visuals
5. **Smart Scheduling** - Optimize posting times based on analytics
6. **Multi-Platform Publishing** - Post to LinkedIn, TikTok, Facebook, Instagram, X

### Key Agents

#### Social Media Agent
- **File**: `social_media_agent.py`
- **Purpose**: Generate and manage social media content
- **Features**:
  - Platform-specific content generation
  - Hashtag optimization
  - Call-to-action generation
  - Image prompt creation

#### LinkedIn Agent
- **File**: `linkedin_agent.py`
- **Purpose**: LinkedIn integration and posting
- **Features**:
  - OAuth authentication
  - Profile analysis
  - Content posting
  - Engagement tracking

#### TikTok Insights Agent
- **Directory**: `agents/tiktok_insights_agent-main/`
- **Purpose**: TikTok content analysis
- **Features**:
  - Trend analysis
  - Engagement patterns
  - Viral content identification

### API Endpoints

#### Generate Social Media Posts
```http
POST /social-media/generate-posts
```
**Request Body:**
```json
{
  "business_summary": "Business description",
  "marketing_insights": {...},
  "platform": "all",
  "count": 5,
  "generate_images": true,
  "brand_identity": {...},
  "include_scheduling": true
}
```

**Response:**
```json
{
  "posts": [
    {
      "id": "post_platform_timestamp",
      "platform": "linkedin",
      "title": "Post title",
      "content": "Post content...",
      "hashtags": ["#Business", "#Innovation"],
      "image_url": "image_url",
      "optimal_time": "9:00 AM",
      "engagement_prediction": "high"
    }
  ],
  "scheduled_posts": [...],
  "generated_images": {...}
}
```

#### Schedule Posts
```http
POST /social-media/schedule-posts
```
**Request Body:**
```json
{
  "posts": [...],
  "platform": "linkedin",
  "schedule_type": "optimal",
  "start_date": "2025-01-15T09:00:00"
}
```

#### Post to Social Media (Now)
```http
POST /social-media/post-now
```
**Request Body:**
```json
{
  "post_id": "post_id",
  "platform": "linkedin",
  "immediate": true
}
```

#### Get Upcoming Posts
```http
GET /social-media/upcoming-posts?platform=linkedin&limit=50
```

#### Cancel Scheduled Post
```http
DELETE /social-media/posts/{post_id}/cancel
```

#### Configure Platform
```http
POST /social-media/platforms/{platform}/configure
```
**Request Body:**
```json
{
  "config": {
    "client_id": "...",
    "client_secret": "...",
    "access_token": "..."
  }
}
```

#### LinkedIn OAuth Flow
```http
GET /linkedin/auth
GET /social/linkedin/callback?code=...
GET /linkedin/status
POST /linkedin/post
```

### Content Generation Features

#### Platform-Specific Optimization
- **LinkedIn**: Professional, business-focused content
- **Instagram**: Visual storytelling, lifestyle content
- **Facebook**: Community engagement, longer-form posts
- **TikTok**: Short-form video concepts, trending topics
- **X (Twitter)**: Concise, real-time updates

#### Smart Scheduling
- Analyzes engagement patterns from competitor analysis
- Optimizes posting times based on platform algorithms
- Distributes posts to avoid spam detection
- Considers time zones and audience demographics

#### Image Generation
- Brand-consistent visuals using Pollinations AI
- 1:1 aspect ratio for optimal display
- Color palette matching brand identity
- Professional, clean composition

### Output Files
- `agents/output/scheduled_posts.json`
- Generated images in `agents/output/images/`
- Marketing strategy insights

---

## Stage 5: Website Generation

### Purpose
Generate professional, responsive websites/landing pages based on business data and brand identity.

### Process Flow
1. **Data Loading** - Load business analysis and brand identity
2. **Business Analysis** - Analyze requirements for website
3. **Website Generation** - Create HTML/CSS/JS website
4. **Version Management** - Track different versions
5. **Iterative Refinement** - Regenerate based on feedback
6. **Publishing** - Deploy to custom URL

### Key Agent

#### Website Generator Agent
- **File**: `website_generator_agent.py`
- **Purpose**: Generate professional websites
- **Features**:
  - Business data integration
  - Brand identity application
  - Responsive design
  - Version control
  - Feedback-based regeneration

### API Endpoints

#### Load Business Data
```http
GET /website-generator/business-data
```

#### Analyze Business for Website
```http
GET /website-generator/analyze
```

#### Generate Website
```http
POST /website-generator/generate
```
**Request Body:**
```json
{
  "user_prompt": "Optional customization requirements",
  "style_preferences": "modern",
  "regenerate": false,
  "website_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Website generated successfully! 🎉",
  "website_id": "website_timestamp",
  "html_code": "<html>...</html>",
  "analysis": {...},
  "version_info": {...},
  "company_name": "Company Name",
  "generation_time": "2025-01-15T10:30:00"
}
```

#### Regenerate Website with Feedback
```http
POST /website-generator/regenerate
```
**Request Body:**
```json
{
  "website_id": "website_id",
  "user_feedback": "Make it more colorful, add testimonials",
  "style_preferences": "modern"
}
```

#### Get Website Versions
```http
GET /website-generator/versions/{website_id}
```

#### Get Website HTML
```http
GET /website-generator/version/{version_id}/html
```

#### Get Website Metadata
```http
GET /website-generator/version/{version_id}/metadata
```

#### Publish Website
```http
POST /website-generator/publish
```
**Request Body:**
```json
{
  "version_id": "version_id"
}
```

#### Serve Published Website
```http
GET /company-profile/{website_id}
```

### Website Features
- Fully responsive design
- Brand-consistent styling
- SEO-optimized structure
- Fast loading performance
- Mobile-first approach
- Accessibility compliant

### Output Files
- `generated_websites/{website_id}/`
- `website_versions/{version_id}.html`
- `website_versions/{version_id}_metadata.json`
- Published sites in `generated_websites/published/`

---

## Stage 6: Launch & Automation

### Purpose
Coordinate the final launch activities including investor outreach, automated posting, and monitoring.

### Process Flow
1. **Investor Matching** - Find suitable investors based on business profile
2. **Launch Content** - Final content review and scheduling
3. **Automated Posting** - Execute scheduled posts across platforms
4. **Monitoring** - Track engagement and performance
5. **Optimization** - Adjust strategy based on results

### Key Agents

#### Investor Agent
- **File**: `investor_agent.py`
- **Purpose**: Match business with suitable investors
- **Database**: `investors.json`, `full_investor.json`

#### Image Agent
- **File**: `image_agent.py`
- **Purpose**: Generate background images and visuals
- **Integration**: Groq AI + Pollinations AI

### API Endpoints

#### Analyze for Investors
```http
POST /investors/analyze
```
**Request Body:**
```json
{
  "business_summary": "Complete business description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "investor_name": "ABC Ventures",
        "match_score": 0.92,
        "investment_range": "$500K-$2M",
        "focus_areas": ["SaaS", "B2B"],
        "reasoning": "Strong alignment with portfolio"
      }
    ],
    "readiness_score": 0.85
  }
}
```

#### Get All Investors
```http
GET /investors/all
```

#### Generate Background Image
```http
POST /generate-image
```
**Request Body:**
```json
{
  "business_idea": "Brief description",
  "business_summary": "Complete business summary"
}
```

### Launch Checklist
- [ ] All business analysis complete
- [ ] Brand identity finalized
- [ ] Content scheduled across platforms
- [ ] Website published
- [ ] Investor list prepared
- [ ] Monitoring dashboard configured

---

## API Endpoints Reference

### Base URL
```
http://localhost:8001
```

### Endpoint Categories

#### Ideation
- `POST /ideation/init` - Initialize session
- `POST /ideation/answer` - Submit answer
- `POST /ideation/keywords` - Get suggestions
- `POST /ideation/summary` - Generate summary
- `POST /ideation/reset` - Reset question

#### Business Analysis
- `POST /run-all` - Run all agents
- `POST /save-business-summary` - Save summary
- `POST /run-swot` - SWOT analysis
- `POST /run-viability` - Viability assessment
- `POST /bmc/run` - BMC extraction
- `GET /agent-output` - Get output
- `GET /swot-output` - Get SWOT
- `GET /viability-output` - Get viability
- `GET /bmc/output` - Get BMC

#### Brand Identity
- `POST /brand-discovery/init` - Init discovery
- `POST /brand-discovery/respond` - Submit response
- `POST /brand-discovery/complete` - Complete discovery
- `POST /brand-identity/comprehensive` - Full identity
- `POST /brand-identity/generate-logo` - Logo only
- `POST /brand-identity/generate-flyer` - Flyer only
- `POST /generate-brand-palettes` - Color palettes
- `GET /brand-identity-output` - Get output

#### Social Media & Content
- `POST /social-media/generate-posts` - Generate posts
- `POST /social-media/schedule-posts` - Schedule posts
- `POST /social-media/post-now` - Post immediately
- `GET /social-media/upcoming-posts` - Get scheduled
- `DELETE /social-media/posts/{id}/cancel` - Cancel post
- `POST /social-media/platforms/{platform}/configure` - Configure
- `GET /social-media/platforms/status` - Platform status
- `GET /linkedin/auth` - LinkedIn OAuth
- `GET /linkedin/status` - LinkedIn status
- `POST /linkedin/post` - Post to LinkedIn

#### Website Generation
- `GET /website-generator/business-data` - Load data
- `GET /website-generator/analyze` - Analyze
- `POST /website-generator/generate` - Generate
- `POST /website-generator/regenerate` - Regenerate
- `GET /website-generator/versions/{id}` - Get versions
- `POST /website-generator/publish` - Publish
- `GET /company-profile/{id}` - Serve website

#### Investor Relations
- `POST /investors/analyze` - Analyze & match
- `GET /investors/recommendations` - Get matches
- `GET /investors/all` - All investors

#### Image Generation
- `POST /generate-image` - Generate image
- `GET /images/{filename}` - Serve image

---

## Agents Overview

### Core Agents

| Agent | File | Purpose | Output |
|-------|------|---------|--------|
| Ideation | `ideation_agents.py` | Business idea refinement | Business summary |
| Financial Assessment | `Financial_Assessment.py` | Financial analysis | Financial projections |
| Legal | `legal_agent.py` | Legal compliance | Legal requirements |
| Market Analysis | `marketAnalysis_competitors_Agents.py` | Market research | Market insights |
| Opportunities | `opportunities_agent.py` | Partner/investor finding | Opportunities list |
| SWOT | `swot_agent.py` | SWOT analysis | SWOT matrix |
| Viability | `viability_agent.py` | Viability scoring | Viability score |
| BMC | `bmc_agent.py` | Business model canvas | BMC structure |
| Brand Discovery | `brand_discovery_agent.py` | Brand preferences | Brand brief |
| Brand Orchestrator | `brand_orchestrator.py` | Brand creation | Complete identity |
| Identity Orchestrator | `identity_orchestrator.py` | Identity services | Logo, flyer, etc. |
| Social Media | `social_media_agent.py` | Content generation | Social posts |
| LinkedIn | `linkedin_agent.py` | LinkedIn integration | LinkedIn posts |
| Website Generator | `website_generator_agent.py` | Website creation | HTML website |
| Investor | `investor_agent.py` | Investor matching | Investor list |
| Image | `image_agent.py` | Image generation | Visual assets |

### Specialized Sub-Agents

#### Identity Services (`agents/identity/`)
- Logo Generator
- Flyer Generator
- Vectorization Service
- Color Palette Generator

#### Social Media Insights
- LinkedIn Insights (`linkedin_agent-main/`)
- TikTok Insights (`tiktok_insights_agent-main/`)

---

## Data Flow Diagram

```
┌─────────────────┐
│   IDEATION      │
│  (5 Questions)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Business Summary│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      BUSINESS ANALYSIS (Parallel)       │
├──────────┬──────────┬──────────┬────────┤
│Financial │  Legal   │  Market  │Partners│
│  SWOT    │Viability │   BMC    │        │
└────────┬─┴──────────┴──────────┴────────┘
         │
         ▼
┌─────────────────┐
│ Brand Discovery │
│  (Interactive)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     BRAND IDENTITY CREATION             │
├──────────┬──────────┬──────────┬────────┤
│ Strategy │ Visual   │  Voice   │ Assets │
└────────┬─┴──────────┴──────────┴────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│   CONTENT    │ │ WEBSITE  │ │ INVESTOR │
│  GENERATION  │ │   GEN    │ │ MATCHING │
└──────┬───────┘ └────┬─────┘ └────┬─────┘
       │              │             │
       ▼              ▼             ▼
┌─────────────────────────────────────────┐
│            LAUNCH & DEPLOY              │
│  (Social Media + Website + Investors)   │
└─────────────────────────────────────────┘
```

---

## Best Practices

### For Developers

1. **Sequential Execution**: Complete each stage before moving to the next
2. **State Management**: Always save state between stages
3. **Error Handling**: Implement retry logic for API calls
4. **Data Validation**: Validate input at each stage
5. **Output Verification**: Check agent outputs before proceeding

### For Users

1. **Thorough Ideation**: Provide detailed answers in ideation stage
2. **Review Analysis**: Review business analysis outputs carefully
3. **Brand Consistency**: Keep brand identity consistent across all materials
4. **Content Quality**: Review generated content before posting
5. **Platform Setup**: Properly configure social media platforms before posting

### Environment Setup

Required environment variables:
```env
# OpenRouter / AI API
OPENROUTER_API_KEY=your_key_here

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback

# Groq AI
GROQ_API_KEY=your_groq_key

# Other platform credentials as needed
```

---

## Troubleshooting

### Common Issues

#### 1. Missing Business Summary
**Problem**: Later stages fail because business summary is missing
**Solution**: Always run ideation stage first and save the summary

#### 2. API Rate Limits
**Problem**: AI API calls fail due to rate limiting
**Solution**: Implement exponential backoff and retry logic

#### 3. Platform Authentication
**Problem**: Social media posting fails
**Solution**: Complete OAuth flow and verify token validity

#### 4. File Not Found Errors
**Problem**: Agent outputs not found
**Solution**: Ensure agents completed successfully and check output directory

---

## Future Enhancements

### Planned Features
- Real-time collaboration
- Advanced analytics dashboard
- A/B testing for content
- Multi-language support
- Mobile app integration
- Email marketing integration
- CRM integration
- Enhanced AI models
- Video content generation
- Podcast script generation

---

## Support & Documentation

### Additional Resources
- Main README: `/README.md`
- Frontend Documentation: `/front/README.md`
- Agent-Specific Documentation:
  - LinkedIn: `/backend/agents/linkedin_agent-main/README.md`
  - TikTok: `/backend/agents/tiktok_insights_agent-main/README.md`
  - Identity: `/backend/agents/identity/README.md`
  - Vectorization: `/backend/agents/identity/README_vectorization.md`

### API Documentation
- FastAPI Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

---

## Version History

- **v1.0.0** - Initial BrandOrbAI platform
- **v1.1.0** - Added comprehensive brand identity orchestration
- **v1.2.0** - Enhanced social media scheduling
- **v1.3.0** - Website generation capabilities
- **v2.0.0** - Complete pipeline documentation

---

## Contributors

Developed during **Summer Camp 2025 in Talan** - Gold Prize Winner 🏆

---

## License

[License Information]

---

*For questions or support, please refer to the main repository documentation or open an issue.*
