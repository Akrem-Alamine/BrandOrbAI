# TikTok Profile Analysis API

A FastAPI-based service for scraping TikTok profiles and analyzing engagement patterns using association rule mining with automatic session restoration, robust error handling, and AI-powered insights generation.

## Features

- **Profile Scraping**: Scrape TikTok profile videos using the Apify API
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

The server will start on `http://localhost:8000` and automatically restore any existing sessions from the `tiktok_scraping_results/` directory.

## API Documentation

### Interactive Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Usage Examples with curl

### 1. Start a Profile Scraping Job

```bash
curl -X POST "http://localhost:8000/scrape-profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_names": ["talan_tunisie", "another_profile"],
    "results_per_page": 50,
    "proxy_country_code": "TN",
    "profile_sorting": "latest",
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
  "message": "Scraping job started for 2 profiles"
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
  "message": "Scraping TikTok profiles...",
  "videos_scraped": null,
  "created_at": "2025-08-07T10:30:00"
}
```

**Response (successfully completed):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "completed",
  "message": "Successfully scraped 47 videos and mined engagement patterns",
  "videos_scraped": 47,
  "created_at": "2025-08-07T10:30:00"
}
```

**Response (completed with mining error):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "completed_with_mining_error",
  "message": "Successfully scraped 47 videos but mining failed: insufficient data for patterns",
  "videos_scraped": 47,
  "created_at": "2025-08-07T10:30:00"
}
```

**Response (restored session on server restart):**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "status": "completed",
  "message": "Restored session with 47 videos (mining not performed)",
  "videos_scraped": 47,
  "created_at": "2025-08-07T10:30:00"
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
      "profile_names": ["talan_tunisie"],
      "created_at": "2025-08-07T10:30:00",
      "videos_scraped": 47
    },
    {
      "session_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "completed_with_mining_error",
      "profile_names": ["another_profile"],
      "created_at": "2025-08-07T09:15:00",
      "videos_scraped": 15
    }
  ]
}
```

### 5. Analyze Engagement Rules

Once a session has completed mining, you can request association rules:

```bash
curl -X POST "http://localhost:8000/analyze-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["high_views"],
    "top_n": 5
  }'
```

**Response:**
```json
{
  "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
  "targets": ["high_views"],
  "rules": [
    {
      "rule": "If time_period_evening AND hashtag_trending => then high_views",
      "antecedent": ["time_period_evening", "hashtag_trending"],
      "consequent": ["high_views"],
      "support": 0.15,
      "confidence": 0.75,
      "lift": 2.3
    },
    {
      "rule": "If weekend AND duration_short => then high_views",
      "antecedent": ["weekend", "duration_short"],
      "consequent": ["high_views"],
      "support": 0.12,
      "confidence": 0.68,
      "lift": 1.9
    }
  ],
  "total_videos": 47,
  "total_rules_found": 5
}
```

**Error Response (session with mining error):**
```json
{
  "detail": "No mining results available for this session"
}
```

### 6. Get Available Target Variables

```bash
curl -X GET "http://localhost:8000/available-targets"
```

**Response:**
```json
{
  "targets": [
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
}
```

### 7. Delete a Session

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
curl -X POST "http://localhost:8000/analyze-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["high_views", "high_likes"],
    "top_n": 3
  }'
```

### Custom Mining Parameters

Set specific mining parameters during scraping for optimal performance:

```bash
curl -X POST "http://localhost:8000/scrape-profiles" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_names": ["profile1", "profile2"],
    "results_per_page": 30,
    "min_support": 0.03,
    "min_confidence": 0.6,
    "min_lift": 1.5
  }'
```

### Retry Mining with Different Parameters

For sessions that failed mining, you can retry with different parameters:

```bash
curl -X POST "http://localhost:8000/session/670e94d6-0487-4e2f-9de7-edbf738276c2/mine-patterns?min_support=0.1&min_confidence=0.6&min_lift=1.5"
```

## Session States and Workflow

### Session Status Types

1. **`queued`**: Job submitted but not started
2. **`scraping`**: Currently scraping TikTok profiles
3. **`mining`**: Currently mining engagement patterns
4. **`completed`**: Successfully scraped and mined patterns
5. **`completed_with_mining_error`**: Scraped successfully but mining failed
6. **`error`**: Scraping failed

### Typical Workflow

1. **Start Scraping**: POST to `/scrape-profiles` with profiles and mining parameters
2. **Monitor Progress**: GET `/session/{id}/status` to track progress
3. **Handle Mining Issues**: If status is `completed_with_mining_error`, use POST `/session/{id}/mine-patterns`
4. **Analyze Patterns**: POST `/analyze-rules` with target engagement metrics
5. **Review Results**: Extract insights from association rules
6. **Server Restart**: Sessions automatically restored from saved files
7. **Clean Up**: DELETE `/session/{id}` when analysis is complete

### Session Restoration

**Key Features:**
- Automatic restoration of sessions on server restart
- Sessions restored from `tiktok_scraping_results/session_{id}_data.json` files
- Restored sessions have status `completed` but require re-mining
- Profile names extracted from video data
- File modification time used as creation timestamp

**Example Restoration Process:**
```bash
# Server restart automatically detects and restores sessions
# Check restored sessions
curl -X GET "http://localhost:8000/sessions"

# Mine patterns for restored session
curl -X POST "http://localhost:8000/session/670e94d6-0487-4e2f-9de7-edbf738276c2/mine-patterns"

# Analyze rules
curl -X POST "http://localhost:8000/analyze-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "670e94d6-0487-4e2f-9de7-edbf738276c2",
    "targets": ["viral"]
  }'
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

**Invalid Targets (400):**
```json
{
  "detail": "Invalid targets: ['invalid_target']. Valid targets are: ['high_views', 'high_likes', ...]"
}
```

**Mining Failure Recovery:**
The API automatically handles mining failures and allows retry with different parameters. Sessions with mining errors still preserve the scraped data.

## Parameter Guidelines

**Mining Parameters:**
- `min_support` (0.01-0.5): Lower values find more patterns but take longer
- `min_confidence` (0.1-1.0): Higher values produce more reliable rules
- `min_lift` (1.0-5.0): Higher values show stronger associations

**Performance Tips:**
- Use higher `min_support` (0.1+) for faster mining with smaller datasets
- Start with default parameters and adjust based on results
- Use the separate mining endpoint for experimentation

## Data Persistence

- Scraped data automatically saved to `tiktok_scraping_results/` directory
- Session-specific filenames: `session_{id}_data.json`
- Sessions automatically restored on server restart
- Mining results stored in memory (re-mining required after restart)

## License

This project is for educational and research purposes. Please ensure compliance with TikTok's terms of service and applicable data protection laws.