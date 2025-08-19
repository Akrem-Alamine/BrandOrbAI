# LinkedIn Post Analysis API

A FastAPI-based service for scraping LinkedIn company posts and analyzing engagement patterns using association rule mining with automatic session restoration, robust error handling, and AI-powered insights generation.

## Features

- **LinkedIn Post Scraping**: Scrape company posts from LinkedIn using the Apify API
- **Engagement Analysis**: Perform association rule mining to discover patterns that lead to higher engagement
- **AI Insights Generation**: Generate strategic insights using Groq AI based on discovered patterns
- **Session Management**: Track scraping jobs and reuse mining results with persistent storage
- **Session Restoration**: Automatically restore sessions from existing data files on server restart
- **Robust Error Handling**: Graceful handling of mining failures with recovery options
- **RESTful API**: Easy-to-use HTTP endpoints with comprehensive documentation

## Installation

1. Install dependencies using uv:
```bash
uv sync
```

2. Set your API tokens:
```bash
export APIFY_API_TOKEN="your_apify_token_here"
export GROQ_API_KEY="your_groq_api_key_here"
```

3. Run the server:
```bash
uv run python main.py
```

The server will start on `http://localhost:8000` and automatically restore any existing sessions from the `linkedin_scraping_results/` directory.

## API Documentation

### Interactive Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Usage Examples with curl

### 1. Start a LinkedIn Post Scraping Job

```bash
curl -X POST "http://localhost:8000/scrape-posts" 
  -H "Content-Type: application/json" 
  -d '{
    "company_urls": [
      "https://www.linkedin.com/company/talan-tunisie/posts/?feedView=all",
      "https://www.linkedin.com/company/google/posts/?feedView=all"
    ],
    "limit": 20,
    "page_number": 1,
    "sort": "recent",
    "min_support": 0.05,
    "min_confidence": 0.5,
    "min_lift": 1.2
  }'
```

**Response:**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "queued",
  "message": "Scraping job started for 2 companies"
}
```

### 2. Check Session Status

```bash
curl -X GET "http://localhost:8000/session/670e94d6-0487-4e2f-9de7-edbf738276c2/status"
```

**Response (while scraping):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "scraping",
  "message": "Scraping LinkedIn company posts...",
  "posts_scraped": null,
  "created_at": "2025-08-13T10:30:00"
}
```

**Response (successfully completed):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "completed",
  "message": "Successfully scraped 35 posts and mined engagement patterns",
  "posts_scraped": 35,
  "created_at": "2025-08-13T10:30:00"
}
```

**Response (completed with mining error):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "completed_with_mining_error",
  "message": "Successfully scraped 35 posts but mining failed: insufficient data for patterns",
  "posts_scraped": 35,
  "created_at": "2025-08-13T10:30:00"
}
```

### 3. Mine Patterns for Existing Data (For Restored Sessions)

If you have a restored session or a session that completed with mining errors, you can start/retry mining:

```bash
curl -X POST "http://localhost:8000/session/670e94d6-0487-4e2f-9de7-edbf738276c2/mine-patterns?min_support=0.05&min_confidence=0.5&min_lift=1.2"
```

**Response:**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "mining",
  "message": "Started mining patterns for existing data"
}
```

### 4. List All Sessions

```bash
curl -X GET "http://localhost:8000/sessions"
```

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
      "status": "completed",
      "company_urls": ["Talan - Tunisie", "Google"],
      "created_at": "2025-08-13T10:30:00",
      "posts_scraped": 35
    },
    {
      "session_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "completed_with_mining_error",
      "company_urls": ["Microsoft"],
      "created_at": "2025-08-13T09:15:00",
      "posts_scraped": 12
    }
  ]
}
```

### 5. Analyze Engagement Rules

Once a session has completed mining, you can request association rules:

```bash
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["high_reactions"],
    "top_n": 5
  }'
```

**Response:**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "targets": ["high_reactions"],
  "rules": [
    {
      "rule": "time_period_morning + has_document + few_hashtags => high_reactions",
      "antecedent": ["time_period_morning", "has_document", "few_hashtags"],
      "consequent": ["high_reactions"],
      "support": 0.15,
      "confidence": 0.75,
      "lift": 2.3
    },
    {
      "rule": "weekend + text_length_medium + author_large_followers => high_reactions",
      "antecedent": ["weekend", "text_length_medium", "author_large_followers"],
      "consequent": ["high_reactions"],
      "support": 0.12,
      "confidence": 0.68,
      "lift": 1.9
    }
  ],
  "total_posts": 35,
  "total_rules_found": 5
}
```

### 6. Generate AI-Powered Insights

Get strategic insights based on association rules using Groq AI:

```bash
curl -X POST "http://localhost:8000/generate-insights" 
  -H "Content-Type: application/json" 
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["viral", "high_engagement_rate"],
    "n": 10
  }'
