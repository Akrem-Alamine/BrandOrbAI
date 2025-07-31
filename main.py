#!/usr/bin/env python3
"""
Professional Logo Generator - AI-Powered Logo Generation using Pollinations
Uses QWEN for prompt generation and Pollinations for image creation
"""

import streamlit as st
import json
import re
import requests
from openai import OpenAI
import colorsys
import random
import base64
from io import BytesIO
from PIL import Image

# Initialize OpenAI client with OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

class LogoGeneratorAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        
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
        
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        # Extract JSON from the response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            # Simple fallback if JSON parsing fails
            return {
                "palettes": [
                    {
                        "name": "Professional Black",
                        "description": "Classic and professional",
                        "colors": ["#000000", "#333333", "#666666"]
                    },
                    {
                        "name": "Luxurious Gold",
                        "description": "Premium and sophisticated",
                        "colors": ["#FFD700", "#B8860B", "#DAA520"]
                    },
                    {
                        "name": "Modern Blue",
                        "description": "Trust and innovation",
                        "colors": ["#1e3a8a", "#3b82f6", "#60a5fa"]
                    },
                    {
                        "name": "Creative Red",
                        "description": "Bold and energetic",
                        "colors": ["#dc2626", "#ef4444", "#f87171"]
                    },
                    {
                        "name": "Elegant Green",
                        "description": "Growth and sustainability",
                        "colors": ["#065f46", "#10b981", "#34d399"]
                    },
                    {
                        "name": "Premium Purple",
                        "description": "Luxury and creativity",
                        "colors": ["#581c87", "#a855f7", "#c084fc"]
                    }
                ]
            }
    
    def generate_logo(self, business_description, logo_description, selected_colors):
        """Generate a professional logo using Pollinations API with QWEN-enhanced prompts"""
        
        # Create color description from hex codes with better mapping
        color_names = []
        for color in selected_colors:
            hex_color = color.lower()
            # More comprehensive color mapping
            if hex_color in ['#ffd700', '#ffdf00', '#ffc000', '#b8860b', '#daa520']:
                color_names.append('gold')
            elif hex_color in ['#c0c0c0', '#a9a9a9', '#808080', '#778899']:
                color_names.append('silver')
            elif hex_color in ['#ff0000', '#dc2626', '#ef4444', '#b91c1c', '#dc143c']:
                color_names.append('red')
            elif hex_color in ['#00ff00', '#10b981', '#065f46', '#16a34a', '#22c55e']:
                color_names.append('green')
            elif hex_color in ['#0000ff', '#3b82f6', '#1e3a8a', '#1d4ed8', '#2563eb']:
                color_names.append('blue')
            elif hex_color in ['#ffa500', '#ea580c', '#fb923c', '#f97316', '#ea580c']:
                color_names.append('orange')
            elif hex_color in ['#800080', '#581c87', '#a855f7', '#9333ea', '#8b5cf6']:
                color_names.append('purple')
            elif hex_color in ['#ffff00', '#fbbf24', '#f59e0b', '#eab308', '#facc15']:
                color_names.append('yellow')
            elif hex_color in ['#ffc0cb', '#f472b6', '#ec4899', '#db2777', '#e11d48']:
                color_names.append('pink')
            elif hex_color in ['#000000', '#374151', '#1f2937', '#111827', '#030712']:
                color_names.append('black')
            elif hex_color in ['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db']:
                color_names.append('white')
            else:
                # Extract basic color from hex with better logic
                r = int(color[1:3], 16)
                g = int(color[3:5], 16)
                b = int(color[5:7], 16)
                
                # Check for gold (high red+green, low blue)
                if r > 200 and g > 150 and b < 100:
                    color_names.append('gold')
                # Check for silver/gray
                elif abs(r-g) < 30 and abs(g-b) < 30 and abs(r-b) < 30:
                    color_names.append('silver')
                elif r > g and r > b:
                    color_names.append('red')
                elif g > r and g > b:
                    color_names.append('green')
                elif b > r and b > g:
                    color_names.append('blue')
                else:
                    color_names.append('black')
        
        # Use the most appropriate color
        primary_color = color_names[0] if color_names else 'black'
        
        # Extract business name from description
        business_name_prompt = f"""
        Extract the business name from this description: "{business_description}"
        
        Return ONLY the business name, nothing else. If no specific name is mentioned, return "company".
        """
        
        business_name_response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": business_name_prompt}],
            temperature=0.1
        )
        
        business_name = business_name_response.choices[0].message.content.strip().lower().replace(" ", "")
        if not business_name or len(business_name) > 20:
            business_name = "company"
        
        # Generate enhanced prompt using QWEN in specific format with business name
        prompt = f"""
        Based on this business: "{business_description}"
        And this description: "{logo_description}"
        
        Create a Pollinations prompt in this EXACT format (no spaces, all lowercase, separated by hyphens):
        flat-highresolution-logo-{business_name}-[BUSINESS_TYPE]-all{primary_color}-whitebackground-oneelement-oneblock-flatemblem-text{business_name}
        
        Replace [BUSINESS_TYPE] with a single word describing the business type (like: tech, fashion, food, ecommerce, etc.)
        Use the color: {primary_color}
        Include the business name: {business_name}
        
        IMPORTANT: Make sure the color {primary_color} is actually used in the prompt, not red or any other color.
        
        Return ONLY the formatted prompt, nothing else.
        """
        
        # Get enhanced prompt from QWEN
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        enhanced_prompt = response.choices[0].message.content.strip()
        
        # Ensure the correct color is in the prompt
        if primary_color not in enhanced_prompt:
            enhanced_prompt = enhanced_prompt.replace('allred', f'all{primary_color}').replace('allblue', f'all{primary_color}').replace('allgreen', f'all{primary_color}')
        
        # Generate logo using Pollinations API
        return self._generate_logo_with_pollinations(enhanced_prompt)
    
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
        
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {
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
            }
    
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
        """Generate logo using Pollinations API - NO FALLBACKS"""
        # Pollinations API endpoint
        base_url = "https://image.pollinations.ai/prompt/"
        encoded_prompt = requests.utils.quote(prompt)
        
        # Parameters for high-quality logo
        params = {
            'width': 1024,
            'height': 1024,
            'model': 'flux',  # High quality model
            'seed': random.randint(1, 1000000),
            'enhance': 'true'  # Enable prompt enhancement
        }
        
        # Build full URL
        param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{base_url}{encoded_prompt}?{param_string}"
        
        # Make request to Pollinations
        response = requests.get(full_url, timeout=60)
        
        if response.status_code == 200:
            # Convert to base64 for display
            image_bytes = response.content
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            return {
                'success': True,
                'image_data': image_base64,
                'image_bytes': image_bytes,
                'prompt': prompt,
                'url': full_url
            }
        else:
            st.error(f"Pollinations API error: {response.status_code}")
            return None

