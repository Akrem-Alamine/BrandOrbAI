#!/usr/bin/env python3
"""
Brand Discovery Agent - Interactive Brand Questionnaire
Guides users through brand discovery with smart questions based on existing data
"""
import json
import logging
from openai import OpenAI
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class BrandDiscoveryAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key="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"
        )
        
        # Define brand discovery areas and their questions
        self.discovery_areas = {
            "business_basics": {
                "title": "Business Basics",
                "description": "Understanding your business foundation",
                "questions": [
                    {
                        "id": "business_name",
                        "type": "text_with_suggestions",
                        "question": "What is your business name?",
                        "description": "Do you have a business name in mind, or would you like suggestions?",
                        "required": True
                    },
                    {
                        "id": "business_stage", 
                        "type": "single_choice",
                        "question": "What stage is your business at?",
                        "options": ["Just an idea", "Planning phase", "Recently launched", "Operating for some time"],
                        "required": True
                    }
                ]
            },
            "target_audience": {
                "title": "Target Audience",
                "description": "Who are your ideal customers?",
                "questions": [
                    {
                        "id": "ideal_customer",
                        "type": "text",
                        "question": "Describe your ideal customer",
                        "description": "Who do you want to serve? (demographics, interests, needs)",
                        "required": True
                    },
                    {
                        "id": "customer_pain_points",
                        "type": "text",
                        "question": "What problems do you solve for your customers?",
                        "description": "What pain points or needs does your business address?",
                        "required": True
                    }
                ]
            },
            "brand_personality": {
                "title": "Brand Personality",
                "description": "How should your brand feel and sound?",
                "questions": [
                    {
                        "id": "brand_personality_traits",
                        "type": "multiple_choice",
                        "question": "Which personality traits best describe your brand?",
                        "options": [
                            "Professional", "Friendly", "Innovative", "Trustworthy", 
                            "Creative", "Reliable", "Bold", "Sophisticated", 
                            "Approachable", "Expert", "Fun", "Premium"
                        ],
                        "max_selections": 4,
                        "required": True
                    },
                    {
                        "id": "brand_voice_tone",
                        "type": "single_choice", 
                        "question": "How should your brand communicate?",
                        "options": ["Formal and professional", "Casual and friendly", "Conversational and helpful", "Authoritative and expert"],
                        "required": True
                    }
                ]
            },
            "visual_preferences": {
                "title": "Visual Style",
                "description": "How should your brand look and feel?",
                "questions": [
                    {
                        "id": "style_preference",
                        "type": "single_choice",
                        "question": "What visual style appeals to you?",
                        "options": ["Modern and minimalist", "Classic and traditional", "Bold and creative", "Professional and corporate", "Warm and approachable"],
                        "required": True
                    },
                    {
                        "id": "color_mood",
                        "type": "single_choice",
                        "question": "What color mood fits your brand?",
                        "options": ["Cool and professional (blues, grays)", "Warm and friendly (oranges, reds)", "Natural and trustworthy (greens, browns)", "Creative and energetic (purples, bright colors)", "Neutral and sophisticated (blacks, whites, grays)"],
                        "required": True
                    }
                ]
            },
            "brand_values": {
                "title": "Brand Values & Story",
                "description": "What drives your brand?",
                "questions": [
                    {
                        "id": "core_values",
                        "type": "text_list",
                        "question": "What are your brand's core values?",
                        "description": "List 3-5 values that guide your business (e.g., Quality, Innovation, Customer Focus)",
                        "max_items": 5,
                        "required": True
                    },
                    {
                        "id": "brand_story",
                        "type": "text",
                        "question": "What's your brand story?",
                        "description": "Why did you start this business? What's your mission?",
                        "required": False
                    }
                ]
            },
            "competition": {
                "title": "Competition & Differentiation", 
                "description": "How do you stand out?",
                "questions": [
                    {
                        "id": "main_competitors",
                        "type": "text",
                        "question": "Who are your main competitors?",
                        "description": "List 2-3 businesses you compete with or aspire to be like",
                        "required": False
                    },
                    {
                        "id": "differentiation",
                        "type": "text",
                        "question": "How are you different from competitors?",
                        "description": "What makes you unique or better?",
                        "required": True
                    }
                ]
            }
        }
    
    def get_discovery_session_structure(self) -> Dict[str, Any]:
        """Get the complete brand discovery session structure"""
        return {
            "areas": self.discovery_areas,
            "total_questions": sum(len(area["questions"]) for area in self.discovery_areas.values()),
            "estimated_time": "5-10 minutes"
        }
    
    def analyze_existing_data(self, business_summary: str, existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze existing business data to pre-populate or skip questions"""
        
        prompt = f"""
        Analyze this business information and determine what we already know for brand discovery:
        
        Business Summary: "{business_summary}"
        Existing Data: {json.dumps(existing_data or {}, indent=2)}
        
        Based on this information, extract any available details for these brand areas:
        - Business name/company name
        - Target audience/ideal customers
        - Business stage
        - Core values or brand values
        - Brand personality traits
        - Unique value proposition/differentiation
        - Pain points solved
        - Competition information
        
        Return a JSON object with what we already know:
        {{
            "known_information": {{
                "business_name": "extracted name or null",
                "target_audience": "extracted audience description or null",
                "business_stage": "estimated stage or null",
                "core_values": ["extracted values"] or null,
                "brand_personality": "estimated personality or null",
                "differentiation": "unique value prop or null",
                "pain_points": "problems solved or null",
                "competitors": "competition info or null"
            }},
            "confidence_scores": {{
                "business_name": 0.0-1.0,
                "target_audience": 0.0-1.0,
                "business_stage": 0.0-1.0,
                "core_values": 0.0-1.0,
                "brand_personality": 0.0-1.0,
                "differentiation": 0.0-1.0
            }},
            "questions_to_skip": ["question_ids_we_can_skip"],
            "pre_populated_answers": {{
                "question_id": "suggested_answer"
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
                return self._create_empty_analysis()
                
        except Exception as e:
            logger.error(f"Error analyzing existing data: {e}")
            return self._create_empty_analysis()
    
    def generate_business_name_suggestions(self, business_summary: str, industry: str = None) -> List[str]:
        """Generate creative business name suggestions"""
        
        prompt = f"""
        Generate 8 creative business name suggestions for this business:
        
        Business Description: "{business_summary}"
        Industry: {industry or "Not specified"}
        
        Create names that are:
        - Memorable and catchy
        - Professional yet approachable  
        - Relevant to the business
        - Easy to pronounce and spell
        - Available as potential domain names (avoid very common words)
        
        Return only a JSON array of name suggestions:
        ["Name 1", "Name 2", "Name 3", "Name 4", "Name 5", "Name 6", "Name 7", "Name 8"]
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            
            content = response.choices[0].message.content
            import re
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            
            if json_match:
                return json.loads(json_match.group())
            else:
                return ["Your Business", "BrandName Co", "Solutions Inc"]
                
        except Exception as e:
            logger.error(f"Error generating business names: {e}")
            return ["Your Business", "BrandName Co", "Solutions Inc"]
    
    def validate_responses(self, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Validate user responses and suggest improvements"""
        
        validation_results = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        # Check required fields
        required_fields = [
            "business_name", "business_stage", "ideal_customer", 
            "brand_personality_traits", "style_preference", "core_values"
        ]
        
        for field in required_fields:
            if field not in responses or not responses[field]:
                validation_results["is_valid"] = False
                validation_results["errors"].append(f"Please provide {field.replace('_', ' ')}")
        
        # Check business name uniqueness/quality
        if "business_name" in responses:
            business_name = responses["business_name"]
            if len(business_name) < 2:
                validation_results["warnings"].append("Business name seems very short")
            elif len(business_name) > 50:
                validation_results["warnings"].append("Business name might be too long")
        
        # Check core values
        if "core_values" in responses:
            values = responses["core_values"]
            if isinstance(values, list) and len(values) < 2:
                validation_results["warnings"].append("Consider adding more core values (3-5 recommended)")
        
        return validation_results
    
    def compile_brand_brief(self, responses: Dict[str, Any], business_summary: str) -> Dict[str, Any]:
        """Compile all responses into a comprehensive brand brief"""
        
        return {
            "brand_brief": {
                "business_information": {
                    "name": responses.get("business_name", ""),
                    "stage": responses.get("business_stage", ""),
                    "summary": business_summary,
                    "story": responses.get("brand_story", "")
                },
                "target_audience": {
                    "ideal_customer": responses.get("ideal_customer", ""),
                    "pain_points": responses.get("customer_pain_points", "")
                },
                "brand_personality": {
                    "traits": responses.get("brand_personality_traits", []),
                    "voice_tone": responses.get("brand_voice_tone", ""),
                    "core_values": responses.get("core_values", [])
                },
                "visual_preferences": {
                    "style": responses.get("style_preference", ""),
                    "color_mood": responses.get("color_mood", "")
                },
                "positioning": {
                    "differentiation": responses.get("differentiation", ""),
                    "competitors": responses.get("main_competitors", "")
                }
            },
            "session_metadata": {
                "completed_at": datetime.now().isoformat(),
                "total_responses": len(responses),
                "completion_rate": self._calculate_completion_rate(responses)
            }
        }
    
    def _create_empty_analysis(self) -> Dict[str, Any]:
        """Create empty analysis structure"""
        return {
            "known_information": {},
            "confidence_scores": {},
            "questions_to_skip": [],
            "pre_populated_answers": {}
        }
    
    def _calculate_completion_rate(self, responses: Dict[str, Any]) -> float:
        """Calculate completion rate based on responses"""
        total_questions = sum(len(area["questions"]) for area in self.discovery_areas.values())
        completed_questions = len([r for r in responses.values() if r])
        return completed_questions / total_questions if total_questions > 0 else 0.0

# Brand Discovery Session Management
class BrandDiscoverySession:
    def __init__(self, session_id: str, business_summary: str):
        self.session_id = session_id
        self.business_summary = business_summary
        self.agent = BrandDiscoveryAgent()
        self.responses = {}
        self.current_area = "business_basics"
        self.current_question = 0
        self.created_at = datetime.now()
        
        # Analyze existing data
        self.analysis = self.agent.analyze_existing_data(business_summary)
        
    def get_current_question(self) -> Dict[str, Any]:
        """Get the current question for the user"""
        areas = self.agent.discovery_areas
        
        if self.current_area not in areas:
            return {"completed": True}
            
        area = areas[self.current_area]
        
        if self.current_question >= len(area["questions"]):
            # Move to next area
            area_keys = list(areas.keys())
            current_index = area_keys.index(self.current_area)
            
            if current_index + 1 >= len(area_keys):
                return {"completed": True}
            
            self.current_area = area_keys[current_index + 1]
            self.current_question = 0
            return self.get_current_question()
        
        question = area["questions"][self.current_question]
        
        # Add context and suggestions
        context = {
            "area": area,
            "question": question,
            "progress": self._calculate_progress(),
            "suggestions": self._get_question_suggestions(question)
        }
        
        return context
    
    def submit_response(self, response: Any) -> Dict[str, Any]:
        """Submit response to current question"""
        current_q = self.get_current_question()
        
        if current_q.get("completed"):
            return {"error": "Session already completed"}
        
        question_id = current_q["question"]["id"]
        self.responses[question_id] = response
        
        # Move to next question
        self.current_question += 1
        
        return {
            "success": True,
            "next_question": self.get_current_question()
        }
    
    def _calculate_progress(self) -> Dict[str, Any]:
        """Calculate session progress"""
        total_questions = sum(len(area["questions"]) for area in self.agent.discovery_areas.values())
        completed_questions = len(self.responses)
        
        return {
            "completed": completed_questions,
            "total": total_questions,
            "percentage": (completed_questions / total_questions) * 100 if total_questions > 0 else 0
        }
    
    def _get_question_suggestions(self, question: Dict[str, Any]) -> List[str]:
        """Get suggestions for current question based on type"""
        if question["id"] == "business_name":
            return self.agent.generate_business_name_suggestions(self.business_summary)
        
        return []

def run_brand_discovery_analysis(session_id: str, business_summary: str, responses: Dict[str, Any]) -> Dict[str, Any]:
    """Main function to complete brand discovery and return brand brief"""
    try:
        agent = BrandDiscoveryAgent()
        
        # Validate responses
        validation = agent.validate_responses(responses)
        if not validation["is_valid"]:
            return {
                "success": False,
                "errors": validation["errors"],
                "warnings": validation["warnings"]
            }
        
        # Compile brand brief
        brand_brief = agent.compile_brand_brief(responses, business_summary)
        
        return {
            "success": True,
            "brand_brief": brand_brief,
            "validation": validation,
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error in brand discovery analysis: {e}")
        return {
            "success": False,
            "error": str(e)
        }
