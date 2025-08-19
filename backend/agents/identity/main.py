#!/usr/bin/env python3
"""
Professional Logo Generator - AI-Powered Logo Generation using Pollinations
Uses QWEN for prompt generation and Pollinations for image creation
Backend version integrated with FastAPI
"""

import json
import re
import requests
from openai import OpenAI
import random
import base64
import os
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class LogoGeneratorAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        # Use environment variable for API key
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        
    def generate_color_palette(self, business_description):
        """Generate a color palette based on business description"""
        prompt = f"""
        Based on this business description: "{business_description}"
        
        Generate 5 different color palettes, each with 3-4 colors that would work well for this business.
        Consider the industry, target audience, and brand personality.
        
        Return the response in this exact JSON format:
        {{
            "palettes": [
                {{
                    "name": "Palette Name",
                    "description": "Brief description of why this palette fits",
                    "colors": ["#hexcode1", "#hexcode2", "#hexcode3"]
                }}
            ]
        }}
        
        Make sure all hex codes are valid and the palettes are professional and suitable for logos.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        # Extract JSON from the response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in color palette generation: {e}")
                return None
        else:
            logger.warning("No JSON found in color palette response")
            return None
    
    def generate_logo(self, business_description, logo_description, selected_colors):
        """Generate a professional logo using Pollinations API with QWEN-enhanced prompts"""
        
        # Convert hex colors to color names for better prompt understanding
        color_names = []
        hex_color_specs = []
        
        for hex_color in selected_colors:
            color_name_prompt = f"""
            Convert this hex color {hex_color} to a descriptive color name.
            Return ONLY the color name (like: navy blue, forest green, crimson red, golden yellow, etc.)
            """
            
            color_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": color_name_prompt}],
                temperature=0.1
            )
            
            color_name = color_response.choices[0].message.content.strip().lower()
            color_names.append(color_name)
            hex_color_specs.append(f"{color_name} ({hex_color})")
        
        # Create a comprehensive color description with exact hex values
        colors_description = ", ".join(color_names)
        hex_colors_list = ", ".join(selected_colors)
        color_specifications = " | ".join(hex_color_specs)
        primary_color = color_names[0] if color_names else "blue"
        
        # Define default logo type specification (emblem + typography)
        selected_type_spec = {
            "description": "Combined emblem + typography logo",
            "requirements": "Create both an emblem/icon AND typography. Position the emblem on the LEFT and typography on the RIGHT. Or creatively integrate the first letter into the emblem design."
        }
        
        # Extract business name from description using AI
        business_name_prompt = f"""
        From this business description, extract the most suitable business name for a logo:
        "{business_description}"
        
        Rules:
        1. If there's a clear business name mentioned, use it
        2. If no name is mentioned, create a short, catchy name based on the business concept
        3. Keep it to 1-2 words maximum
        4. Make it logo-friendly (no spaces, lowercase, suitable for branding)
        
        Return ONLY the business name, nothing else.
        """
        
        business_name_response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": business_name_prompt}],
            temperature=0.3
        )
        
        business_name = business_name_response.choices[0].message.content.strip().lower().replace(" ", "").replace("-", "")
        
        # Ensure it's reasonable for a logo
        if not business_name or len(business_name) > 15 or not business_name.isalpha():
            # Let AI generate a fallback name
            fallback_prompt = f"""
            Create a short, brandable name (1 word, 3-8 letters) for this business: "{business_description}"
            Return only the name, lowercase, no spaces.
            """
            fallback_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": fallback_prompt}],
                temperature=0.5
            )
            business_name = fallback_response.choices[0].message.content.strip().lower().replace(" ", "")[:8]
        
        # Generate completely dynamic prompt using QWEN with specific colors and logo type
        dynamic_prompt = f"""
        You are an expert graphic designer and prompt engineer. Create a detailed Pollinations AI prompt for generating a professional logo with these EXACT specifications:
        
        BUSINESS CONTEXT:
        - Business: "{business_description}"
        - Style Description: "{logo_description}"
        - Business Name: "{business_name}"
        
        LOGO TYPE REQUIREMENTS:
        - Type: {selected_type_spec['description']}
        - Specific Requirements: {selected_type_spec['requirements']}
        
        COLOR SPECIFICATIONS (CRITICAL - MUST BE FOLLOWED EXACTLY):
        - Primary Colors: {colors_description}
        - Exact Hex Values: {hex_colors_list}
        - Color Mapping: {color_specifications}
        - MANDATORY: Use ONLY these exact hex color codes: {hex_colors_list}
        - The logo MUST prominently feature these EXACT shades: {color_specifications}
        - NO other colors allowed except these specific hex values and white for background
        
        TECHNICAL REQUIREMENTS:
        1. Create a flat, high-resolution logo design (1024x1024)
        2. Use EXCLUSIVELY the provided hex colors: {hex_colors_list}
        3. White or transparent background ONLY
        4. Professional, clean, and scalable design
        5. Single cohesive design element
        6. Suitable for branding across all media
        7. Crisp, vector-style appearance
        
        DESIGN APPROACH:
        Think like a professional graphic designer and create a prompt that will result in:
        - Perfect color accuracy using the exact hex values provided
        - Appropriate combined emblem + typography execution
        - Brand-appropriate styling that matches the business description
        - Professional execution suitable for corporate branding
        
        CRITICAL COLOR ENFORCEMENT:
        The AI image generator MUST use these EXACT colors: {hex_colors_list}. 
        Emphasize in the prompt that color accuracy is paramount and these specific hex values must be matched precisely.
        
        Generate a detailed, creative prompt that will produce the perfect logo using the specified colors and default logo type.
        
        Return ONLY the final optimized prompt for the AI image generator, nothing else.
        """
        
        # Get completely dynamic prompt from QWEN
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": dynamic_prompt}],
            temperature=0.4
        )
        
        enhanced_prompt = response.choices[0].message.content.strip()
        
        # Ensure the specific colors and logo type are strongly emphasized in the prompt
        color_enforcement = f"using EXACT hex colors {hex_colors_list}, color specifications: {color_specifications}"
        logo_type_enforcement = f"following {selected_type_spec['description']} requirements"
        
        enhanced_prompt = f"{enhanced_prompt} | {color_enforcement} | {logo_type_enforcement}"
        
        if business_name not in enhanced_prompt.lower() and len(business_name) < 10:
            enhanced_prompt = f"{enhanced_prompt} featuring {business_name} text"
        
        # Generate logo using Pollinations API
        return self._generate_logo_with_pollinations(enhanced_prompt)
    
    def generate_3d_logo(self, business_description, logo_description, selected_colors, base_logo_prompt=None):
        """Generate a 3D version of the existing logo by analyzing the selected logo and converting it to 3D"""
        
        # Convert hex colors to color names for better 3D rendering
        color_names = []
        hex_color_specs = []
        
        for hex_color in selected_colors:
            color_name_prompt = f"""
            Convert this hex color {hex_color} to a descriptive color name for 3D rendering.
            Return ONLY the color name (like: navy blue, forest green, crimson red, golden yellow, etc.)
            """
            
            color_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": color_name_prompt}],
                temperature=0.1
            )
            
            color_name = color_response.choices[0].message.content.strip().lower()
            color_names.append(color_name)
            hex_color_specs.append(f"{color_name} ({hex_color})")
        
        # Create a comprehensive color description with exact hex values
        colors_description = ", ".join(color_names)
        hex_colors_list = ", ".join(selected_colors)
        color_specifications = " | ".join(hex_color_specs)
        primary_color = color_names[0] if color_names else "blue"
        
        # Define default logo type specification (emblem + typography)
        selected_type_spec = {
            "description": "Combined emblem + typography logo",
            "requirements": "Create both an emblem/icon AND typography. Position the emblem on the LEFT and typography on the RIGHT. Or creatively integrate the first letter into the emblem design."
        }
        
        # Extract business name (same logic as regular logo)
        business_name_prompt = f"""
        From this business description, extract the most suitable business name for a 3D logo:
        "{business_description}"
        
        Rules:
        1. If there's a clear business name mentioned, use it
        2. If no name is mentioned, create a short, catchy name based on the business concept
        3. Keep it to 1-2 words maximum
        4. Make it logo-friendly (no spaces, lowercase, suitable for branding)
        
        Return ONLY the business name, nothing else.
        """
        
        business_name_response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": business_name_prompt}],
            temperature=0.3
        )
        
        business_name = business_name_response.choices[0].message.content.strip().lower().replace(" ", "").replace("-", "")
        
        # Ensure it's reasonable for a logo
        if not business_name or len(business_name) > 15 or not business_name.isalpha():
            fallback_prompt = f"""
            Create a short, brandable name (1 word, 3-8 letters) for this business: "{business_description}"
            Return only the name, lowercase, no spaces.
            """
            fallback_response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": fallback_prompt}],
                temperature=0.5
            )
            business_name = fallback_response.choices[0].message.content.strip().lower().replace(" ", "")[:8]
        
        # Generate 3D-specific prompt that maintains the original logo design
        threed_prompt = f"""
        Create a detailed Pollinations AI prompt for generating a 3D version of an existing logo with these specifications:
        
        Original Logo Details:
        - Business: "{business_description}"
        - Style Description: "{logo_description}"
        - Color Palette: {colors_description}
        - Hex Colors: {selected_colors}
        - Business Name: {business_name}
        - Original Logo Prompt: {base_logo_prompt if base_logo_prompt else "Base design"}
        
        Requirements for 3D Conversion:
        1. Convert the EXISTING logo design into a 3D rendered version
        2. Maintain the SAME design elements and composition from the original
        3. Use EXACTLY the same colors: {colors_description} (hex: {selected_colors})
        4. Add 3D depth, realistic lighting, shadows, and highlights
        5. Keep the same business name "{business_name}" in 3D text
        6. Clean background (white or transparent)
        7. Professional 3D rendering with realistic materials
        8. Isometric or perspective view that shows depth
        9. IMPORTANT: This should look like the same logo but in 3D, not a completely new design
        
        The goal is to take the existing flat logo design and make it three-dimensional while preserving all the original elements, colors, and style.
        
        Return ONLY the final prompt for the AI image generator, nothing else.
        """
        
        # Get 3D prompt from QWEN
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": threed_prompt}],
            temperature=0.3  # Lower temperature for more consistency
        )
        
        enhanced_3d_prompt = response.choices[0].message.content.strip()
        
        # Ensure 3D keywords and color consistency
        enhanced_3d_prompt = f"3D rendered version of existing logo: {enhanced_3d_prompt} using exact color palette: {colors_description}, hex colors {selected_colors}"
        
        if business_name not in enhanced_3d_prompt.lower() and len(business_name) < 10:
            enhanced_3d_prompt = f"{enhanced_3d_prompt} featuring {business_name} 3D text"
        
        # Generate 3D logo using Pollinations API
        return self._generate_logo_with_pollinations(enhanced_3d_prompt)
    
    def generate_suggested_keywords(self, business_description):
        """Generate suggested keywords and descriptions for logo design"""
        prompt = f"""
        Based on this business: "{business_description}"
        
        Generate helpful suggestions for logo design. Return in this JSON format:
        {{
            "suggested_styles": [
                "modern and minimalist",
                "bold and geometric", 
                "elegant and sophisticated",
                "playful and creative",
                "professional and clean"
            ],
            "suggested_keywords": [
                "clean lines",
                "modern typography", 
                "simple icon",
                "professional look",
                "memorable design"
            ],
            "industry_specific": [
                "tech-focused elements",
                "business-appropriate colors",
                "scalable design"
            ]
        }}
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in keywords generation: {e}")
                return None
        else:
            logger.warning("No JSON found in keywords response")
            return None
    
    def convert_to_svg(self, image_data):
        """Convert PNG to SVG using AI enhancement"""
        # For now, we'll create a simple SVG wrapper
        # In a real implementation, you might use more sophisticated conversion
        svg_template = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="1024" height="1024" viewBox="0 0 1024 1024">
  <image width="1024" height="1024" xlink:href="data:image/png;base64,{image_data}"/>
