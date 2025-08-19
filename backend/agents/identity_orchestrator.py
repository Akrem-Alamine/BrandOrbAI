#!/usr/bin/env python3
"""
Brand Identity Orchestrator - Comprehensive Integration
Orchestrates logo generation, flyer creation, and brand identity services
"""

import json
import logging
import os
import sys
import asyncio
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from openai import OpenAI

# Remove manual path insertion and use proper package-relative imports
try:
    from .identity.main import LogoGeneratorAgent  # type: ignore
    LOGO_AGENT_AVAILABLE = True
except Exception as e:
    logging.warning(f"LogoGeneratorAgent not available: {e}")
    LogoGeneratorAgent = None
    LOGO_AGENT_AVAILABLE = False

try:
    from .identity.flyer_generator import FlyerGeneratorAgent  # type: ignore
    FLYER_AGENT_AVAILABLE = True
except Exception as e:
    logging.warning(f"FlyerGeneratorAgent not available: {e}")
    FlyerGeneratorAgent = None
    FLYER_AGENT_AVAILABLE = False

logger = logging.getLogger(__name__)

class IdentityOrchestrator:
    """Orchestrates all brand identity creation services"""
    
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY", "")
        )
        if not self.client.api_key:
            logger.warning("OPENROUTER_API_KEY not set; AI generations may fail")
        
        # Initialize agents if available
        try:
            self.logo_agent = LogoGeneratorAgent() if LOGO_AGENT_AVAILABLE else None
            if self.logo_agent:
                logger.info("LogoGeneratorAgent initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize LogoGeneratorAgent: {e}")
            self.logo_agent = None
            
        try:
            self.flyer_agent = FlyerGeneratorAgent() if FLYER_AGENT_AVAILABLE else None
            if self.flyer_agent:
                logger.info("FlyerGeneratorAgent initialized successfully")  
        except Exception as e:
            logger.warning(f"Failed to initialize FlyerGeneratorAgent: {e}")
            self.flyer_agent = None
        
        # Identity service endpoints (if running separately)
        self.logo_api_base = "http://localhost:8000"
        self.flyer_api_base = "http://localhost:8001"
        
    def create_comprehensive_brand_identity(
        self, 
        business_summary: str, 
        brand_discovery_data: Optional[Dict] = None,
        existing_business_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a comprehensive brand identity including:
        - Brand strategy and guidelines
        - Logo concepts and generation
        - Marketing materials (flyers, business cards)
        - Visual identity system
        """
        try:
            logger.info("Starting comprehensive brand identity creation")
            
            # Step 1: Extract brand essentials
            brand_essentials = self._extract_brand_essentials(
                business_summary, 
                brand_discovery_data, 
                existing_business_data
            )
            
            # Step 2: Generate color palettes
            color_palettes = self._generate_color_palettes(brand_essentials)
            
            # Step 3: Create logo concepts and generate actual logos
            logo_system = self._create_logo_system(brand_essentials, color_palettes)
            
            # Step 4: Generate marketing materials
            marketing_materials = self._generate_marketing_materials(
                brand_essentials, 
                logo_system, 
                color_palettes
            )
            
            # Step 5: Create brand guidelines
            brand_guidelines = self._create_brand_guidelines(
                brand_essentials, 
                logo_system, 
                color_palettes,
                marketing_materials
            )
            
            # Step 6: Compile comprehensive brand book
            brand_book = self._compile_brand_book(
                brand_essentials,
                logo_system,
                color_palettes,
                marketing_materials,
                brand_guidelines
            )
            
            return {
                "success": True,
                "brand_identity": {
                    "brand_essentials": brand_essentials,
                    "logo_system": logo_system,
                    "color_palettes": color_palettes,
                    "marketing_materials": marketing_materials,
                    "brand_guidelines": brand_guidelines,
                    "brand_book": brand_book
                },
                "generation_metadata": {
                    "created_at": datetime.now().isoformat(),
                    "orchestrator_version": "2.0",
                    "services_used": self._get_services_status()
                }
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive brand identity creation: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_brand_essentials(
        self, 
        business_summary: str, 
        discovery_data: Optional[Dict] = None,
        existing_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Extract essential brand information from all available data"""
        
        prompt = f"""
        Analyze the following business information and extract essential brand elements:
        
        Business Summary: {business_summary}
        
        {f"Brand Discovery Data: {json.dumps(discovery_data, indent=2)}" if discovery_data else ""}
        
        {f"Existing Business Analysis: {json.dumps(existing_data, indent=2)}" if existing_data else ""}
        
        Extract and structure the following brand essentials:
        
        {{
            "business_name": "Business name or generate one if not provided",
            "tagline": "Short, memorable tagline",
            "mission": "Mission statement",
            "vision": "Vision statement", 
            "core_values": ["value1", "value2", "value3"],
            "target_audience": {{
                "primary": "Primary target audience description",
                "demographics": "Age, income, location, etc.",
                "psychographics": "Interests, values, lifestyle"
            }},
            "brand_personality": {{
                "traits": ["trait1", "trait2", "trait3"],
                "tone": "Communication tone",
                "voice": "Brand voice description"
            }},
            "competitive_positioning": "How the brand positions against competitors",
            "unique_value_proposition": "What makes this brand unique",
            "industry_context": "Industry and market context",
            "brand_story": "Compelling brand narrative"
        }}
        
        Return only the JSON structure with no additional text.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not extract JSON from response")
                
        except Exception as e:
            logger.error(f"Error extracting brand essentials: {e}")
            return self._create_fallback_essentials(business_summary)
    
    def _generate_color_palettes(self, brand_essentials: Dict) -> Dict[str, Any]:
        """Generate color palettes using the logo agent or AI"""
        
        if self.logo_agent:
            try:
                # Use the logo agent's color palette generation
                palettes = self.logo_agent.generate_color_palette(
                    f"{brand_essentials.get('business_name', '')} - {brand_essentials.get('brand_story', '')}"
                )
                return palettes
            except Exception as e:
                logger.warning(f"Logo agent color generation failed: {e}")
        
        # Fallback to AI-generated palettes
        return self._generate_ai_color_palettes(brand_essentials)
    
    def _create_logo_system(self, brand_essentials: Dict, color_palettes: Dict) -> Dict[str, Any]:
        """Create comprehensive logo system with multiple variations"""
        
        logo_system = {
            "concepts": [],
            "generated_logos": [],
            "logo_guidelines": {},
            "variations": {}
        }
        
        # Generate logo concepts
        logo_concepts = self._generate_logo_concepts(brand_essentials)
        logo_system["concepts"] = logo_concepts
        
        # Generate actual logos if logo agent is available
        if self.logo_agent and color_palettes.get("palettes"):
            try:
                generated_logos = []
                
                # Take the first color palette for generation
                primary_palette = color_palettes["palettes"][0]
                selected_colors = primary_palette.get("colors", ["#000000", "#FFFFFF"])
                
                # Generate logos for each concept
                for i, concept in enumerate(logo_concepts[:3]):  # Limit to 3 concepts
                    logo_result = self.logo_agent.generate_logo(
                        brand_essentials.get("brand_story", ""),
                        concept.get("description", ""),
                        selected_colors
                    )
                    
                    if logo_result and logo_result.get("success"):
                        generated_logos.append({
                            "concept_index": i,
                            "concept_name": concept.get("name", f"Concept {i+1}"),
                            "logo_data": logo_result,
                            "colors_used": selected_colors
                        })
                
                logo_system["generated_logos"] = generated_logos
                
                # Generate 3D versions for the first logo
                if generated_logos:
                    first_logo = generated_logos[0]
                    threed_result = self.logo_agent.generate_3d_logo(
                        brand_essentials.get("brand_story", ""),
                        first_logo["concept_name"],
                        selected_colors,
                        first_logo["logo_data"].get("prompt", "")
                    )
                    
                    if threed_result and threed_result.get("success"):
                        logo_system["variations"]["3d_version"] = threed_result
                
            except Exception as e:
                logger.warning(f"Logo generation failed: {e}")
        
        # Create logo guidelines
        logo_system["logo_guidelines"] = self._create_logo_guidelines(brand_essentials, logo_system)
        
        return logo_system
    
    def _generate_marketing_materials(
        self, 
        brand_essentials: Dict, 
        logo_system: Dict, 
        color_palettes: Dict
    ) -> Dict[str, Any]:
        """Generate marketing materials including flyers and business cards"""
        
        marketing_materials = {
            "flyers": [],
            "business_cards": [],
            "social_media_templates": [],
            "letterhead": []
        }
        
        # Generate flyers if flyer agent is available
        if self.flyer_agent:
            try:
                flyer_result = self.flyer_agent.generate_comprehensive_flyer(
                    brand_essentials.get("brand_story", ""),
                    f"{brand_essentials.get('business_name', '')} - {brand_essentials.get('tagline', '')}"
                )
                
                if flyer_result:
                    marketing_materials["flyers"].append(flyer_result)
                    
            except Exception as e:
                logger.warning(f"Flyer generation failed: {e}")
        
        # Generate business card concepts
        marketing_materials["business_cards"] = self._generate_business_card_concepts(
            brand_essentials, logo_system, color_palettes
        )
        
        # Generate social media templates
        marketing_materials["social_media_templates"] = self._generate_social_media_concepts(
            brand_essentials, logo_system, color_palettes
        )
        
        return marketing_materials
    
    def _create_brand_guidelines(
        self, 
        brand_essentials: Dict,
        logo_system: Dict,
        color_palettes: Dict,
        marketing_materials: Dict
    ) -> Dict[str, Any]:
        """Create comprehensive brand guidelines"""
        
        prompt = f"""
        Create comprehensive brand guidelines based on the following brand information:
        
        Brand Essentials: {json.dumps(brand_essentials, indent=2)}
        Logo System: {json.dumps(logo_system.get("concepts", []), indent=2)}
        Color Palettes: {json.dumps(color_palettes, indent=2)}
        
        Create detailed brand guidelines in this structure:
        
        {{
            "logo_usage": {{
                "dos": ["Guideline 1", "Guideline 2", "Guideline 3"],
                "donts": ["Don't do this", "Avoid that", "Never this"],
                "minimum_sizes": "Minimum size specifications",
                "clear_space": "Clear space requirements",
                "placement_rules": "Where and how to place the logo"
            }},
            "color_usage": {{
                "primary_usage": "When to use primary colors",
                "secondary_usage": "When to use secondary colors",
                "accessibility": "Color accessibility guidelines",
                "combinations": "Approved color combinations",
                "backgrounds": "Background color usage"
            }},
            "typography": {{
                "primary_font": "Primary font selection and usage",
                "secondary_font": "Secondary font for body text",
                "hierarchy": "Typography hierarchy rules",
                "sizing": "Font sizing guidelines",
                "spacing": "Letter and line spacing"
            }},
            "voice_and_tone": {{
                "communication_style": "How the brand communicates",
                "tone_guidelines": "Tone of voice in different contexts",
                "language_preferences": "Preferred language and terminology",
                "messaging_dos_donts": ["Do say this", "Don't say that"]
            }},
            "application_guidelines": {{
                "business_cards": "Business card design rules",
                "letterhead": "Letterhead specifications",
                "social_media": "Social media usage guidelines",
                "website": "Website design guidelines",
                "marketing_materials": "Marketing material specifications"
            }},
            "brand_protection": {{
                "trademark_usage": "How to use trademark symbols",
                "co_branding": "Rules for co-branding",
                "approval_process": "Brand approval workflow"
            }}
        }}
        
        Return only the JSON structure.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            
            content = response.choices[0].message.content.strip()
            
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise ValueError("Could not extract JSON from guidelines response")
                
        except Exception as e:
            logger.error(f"Error creating brand guidelines: {e}")
            return self._create_fallback_guidelines()
    
    def _compile_brand_book(
        self,
        brand_essentials: Dict,
        logo_system: Dict,
        color_palettes: Dict,
        marketing_materials: Dict,
        brand_guidelines: Dict
    ) -> Dict[str, Any]:
        """Compile everything into a comprehensive brand book"""
        
        return {
            "brand_overview": {
                "brand_name": brand_essentials.get("business_name", ""),
                "tagline": brand_essentials.get("tagline", ""),
                "mission": brand_essentials.get("mission", ""),
                "vision": brand_essentials.get("vision", ""),
                "brand_story": brand_essentials.get("brand_story", ""),
                "core_values": brand_essentials.get("core_values", [])
            },
            "visual_identity": {
                "logo_system": logo_system,
                "color_palettes": color_palettes,
                "typography": brand_guidelines.get("typography", {}),
                "imagery_style": "Professional, clean, modern imagery that aligns with brand values"
            },
            "voice_and_tone": {
                "brand_voice": brand_essentials.get("brand_personality", {}),
                "communication_guidelines": brand_guidelines.get("voice_and_tone", {}),
                "messaging_framework": {
                    "key_messages": [brand_essentials.get("unique_value_proposition", "")],
                    "value_propositions": [brand_essentials.get("competitive_positioning", "")],
                    "elevator_pitch": f"We are {brand_essentials.get('business_name', '')} - {brand_essentials.get('tagline', '')}"
                }
            },
            "application_guidelines": brand_guidelines.get("application_guidelines", {}),
            "marketing_materials": marketing_materials,
            "brand_protection": brand_guidelines.get("brand_protection", {}),
            "implementation_roadmap": {
                "phase_1": "Logo implementation and basic collateral",
                "phase_2": "Website and digital presence",
                "phase_3": "Comprehensive marketing campaign",
                "phase_4": "Brand monitoring and optimization"
            }
        }
    
    # Helper methods
    def _create_fallback_essentials(self, business_summary: str) -> Dict[str, Any]:
        """Create basic brand essentials when AI extraction fails"""
        return {
            "business_name": "New Business",
            "tagline": "Excellence in Everything",
            "mission": "To provide exceptional value to our customers",
            "vision": "To be the leading provider in our industry",
            "core_values": ["Quality", "Innovation", "Customer Focus"],
            "target_audience": {
                "primary": "Businesses and individuals seeking quality solutions",
                "demographics": "All age groups, middle to high income",
                "psychographics": "Value-conscious, quality-focused"
            },
            "brand_personality": {
                "traits": ["Professional", "Trustworthy", "Innovative"],
                "tone": "Professional yet approachable",
                "voice": "Confident and knowledgeable"
            },
            "competitive_positioning": "Premium quality with excellent customer service",
            "unique_value_proposition": "Unique combination of quality and service",
            "industry_context": "Professional services",
            "brand_story": business_summary
        }
    
    def _generate_ai_color_palettes(self, brand_essentials: Dict) -> Dict[str, Any]:
        """Generate color palettes using AI when logo agent is not available"""
        
        prompt = f"""
        Create 3 professional color palettes for this brand:
        
        Business: {brand_essentials.get('business_name', '')}
        Industry: {brand_essentials.get('industry_context', '')}
        Personality: {', '.join(brand_essentials.get('brand_personality', {}).get('traits', []))}
        Target Audience: {brand_essentials.get('target_audience', {}).get('primary', '')}
        
        Return in this format:
        {{
            "palettes": [
                {{
                    "name": "Palette Name",
                    "description": "Why this palette fits the brand",
                    "mood": "Professional/Modern/Creative/etc",
                    "colors": ["#hexcode1", "#hexcode2", "#hexcode3", "#hexcode4"]
                }}
            ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4
            )
            
            content = response.choices[0].message.content.strip()
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"AI color palette generation failed: {e}")
        
        # Fallback color palettes
        return {
            "palettes": [
                {
                    "name": "Professional Blue",
                    "description": "Trustworthy and professional",
                    "mood": "Professional",
                    "colors": ["#2563EB", "#1E40AF", "#3B82F6", "#93C5FD"]
                },
                {
                    "name": "Modern Neutral",
                    "description": "Clean and contemporary",
                    "mood": "Modern",
                    "colors": ["#374151", "#6B7280", "#9CA3AF", "#F3F4F6"]
                },
                {
                    "name": "Creative Accent",
                    "description": "Creative with pop of color",
                    "mood": "Creative",
                    "colors": ["#7C3AED", "#A855F7", "#C084FC", "#E9D5FF"]
                }
            ]
        }
    
    def _generate_logo_concepts(self, brand_essentials: Dict) -> List[Dict]:
        """Generate logo concepts using AI"""
        
        prompt = f"""
        Create 4 diverse logo concepts for this brand:
        
        Brand: {brand_essentials.get('business_name', '')}
        Industry: {brand_essentials.get('industry_context', '')}
        Personality: {', '.join(brand_essentials.get('brand_personality', {}).get('traits', []))}
        Values: {', '.join(brand_essentials.get('core_values', []))}
        
        For each concept, provide:
        {{
            "concepts": [
                {{
                    "name": "Concept Name",
                    "style": "Minimalist/Modern/Classic/Creative",
                    "description": "Detailed description of the logo concept",
                    "elements": ["element1", "element2"],
                    "symbolism": "What the logo represents",
                    "target_appeal": "Who this concept appeals to most"
                }}
            ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6
            )
            
            content = response.choices[0].message.content.strip()
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result.get("concepts", [])
        except Exception as e:
            logger.warning(f"Logo concept generation failed: {e}")
        
        # Fallback concepts
        return [
            {
                "name": "Professional Wordmark",
                "style": "Minimalist",
                "description": "Clean typography-based logo",
                "elements": ["Typography", "Simple icon"],
                "symbolism": "Professionalism and clarity",
                "target_appeal": "Business professionals"
            }
        ]
    
    def _create_logo_guidelines(self, brand_essentials: Dict, logo_system: Dict) -> Dict[str, Any]:
        """Create logo usage guidelines"""
        return {
            "minimum_size": "Logo should not be smaller than 24px in digital or 0.5 inches in print",
            "clear_space": "Maintain clear space equal to the height of the logo on all sides",
            "acceptable_backgrounds": ["White", "Light gray", "Dark backgrounds with light logo"],
            "file_formats": ["PNG for digital", "SVG for scalable", "EPS for print"],
            "color_variations": ["Full color", "Single color", "Black", "White"],
            "usage_contexts": ["Business cards", "Letterhead", "Website", "Social media", "Marketing materials"]
        }
    
    def _generate_business_card_concepts(self, brand_essentials: Dict, logo_system: Dict, color_palettes: Dict) -> List[Dict]:
        """Generate business card design concepts"""
        return [
            {
                "name": "Professional Standard",
                "description": "Clean, professional business card with logo and essential information",
                "layout": "Logo top left, contact info right-aligned",
                "colors": "Primary brand colors",
                "typography": "Primary brand font for name, secondary for details"
            },
            {
                "name": "Modern Minimal",
                "description": "Minimalist design with focus on logo and key contact information",
                "layout": "Centered logo, minimal text below",
                "colors": "Monochrome with accent color",
                "typography": "Clean, sans-serif throughout"
            }
        ]
    
    def _generate_social_media_concepts(self, brand_essentials: Dict, logo_system: Dict, color_palettes: Dict) -> List[Dict]:
        """Generate social media template concepts"""
        return [
            {
                "platform": "LinkedIn",
                "template_type": "Profile Header",
                "description": "Professional header with logo and tagline",
                "dimensions": "1584x396px",
                "elements": ["Logo", "Tagline", "Brand colors"]
            },
            {
                "platform": "Instagram",
                "template_type": "Post Template",
                "description": "Square post template for brand announcements",
                "dimensions": "1080x1080px",
                "elements": ["Logo watermark", "Brand colors", "Typography system"]
            }
        ]
    
    def _create_fallback_guidelines(self) -> Dict[str, Any]:
        """Create basic brand guidelines when AI generation fails"""
        return {
            "logo_usage": {
                "dos": ["Use original logo files", "Maintain proportions", "Ensure adequate clear space"],
                "donts": ["Don't distort or skew", "Don't change colors", "Don't add effects"],
                "minimum_sizes": "24px digital, 0.5 inches print",
                "clear_space": "Equal to logo height on all sides",
                "placement_rules": "Top-left or center positioning preferred"
            },
            "color_usage": {
                "primary_usage": "Use primary colors for main brand elements",
                "secondary_usage": "Use secondary colors for accents and backgrounds",
                "accessibility": "Ensure minimum 4.5:1 contrast ratio",
                "combinations": "Primary with white, secondary with neutrals",
                "backgrounds": "White, light gray, or dark backgrounds"
            },
            "typography": {
                "primary_font": "Modern sans-serif for headings",
                "secondary_font": "Readable sans-serif for body text",
                "hierarchy": "Large heading, medium subheading, standard body",
                "sizing": "16px minimum for body text",
                "spacing": "1.5x line height for readability"
            }
        }
    
    def _get_services_status(self) -> Dict[str, str]:
        """Get status of available services"""
        return {
            "logo_agent": "available" if self.logo_agent else "unavailable",
            "flyer_agent": "available" if self.flyer_agent else "unavailable",
            "logo_api": self._check_service_health(self.logo_api_base),
            "flyer_api": self._check_service_health(self.flyer_api_base)
        }
    
    def _check_service_health(self, base_url: str) -> str:
        """Check if a service is running"""
        try:
            response = requests.get(f"{base_url}/health", timeout=2)
            return "running" if response.status_code == 200 else "error"
        except:
            return "offline"

# Main orchestration function
def run_comprehensive_brand_identity(
    business_summary: str,
    brand_discovery_data: Optional[Dict] = None,
    existing_business_data: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Main function to create comprehensive brand identity
    
    Args:
        business_summary: Business description
        brand_discovery_data: Data from brand discovery questionnaire
        existing_business_data: Existing business analysis data
    
    Returns:
        Complete brand identity package
    """
    orchestrator = IdentityOrchestrator()
    return orchestrator.create_comprehensive_brand_identity(
        business_summary,
        brand_discovery_data,
        existing_business_data
    )

if __name__ == "__main__":
    # Test the orchestrator
    test_summary = "A modern tech startup focusing on AI-powered solutions for small businesses"
    result = run_comprehensive_brand_identity(test_summary)
    print(json.dumps(result, indent=2))
