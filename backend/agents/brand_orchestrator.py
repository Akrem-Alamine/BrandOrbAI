#!/usr/bin/env python3
"""
Brand Orchestrator Agent - Comprehensive Brand Identity Creation
Orchestrates all brand creation steps using discovery data + existing business analysis
"""
import json
import logging
import os
from openai import OpenAI
from typing import Dict, List, Optional, Any
from datetime import datetime
from .brand_identity_agent import BrandIdentityAgent
from .brand_discovery_agent import BrandDiscoveryAgent

logger = logging.getLogger(__name__)

class BrandOrchestrator:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key="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"
        )
        self.brand_identity_agent = BrandIdentityAgent()
        self.discovery_agent = BrandDiscoveryAgent()
    
    def orchestrate_brand_creation(self, brand_brief: Dict[str, Any], existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main orchestration function that creates comprehensive brand identity
        using brand discovery data + existing business analysis
        """
        try:
            logger.info("Starting brand orchestration...")
            
            # Step 1: Consolidate all available data
            consolidated_data = self._consolidate_brand_data(brand_brief, existing_data)
            
            # Step 2: Generate enhanced business summary for brand creation
            enhanced_summary = self._create_enhanced_business_summary(consolidated_data)
            
            # Step 3: Create brand strategy foundation
            brand_strategy = self._create_brand_strategy(consolidated_data)
            
            # Step 4: Generate visual identity system
            visual_identity = self._create_visual_identity_system(brand_strategy, consolidated_data)
            
            # Step 5: Create brand voice and messaging
            brand_voice = self._create_brand_voice_system(brand_strategy, consolidated_data)
            
            # Step 6: Generate brand applications and guidelines
            brand_applications = self._create_brand_applications(brand_strategy, visual_identity)
            
            # Step 7: Create comprehensive brand book
            brand_book = self._compile_comprehensive_brand_book(
                brand_strategy, visual_identity, brand_voice, brand_applications
            )
            
            # Step 8: Generate brand assets (logos, palettes, etc.)
            brand_assets = self._generate_brand_assets(brand_book, consolidated_data)
            
            return {
                "success": True,
                "brand_identity": {
                    "brand_strategy": brand_strategy,
                    "visual_identity": visual_identity,
                    "brand_voice": brand_voice,
                    "brand_book": brand_book,
                    "brand_assets": brand_assets,
                    "consolidated_data": consolidated_data
                },
                "metadata": {
                    "created_at": datetime.now().isoformat(),
                    "data_sources": list(existing_data.keys()) if existing_data else [],
                    "orchestration_version": "2.0"
                }
            }
            
        except Exception as e:
            logger.error(f"Error in brand orchestration: {e}")
            return {
                "success": False,
                "error": str(e),
                "partial_data": locals().get('brand_strategy', {})
            }
    
    def _consolidate_brand_data(self, brand_brief: Dict[str, Any], existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Consolidate brand discovery data with existing business analysis"""
        
        consolidated = {
            "brand_discovery": brand_brief.get("brand_brief", {}),
            "existing_analysis": existing_data or {}
        }
        
        # Extract key information from existing data
        if existing_data:
            # From business summary
            if "business_summary" in existing_data:
                consolidated["business_context"] = existing_data["business_summary"]
            
            # From SWOT analysis
            if "swot_analysis" in existing_data:
                consolidated["swot_insights"] = existing_data["swot_analysis"]
            
            # From market analysis
            if "market_analysis" in existing_data:
                consolidated["market_insights"] = existing_data["market_analysis"]
            
            # From viability assessment
            if "viability_assessment" in existing_data:
                consolidated["viability_insights"] = existing_data["viability_assessment"]
            
            # From BMC
            if "bmc_data" in existing_data:
                consolidated["business_model"] = existing_data["bmc_data"]
        
        return consolidated
    
    def _create_enhanced_business_summary(self, consolidated_data: Dict[str, Any]) -> str:
        """Create enhanced business summary incorporating all available data"""
        
        prompt = f"""
        Create a comprehensive business summary that incorporates all available information:
        
        Brand Discovery Data: {json.dumps(consolidated_data.get("brand_discovery", {}), indent=2)}
        Business Context: {consolidated_data.get("business_context", "")}
        Market Insights: {json.dumps(consolidated_data.get("market_insights", {}), indent=2)}
        SWOT Analysis: {json.dumps(consolidated_data.get("swot_insights", {}), indent=2)}
        
        Create a detailed business summary that includes:
        - Business name and mission
        - Target audience and market
        - Unique value proposition
        - Core business model
        - Competitive advantages
        - Brand personality and values
        
        Write this as a comprehensive paragraph that can be used for brand identity creation.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error creating enhanced summary: {e}")
            return consolidated_data.get("business_context", "Business summary not available")
    
    def _create_brand_strategy(self, consolidated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive brand strategy using all available data"""
        
        brand_discovery = consolidated_data.get("brand_discovery", {})
        business_info = brand_discovery.get("business_information", {})
        brand_personality = brand_discovery.get("brand_personality", {})
        positioning = brand_discovery.get("positioning", {})
        
        prompt = f"""
        Create a comprehensive brand strategy based on this consolidated data:
        
        {json.dumps(consolidated_data, indent=2)}
        
        Generate a detailed brand strategy in JSON format:
        {{
            "brand_foundation": {{
                "brand_name": "{business_info.get('name', 'Brand Name')}",
                "mission": "Clear brand mission statement",
                "vision": "Brand vision for the future",
                "purpose": "Why the brand exists",
                "tagline": "Memorable brand tagline"
            }},
            "brand_positioning": {{
                "target_audience": "Primary target audience description",
                "market_position": "Where the brand sits in the market",
                "unique_value_proposition": "What makes this brand unique",
                "competitive_advantage": "Key competitive differentiator",
                "brand_promise": "What the brand promises to deliver"
            }},
            "brand_personality": {{
                "core_traits": {brand_personality.get('traits', [])},
                "brand_archetype": "Brand archetype (Hero, Sage, Explorer, etc.)",
                "personality_description": "How the brand behaves and feels",
                "tone_attributes": ["attribute1", "attribute2", "attribute3"]
            }},
            "brand_values": {{
                "core_values": {brand_personality.get('core_values', [])},
                "value_descriptions": {{"value": "detailed description"}},
                "cultural_principles": ["principle1", "principle2"]
            }}
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
            else:
                return self._create_fallback_brand_strategy(consolidated_data)
                
        except Exception as e:
            logger.error(f"Error creating brand strategy: {e}")
            return self._create_fallback_brand_strategy(consolidated_data)
    
    def _create_visual_identity_system(self, brand_strategy: Dict[str, Any], consolidated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive visual identity system"""
        
        visual_prefs = consolidated_data.get("brand_discovery", {}).get("visual_preferences", {})
        
        # Generate color palettes based on preferences
        color_palettes = self._generate_color_palettes(brand_strategy, visual_prefs)
        
        # Generate logo concepts
        logo_concepts = self._generate_logo_concepts(brand_strategy, color_palettes)
        
        # Generate typography system
        typography_system = self._generate_typography_system(brand_strategy, visual_prefs)
        
        return {
            "color_palettes": color_palettes,
            "logo_concepts": logo_concepts,
            "typography": typography_system,
            "visual_style": {
                "overall_style": visual_prefs.get("style", "Modern and professional"),
                "design_principles": self._generate_design_principles(brand_strategy),
                "imagery_style": self._generate_imagery_guidelines(brand_strategy)
            }
        }
    
    def _generate_color_palettes(self, brand_strategy: Dict[str, Any], visual_prefs: Dict[str, Any]) -> Dict[str, Any]:
        """Generate multiple color palette options"""
        
        color_mood = visual_prefs.get("color_mood", "Professional and trustworthy")
        brand_traits = brand_strategy.get("brand_personality", {}).get("core_traits", [])
        
        prompt = f"""
        Generate 5 professional color palettes based on:
        
        Brand Traits: {brand_traits}
        Color Mood Preference: {color_mood}
        Brand Positioning: {brand_strategy.get("brand_positioning", {})}
        
        Each palette should have 5-6 colors (primary, secondary, accent, neutral, dark, light).
        
        Return in this exact JSON format:
        {{
            "recommended_palette": {{
                "name": "Primary Recommendation",
                "description": "Why this is the best fit",
                "colors": [
                    {{"hex": "#hexcode", "name": "Color name", "usage": "Primary brand color", "psychology": "What this color conveys"}},
                    {{"hex": "#hexcode", "name": "Color name", "usage": "Secondary", "psychology": "Color meaning"}}
                ]
            }},
            "alternative_palettes": [
                {{
                    "name": "Alternative 1",
                    "description": "Alternative option",
                    "colors": [...]
                }}
            ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
            else:
                return self._create_default_color_palettes()
                
        except Exception as e:
            logger.error(f"Error generating color palettes: {e}")
            return self._create_default_color_palettes()
    
    def _generate_logo_concepts(self, brand_strategy: Dict[str, Any], color_palettes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate logo concepts with detailed descriptions"""
        
        brand_name = brand_strategy.get("brand_foundation", {}).get("brand_name", "Brand")
        brand_personality = brand_strategy.get("brand_personality", {})
        
        # Use the brand identity agent for logo generation
        return self.brand_identity_agent.generate_logo_concepts(
            {"brand_strategy": brand_strategy}, 
            []  # Colors will be applied later
        )
    
    def _generate_typography_system(self, brand_strategy: Dict[str, Any], visual_prefs: Dict[str, Any]) -> Dict[str, Any]:
        """Generate typography system based on brand strategy"""
        
        style_pref = visual_prefs.get("style", "Modern and professional")
        brand_traits = brand_strategy.get("brand_personality", {}).get("core_traits", [])
        
        prompt = f"""
        Create a typography system for a brand with these characteristics:
        
        Brand Traits: {brand_traits}
        Visual Style: {style_pref}
        Brand Personality: {brand_strategy.get("brand_personality", {})}
        
        Generate typography recommendations in JSON format:
        {{
            "primary_font": {{
                "category": "Sans-serif/Serif/Display",
                "style": "Modern/Classic/Creative",
                "examples": ["Font Name 1", "Font Name 2", "Font Name 3"],
                "usage": "Headlines, logos, important text",
                "personality": "What this font conveys"
            }},
            "secondary_font": {{
                "category": "Sans-serif/Serif",
                "style": "Readable/Clean/Friendly",
                "examples": ["Font Name 1", "Font Name 2", "Font Name 3"],
                "usage": "Body text, descriptions, details",
                "personality": "Supporting characteristics"
            }},
            "hierarchy": {{
                "h1": "Primary font, bold, large",
                "h2": "Primary font, medium",
                "h3": "Primary font, regular",
                "body": "Secondary font, regular",
                "caption": "Secondary font, small"
            }}
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5
            )
            
            content = response.choices[0].message.content
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
            else:
                return self._create_default_typography()
                
        except Exception as e:
            logger.error(f"Error generating typography: {e}")
            return self._create_default_typography()
    
    def _create_brand_voice_system(self, brand_strategy: Dict[str, Any], consolidated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive brand voice and messaging system"""
        
        brand_personality = brand_strategy.get("brand_personality", {})
        voice_tone = consolidated_data.get("brand_discovery", {}).get("brand_personality", {}).get("voice_tone", "")
        
        # Use existing brand identity agent for voice generation
        brand_context = {
            "brand_strategy": brand_strategy,
            "brand_positioning": brand_strategy.get("brand_positioning", {})
        }
        
        # Generate brand book which includes voice and tone
        brand_book = self.brand_identity_agent.generate_brand_book(brand_context, "")
        
        return brand_book.get("voice_and_tone", {})
    
    def _create_brand_applications(self, brand_strategy: Dict[str, Any], visual_identity: Dict[str, Any]) -> Dict[str, Any]:
        """Create brand application guidelines"""
        
        # Use existing brand identity agent
        brand_context = {
            "brand_strategy": brand_strategy,
            "visual_direction": visual_identity.get("visual_style", {})
        }
        
        brand_book = self.brand_identity_agent.generate_brand_book(brand_context, "")
        
        return brand_book.get("application_guidelines", {})
    
    def _compile_comprehensive_brand_book(self, brand_strategy: Dict[str, Any], visual_identity: Dict[str, Any], 
                                        brand_voice: Dict[str, Any], brand_applications: Dict[str, Any]) -> Dict[str, Any]:
        """Compile everything into a comprehensive brand book"""
        
        return {
            "brand_overview": brand_strategy.get("brand_foundation", {}),
            "brand_strategy": brand_strategy,
            "visual_identity": visual_identity,
            "voice_and_tone": brand_voice,
            "application_guidelines": brand_applications,
            "brand_standards": {
                "logo_usage": self._generate_logo_standards(),
                "color_usage": self._generate_color_standards(),
                "typography_usage": self._generate_typography_standards(),
                "dos_and_donts": self._generate_dos_and_donts()
            }
        }
    
    def _generate_brand_assets(self, brand_book: Dict[str, Any], consolidated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate actual brand assets (logos, business cards, etc.)"""
        
        assets = {}
        
        # Generate logo variations if we have logo concepts
        logo_concepts = brand_book.get("visual_identity", {}).get("logo_concepts", {})
        if logo_concepts and "concepts" in logo_concepts:
            primary_concept = logo_concepts["concepts"][0] if logo_concepts["concepts"] else None
            if primary_concept:
                brand_name = brand_book.get("brand_overview", {}).get("brand_name", "Brand")
                colors = self._extract_primary_colors(brand_book.get("visual_identity", {}))
                
                # Generate logo image
                logo_result = self.brand_identity_agent.generate_logo_image(
                    brand_name, primary_concept, colors
                )
                assets["logo"] = logo_result
        
        # Generate business assets
        business_assets = self.brand_identity_agent.generate_brand_assets(brand_book, assets.get("logo", {}))
        assets.update(business_assets)
        
        return assets
    
    # Helper methods
    def _create_fallback_brand_strategy(self, consolidated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback brand strategy"""
        brand_discovery = consolidated_data.get("brand_discovery", {})
        business_info = brand_discovery.get("business_information", {})
        
        return {
            "brand_foundation": {
                "brand_name": business_info.get("name", "Your Brand"),
                "mission": "To provide exceptional value to our customers",
                "vision": "To be a leading provider in our industry",
                "purpose": "Making a positive impact through our services",
                "tagline": "Your Success, Our Priority"
            },
            "brand_positioning": {
                "target_audience": brand_discovery.get("target_audience", {}).get("ideal_customer", "Our customers"),
                "market_position": "Quality-focused provider",
                "unique_value_proposition": "Exceptional service and results",
                "competitive_advantage": "Customer-focused approach",
                "brand_promise": "Delivering reliable solutions"
            },
            "brand_personality": {
                "core_traits": ["Professional", "Reliable", "Trustworthy"],
                "brand_archetype": "The Expert",
                "personality_description": "Professional, reliable, and customer-focused",
                "tone_attributes": ["Professional", "Helpful", "Clear"]
            },
            "brand_values": {
                "core_values": ["Quality", "Integrity", "Innovation"],
                "value_descriptions": {
                    "Quality": "We deliver excellence in everything we do",
                    "Integrity": "We act with honesty and transparency",
                    "Innovation": "We continuously improve and adapt"
                },
                "cultural_principles": ["Customer first", "Continuous improvement"]
            }
        }
    
    def _create_default_color_palettes(self) -> Dict[str, Any]:
        """Create default color palettes"""
        return {
            "recommended_palette": {
                "name": "Professional Blue",
                "description": "Trust and reliability",
                "colors": [
                    {"hex": "#2563eb", "name": "Primary Blue", "usage": "Primary brand color", "psychology": "Trust and professionalism"},
                    {"hex": "#1f2937", "name": "Dark Gray", "usage": "Secondary", "psychology": "Sophistication"},
                    {"hex": "#10b981", "name": "Green Accent", "usage": "Accent", "psychology": "Growth and success"},
                    {"hex": "#6b7280", "name": "Medium Gray", "usage": "Neutral", "psychology": "Balance"},
                    {"hex": "#111827", "name": "Dark", "usage": "Text", "psychology": "Clarity"},
                    {"hex": "#f9fafb", "name": "Light", "usage": "Background", "psychology": "Cleanliness"}
                ]
            },
            "alternative_palettes": []
        }
    
    def _create_default_typography(self) -> Dict[str, Any]:
        """Create default typography system"""
        return {
            "primary_font": {
                "category": "Sans-serif",
                "style": "Modern",
                "examples": ["Inter", "Helvetica", "Arial"],
                "usage": "Headlines, logos, important text",
                "personality": "Clean and professional"
            },
            "secondary_font": {
                "category": "Sans-serif",
                "style": "Readable",
                "examples": ["Open Sans", "Roboto", "Lato"],
                "usage": "Body text, descriptions, details",
                "personality": "Friendly and accessible"
            },
            "hierarchy": {
                "h1": "Primary font, bold, 32px",
                "h2": "Primary font, medium, 24px",
                "h3": "Primary font, regular, 20px",
                "body": "Secondary font, regular, 16px",
                "caption": "Secondary font, regular, 14px"
            }
        }
    
    def _generate_design_principles(self, brand_strategy: Dict[str, Any]) -> List[str]:
        """Generate design principles"""
        return [
            "Maintain simplicity and clarity",
            "Ensure consistency across all applications",
            "Prioritize readability and accessibility",
            "Reflect brand personality in all designs"
        ]
    
    def _generate_imagery_guidelines(self, brand_strategy: Dict[str, Any]) -> Dict[str, Any]:
        """Generate imagery guidelines"""
        return {
            "style": "Professional and authentic",
            "mood": "Positive and approachable",
            "color_treatment": "Align with brand color palette",
            "composition": "Clean and uncluttered"
        }
    
    def _generate_logo_standards(self) -> Dict[str, Any]:
        """Generate logo usage standards"""
        return {
            "clear_space": "Minimum clear space equal to the height of the logo",
            "minimum_size": "No smaller than 24px in digital, 0.5 inches in print",
            "color_variations": ["Full color", "Single color", "Reversed"],
            "forbidden_uses": ["Do not stretch", "Do not change colors", "Do not add effects"]
        }
    
    def _generate_color_standards(self) -> Dict[str, Any]:
        """Generate color usage standards"""
        return {
            "primary_usage": "Use primary colors for main brand elements",
            "secondary_usage": "Use secondary colors for accents and highlights",
            "accessibility": "Ensure proper contrast ratios for readability",
            "print_specifications": "Provide CMYK values for print applications"
        }
    
    def _generate_typography_standards(self) -> Dict[str, Any]:
        """Generate typography standards"""
        return {
            "hierarchy": "Maintain consistent hierarchy across all materials",
            "spacing": "Use consistent line spacing and letter spacing",
            "alignment": "Prefer left alignment for readability",
            "fallbacks": "Always specify web-safe fallback fonts"
        }
    
    def _generate_dos_and_donts(self) -> Dict[str, Any]:
        """Generate comprehensive dos and don'ts"""
        return {
            "logo_usage": {
                "dos": ["Maintain proportions", "Use approved colors", "Ensure clear space"],
                "donts": ["Don't stretch or distort", "Don't change colors", "Don't add effects"]
            },
            "color_usage": {
                "dos": ["Use exact color codes", "Maintain contrast", "Consider color psychology"],
                "donts": ["Don't use unapproved colors", "Don't ignore accessibility", "Don't oversaturate"]
            },
            "typography": {
                "dos": ["Follow hierarchy", "Maintain consistency", "Ensure readability"],
                "donts": ["Don't mix too many fonts", "Don't ignore spacing", "Don't sacrifice readability"]
            }
        }
    
    def _extract_primary_colors(self, visual_identity: Dict[str, Any]) -> List[str]:
        """Extract primary colors from visual identity"""
        color_palettes = visual_identity.get("color_palettes", {})
        recommended = color_palettes.get("recommended_palette", {})
        colors = recommended.get("colors", [])
        
        return [color.get("hex", "#2563eb") for color in colors[:3]]  # Get first 3 colors

def run_brand_orchestration(brand_brief: Dict[str, Any], existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Main function to orchestrate complete brand identity creation"""
    try:
        orchestrator = BrandOrchestrator()
        return orchestrator.orchestrate_brand_creation(brand_brief, existing_data)
        
    except Exception as e:
        logger.error(f"Error in brand orchestration: {e}")
        return {
            "success": False,
            "error": str(e)
        }