</svg>'''
        return svg_template
    
    def _generate_logo_with_pollinations(self, prompt):
        """Generate logo using Pollinations API with enhanced color enforcement and retry logic"""
        # Pollinations API endpoint
        base_url = "https://image.pollinations.ai/prompt/"
        
        # Enhance the prompt to strongly enforce color usage
        enhanced_prompt = f"professional logo design: {prompt}, high quality, crisp colors, exact color matching"
        encoded_prompt = requests.utils.quote(enhanced_prompt)
        
        # Parameters for high-quality logo with better color control
        params = {
            'width': 1024,
            'height': 1024,
            'model': 'flux',  # High quality model
            'seed': random.randint(1, 1000000),
            'enhance': 'true',  # Enable prompt enhancement
            'nologo': 'true'    # Remove watermarks
        }
        
        # Build full URL
        param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{base_url}{encoded_prompt}?{param_string}"
        
        # Retry logic with different timeout strategies
        max_retries = 5  # Increased retries
        timeouts = [120, 150, 180, 210, 240]  # Longer timeouts
        
        for attempt in range(max_retries):
            try:
                timeout = timeouts[attempt] if attempt < len(timeouts) else 240
                logger.info(f"Attempting logo generation (attempt {attempt + 1}/{max_retries}) with {timeout}s timeout")
                
                # Make request to Pollinations with increasing timeout
                response = requests.get(full_url, timeout=timeout)
                
                if response.status_code == 200:
                    # Convert to base64 for display
                    image_bytes = response.content
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    
                    logger.info(f"Logo generation successful on attempt {attempt + 1}")
                    return {
                        'success': True,
                        'image_data': image_base64,
                        'prompt': enhanced_prompt,
                        'url': full_url,
                        'image_url': full_url  # Add this for compatibility
                    }
                else:
                    logger.warning(f"Pollinations API returned status {response.status_code} on attempt {attempt + 1}")
                    if attempt == max_retries - 1:  # Last attempt
                        logger.error(f"Pollinations API error: {response.status_code}")
                        return {
                            'success': False,
                            'error': f"Pollinations API error: {response.status_code}"
                        }
                        
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout on attempt {attempt + 1} ({timeout}s)")
                if attempt == max_retries - 1:  # Last attempt
                    return {
                        'success': False,
                        'error': f"Logo generation timed out after {max_retries} attempts. Please try again with a simpler prompt."
                    }
                # Wait before retry
                import time
                time.sleep(2 * (attempt + 1))  # Progressive backoff
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Request error on attempt {attempt + 1}: {str(e)}")
                if attempt == max_retries - 1:  # Last attempt
                    return {
                        'success': False,
                        'error': f"Network error during logo generation: {str(e)}"
                    }
                # Wait before retry
                import time
                time.sleep(2 * (attempt + 1))  # Progressive backoff
        
        # Should never reach here, but just in case
        return {
            'success': False,
            'error': 'Unexpected error during logo generation'
        }

# Remove all Streamlit UI code - keeping only the LogoGeneratorAgent class
# The main() function and all UI code has been removed for backend integration

# Helper function for backend integration
def create_logo_agent():
    """Factory function to create a LogoGeneratorAgent instance"""
    return LogoGeneratorAgent()

# Test function for standalone usage
def test_logo_generation():
    """Test function to verify logo generation works"""
    agent = LogoGeneratorAgent()
    
    # Test color palette generation
    test_business = "A modern tech startup focusing on AI-powered solutions"
    palettes = agent.generate_color_palette(test_business)
    print("Color Palettes:", json.dumps(palettes, indent=2) if palettes else "None")
    
    # Test logo generation if palettes work
    if palettes and palettes.get('palettes'):
        first_palette = palettes['palettes'][0]
        colors = first_palette.get('colors', ['#2563EB', '#1F2937'])
        
        logo_result = agent.generate_logo(
            test_business,
            "modern minimalist geometric logo",
            colors[:3]  # Use first 3 colors
        )
        
        if logo_result and logo_result.get('success'):
            print("Logo generation successful!")
            print(f"Image URL: {logo_result.get('url')}")
        else:
            print("Logo generation failed:", logo_result)
    
    return True

if __name__ == "__main__":
    test_logo_generation()
