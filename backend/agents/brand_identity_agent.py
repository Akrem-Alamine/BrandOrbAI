#!/usr/bin/env python3
"""
Enhanced Brand Identity Agent - Comprehensive Brand Book Generation
Refactored: cleaner prompts, JSON parsing robustness, revision support.
"""

import json
import re
import requests
from openai import OpenAI
import base64
from io import BytesIO
from PIL import Image
import random
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
import os

logger = logging.getLogger(__name__)

class BrandIdentityAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        api_key = os.getenv("OPENROUTER_API_KEY")
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key or ""
        )
    
    def analyze_brand_context(self, business_summary: str, chatbot_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze business context and chatbot data to extract brand requirements"""
        
        # Extract chatbot data if provided
        company_name = chatbot_data.get('company_name', '') if chatbot_data else ''
        brand_values = chatbot_data.get('brand_values', []) if chatbot_data else []
        target_audience = chatbot_data.get('target_audience', '') if chatbot_data else ''
        brand_personality = chatbot_data.get('brand_personality', '') if chatbot_data else ''
        visual_preferences = chatbot_data.get('visual_preferences', {}) if chatbot_data else {}
        
        prompt = f"""
You are a senior brand strategist. Extract concise structured context.
Business Summary: {business_summary}\nChat Inputs: {chatbot_data or {}}
Return JSON with keys: brand_strategy(mission, vision, core_values[3-6], unique_selling_proposition, brand_personality_traits[3-6]), target_analysis(primary_audience, secondary_audience, audience_pain_points[3], audience_aspirations[2]), brand_positioning(market_position, competitive_advantage, brand_promise, tone_of_voice), visual_direction(overall_style, color_psychology, typography_style, imagery_style).
Only JSON.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            return self._safe_extract_json(content, self._create_fallback_brand_context(chatbot_data.get('company_name','') if chatbot_data else '', business_summary))
        except Exception as e:
            logger.error(f"Error analyzing brand context: {e}")
            return self._create_fallback_brand_context(chatbot_data.get('company_name','') if chatbot_data else '', business_summary)
    
    def generate_brand_book(self, brand_context: Dict[str, Any], business_summary: str) -> Dict[str, Any]:
        safe_context = json.dumps(brand_context)[:2800]
        prompt = (
            "You are a senior brand strategist. Create brand book JSON only. "
            f"Input Context: {safe_context}\n"
            "Return ONLY JSON with keys: \n"
            "{\n"
            "  \"brand_overview\": {\n"
            "     \"brand_name\": \"Company name\", \n"
            "     \"tagline\": \"Memorable brand tagline\", \n"
            "     \"mission_statement\": \"Detailed mission statement\", \n"
            "     \"vision_statement\": \"Detailed vision statement\", \n"
            "     \"brand_story\": \"Narrative\", \n"
            "     \"core_values\": [\"Value\", \"Value\", \"Value\"]\n"
            "  },\n"
            "  \"visual_identity\": {\n"
            "     \"logo_guidelines\": {\n"
            "        \"logo_concept\": \"Concept description\", \n"
            "        \"logo_variations\": [\"Primary\", \"Secondary\", \"Icon\"], \n"
            "        \"logo_usage_rules\": [\"Rule 1\", \"Rule 2\"], \n"
            "        \"logo_dont_guidelines\": [\"Don't rule 1\", \"Don't rule 2\"]\n"
            "     },\n"
            "     \"color_system\": {\n"
            "        \"primary_colors\": [{\"name\": \"Primary\", \"hex\": \"#2563EB\", \"usage\": \"Main\"}],\n"
            "        \"secondary_colors\": [{\"name\": \"Accent\", \"hex\": \"#10b981\", \"usage\": \"Accent\"}],\n"
            "        \"neutral_colors\": [{\"name\": \"Dark\", \"hex\": \"#111827\", \"usage\": \"Text\"}]\n"
            "     },\n"
            "     \"typography\": {\n"
            "        \"primary_font\": {\"name\": \"Inter\", \"usage\": \"Headings\", \"personality\": \"Modern\"},\n"
            "        \"secondary_font\": {\"name\": \"Roboto\", \"usage\": \"Body\", \"personality\": \"Readable\"},\n"
            "        \"font_hierarchy\": [\"H1\", \"H2\", \"Body\", \"Caption\"]\n"
            "     }\n"
            "  },\n"
            "  \"voice_and_tone\": {\n"
            "     \"brand_voice\": {\"personality\": \"Description\", \"tone_attributes\": [\"Trait\"], \"communication_style\": \"Style\"},\n"
            "     \"messaging_guidelines\": {\"key_messages\": [\"Message\"], \"value_propositions\": [\"Value\"], \"elevator_pitch\": \"Pitch\"},\n"
            "     \"tone_examples\": {\"formal_communication\": \"Text\", \"casual_communication\": \"Text\", \"social_media_tone\": \"Text\"}\n"
            "  },\n"
            "  \"application_guidelines\": {\n"
            "     \"business_cards\": \"Guidelines\", \n"
            "     \"website_guidelines\": \"Guidelines\", \n"
            "     \"social_media\": \"Guidelines\", \n"
            "     \"marketing_materials\": \"Guidelines\"\n"
            "  },\n"
            "  \"dos_and_donts\": {\n"
            "     \"logo_usage\": {\"dos\": [\"Do\"], \"donts\": [\"Don't\"]},\n"
            "     \"color_usage\": {\"dos\": [\"Do\"], \"donts\": [\"Don't\"]},\n"
            "     \"typography\": {\"dos\": [\"Do\"], \"donts\": [\"Don't\"]},\n"
            "     \"general_brand\": {\"dos\": [\"Do\"], \"donts\": [\"Don't\"]}\n"
            "  }\n"
            "}"
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.25
            )
            content = response.choices[0].message.content
            return self._safe_extract_json(content, self._create_fallback_brand_book())
        except Exception as e:
            logger.error(f"Error generating brand book: {e}")
            return self._create_fallback_brand_book()
    
    def generate_color_palettes(self, brand_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate multiple color palette options based on brand context"""
        
        visual_direction = brand_context.get('visual_direction', {})
        brand_personality = brand_context.get('brand_strategy', {}).get('brand_personality_traits', [])
        
        prompt = f"""
Generate 5 harmonious professional color palettes from context: {brand_context.get('visual_direction', {})}. JSON only: palettes:[{ '{' }name, description, mood, colors:[{{hex,name,usage}}] { '}' }]. Valid hex codes.
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.55
            )
            
            return self._safe_extract_json(response.choices[0].message.content, self._create_default_color_palettes())
        except Exception as e:
            logger.error(f"Error generating color palettes: {e}")
            return self._create_default_color_palettes()
    
    def generate_logo_concepts(self, brand_context: Dict[str, Any], selected_colors: List[str]) -> Dict[str, Any]:
        """Generate multiple logo concept descriptions"""
        
        brand_strategy = brand_context.get('brand_strategy', {})
        visual_direction = brand_context.get('visual_direction', {})
        
        prompt = f"""
Create 5 distinct logo concepts. Context: {brand_context.get('brand_strategy',{})}. Colors: {selected_colors}. JSON: concepts:[{ '{' }name, style, description, elements[], symbolism, technical_specs{ '}' }].
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6
            )
            
            return self._safe_extract_json(response.choices[0].message.content, self._create_default_logo_concepts())
        except Exception as e:
            logger.error(f"Error generating logo concepts: {e}")
            return self._create_default_logo_concepts()
    
    def generate_logo_image(self, brand_name: str, logo_concept: Dict[str, Any], colors: List[str]) -> Dict[str, Any]:
        """Generate actual logo image using Pollinations API"""
        
        # Convert hex colors to descriptive names
        color_names = []
        for hex_color in colors:
            color_name_prompt = f"""
            Convert this hex color {hex_color} to a descriptive color name.
            Return ONLY the color name (like: navy blue, forest green, crimson red, etc.)
            """
            
            try:
                color_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": color_name_prompt}],
                    temperature=0.1
                )
                color_name = color_response.choices[0].message.content.strip().lower()
                color_names.append(color_name)
            except:
                color_names.append("brand color")
        
        colors_description = ", ".join(color_names)
        
        # Generate detailed logo prompt
        logo_prompt = f"""
        Create a detailed Pollinations AI prompt for generating a professional logo:
        
        Brand Name: "{brand_name}"
        Concept: {logo_concept}
        Colors: {colors_description} (hex: {colors})
        
        Requirements:
        1. Professional, high-resolution logo design
        2. Use EXACTLY these colors: {colors_description}
        3. Include the brand name "{brand_name}" prominently
        4. Style: {logo_concept.get('style', 'modern')}
        5. Elements: {logo_concept.get('elements', [])}
        6. Clean white background
        7. Scalable vector-style design
        8. Corporate/business appropriate
        
        The logo should embody: {logo_concept.get('symbolism', 'professionalism and trust')}
        
        Return ONLY the final prompt for AI image generation.
        """
        
        try:
            prompt_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": logo_prompt}],
                temperature=0.4
            )
            
            enhanced_prompt = prompt_response.choices[0].message.content.strip()
            enhanced_prompt = f"Professional business logo: {enhanced_prompt} using exact colors: {colors_description}"
            
            # Generate logo using Pollinations
            return self._generate_with_pollinations(enhanced_prompt)
            
        except Exception as e:
            logger.error(f"Error generating logo image: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_brand_assets(self, brand_book: Dict[str, Any], logo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate additional brand assets like business cards, letterheads, etc."""
        
        brand_name = brand_book.get('brand_overview', {}).get('brand_name', 'Brand')
        colors = brand_book.get('visual_identity', {}).get('color_system', {})
        
        # Extract primary colors
        primary_colors = []
        if colors.get('primary_colors'):
            primary_colors = [color['hex'] for color in colors['primary_colors']]
        
        assets = {}
        
        # Generate business card design
        try:
            business_card_prompt = f"""
            Professional business card design for {brand_name}:
            - Clean, modern layout
            - Brand colors: {primary_colors}
            - Include logo space, contact info layout
            - Professional typography
            - Standard business card proportions
            - High-quality, print-ready design
            """
            
            assets['business_card'] = self._generate_with_pollinations(business_card_prompt)
            
        except Exception as e:
            logger.error(f"Error generating business card: {e}")
            assets['business_card'] = {"success": False, "error": str(e)}
        
        # Generate letterhead design
        try:
            letterhead_prompt = f"""
            Professional letterhead design for {brand_name}:
            - Elegant header with logo placement
            - Brand colors: {primary_colors}
            - Clean layout for formal correspondence
            - Professional typography
            - A4 document format
            - Corporate appearance
            """
            
            assets['letterhead'] = self._generate_with_pollinations(letterhead_prompt)
            
        except Exception as e:
            logger.error(f"Error generating letterhead: {e}")
            assets['letterhead'] = {"success": False, "error": str(e)}
        
        return assets
    
    def _generate_with_pollinations(self, prompt: str) -> Dict[str, Any]:
        """Generate image using Pollinations API"""
        try:
            base_url = "https://image.pollinations.ai/prompt/"
            enhanced_prompt = f"professional design: {prompt}, high quality, crisp, business-appropriate"
            encoded_prompt = requests.utils.quote(enhanced_prompt)
            
            params = {
                'width': 1024,
                'height': 1024,
                'model': 'flux',
                'seed': random.randint(1, 1000000),
                'enhance': 'true',
                'nologo': 'true'
            }
            
            param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            full_url = f"{base_url}{encoded_prompt}?{param_string}"
            
            response = requests.get(full_url, timeout=60)
            
            if response.status_code == 200:
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                
                return {
                    'success': True,
                    'image_data': image_base64,
                    'image_bytes': image_bytes,
                    'prompt': enhanced_prompt,
                    'url': full_url
                }
            else:
                return {"success": False, "error": f"API error: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _safe_extract_json(self, content: str, fallback: Any) -> Any:
        """Attempt to extract first JSON object/array from LLM content; fallback on failure."""
        try:
            import re, json as _json
            match = re.search(r'\{.*\}|\[.*\]', content, re.DOTALL)
            if match:
                return _json.loads(match.group())
        except Exception as e:
            logger.warning(f"JSON parse failed: {e}")
        return fallback
    
    def _create_fallback_brand_context(self, company_name: str, business_summary: str) -> Dict[str, Any]:
        """Create fallback brand context when AI analysis fails"""
        return {
            "brand_strategy": {
                "mission": f"To provide exceptional value to our customers through {business_summary[:100]}",
                "vision": "To be a leading provider in our industry",
                "core_values": ["Quality", "Innovation", "Customer Focus"],
                "unique_selling_proposition": "Unique value proposition based on our expertise",
                "brand_personality_traits": ["Professional", "Reliable", "Innovative"]
            },
            "target_analysis": {
                "primary_audience": "Business professionals and customers",
                "secondary_audience": "Industry stakeholders",
                "audience_pain_points": ["Need for quality solutions", "Time constraints", "Budget considerations"],
                "audience_aspirations": ["Success", "Efficiency", "Growth"]
            },
            "brand_positioning": {
                "market_position": "Quality-focused provider",
                "competitive_advantage": "Expertise and customer service",
                "brand_promise": "Delivering exceptional results",
                "tone_of_voice": "Professional and approachable"
            },
            "visual_direction": {
                "overall_style": "Modern and professional",
                "color_psychology": "Trust, reliability, and innovation",
                "typography_style": "Clean and readable",
                "imagery_style": "Professional and authentic"
            }
        }
    
    def _create_fallback_brand_book(self) -> Dict[str, Any]:
        """Create fallback brand book structure"""
        return {
            "brand_overview": {
                "brand_name": "Brand Name",
                "tagline": "Your Success, Our Priority",
                "mission_statement": "To deliver exceptional value through innovative solutions",
                "vision_statement": "To be the preferred choice in our industry",
                "brand_story": "A company built on principles of quality and customer satisfaction",
                "core_values": ["Quality", "Innovation", "Integrity", "Customer Focus"]
            },
            "visual_identity": {
                "logo_guidelines": {
                    "logo_concept": "Modern and professional logo design",
                    "logo_variations": ["Primary", "Secondary", "Icon"],
                    "logo_usage_rules": ["Maintain clear space", "Use approved colors", "Keep proportions"],
                    "logo_dont_guidelines": ["Don't stretch", "Don't change colors", "Don't add effects"]
                },
                "color_system": {
                    "primary_colors": [
                        {"name": "Brand Primary", "hex": "#2563eb", "usage": "Main brand color"},
                        {"name": "Brand Secondary", "hex": "#1f2937", "usage": "Supporting color"}
                    ],
                    "secondary_colors": [
                        {"name": "Accent", "hex": "#10b981", "usage": "Highlights"},
                        {"name": "Neutral", "hex": "#6b7280", "usage": "Text and backgrounds"}
                    ],
                    "neutral_colors": [
                        {"name": "Dark", "hex": "#111827", "usage": "Text"},
                        {"name": "Light", "hex": "#f9fafb", "usage": "Backgrounds"}
                    ]
                },
                "typography": {
                    "primary_font": {
                        "name": "Inter",
                        "usage": "Headlines and main text",
                        "personality": "Modern, clean, readable"
                    },
                    "secondary_font": {
                        "name": "Roboto",
                        "usage": "Body text and details",
                        "personality": "Neutral and versatile"
                    },
                    "font_hierarchy": ["Headlines", "Subheadings", "Body text", "Captions"]
                }
            },
            "voice_and_tone": {
                "brand_voice": {
                    "personality": "Professional yet approachable",
                    "tone_attributes": ["Confident", "Helpful", "Clear"],
                    "communication_style": "Direct and informative with a human touch"
                },
                "messaging_guidelines": {
                    "key_messages": ["Quality solutions", "Customer-focused approach"],
                    "value_propositions": ["Exceptional service", "Proven results"],
                    "elevator_pitch": "We provide quality solutions that help our customers succeed"
                },
                "tone_examples": {
                    "formal_communication": "We are pleased to present our comprehensive solution",
                    "casual_communication": "Here's how we can help you achieve your goals",
                    "social_media_tone": "Celebrating another successful project! 🎉"
                }
            }
        }
    
    def _create_default_color_palettes(self) -> Dict[str, Any]:
        """Create default color palettes"""
        return {
            "palettes": [
                {
                    "name": "Professional Blue",
                    "description": "Trust and reliability",
                    "mood": "Professional",
                    "colors": [
                        {"hex": "#2563eb", "name": "Primary Blue", "usage": "Primary"},
                        {"hex": "#1f2937", "name": "Dark Gray", "usage": "Secondary"},
                        {"hex": "#10b981", "name": "Green Accent", "usage": "Accent"},
                        {"hex": "#f9fafb", "name": "Light Gray", "usage": "Background"}
                    ]
                }
            ]
        }
    
    def _create_default_logo_concepts(self) -> Dict[str, Any]:
        """Create default logo concepts"""
        return {
            "concepts": [
                {
                    "name": "Modern Minimalist",
                    "style": "Minimalist",
                    "description": "Clean, simple design with strong typography",
                    "elements": ["Typography", "Simple Icon"],
                    "symbolism": "Clarity and professionalism",
                    "technical_specs": "Scalable, works in all sizes"
                }
            ]
        }
    
    def revise_brand_identity(self, current_identity: Dict[str, Any], section: str, instruction: str) -> Dict[str, Any]:
        """Produce an expert critique & updated section while preserving consistency."""
        fallback = {"updated_identity": current_identity, "critique": "No change applied."}
        prompt = f"""
You are a senior brand strategist & design director. A user wants to modify section '{section}'.
Instruction: {instruction}
Current Brand Identity JSON: {json.dumps(current_identity)[:6000]}
Return JSON only:
{{
  "critique": "Brief expert evaluation of the instruction (support / warn / alternative).",
  "applied_changes": true|false,
  "updated_section": {{...}} ,
  "updated_identity": {{(full updated identity JSON if changes applied, else original)}},
  "rationale": "Why changes were / weren't applied (focus on consistency, accessibility, distinctiveness).",
  "follow_up_questions": ["question1", "question2"]
}}
If request harms brand coherence (e.g., too many colors, off-tone), set applied_changes false and propose alternatives.
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4
            )
            return self._safe_extract_json(response.choices[0].message.content, fallback)
        except Exception as e:
            logger.error(f"Revision error: {e}")
            return fallback

def run_brand_identity_analysis(business_summary: str, chatbot_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Main function to run complete brand identity analysis"""
    try:
        agent = BrandIdentityAgent()
        
        # Step 1: Analyze brand context
        logger.info("Analyzing brand context...")
        brand_context = agent.analyze_brand_context(business_summary, chatbot_data)
        
        # Step 2: Generate comprehensive brand book
        logger.info("Generating brand book...")
        brand_book = agent.generate_brand_book(brand_context, business_summary)
        
        # Step 3: Generate color palettes
        logger.info("Generating color palettes...")
        color_palettes = agent.generate_color_palettes(brand_context)
        
        # Step 4: Generate logo concepts
        logger.info("Generating logo concepts...")
        logo_concepts = agent.generate_logo_concepts(brand_context, [])
        
        return {
            "success": True,
            "brand_context": brand_context,
            "brand_book": brand_book,
            "color_palettes": color_palettes,
            "logo_concepts": logo_concepts,
            "generation_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in brand identity analysis: {e}")
        return {
            "success": False,
            "error": str(e),
            "generation_time": datetime.now().isoformat()
        }