```

**Response:**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "targets": ["viral", "high_engagement_rate"],
  "insights": "Based on the analysis of your LinkedIn post data, here are key strategies for creating viral and high-engagement content:

**Content Strategy:**
1. **Document Integration**: Posts with attached documents (PDFs, reports) show 2.3x higher engagement. Include whitepapers, industry reports, or company announcements.

2. **Optimal Text Length**: Medium-length posts (100-300 characters) perform best, balancing informativeness with readability.

**Timing Strategy:**
3. **Morning Posts**: Publishing between 6-12 AM shows strongest correlation with high reactions, particularly for B2B audiences.

4. **Weekend Advantage**: Weekend posts from large companies (>100k followers) achieve 1.9x higher engagement rates.

**Engagement Tactics:**
5. **Strategic Hashtag Use**: 2-3 relevant hashtags optimize discoverability without appearing spammy.

6. **Company Authority**: Leverage your company's follower base - larger companies see amplified engagement when posting professional insights.",
  "rules_analyzed": 10,
  "total_posts": 35
}
```

### 7. Get Available Target Variables

```bash
curl -X GET "http://localhost:8000/available-targets"
```

**Response:**
```json
{
  "targets": [
    {
      "name": "high_reactions",
      "description": "Posts with high reaction count (top 25%)"
    },
    {
      "name": "high_likes",
      "description": "Posts with high like count (top 25%)"
    },
    {
      "name": "high_supports",
      "description": "Posts with high support count (top 25%)"
    },
    {
      "name": "viral",
      "description": "Viral content (top 10% in total reactions)"
    },
    {
      "name": "high_engagement_rate",
      "description": "High engagement rate (top 25%)"
    },
    {
      "name": "has_document",
      "description": "Posts that include documents/PDFs"
    },
    {
      "name": "has_media",
      "description": "Posts that include media/images"
    },
    {
      "name": "popular_post",
      "description": "Popular posts (combination of high reactions and engagement)"
    }
  ]
}
```

### 8. Delete a Session

```bash
curl -X DELETE "http://localhost:8000/session/670e94d6-0487-4e2f-9de7-edbf738276c2"
```

**Response:**
```json
{
  "message": "Session 670e94d6-0487-4e2f-9de7-edbf738276c2 deleted successfully"
}
```

## Advanced Usage

### Multiple Target Analysis

Analyze rules for multiple engagement targets simultaneously:

```bash
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["viral", "has_document"],
    "top_n": 5
  }'
```

### Custom Mining Parameters for Large Companies

Set specific mining parameters for better performance with large datasets:

```bash
curl -X POST "http://localhost:8000/scrape-posts" 
  -H "Content-Type: application/json" 
  -d '{
    "company_urls": [
      "https://www.linkedin.com/company/microsoft/posts/?feedView=all",
      "https://www.linkedin.com/company/google/posts/?feedView=all"
    ],
    "limit": 50,
    "sort": "top",
    "min_support": 0.08,
    "min_confidence": 0.6,
    "min_lift": 1.5
  }'
```

### Analyze Content Strategy Patterns

Focus on content-specific patterns:

```bash
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["has_media", "has_document"],
    "top_n": 8
  }'
```

### Generate Timing-Focused Insights

Get insights specifically about timing strategies:

```bash
curl -X POST "http://localhost:8000/generate-insights" 
  -H "Content-Type: application/json" 
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["high_engagement_rate"],
    "n": 5
  }'
```

## LinkedIn-Specific Features

### Supported Company URL Formats

The API accepts LinkedIn company URLs in the following format:
```
https://www.linkedin.com/company/{company-name}/posts/?feedView=all
```

Examples:
- `https://www.linkedin.com/company/talan-tunisie/posts/?feedView=all`
- `https://www.linkedin.com/company/google/posts/?feedView=all`
- `https://www.linkedin.com/company/microsoft/posts/?feedView=all`

### Content Analysis Features

**Text Analysis:**
- Hashtag extraction and frequency analysis
- Mention detection (@username patterns)
- Text length categorization (short/medium/long/very long)
- Language detection

**Media Analysis:**
- Document attachment detection (PDFs, presentations)
- Image/media presence analysis
- Rich content correlation with engagement

**Timing Analysis:**
- Post timing optimization (morning/afternoon/evening/night)
- Weekend vs. weekday performance
- Day-of-week engagement patterns

**Author/Company Analysis:**
- Company size impact (follower count categories)
- Industry-specific engagement patterns
- Authority and credibility factors

## Session States and Workflow

### Session Status Types