def main():
    st.set_page_config(page_title="AI Logo Generator", page_icon="🎨", layout="wide")
    
    st.title("🎨 Professional Logo Generator")
    st.markdown("**AI-Powered Logo Creation** • QWEN for Prompts • Pollinations for Generation")
    
    # Initialize the agent
    if 'agent' not in st.session_state:
        st.session_state.agent = LogoGeneratorAgent()
    
    # Initialize session state
    if 'step' not in st.session_state:
        st.session_state.step = 1
    if 'business_description' not in st.session_state:
        st.session_state.business_description = ""
    if 'logo_description' not in st.session_state:
        st.session_state.logo_description = ""
    if 'palettes' not in st.session_state:
        st.session_state.palettes = None
    if 'selected_colors' not in st.session_state:
        st.session_state.selected_colors = []
    
    # Step 1: Business Description
    if st.session_state.step == 1:
        st.header("Step 1: Describe Your Business")
        
        business_description = st.text_area(
            "Tell us about your business:",
            placeholder="e.g., A modern tech startup focusing on AI-powered solutions for small businesses...",
            height=100,
            value=st.session_state.business_description
        )
        
        if st.button("Continue to Logo Description", disabled=not business_description.strip()):
            st.session_state.business_description = business_description
            st.session_state.step = 2
            st.rerun()
    
    # Step 2: Logo Description
    elif st.session_state.step == 2:
        st.header("Step 2: Describe Your Ideal Logo")
        
        st.info(f"Business: {st.session_state.business_description}")
        
        # Generate and show suggestions
        if 'suggestions' not in st.session_state:
            with st.spinner("Generating suggestions..."):
                st.session_state.suggestions = st.session_state.agent.generate_suggested_keywords(
                    st.session_state.business_description
                )
        
        # Show suggestions in expandable sections
        with st.expander("💡 AI Suggestions for Your Logo", expanded=True):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.subheader("Style Suggestions")
                for style in st.session_state.suggestions['suggested_styles']:
                    if st.button(f"✨ {style}", key=f"style_{style}"):
                        st.session_state.logo_description = style
                        st.rerun()
            
            with col2:
                st.subheader("Design Keywords")
                for keyword in st.session_state.suggestions['suggested_keywords']:
                    if st.button(f"🎨 {keyword}", key=f"keyword_{keyword}"):
                        current = st.session_state.logo_description
                        st.session_state.logo_description = f"{current} {keyword}".strip()
                        st.rerun()
            
            with col3:
                st.subheader("Industry Specific")
                for specific in st.session_state.suggestions['industry_specific']:
                    if st.button(f"🏢 {specific}", key=f"industry_{specific}"):
                        current = st.session_state.logo_description
                        st.session_state.logo_description = f"{current} {specific}".strip()
                        st.rerun()
        
        logo_description = st.text_area(
            "How do you want your business logo to look?",
            placeholder="e.g., I want a modern, minimalist logo with clean lines and professional styling...",
            height=100,
            value=st.session_state.logo_description
        )
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("← Back"):
                st.session_state.step = 1
                st.rerun()
        
        with col2:
            if st.button("Generate Color Palettes", disabled=not logo_description.strip()):
                st.session_state.logo_description = logo_description
                with st.spinner("Generating color palettes..."):
                    st.session_state.palettes = st.session_state.agent.generate_color_palette(
                        st.session_state.business_description
                    )
                st.session_state.step = 3
                st.rerun()
    
    # Step 3: Color Selection
    elif st.session_state.step == 3:
        st.header("Step 3: Choose Your Color Palette")
        
        st.info(f"Business: {st.session_state.business_description}")
        st.info(f"Logo Style: {st.session_state.logo_description}")
        
        if st.session_state.palettes:
            selected_palette_idx = st.radio(
                "Select a color palette:",
                range(len(st.session_state.palettes['palettes'])),
                format_func=lambda x: st.session_state.palettes['palettes'][x]['name']
            )
            
            # Display selected palette
            palette = st.session_state.palettes['palettes'][selected_palette_idx]
            st.subheader(f"{palette['name']}")
            st.write(palette['description'])
            
            # Show color swatches
            cols = st.columns(len(palette['colors']))
            for i, color in enumerate(palette['colors']):
                with cols[i]:
                    st.markdown(
                        f"""
                        <div style="
                            background-color: {color};
                            height: 60px;
                            border-radius: 10px;
                            margin: 5px 0;
                            border: 2px solid #ddd;
                        "></div>
                        <p style="text-align: center; font-size: 12px; margin: 0;">{color}</p>
                        """,
                        unsafe_allow_html=True
                    )
            
            st.session_state.selected_colors = palette['colors']
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("← Back"):
                    st.session_state.step = 2
                    st.rerun()
            
            with col2:
                if st.button("Generate Logo"):
                    st.session_state.step = 4
                    st.rerun()
    
    # Step 4: Logo Generation and Display
    elif st.session_state.step == 4:
        st.header("Step 4: Your Generated Logo")
        
        # Show summary
        with st.expander("Project Summary", expanded=False):
            st.write(f"**Business:** {st.session_state.business_description}")
            st.write(f"**Logo Style:** {st.session_state.logo_description}")
            st.write(f"**Colors:** {', '.join(st.session_state.selected_colors)}")
        
        # Generate logo
        with st.spinner("🎨 Generating your professional logo using Pollinations..."):
            logo_result = st.session_state.agent.generate_logo(
                st.session_state.business_description,
                st.session_state.logo_description,
                st.session_state.selected_colors
            )
        
        if logo_result and logo_result.get('success', False):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.subheader("Your Professional Logo")
                # Display the logo
                st.image(
                    f"data:image/jpeg;base64,{logo_result['image_data']}", 
                    caption="Generated Professional Logo",
                    use_container_width=True
                )
                
                # Logo modification options
                st.subheader("🔧 Modify Your Logo")
                
                col_a, col_b = st.columns(2)
                with col_a:
                    if st.button("🎨 Change Colors"):
                        st.session_state.step = 3
                        st.rerun()
                
                with col_b:
                    if st.button("✏️ Change Description"):
                        st.session_state.step = 2
                        st.rerun()
                
                # Style modification
                new_style = st.text_input(
                    "Quick style change:",
                    placeholder="e.g., make it more modern, add gold elements, etc.",
                    key="style_modification"
                )
                
                if st.button("🔄 Apply Style Change") and new_style.strip():
                    # Update logo description with new style
                    st.session_state.logo_description = f"{st.session_state.logo_description} {new_style}"
                    with st.spinner("Applying style changes..."):
                        updated_result = st.session_state.agent.generate_logo(
                            st.session_state.business_description,
                            st.session_state.logo_description,
                            st.session_state.selected_colors
                        )
                        if updated_result:
                            st.rerun()
            
            with col2:
                st.subheader("Download Options")
                
                # Download as JPG
                st.download_button(
                    label="📸 Download as JPG",
                    data=logo_result['image_bytes'],
                    file_name="professional_logo.jpg",
                    mime="image/jpeg"
                )
                
                # Convert and download as SVG
                if st.button("🔄 Convert to SVG"):
                    svg_content = st.session_state.agent.convert_to_svg(logo_result['image_data'])
                    st.download_button(
                        label="📄 Download as SVG",
                        data=svg_content,
                        file_name="professional_logo.svg",
                        mime="image/svg+xml",
                        key="svg_download"
                    )
                    st.success("✅ SVG version ready for download!")
                
                # Show generation details
                with st.expander("Generation Details"):
                    st.write(f"**QWEN Enhanced Prompt:** {logo_result['prompt']}")
                    st.write(f"**Pollinations URL:** {logo_result['url']}")
                    
                # Color verification
                with st.expander("Color Verification"):
                    st.write("**Selected Colors:**")
                    for color in st.session_state.selected_colors:
                        st.markdown(f"<div style='background-color: {color}; height: 20px; margin: 2px 0; padding: 5px; color: white; text-align: center;'>{color}</div>", unsafe_allow_html=True)
        else:
            st.error("❌ Failed to generate logo using Pollinations API. Please try again.")
        
        # Action buttons
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("← Back to Colors"):
                st.session_state.step = 3
                st.rerun()
        
        with col2:
            if st.button("🔄 Generate New Logo"):
                # Keep the same settings but regenerate
                st.rerun()
        
        with col3:
            if st.button("🆕 Start Over"):
                # Reset everything
                for key in ['step', 'business_description', 'logo_description', 'palettes', 'selected_colors']:
                    if key in st.session_state:
                        del st.session_state[key]
                st.rerun()

if __name__ == "__main__":
    main()
