# Social Media Management System

## Overview

The BrandOrbAI Social Media Management System allows users to generate, schedule, and post AI-powered content across multiple social media platforms including LinkedIn, TikTok, Facebook, Instagram, and X (Twitter).

## Features

### 🤖 AI-Powered Content Generation
- Generate platform-specific posts based on business summary and marketing insights
- AI-generated images using Pollinations API
- Optimal timing suggestions based on engagement patterns
- Platform-specific content optimization

### 📅 Smart Scheduling
- Optimal posting times based on marketing strategy heatmap
- Manual scheduling with calendar interface
- Batch scheduling across multiple platforms
- Post preview and editing

### 🔗 Multi-Platform Support
- **LinkedIn**: Professional content, industry insights, networking
- **TikTok**: Short-form video concepts, trending content
- **Facebook**: Community engagement, storytelling
- **Instagram**: Visual content, lifestyle posts
- **X (Twitter)**: Quick insights, real-time updates

### ⚡ Real-Time Posting
- Immediate posting to configured platforms
- Post status tracking
- Engagement prediction
- Content performance analytics

## Architecture

### Backend Components

1. **Social Media Agent** (`agents/social_media_agent.py`)
   - Main AI content generation
   - Platform-specific optimization
   - Image generation integration
   - Scheduling logic

2. **LinkedIn Agent** (`agents/linkedin_agent.py`)
   - LinkedIn API integration
   - OAuth authentication
   - Post publishing with media support

3. **Main API Endpoints** (`main.py`)
   - RESTful API endpoints
   - Authentication handling
   - Data management

### Frontend Components

1. **Online Presence Page** (`app/dashboard/go-to-market/online-presence/page.tsx`)
   - Modern React interface
   - Real-time updates
   - Platform management
   - Content generation UI

## API Endpoints

### Social Media Management
- `POST /social-media/generate-posts` - Generate AI posts
- `GET /social-media/platforms/status` - Check platform configurations
- `GET /social-media/platforms/{platform}/help` - Get setup instructions
- `POST /social-media/schedule-posts` - Schedule posts
- `POST /social-media/post-now` - Post immediately
- `GET /social-media/upcoming-posts` - Get scheduled posts

### LinkedIn Integration
- `GET /linkedin/auth` - Get OAuth URL
- `GET /social/linkedin/callback` - OAuth callback
- `POST /linkedin/post` - Post to LinkedIn

## Setup Instructions

### 1. Backend Configuration

1. Copy `.env.example` to `.env`
2. Configure LinkedIn API credentials:
   ```bash
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_ACCESS_TOKEN=your_access_token
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 2. Frontend Configuration

1. Install dependencies:
   ```bash
   npm install react-day-picker date-fns @radix-ui/react-switch @radix-ui/react-scroll-area
   ```

### 3. Platform Setup

#### LinkedIn
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Get Client ID and Client Secret
4. Set redirect URI: `http://localhost:8001/social/linkedin/callback`
5. Generate access token with `w_member_social` scope

#### Other Platforms
See the help section in the UI for specific setup instructions for TikTok, Facebook, Instagram, and X.

## Usage

### 1. Configure Platforms
- Navigate to the Platform Settings tab
- Click help button next to each platform for setup instructions
- Configure API credentials for desired platforms

### 2. Generate Content
- Go to Content Generator tab
- Select target platforms
- Configure generation settings (post count, AI images)
- Click "Generate AI Posts"

### 3. Schedule or Post
- Review generated posts
- Click "Schedule" for optimal timing
- Click "Post Now" for immediate publishing
- Monitor upcoming posts in Scheduling tab

## Content Generation Flow

1. **Business Analysis**: System analyzes business summary and marketing insights
2. **Platform Optimization**: Content is tailored for each platform's audience and format
3. **AI Enhancement**: QWEN AI generates engaging, platform-specific content
4. **Image Generation**: Optional AI-generated visuals using Pollinations
5. **Optimal Scheduling**: Posts scheduled based on engagement heatmap data

## Marketing Integration

The system integrates with the marketing strategy analysis to provide:
- Platform-specific engagement patterns
- Optimal posting times
- Content themes based on competitor analysis
- Performance predictions

## Error Handling

- Graceful platform configuration errors
- API rate limit handling
- Content generation fallbacks
- User-friendly error messages

## Future Enhancements

- Advanced analytics dashboard
- A/B testing capabilities
- Content templates library
- Team collaboration features
- Automated engagement responses
- Performance optimization suggestions

## Security

- OAuth 2.0 authentication
- Secure credential storage
- API key encryption
- Rate limiting protection

## Support

For setup assistance or troubleshooting:
1. Check the platform help sections in the UI
2. Verify API credentials in environment variables
3. Review backend logs for detailed error information
4. Test individual platform connections before bulk operations