1. **`queued`**: Job submitted but not started
2. **`scraping`**: Currently scraping LinkedIn company posts
3. **`mining`**: Currently mining engagement patterns
4. **`completed`**: Successfully scraped and mined patterns
5. **`completed_with_mining_error`**: Scraped successfully but mining failed
6. **`error`**: Scraping failed

### Typical LinkedIn Analysis Workflow

1. **Start Scraping**: POST to `/scrape-posts` with company URLs and mining parameters
2. **Monitor Progress**: GET `/session/{id}/status` to track progress
3. **Handle Mining Issues**: If status is `completed_with_mining_error`, use POST `/session/{id}/mine-patterns`
4. **Analyze Patterns**: POST `/analyze-rules` with target engagement metrics
5. **Generate Insights**: POST `/generate-insights` for AI-powered strategic recommendations
6. **Review Results**: Extract actionable LinkedIn content strategies
7. **Server Restart**: Sessions automatically restored from saved files
8. **Clean Up**: DELETE `/session/{id}` when analysis is complete

### Example Complete Workflow

```bash
# 1. Start scraping LinkedIn posts
SESSION_ID=$(curl -s -X POST "http://localhost:8000/scrape-posts" 
  -H "Content-Type: application/json" 
  -d '{
    "company_urls": ["https://www.linkedin.com/company/talan-tunisie/posts/?feedView=all"],
    "limit": 30,
    "sort": "recent"
  }' | jq -r '.session_id')

echo "Session ID: $SESSION_ID"

# 2. Wait and check status
sleep 30
curl -X GET "http://localhost:8000/session/$SESSION_ID/status"

# 3. Analyze viral content patterns
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d "{
    "session_id": "$SESSION_ID",
    "targets": ["viral"],
    "top_n": 5
  }"

# 4. Generate strategic insights
curl -X POST "http://localhost:8000/generate-insights" 
  -H "Content-Type: application/json" 
  -d "{
    "session_id": "$SESSION_ID",
    "targets": ["high_engagement_rate", "popular_post"],
    "n": 8
  }"
```

## Error Handling

### Common Error Scenarios

**Session Not Found (404):**
```json
{
  "detail": "Session not found"
}
```

**Session Not Ready (400):**
```json
{
  "detail": "Session status is 'scraping'. Can only analyze completed sessions."
}
```

**No Mining Results (400):**
```json
{
  "detail": "No mining results available for this session"
}
```

**Invalid LinkedIn Targets (400):**
```json
{
  "detail": "Invalid targets: ['invalid_target']. Valid targets are: ['high_reactions', 'high_likes', 'viral', ...]"
}
```

**GROQ API Key Missing (500):**
```json
{
  "detail": "GROQ_API_KEY environment variable is not set"
}
```

## Parameter Guidelines for LinkedIn Analysis

**Mining Parameters:**
- `min_support` (0.01-0.5): Lower values find more patterns but take longer
  - 0.05-0.08: Good for 20-50 posts
  - 0.1-0.15: Better for 100+ posts
- `min_confidence` (0.1-1.0): Higher values produce more reliable rules
  - 0.5-0.6: Balanced reliability
  - 0.7+: High confidence patterns only
- `min_lift` (1.0-5.0): Higher values show stronger associations
  - 1.2-1.5: Good starting point
  - 2.0+: Strong correlations only

**Scraping Parameters:**
- `limit` (1-100): Number of posts per company
  - 10-20: Quick analysis
  - 30-50: Comprehensive analysis
  - 50+: Deep pattern mining
- `sort`: "recent" (latest posts) or "top" (most engaged posts)
- `page_number`: For pagination through older posts

**Performance Tips:**
- Use higher `min_support` (0.1+) for faster mining with smaller datasets
- Start with `sort: "top"` to get highest quality engagement data
- Use separate mining endpoint for parameter experimentation
- Combine multiple companies for broader pattern discovery

## Data Persistence

- Scraped data automatically saved to `linkedin_scraping_results/` directory
- Session-specific filenames: `session_{id}_data.json`
- Sessions automatically restored on server restart
- Mining results stored in memory (re-mining required after restart)

## Real-World Use Cases

### Content Strategy Optimization
```bash
# Find what content types drive engagement
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d '{
    "targets": ["has_document", "has_media"],
    "top_n": 10
  }'
```

### Timing Strategy Analysis
```bash
# Discover optimal posting times
curl -X POST "http://localhost:8000/generate-insights" 
  -H "Content-Type: application/json" 
  -d '{
    "targets": ["high_engagement_rate"],
    "n": 15
  }'
```

### Viral Content Patterns
```bash
# Understand what makes content go viral
curl -X POST "http://localhost:8000/analyze-rules" 
  -H "Content-Type: application/json" 
  -d '{
    "targets": ["viral"],
    "top_n": 8
  }'
```

## License

This project is for educational and research purposes. Please ensure compliance with LinkedIn's terms of service and applicable data protection laws.