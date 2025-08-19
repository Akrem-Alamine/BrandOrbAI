#!/usr/bin/env python3
"""
Social Media Management Agent - AI-Powered Multi-Platform Social Media Posting
Supports LinkedIn, TikTok, Facebook, Instagram, and X (Twitter)
"""

import os
import base64
import urllib.parse
import json
import re
import random
import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class SocialMediaAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY')
        )
        
        # Platform configurations
        self.platform_configs = {
            'linkedin': {
                'client_id': os.getenv('LINKEDIN_CLIENT_ID'),
                'client_secret': os.getenv('LINKEDIN_CLIENT_SECRET'),
                'redirect_uri': os.getenv('LINKEDIN_REDIRECT_URI'),
                'access_token': os.getenv('LINKEDIN_ACCESS_TOKEN'),
            },
            'tiktok': {
                'client_id': os.getenv('TIKTOK_CLIENT_ID'),
                'client_secret': os.getenv('TIKTOK_CLIENT_SECRET'),
                'access_token': os.getenv('TIKTOK_ACCESS_TOKEN'),
            },
            'facebook': {
                'app_id': os.getenv('FACEBOOK_APP_ID'),
                'app_secret': os.getenv('FACEBOOK_APP_SECRET'),
                'access_token': os.getenv('FACEBOOK_ACCESS_TOKEN'),
                'page_id': os.getenv('FACEBOOK_PAGE_ID'),
            },
            'instagram': {
                'app_id': os.getenv('INSTAGRAM_APP_ID'),
                'app_secret': os.getenv('INSTAGRAM_APP_SECRET'),
                'access_token': os.getenv('INSTAGRAM_ACCESS_TOKEN'),
                'user_id': os.getenv('INSTAGRAM_USER_ID'),
            },
            'x': {
                'api_key': os.getenv('X_API_KEY'),
                'api_secret': os.getenv('X_API_SECRET'),
                'access_token': os.getenv('X_ACCESS_TOKEN'),
                'access_token_secret': os.getenv('X_ACCESS_TOKEN_SECRET'),
            }
        }

    def load_business_data(self) -> Dict[str, str]:
        """Load business data from output files and brand identity storage"""
        # Read existing analysis data
        base_path = os.path.join(os.path.dirname(__file__), "output")
        
        # Read financial data
        financial_path = os.path.join(base_path, "assessment_output.txt")
        financial_data = ""
        if os.path.exists(financial_path):
            with open(financial_path, "r", encoding="utf-8") as f:
                financial_data = f.read()
        
        # Read market data
        market_path = os.path.join(base_path, "market_analysis_competitors_output.txt")
        market_data = ""
        if os.path.exists(market_path):
            with open(market_path, "r", encoding="utf-8") as f:
                market_data = f.read()
        
        # Read legal data
        legal_path = os.path.join(base_path, "legal_output.txt")
        legal_data = ""
        if os.path.exists(legal_path):
            with open(legal_path, "r", encoding="utf-8") as f:
                legal_data = f.read()
                
        # Read business summary
        business_summary_path = os.path.join(base_path, "business_summary.txt")
        business_summary = ""
        if os.path.exists(business_summary_path):
            with open(business_summary_path, "r", encoding="utf-8") as f:
                raw_summary = f.read()
                # Remove the "Generated on" date line for cleaner processing
                business_summary = raw_summary.split("\nGenerated on")[0] if "\nGenerated on" in raw_summary else raw_summary
        
        # Load brand identity data from global storage
        brand_identity_data = ""
        try:
            # Import the brand identity storage from main.py
            import sys
            main_module_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main.py')
            if os.path.exists(main_module_path):
                sys.path.append(os.path.dirname(os.path.dirname(__file__)))
                from main import brand_identity_storage
                
                # Get the latest brand identity data
                if brand_identity_storage:
                    latest_key = max(brand_identity_storage.keys()) if brand_identity_storage else None
                    if latest_key:
                        brand_identity_data = str(brand_identity_storage[latest_key])
        except Exception as e:
            logger.warning(f"Could not load brand identity data: {e}")
        
        return {
            "business_summary": business_summary,
            "financial_data": financial_data,
            "market_data": market_data,
            "legal_data": legal_data,
            "brand_identity_data": brand_identity_data
        }

    def generate_marketing_posts(self, business_summary: str = None, marketing_insights: Dict = None, 
                                platform: str = 'all', count: int = 5) -> List[Dict]:
        """Generate marketing posts based on business summary and insights"""
        
        # If no business summary provided, try to load from files
        if not business_summary:
            business_data = self.load_business_data()
            business_summary = business_data.get("business_summary", "")
            
            if not business_summary:
                # Create a basic summary from available data
                financial_data = business_data.get("financial_data", "")
                market_data = business_data.get("market_data", "")
                brand_identity_data = business_data.get("brand_identity_data", "")
                
                if financial_data or market_data or brand_identity_data:
                    business_summary = f"Business Analysis Data:\n{financial_data[:500]}\n{market_data[:500]}\n{brand_identity_data[:500]}"
                else:
                    business_summary = "A growing business focused on innovation and customer success"
        
        platform_prompts = {
            'linkedin': """
            Create professional LinkedIn posts that focus on:
            - Industry insights and thought leadership
            - Business expertise and credibility
            - Professional networking value
            - Educational content for professionals
            - Case studies and success stories
            
            Format: Professional tone, 150-300 words, include relevant hashtags (#Industry #Business #Professional)
            """,
            'tiktok': """
            Create engaging TikTok posts that focus on:
            - Quick tips and tutorials
            - Behind-the-scenes content
            - Trending topics and challenges
            - Educational but fun content
            - Visual storytelling concepts
            
            Format: Casual tone, 50-150 words, trendy language, include popular hashtags
            """,
            'facebook': """
            Create Facebook posts that focus on:
            - Community engagement
            - Storytelling and brand personality
            - Customer testimonials and reviews
            - Company updates and news
            - Interactive content (questions, polls)
            
            Format: Conversational tone, 100-250 words, engaging questions
            """,
            'instagram': """
            Create Instagram posts that focus on:
            - Visual storytelling
            - Brand aesthetics and lifestyle
            - User-generated content inspiration
            - Product showcases
            - Inspirational quotes and tips
            
            Format: Creative tone, 50-200 words, visual descriptions, Instagram hashtags
            """,
            'x': """
            Create X (Twitter) posts that focus on:
            - Quick insights and hot takes
            - Industry news and commentary
            - Engaging conversations
            - Thread-worthy content
            - Real-time updates
            
            Format: Concise tone, 50-280 characters, punchy and direct
            """
        }

        # Load marketing strategy insights if not provided
        if not marketing_insights:
            marketing_insights = self.load_marketing_strategy_insights()
        
        # Extract platform-specific insights from marketing strategy
        platform_insights = {}
        optimal_times = {}
        engagement_strategies = {}
        
        if marketing_insights:
            # Extract engagement heatmap data
            heatmap = marketing_insights.get('engagement_heatmap', {})
            optimal_times = heatmap.get('best_times', {}).get(platform, {})
            
            # Extract combined strategy
            combined_strategy = marketing_insights.get('combined_strategy', {})
            platform_specific = combined_strategy.get('platform_specific', {}).get(platform, {})
            timing_strategy = combined_strategy.get('timing_strategy', {})
            content_strategy = combined_strategy.get('content_strategy', {})
            
            platform_insights = {
                'focus': platform_specific.get('focus', 'Engaging content'),
                'optimal_content': platform_specific.get('optimal_content', 'Various content types'),
                'hashtag_strategy': platform_specific.get('hashtag_strategy', 'Relevant hashtags'),
                'post_frequency': platform_specific.get('post_frequency', 'Regular posting'),
                'engagement_tactics': platform_specific.get('engagement_tactics', 'Engage with audience'),
                'optimal_time': timing_strategy.get(f'{platform}_optimal_time', 'Business hours'),
                'content_focus': content_strategy.get(f'{platform}_style', 'Professional content')
            }

        # Enhanced platform prompts with marketing strategy integration
        platform_prompts = {
            'linkedin': f"""
            Create professional LinkedIn posts that focus on:
            - Industry insights and thought leadership
            - Business expertise and credibility
            - Professional networking value
            - Educational content for professionals
            - Case studies and success stories
            
            MARKETING STRATEGY INSIGHTS:
            - Platform Focus: {platform_insights.get('focus', 'Professional networking and B2B audience')}
            - Content Types: {platform_insights.get('optimal_content', 'Industry insights, thought leadership')}
            - Hashtag Strategy: {platform_insights.get('hashtag_strategy', '2-3 professional hashtags')}
            - Engagement Tactics: {platform_insights.get('engagement_tactics', 'Ask questions, share insights')}
            
            Format: Professional tone, 150-300 words, include relevant hashtags (#Industry #Business #Professional)
            """,
            'tiktok': f"""
            Create engaging TikTok posts that focus on:
            - Quick tips and tutorials
            - Behind-the-scenes content
            - Trending topics and challenges
            - Educational but fun content
            - Visual storytelling concepts
            
            MARKETING STRATEGY INSIGHTS:
            - Platform Focus: {platform_insights.get('focus', 'Creative storytelling and brand personality')}
            - Content Types: {platform_insights.get('optimal_content', 'Behind-the-scenes, educational content')}
            - Hashtag Strategy: {platform_insights.get('hashtag_strategy', 'Mix of trending and niche hashtags')}
            - Engagement Tactics: {platform_insights.get('engagement_tactics', 'Respond to comments, participate in trends')}
            
            Format: Casual tone, 50-150 words, trendy language, include popular hashtags
            """,
            'facebook': f"""
            Create Facebook posts that focus on:
            - Community engagement
            - Storytelling and brand personality
            - Customer testimonials and reviews
            - Company updates and news
            - Interactive content (questions, polls)
            
            MARKETING STRATEGY INSIGHTS:
            - Platform Focus: {platform_insights.get('focus', 'Community engagement and storytelling')}
            - Content Types: {platform_insights.get('optimal_content', 'Community content, updates')}
            - Hashtag Strategy: {platform_insights.get('hashtag_strategy', 'Moderate hashtag usage')}
            - Engagement Tactics: {platform_insights.get('engagement_tactics', 'Ask questions, share stories')}
            
            Format: Conversational tone, 100-250 words, engaging questions
            """,
            'instagram': f"""
            Create Instagram posts that focus on:
            - Visual storytelling
            - Brand aesthetics and lifestyle
            - User-generated content inspiration
            - Product showcases
            - Inspirational quotes and tips
            
            MARKETING STRATEGY INSIGHTS:
            - Platform Focus: {platform_insights.get('focus', 'Visual storytelling and brand aesthetics')}
            - Content Types: {platform_insights.get('optimal_content', 'Visual content, lifestyle')}
            - Hashtag Strategy: {platform_insights.get('hashtag_strategy', 'Strategic hashtag use')}
            - Engagement Tactics: {platform_insights.get('engagement_tactics', 'Visual storytelling, user engagement')}
            
            Format: Creative tone, 50-200 words, visual descriptions, Instagram hashtags
            """,
            'x': f"""
            Create X (Twitter) posts that focus on:
            - Quick insights and hot takes
            - Industry news and commentary
            - Engaging conversations
            - Thread-worthy content
            - Real-time updates
            
            MARKETING STRATEGY INSIGHTS:
            - Platform Focus: {platform_insights.get('focus', 'Quick insights and real-time engagement')}
            - Content Types: {platform_insights.get('optimal_content', 'Quick insights, commentary')}
            - Hashtag Strategy: {platform_insights.get('hashtag_strategy', 'Strategic hashtag use')}
            - Engagement Tactics: {platform_insights.get('engagement_tactics', 'Quick responses, trending topics')}
            
            Format: Concise tone, 50-280 characters, punchy and direct
            """
        }

        # Extract key insights from marketing strategy
        optimal_times_display = {}
        if optimal_times:
            # Convert to user-friendly format
            for hour, score in optimal_times.items():
                hour_12 = int(hour) % 12 or 12
                am_pm = "AM" if int(hour) < 12 else "PM"
                optimal_times_display[f"{hour_12}:00 {am_pm}"] = score
        
        prompt = f"""
        Based on this business: "{business_summary}"
        
        COMPREHENSIVE MARKETING STRATEGY INSIGHTS:
        Platform Focus: {platform_insights.get('focus', 'Engaging content for target audience')}
        Optimal Content Types: {platform_insights.get('optimal_content', 'Varied content approaches')}
        Hashtag Strategy: {platform_insights.get('hashtag_strategy', 'Relevant and strategic hashtags')}
        Posting Frequency: {platform_insights.get('post_frequency', 'Consistent posting schedule')}
        Engagement Tactics: {platform_insights.get('engagement_tactics', 'Active audience engagement')}
        Content Style: {platform_insights.get('content_focus', 'Brand-consistent messaging')}
        
        OPTIMAL POSTING TIMES ANALYSIS:
        {f"Best engagement times: {', '.join([f'{time} (score: {score:.1f})' for time, score in list(optimal_times_display.items())[:3]])}" if optimal_times_display else "Use general best practices for timing"}
        
        {platform_prompts.get(platform, platform_prompts['linkedin']) if platform != 'all' else 'Create versatile posts suitable for multiple platforms with platform-specific adaptations'}
        
        Generate {count} different post concepts for {"all platforms" if platform == 'all' else platform}.
        Each post should be strategically designed based on the marketing insights above.
        
        Return in this JSON format:
        {{
            "posts": [
                {{
                    "id": "post_{platform}_{{post_number}}",
                    "platform": "{platform}",
                    "content_type": "text|image|video",
                    "title": "Catchy post title aligned with marketing strategy",
                    "content": "Full post content incorporating platform insights",
                    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
                    "optimal_time": "suggested posting time based on strategy analysis",
                    "engagement_prediction": "high|medium|low based on strategy alignment",
                    "image_prompt": "Description for AI image generation if needed",
                    "call_to_action": "Specific CTA aligned with platform focus"
                }}
            ]
        }}
        
        IMPORTANT: Make each post unique, strategically optimized, and aligned with the marketing strategy insights.
        Ensure content leverages the optimal content types and engagement tactics identified in the strategy.
        Use the optimal posting times data to set realistic "optimal_time" values for each post.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            
            content = response.choices[0].message.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                posts = result.get('posts', [])
                
                # Enhance posts with strategy-based optimal times if available
                for i, post in enumerate(posts):
                    if optimal_times and not post.get('optimal_time'):
                        # Find the best time based on engagement scores
                        best_times = sorted(optimal_times.items(), key=lambda x: x[1], reverse=True)
                        if best_times:
                            hour = int(best_times[i % len(best_times)][0])
                            hour_12 = hour % 12 or 12
                            am_pm = "AM" if hour < 12 else "PM"
                            post['optimal_time'] = f"{hour_12}:00 {am_pm}"
                            post['engagement_prediction'] = "high" if best_times[i % len(best_times)][1] > 0.8 else "medium"
                
                return posts
            else:
                logger.warning("Failed to parse AI response, using fallback posts")
                return self._generate_fallback_posts(platform, count)
                
        except Exception as e:
            logger.error(f"Error generating posts with AI: {str(e)}")
            return self._generate_fallback_posts(platform, count)

    def load_marketing_strategy_insights(self) -> Dict:
        """Load marketing strategy insights from the system"""
        try:
            # Try to import the main module to access sessions
            import sys
            import os
            
            # Add the parent directory to sys.path to import main
            parent_dir = os.path.dirname(os.path.dirname(__file__))
            if parent_dir not in sys.path:
                sys.path.append(parent_dir)
            
            # Try to load from main module sessions
            try:
                from main import sessions, _generate_combined_strategy, _generate_posting_calendar, _generate_engagement_heatmap
                
                # Look for the most recent marketing analysis
                for analysis_id, analysis_data in sessions.items():
                    if "business_context" in analysis_data:
                        insights = {
                            "combined_strategy": _generate_combined_strategy({}, analysis_data["business_context"]),
                            "posting_calendar": _generate_posting_calendar({}),
                            "engagement_heatmap": _generate_engagement_heatmap({})
                        }
                        logger.info("Successfully loaded marketing strategy insights from analysis")
                        return insights
            except ImportError:
                logger.warning("Could not import main module for marketing strategy")
            
            # Fallback: return default strategy
            logger.info("Using default marketing strategy")
            return self._get_default_strategy()
            
        except Exception as e:
            logger.error(f"Error loading marketing strategy insights: {e}")
            return self._get_default_strategy()
    
    def _get_default_strategy(self) -> Dict:
        """Return default marketing strategy when no analysis is available"""
        return {
            "engagement_heatmap": {
                "best_times": {
                    "linkedin": {"9": 0.9, "13": 0.8, "17": 0.7},
                    "facebook": {"10": 0.8, "15": 0.9, "19": 0.7},
                    "instagram": {"11": 0.8, "14": 0.9, "20": 0.8},
                    "tiktok": {"12": 0.7, "16": 0.8, "21": 0.9},
                    "x": {"8": 0.8, "12": 0.9, "18": 0.7}
                }
            },
            "combined_strategy": {
                "platform_specific": {
                    "linkedin": {
                        "focus": "Professional networking and B2B audience",
                        "optimal_content": "Industry insights, thought leadership, company updates",
                        "hashtag_strategy": "2-3 relevant professional hashtags",
                        "engagement_tactics": "Ask questions, share industry news"
                    },
                    "facebook": {
                        "focus": "Community engagement and storytelling",
                        "optimal_content": "Community content, updates, customer stories",
                        "hashtag_strategy": "Moderate hashtag usage with community focus",
                        "engagement_tactics": "Ask questions, share stories, create discussions"
                    },
                    "instagram": {
                        "focus": "Visual storytelling and brand aesthetics",
                        "optimal_content": "Visual content, lifestyle, behind-the-scenes",
                        "hashtag_strategy": "Strategic mix of trending and niche hashtags",
                        "engagement_tactics": "Visual storytelling, user-generated content"
                    },
                    "tiktok": {
                        "focus": "Creative storytelling and brand personality",
                        "optimal_content": "Short videos, tutorials, trending content",
                        "hashtag_strategy": "Mix of trending (60%) and niche hashtags (40%)",
                        "engagement_tactics": "Participate in trends, respond to comments"
                    },
                    "x": {
                        "focus": "Real-time engagement and quick insights",
                        "optimal_content": "Quick updates, industry commentary, news",
                        "hashtag_strategy": "Strategic hashtag use with trending topics",
                        "engagement_tactics": "Quick responses, join conversations"
                    }
                },
                "timing_strategy": {
                    "linkedin_optimal_time": "Business hours (9 AM - 5 PM)",
                    "facebook_optimal_time": "Afternoon and evening (3-7 PM)", 
                    "instagram_optimal_time": "Morning and evening (11 AM, 8 PM)",
                    "tiktok_optimal_time": "Evening hours (6-9 PM)",
                    "x_optimal_time": "Business and lunch hours (8 AM, 12 PM, 6 PM)"
                },
                "content_strategy": {
                    "linkedin_style": "Professional and authoritative",
                    "facebook_style": "Conversational and community-focused",
                    "instagram_style": "Creative and visually appealing",
                    "tiktok_style": "Authentic and trendy",
                    "x_style": "Concise and engaging"
                }
            }
        }

    def _generate_fallback_posts(self, platform: str, count: int) -> List[Dict]:
        """Generate fallback posts if AI generation fails"""
        fallback_posts = []
        for i in range(count):
            post = {
                "id": f"fallback_post_{i+1}",
                "platform": platform,
                "content_type": "text",
                "title": f"Business Update #{i+1}",
                "content": f"Exciting updates from our business! Stay tuned for more insights. #{platform.capitalize()}Business #Innovation #Growth",
                "hashtags": [f"#{platform.capitalize()}Business", "#Innovation", "#Growth"],
                "optimal_time": "9:00 AM",
                "engagement_prediction": "medium",
                "image_prompt": "Professional business image with modern design",
                "call_to_action": "Follow us for more updates!"
            }
            fallback_posts.append(post)
        return fallback_posts

    def generate_post_image(self, post_data: Dict, business_summary: str) -> Optional[str]:
        """Generate an image for a social media post using AI"""
        
        if not post_data.get('image_prompt'):
            return None
            
        # Create enhanced prompt based on the business and post content
        enhanced_prompt = f"""
        Create a professional social media image for {post_data['platform']} with these specifications:
        
        Business Context: {business_summary}
        Post Content: {post_data['content']}
        Style Requirements: {post_data['image_prompt']}
        
        Design Requirements:
        1. Platform-optimized dimensions and style for {post_data['platform']}
        2. Professional and engaging visual design
        3. Brand-appropriate colors and fonts
        4. High-quality, social media ready
        5. Include visual elements that support the post message
        6. Modern, clean aesthetic
        
        Create a compelling visual that enhances the post content and engages the target audience.
        """
        
        return self._generate_image_with_pollinations(enhanced_prompt, post_data['platform'])

    def _generate_image_with_pollinations(self, prompt: str, platform: str) -> Optional[str]:
        """Generate image using Pollinations API"""
        base_url = "https://image.pollinations.ai/prompt/"
        
        # Platform-specific dimensions
        dimensions = {
            'linkedin': {'width': 1200, 'height': 627},
            'tiktok': {'width': 1080, 'height': 1920},
            'facebook': {'width': 1200, 'height': 630},
            'instagram': {'width': 1080, 'height': 1080},
            'x': {'width': 1200, 'height': 675}
        }
        
        dims = dimensions.get(platform, {'width': 1080, 'height': 1080})
        
        enhanced_prompt = f"professional social media post image: {prompt}, optimized for {platform}"
        encoded_prompt = requests.utils.quote(enhanced_prompt)
        
        params = {
            'width': dims['width'],
            'height': dims['height'],
            'model': 'flux',
            'seed': random.randint(1, 1000000),
            'enhance': 'true',
            'nologo': 'true'
        }
        
        param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{base_url}{encoded_prompt}?{param_string}"
        
        try:
            response = requests.get(full_url, timeout=60)
            if response.status_code == 200:
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                return image_base64
            else:
                logger.error(f"Pollinations API error: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Image generation error: {e}")
            return None

    def schedule_optimal_posts(self, posts: List[Dict], marketing_insights: Dict, 
                              start_date: datetime = None) -> List[Dict]:
        """Schedule posts based on optimal times from marketing insights"""
        
        if not start_date:
            start_date = datetime.now() + timedelta(hours=1)
        
        scheduled_posts = []
        
        # Get optimal times from marketing insights
        optimal_times = marketing_insights.get('engagement_heatmap', {}).get('best_times', {})
        posting_calendar = marketing_insights.get('posting_calendar', {})
        
        for i, post in enumerate(posts):
            platform = post['platform']
            
            # Get optimal posting times for the platform
            platform_times = optimal_times.get(platform, {
                'morning': 0.7, 'afternoon': 0.5, 'evening': 0.6, 'night': 0.3
            })
            
            # Find the best time slot
            best_time_slot = max(platform_times, key=platform_times.get)
            
            # Convert time slot to actual time
            time_mappings = {
                'morning': (8, 11),    # 8 AM - 11 AM
                'afternoon': (12, 16), # 12 PM - 4 PM
                'evening': (17, 20),   # 5 PM - 8 PM
                'night': (21, 23)      # 9 PM - 11 PM
            }
            
            start_hour, end_hour = time_mappings.get(best_time_slot, (9, 17))
            optimal_hour = random.randint(start_hour, end_hour)
            
            # Schedule the post (spread posts over several days)
            post_date = start_date + timedelta(days=i // 2, hours=optimal_hour - start_date.hour)
            
            scheduled_post = {
                **post,
                'scheduled_time': int(post_date.timestamp()),
                'scheduled_date': post_date.isoformat(),
                'optimal_time_slot': best_time_slot,
                'engagement_score': platform_times[best_time_slot]
            }
            
            scheduled_posts.append(scheduled_post)
        
        return scheduled_posts

    def get_platform_status(self) -> Dict[str, Dict]:
        """Check the configuration status of all platforms"""
        import os
        status = {}
        
        for platform, config in self.platform_configs.items():
            required_fields = {
                'linkedin': ['client_id', 'client_secret', 'access_token'],
                'tiktok': ['client_id', 'client_secret', 'access_token'],
                'facebook': ['app_id', 'app_secret', 'access_token', 'page_id'],
                'instagram': ['app_id', 'app_secret', 'access_token', 'user_id'],
                'x': ['api_key', 'api_secret', 'access_token', 'access_token_secret']
            }
            
            platform_fields = required_fields.get(platform, [])
            configured_fields = []
            missing_fields = []
            
            # Special handling for LinkedIn - check environment variables
            if platform == 'linkedin':
                linkedin_env_mapping = {
                    'client_id': 'LINKEDIN_CLIENT_ID',
                    'client_secret': 'LINKEDIN_CLIENT_SECRET', 
                    'access_token': 'LINKEDIN_ACCESS_TOKEN'
                }
                
                for field in platform_fields:
                    env_var = linkedin_env_mapping.get(field)
                    if env_var and os.getenv(env_var) and str(os.getenv(env_var)).strip():
                        configured_fields.append(field)
                    else:
                        missing_fields.append(field)
            else:
                # For other platforms, use config as before
                configured_fields = [field for field in platform_fields if config.get(field) and str(config.get(field)).strip()]
                missing_fields = [field for field in platform_fields if not (config.get(field) and str(config.get(field)).strip())]
            
            status[platform] = {
                'configured': len(configured_fields) == len(platform_fields),
                'missing_fields': missing_fields,
                'configured_fields': configured_fields,
                'total_fields': len(platform_fields)
            }
        
        return status

    def get_platform_help(self, platform: str) -> Dict[str, str]:
        """Get help information for setting up a specific platform"""
        
        help_info = {
            'linkedin': {
                'title': 'LinkedIn API Setup',
                'description': 'Set up LinkedIn API credentials to post to your LinkedIn profile or company page.',
                'steps': [
                    '1. Go to LinkedIn Developer Portal (https://developer.linkedin.com/)',
                    '2. Create a new app and get your Client ID and Client Secret',
                    '3. Set up OAuth 2.0 redirect URI: http://localhost:8001/social/linkedin/callback',
                    '4. Generate access token with w_member_social scope',
                    '5. Add credentials to your environment variables'
                ],
                'env_vars': [
                    'LINKEDIN_CLIENT_ID=your_client_id',
                    'LINKEDIN_CLIENT_SECRET=your_client_secret',
                    'LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback',
                    'LINKEDIN_ACCESS_TOKEN=your_access_token'
                ]
            },
            'tiktok': {
                'title': 'TikTok API Setup',
                'description': 'Set up TikTok for Developers API to post videos and content.',
                'steps': [
                    '1. Apply for TikTok for Developers (https://developers.tiktok.com/)',
                    '2. Create an app and get Client Key and Client Secret',
                    '3. Set up OAuth redirect URI',
                    '4. Get user access token with video.upload scope',
                    '5. Add credentials to your environment variables'
                ],
                'env_vars': [
                    'TIKTOK_CLIENT_ID=your_client_key',
                    'TIKTOK_CLIENT_SECRET=your_client_secret',
                    'TIKTOK_ACCESS_TOKEN=your_access_token'
                ]
            },
            'facebook': {
                'title': 'Facebook API Setup',
                'description': 'Set up Facebook Graph API to post to your Facebook page.',
                'steps': [
                    '1. Go to Facebook Developers (https://developers.facebook.com/)',
                    '2. Create a new app and get App ID and App Secret',
                    '3. Add Facebook Login and Pages API products',
                    '4. Generate Page Access Token with pages_manage_posts permission',
                    '5. Get your Page ID from your Facebook page settings'
                ],
                'env_vars': [
                    'FACEBOOK_APP_ID=your_app_id',
                    'FACEBOOK_APP_SECRET=your_app_secret',
                    'FACEBOOK_ACCESS_TOKEN=your_page_access_token',
                    'FACEBOOK_PAGE_ID=your_page_id'
                ]
            },
            'instagram': {
                'title': 'Instagram API Setup',
                'description': 'Set up Instagram Basic Display API or Instagram Graph API.',
                'steps': [
                    '1. Go to Facebook Developers (https://developers.facebook.com/)',
                    '2. Create a new app and add Instagram Basic Display or Instagram Graph API',
                    '3. Get App ID and App Secret',
                    '4. Generate User Access Token with instagram_content_publish scope',
                    '5. Get your Instagram User ID'
                ],
                'env_vars': [
                    'INSTAGRAM_APP_ID=your_app_id',
                    'INSTAGRAM_APP_SECRET=your_app_secret',
                    'INSTAGRAM_ACCESS_TOKEN=your_access_token',
                    'INSTAGRAM_USER_ID=your_user_id'
                ]
            },
            'x': {
                'title': 'X (Twitter) API Setup',
                'description': 'Set up X API v2 to post tweets and media.',
                'steps': [
                    '1. Apply for X Developer account (https://developer.twitter.com/)',
                    '2. Create a new app and get API Key and API Secret',
                    '3. Generate Access Token and Access Token Secret',
                    '4. Ensure you have write permissions enabled',
                    '5. Add credentials to your environment variables'
                ],
                'env_vars': [
                    'X_API_KEY=your_api_key',
                    'X_API_SECRET=your_api_secret',
                    'X_ACCESS_TOKEN=your_access_token',
                    'X_ACCESS_TOKEN_SECRET=your_access_token_secret'
                ]
            }
        }
        
        return help_info.get(platform, {
            'title': 'Platform Not Found',
            'description': 'Please select a valid platform.',
            'steps': [],
            'env_vars': []
        })

# Initialize the agent
social_media_agent = SocialMediaAgent()
