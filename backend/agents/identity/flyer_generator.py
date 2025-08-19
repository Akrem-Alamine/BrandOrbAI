#!/usr/bin/env python3
"""
Professional Flyer Generator - AI-Powered Flyer Creation for Logo Generator Promotion
Uses QWEN for content generation and Pollinations for image creation
"""

import os
import streamlit as st
import json
import re
import requests
from openai import OpenAI
import random
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import textwrap
from dotenv import load_dotenv

load_dotenv()

class FlyerGeneratorAgent:
    def __init__(self):
        self.model = "qwen/qwen-2.5-coder-32b-instruct"
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY')
        )
        
    def generate_flyer_concepts(self, business_summary, target_audience="business owners"):
        """Generate multiple flyer concept ideas"""
        prompt = f"""
        Create 5 amazing flyer concepts to promote this business: "{business_summary}"
        Target audience: {target_audience}
        
        Each concept should be unique and compelling. Return in this JSON format:
        {{
            "concepts": [
                {{
                    "title": "Catchy flyer title",
                    "style": "Visual style description",
                    "headline": "Main headline text",
                    "subheadline": "Supporting text",
                    "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
                    "call_to_action": "Action text",
                    "color_scheme": "Color palette description",
                    "visual_elements": "What images/graphics to include"
                }}
            ]
        }}
        
        Make each concept world-class and attention-grabbing for promoting this specific business.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return None
    
    def extract_business_name(self, business_description):
        """Extract the business name from the description"""
        prompt = f"""
        From this business description, extract the most suitable business name:
        "{business_description}"
        
        Rules:
        1. If there's a clear business name mentioned, use it exactly
        2. If no name is mentioned, create a short, catchy name based on the business concept
        3. Keep it professional and brandable
        4. Make it suitable for marketing materials
        5. If it's a service description without a name, create one that represents the business
        
        Return ONLY the business name, nothing else.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        business_name = response.choices[0].message.content.strip()
        # Clean up the name (remove quotes, extra spaces, etc.)
        business_name = business_name.replace('"', '').replace("'", '').strip()
        return business_name
    
    def generate_color_palette_options(self, business_description):
        """Generate color palette options for the user to choose from"""
        prompt = f"""
        Based on this business description: "{business_description}"
        
        Generate 5 different color palettes that would work well for promotional flyers.
        Consider the industry, target audience, and brand personality.
        
        Return the response in this exact JSON format:
        {{
            "palettes": [
                {{
                    "name": "Palette Name",
                    "description": "Brief description of why this palette fits",
                    "colors": ["Color Name 1", "Color Name 2", "Color Name 3"]
                }}
            ]
        }}
        
        Use descriptive color names like "deep navy blue", "vibrant orange", "forest green", etc.
        Make sure the palettes are professional and suitable for marketing flyers.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return None
    
    def generate_business_slogans(self, business_summary, business_name, target_audience):
        """Generate multiple slogan options for the business"""
        prompt = f"""
        Create 10 amazing, catchy slogans for this business:
        
        Business Name: {business_name}
        Business Description: {business_summary}
        Target Audience: {target_audience}
        
        Generate slogans that are:
        1. Short and memorable (3-7 words ideal)
        2. Catchy and easy to remember
        3. Reflect the business value proposition
        4. Professional yet engaging
        5. Suitable for marketing materials
        
        Return in this JSON format:
        {{
            "slogans": [
                {{
                    "slogan": "Catchy slogan text",
                    "style": "Professional/Creative/Bold/Friendly",
                    "explanation": "Why this slogan works for the business"
                }}
            ]
        }}
        
        Make each slogan unique and powerful for this specific business!
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return None
    
    def generate_flyer_copy(self, concept, business_summary, business_focus="general"):
        """Generate detailed marketing copy for a flyer concept"""
        prompt = f"""
        Create compelling marketing copy for this flyer concept promoting this business:
        
        Business: {business_summary}
        Concept: {concept}
        Focus: {business_focus}
        
        Generate:
        1. Main headline (powerful, attention-grabbing)
        2. Subheadline (explains the value)
        3. 4-5 key benefits (why choose this business)
        4. Social proof elements (testimonial-style text)
        5. Call-to-action (urgent, compelling)
        6. Contact/website info placeholder
        
        Return in JSON format:
        {{
            "headline": "Main headline",
            "subheadline": "Supporting headline",
            "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
            "social_proof": "Testimonial or statistic",
            "cta": "Call to action",
            "features": ["Feature 1", "Feature 2", "Feature 3"],
            "tagline": "Memorable tagline"
        }}
        
        Make it world-class marketing copy that converts for this specific business!
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return None
    
    def generate_flyer_design_prompt(self, concept, copy_data, business_name="", custom_colors=None):
        """Generate detailed prompt for flyer image creation"""
        
        # Prepare color information
        color_instruction = ""
        if custom_colors:
            color_names = ", ".join(custom_colors)
            color_instruction = f"Use these specific colors: {color_names}. "
        
        # Prepare business name instruction
        name_instruction = ""
        if business_name:
            name_instruction = f"Feature the business name '{business_name}' prominently. "
        
        prompt = f"""
        Create a detailed Pollinations AI prompt for generating a professional promotional flyer with these specifications:
        
        Concept: {concept}
        Marketing Copy: {copy_data}
        Business Name: {business_name}
        Colors: {custom_colors if custom_colors else 'Professional brand colors'}
        
        Key design rules to follow when creating a professional, high-impact flyer:

        🖌️ 1. Use a Strong Visual Hierarchy
        Make the headline big and bold—this grabs attention first.
        Use subheadings and body text with decreasing font sizes to guide the reader's eye.

        🎯 2. Stick to One Clear Message
        Focus on one central idea or call to action.
        Don't overload the flyer with too much text or multiple offers.

        🎨 3. Keep It Clean and Balanced
        Use plenty of white space to avoid clutter.
        Align text and images neatly—follow grid or column structures.

        🎨 4. Choose a Cohesive Color Scheme
        Use 2–3 brand colors that contrast well and reflect your identity.
        Make sure text is always readable (e.g., dark text on light background).

        🖼️ 5. Use High-Quality Images & Icons
        Never use blurry or pixelated images.
        Use consistent styles—either all photos or all illustrations, not a mix.

        🔠 6. Pick Readable Fonts (and Limit Them)
        Use 1–2 font families maximum.
        Choose clean, legible fonts for body text (sans-serif is a safe choice).

        📱 7. Include a Clear Call to Action
        Make the CTA button or line stand out in color or design.
        Example: "Scan the QR Code to Start Refilling Today!"

        📐 8. Design for Print and Digital
        Use CMYK color mode for print, RGB for digital.
        Keep margins safe and avoid placing text too close to the edges.

        ✅ 9. Brand Consistency
        Use your logo, brand fonts, and colors consistently throughout the flyer.
        Make sure it "feels" like your business.

        🔍 10. Proofread and Test
        Double-check spelling and grammar.
        
        Requirements:
        1. Professional marketing flyer design following all design rules above
        2. Eye-catching layout with strong visual hierarchy
        3. Modern, clean design aesthetic with plenty of white space
        4. Include space for text overlay with proper readability
        5. High-quality, print-ready appearance
        6. Compelling visual elements that match the style
        7. {color_instruction}Professional color scheme with good contrast
        8. Business/tech focused imagery that supports the message
        9. Call-to-action prominence and visibility
        10. Brand-appropriate styling that feels cohesive
        11. {name_instruction}Clean typography with 1-2 font families maximum
        12. Grid-based layout with proper alignment
        
        Focus on creating a flyer that looks like it was designed by a top marketing agency.
        Include elements like: geometric shapes, gradients, professional typography space, 
        tech/AI imagery, business icons, and modern design elements.
        
        Return ONLY the final prompt for the AI image generator, nothing else.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6
        )
        
        return response.choices[0].message.content.strip()
    
    def create_flyer_with_text_overlay(self, background_image_bytes, business_name, flyer_copy, colors, dimensions=(1080, 1350)):
        """Create an actual flyer by adding text overlay to background image"""
        try:
            from PIL import Image, ImageDraw, ImageFont
            import textwrap
            import io
            
            # Open the background image
            background = Image.open(io.BytesIO(background_image_bytes))
            background = background.resize(dimensions, Image.Resampling.LANCZOS)
            
            # Create a drawing context
            draw = ImageDraw.Draw(background)
            
            # Calculate font sizes based on image dimensions
            width, height = dimensions
            base_font_size = min(width, height) // 25  # Dynamic font sizing
            
            # Define colors
            text_color = (255, 255, 255)  # White text
            accent_color = (255, 165, 0)  # Orange accent
            
            try:
                # Try to load better fonts with dynamic sizing
                title_font = ImageFont.truetype("arial.ttf", int(base_font_size * 2.5))
                subtitle_font = ImageFont.truetype("arial.ttf", int(base_font_size * 1.8))
                body_font = ImageFont.truetype("arial.ttf", int(base_font_size * 1.3))
                small_font = ImageFont.truetype("arial.ttf", int(base_font_size * 1.0))
            except:
                # Use default font if custom fonts not available
                title_font = ImageFont.load_default()
                subtitle_font = ImageFont.load_default()
                body_font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Calculate positions
            margin = width // 18  # Dynamic margin
            y_pos = margin
            
            # Add semi-transparent overlay for better text readability
            overlay = Image.new('RGBA', dimensions, (0, 0, 0, 120))  # Semi-transparent black
            background = Image.alpha_composite(background.convert('RGBA'), overlay)
            draw = ImageDraw.Draw(background)
            
            # 1. Business Name (Top, Large)
            if business_name:
                # Wrap business name if too long
                max_chars = max(10, width // 60)  # Dynamic wrapping
                wrapped_name = textwrap.fill(business_name, width=max_chars)
                bbox = draw.textbbox((0, 0), wrapped_name, font=title_font)
                text_width = bbox[2] - bbox[0]
                x_pos = (width - text_width) // 2
                
                # Add background rectangle for business name
                padding = margin // 3
                rect_coords = [x_pos - padding, y_pos - padding, 
                             x_pos + text_width + padding, y_pos + bbox[3] - bbox[1] + padding]
                draw.rectangle(rect_coords, fill=(0, 0, 0, 180), outline=accent_color, width=3)
                
                draw.text((x_pos, y_pos), wrapped_name, fill=text_color, font=title_font)
                y_pos += bbox[3] - bbox[1] + margin
            
            # 2. Main Headline
            if flyer_copy and 'headline' in flyer_copy:
                headline = flyer_copy['headline']
                max_chars = max(15, width // 45)
                wrapped_headline = textwrap.fill(headline, width=max_chars)
                bbox = draw.textbbox((0, 0), wrapped_headline, font=subtitle_font)
                text_width = bbox[2] - bbox[0]
                x_pos = (width - text_width) // 2
                draw.text((x_pos, y_pos), wrapped_headline, fill=accent_color, font=subtitle_font)
                y_pos += bbox[3] - bbox[1] + margin // 2
            
            # 3. Subheadline
            if flyer_copy and 'subheadline' in flyer_copy:
                subheadline = flyer_copy['subheadline']
                max_chars = max(20, width // 35)
                wrapped_sub = textwrap.fill(subheadline, width=max_chars)
                bbox = draw.textbbox((0, 0), wrapped_sub, font=body_font)
                text_width = bbox[2] - bbox[0]
                x_pos = (width - text_width) // 2
                draw.text((x_pos, y_pos), wrapped_sub, fill=text_color, font=body_font)
                y_pos += bbox[3] - bbox[1] + margin // 2
            
            # 4. Key Benefits (Left-aligned in a box) - Only if there's space
            if flyer_copy and 'benefits' in flyer_copy and len(flyer_copy['benefits']) > 0 and y_pos < height * 0.6:
                benefits_title = "KEY BENEFITS:"
                draw.text((margin, y_pos), benefits_title, fill=accent_color, font=body_font)
                y_pos += margin // 2
                
                benefits_to_show = min(3, len(flyer_copy['benefits']))  # Limit based on format
                if height < 700:  # For social formats, show fewer
                    benefits_to_show = 2
                
                for benefit in flyer_copy['benefits'][:benefits_to_show]:
                    benefit_text = f"✓ {benefit}"
                    max_chars = max(15, width // 40)
                    wrapped_benefit = textwrap.fill(benefit_text, width=max_chars)
                    draw.text((margin, y_pos), wrapped_benefit, fill=text_color, font=small_font)
                    bbox = draw.textbbox((0, 0), wrapped_benefit, font=small_font)
                    y_pos += bbox[3] - bbox[1] + 10
                
                y_pos += margin // 2
            
            # 5. Call to Action (Bottom area, centered, highlighted)
            if flyer_copy and 'cta' in flyer_copy:
                cta = flyer_copy['cta']
                max_chars = max(12, width // 50)
                wrapped_cta = textwrap.fill(cta, width=max_chars)
                bbox = draw.textbbox((0, 0), wrapped_cta, font=subtitle_font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                # Position in bottom third
                cta_y = height - text_height - margin * 3
                x_pos = (width - text_width) // 2
                
                # Add highlight background
                padding = margin // 2
                rect_coords = [x_pos - padding, cta_y - padding, 
                             x_pos + text_width + padding, cta_y + text_height + padding]
                draw.rectangle(rect_coords, fill=accent_color, outline=(255, 255, 255), width=2)
                
                draw.text((x_pos, cta_y), wrapped_cta, fill=(0, 0, 0), font=subtitle_font)
            
            # 6. Tagline (Very bottom) - Only if there's space
            if flyer_copy and 'tagline' in flyer_copy and height > 800:  # Only for larger formats
                tagline = flyer_copy['tagline']
                max_chars = max(20, width // 30)
                wrapped_tagline = textwrap.fill(tagline, width=max_chars)
                bbox = draw.textbbox((0, 0), wrapped_tagline, font=small_font)
                text_width = bbox[2] - bbox[0]
                x_pos = (width - text_width) // 2
                draw.text((x_pos, height - margin), wrapped_tagline, fill=text_color, font=small_font)
            
            # Convert back to bytes
            output_buffer = io.BytesIO()
            background = background.convert('RGB')  # Convert back to RGB for JPEG
            background.save(output_buffer, format='JPEG', quality=95)
            return output_buffer.getvalue()
            
        except Exception as e:
            print(f"❌ Error creating text overlay: {str(e)}")
            # Return original image if overlay fails
            return background_image_bytes
    def create_flyer_with_pollinations(self, design_prompt, business_name="", business_summary="", colors=None, flyer_copy=None):
        """Generate flyer background and add text overlay to create actual flyers"""
        try:
            print(f"🎨 Generating professional flyer for {business_name}...")
            
            # Create a focused prompt for background image (no text in the prompt)
            business_prompt = "professional marketing flyer background design template clean modern layout"
            if business_summary:
                # Add business context for appropriate imagery
                if "artisan" in business_summary.lower() or "craft" in business_summary.lower():
                    business_prompt += " artisan crafts handmade products"
                elif "tech" in business_summary.lower() or "software" in business_summary.lower():
                    business_prompt += " technology modern digital"
                elif "food" in business_summary.lower() or "restaurant" in business_summary.lower():
                    business_prompt += " food culinary gourmet"
                else:
                    business_prompt += " professional business"
            
            if colors:
                color_desc = " ".join(colors[:2])  # Use first 2 colors
                business_prompt += f" {color_desc} color scheme"
            
            business_prompt += " empty space for text overlay professional marketing template"
            
            base_url = "https://image.pollinations.ai/prompt/"
            encoded_prompt = requests.utils.quote(business_prompt)
            
            params = {
                'width': 1080,
                'height': 1350,
                'seed': random.randint(1, 100000)
            }
            
            param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            full_url = f"{base_url}{encoded_prompt}?{param_string}"
            
            print(f"🔗 Using background prompt: {business_prompt}")
            st.info(f"🌐 Creating professional flyer for {business_name}...")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*'
            }
            
            response = requests.get(full_url, timeout=30, headers=headers)
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                background_bytes = response.content
                print(f"📊 Background image size: {len(background_bytes)} bytes")
                
                if len(background_bytes) > 1000:
                    st.info(f"✍️ Adding marketing copy and business details...")
                    
                    # Create the actual flyer with text overlay
                    flyer_bytes = self.create_flyer_with_text_overlay(
                        background_bytes, 
                        business_name, 
                        flyer_copy, 
                        colors, 
                        (1080, 1350)
                    )
                    
                    image_base64 = base64.b64encode(flyer_bytes).decode('utf-8')
                    st.success(f"✅ Professional flyer created for {business_name}!")
                    
                    return {
                        'success': True,
                        'image_data': image_base64,
                        'image_bytes': flyer_bytes,
                        'prompt': f"Professional flyer for {business_name}",
                        'url': full_url
                    }
            
            # Try alternative approach if first method fails
            st.info(f"🔄 Trying alternative method...")
            alt_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            response = requests.get(alt_url, timeout=30, headers=headers)
            
            if response.status_code == 200:
                background_bytes = response.content
                if len(background_bytes) > 1000:
                    flyer_bytes = self.create_flyer_with_text_overlay(
                        background_bytes, 
                        business_name, 
                        flyer_copy, 
                        colors, 
                        (1080, 1350)
                    )
                    
                    image_base64 = base64.b64encode(flyer_bytes).decode('utf-8')
                    st.success(f"✅ Professional flyer created with alternative method for {business_name}!")
                    
                    return {
                        'success': True,
                        'image_data': image_base64,
                        'image_bytes': flyer_bytes,
                        'prompt': f"Professional flyer for {business_name}",
                        'url': alt_url
                    }
            
            st.error(f"❌ Unable to generate background image.")
            return None
                
        except requests.exceptions.Timeout:
            st.error("❌ Request timed out. API is slow or unavailable.")
            return None
        except requests.exceptions.RequestException as e:
            st.error(f"❌ Network error: {str(e)}")
            return None
        except Exception as e:
            st.error(f"❌ Unexpected error: {str(e)}")
            return None
    
    def generate_social_media_versions(self, concept, business_name, business_summary, flyer_copy=None):
        """Generate different sizes for social media with business-specific details"""
        social_formats = {
            "Instagram Square": (1080, 1080),
            "Instagram Story": (1080, 1920),
            "Facebook Post": (1200, 630),
            "Twitter Header": (1500, 500),
            "LinkedIn Post": (1200, 627)
        }
        
        results = {}
        for format_name, (width, height) in social_formats.items():
            try:
                # Create business-specific prompt for social media
                social_prompt = f"{format_name.lower().replace(' ', '_')}_design"
                if business_name:
                    social_prompt += f" {business_name}"
                if business_summary:
                    # Get business type from first sentence
                    business_type = business_summary.split('.')[0].split(' ')[-3:]  # Last few words of first sentence
                    business_type_str = " ".join(business_type) if len(business_type) <= 3 else ""
                    if business_type_str:
                        social_prompt += f" {business_type_str}"
                
                social_prompt += " professional modern design"
                
                base_url = "https://image.pollinations.ai/prompt/"
                encoded_prompt = requests.utils.quote(social_prompt)
                
                # Basic parameters only
                params = {
                    'width': width,
                    'height': height,
                    'seed': random.randint(1, 100000)
                }
                
                param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
                full_url = f"{base_url}{encoded_prompt}?{param_string}"
                
                print(f"🔗 Generating {format_name} for {business_name}...")
                print(f"🔗 Using prompt: {social_prompt}")
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*,*/*'
                }
                
                # Try with longer timeout and retry logic
                success = False
                for attempt in range(2):  # Try twice
                    try:
                        timeout = 45 if attempt == 0 else 60  # Increase timeout on retry
                        print(f"🔄 Attempt {attempt + 1} with {timeout}s timeout...")
                        
                        response = requests.get(full_url, timeout=timeout, headers=headers)
                        
                        if response.status_code == 200:
                            background_bytes = response.content
                            if len(background_bytes) > 1000:
                                # Create actual social media flyer with text overlay
                                print(f"✍️ Adding text overlay to {format_name}...")
                                flyer_bytes = self.create_flyer_with_text_overlay(
                                    background_bytes, 
                                    business_name, 
                                    flyer_copy, 
                                    None,  # colors 
                                    (width, height)
                                )
                                
                                image_base64 = base64.b64encode(flyer_bytes).decode('utf-8')
                                
                                results[format_name] = {
                                    'success': True,
                                    'image_data': image_base64,
                                    'image_bytes': flyer_bytes,
                                    'dimensions': f"{width}x{height}"
                                }
                                print(f"✅ {format_name} flyer created successfully for {business_name}")
                                success = True
                                break
                            else:
                                print(f"❌ {format_name} invalid image size")
                        else:
                            print(f"❌ {format_name} API error: {response.status_code}")
                            
                    except requests.exceptions.Timeout:
                        print(f"⏰ {format_name} timeout on attempt {attempt + 1}")
                        if attempt == 0:  # Try alternative method on first timeout
                            try:
                                alt_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                                print(f"🔄 Trying alternative URL for {format_name}...")
                                alt_response = requests.get(alt_url, timeout=45, headers=headers)
                                if alt_response.status_code == 200 and len(alt_response.content) > 1000:
                                    # Create actual social media flyer with text overlay
                                    flyer_bytes = self.create_flyer_with_text_overlay(
                                        alt_response.content, 
                                        business_name, 
                                        flyer_copy, 
                                        None,  # colors 
                                        (width, height)
                                    )
                                    image_base64 = base64.b64encode(flyer_bytes).decode('utf-8')
                                    results[format_name] = {
                                        'success': True,
                                        'image_data': image_base64,
                                        'image_bytes': flyer_bytes,
                                        'dimensions': f"{width}x{height}"
                                    }
                                    print(f"✅ {format_name} flyer generated with alternative method for {business_name}")
                                    success = True
                                    break
                            except:
                                print(f"❌ Alternative method also failed for {format_name}")
                        continue
                    except Exception as e:
                        print(f"❌ Error on attempt {attempt + 1} for {format_name}: {str(e)}")
                        continue
                
                if not success:
                    print(f"❌ All attempts failed for {format_name}")
                        
            except Exception as e:
                print(f"❌ Error generating {format_name}: {str(e)}")
                continue
        
        return results

def main():
    st.set_page_config(page_title="AI Flyer Generator", page_icon="📄", layout="wide")
    
    st.title("📄 Professional Flyer Generator")
    st.markdown("**World-Class Marketing Materials** • AI-Powered Flyer Creation • Multiple Formats")
    
    # Initialize the agent
    if 'flyer_agent' not in st.session_state:
        st.session_state.flyer_agent = FlyerGeneratorAgent()
    
    # Initialize session state
    if 'flyer_step' not in st.session_state:
        st.session_state.flyer_step = 1
    if 'target_audience' not in st.session_state:
        st.session_state.target_audience = ""
    if 'business_focus' not in st.session_state:
        st.session_state.business_focus = ""
    if 'business_summary' not in st.session_state:
        st.session_state.business_summary = ""
    if 'business_name' not in st.session_state:
        st.session_state.business_name = ""
    if 'color_palettes' not in st.session_state:
        st.session_state.color_palettes = None
    if 'selected_colors' not in st.session_state:
        st.session_state.selected_colors = []
    if 'business_slogans' not in st.session_state:
        st.session_state.business_slogans = None
    if 'selected_slogan' not in st.session_state:
        st.session_state.selected_slogan = ""
    if 'flyer_concepts' not in st.session_state:
        st.session_state.flyer_concepts = None
    if 'selected_concept' not in st.session_state:
        st.session_state.selected_concept = None
    if 'flyer_copy' not in st.session_state:
        st.session_state.flyer_copy = None
    if 'generated_flyers' not in st.session_state:
        st.session_state.generated_flyers = []
    
    # Step 1: Business Idea Input
    if st.session_state.flyer_step == 1:
        st.header("Step 1: Describe Your Business Idea")
        
        st.markdown("""
        Tell us about your business idea in detail. Include:
        - **What your business does** (products/services)
        - **Who your target customers are** (audience)
        - **What makes you special** (your selling point)
        
        The more details you provide, the better flyers we can create!
        """)
        
        business_idea = st.text_area(
            "What's your business idea?",
            placeholder="""Example: 
I run a premium coffee roasting business targeting busy professionals and coffee enthusiasts in urban areas. We offer freshly roasted, ethically sourced beans delivered weekly to offices and homes. Our main selling point is that we roast small batches every day and guarantee delivery within 24 hours of roasting, ensuring the freshest coffee possible. We focus on building relationships with local coffee farmers and providing detailed tasting notes with each order.""",
            height=150,
            value=st.session_state.target_audience if hasattr(st.session_state, 'target_audience') else ""
        )
        
        if st.button("Generate Amazing Flyer Concepts", disabled=not business_idea.strip()):
            # Extract components using AI
            with st.spinner("🧠 Analyzing your business idea..."):
                analysis_prompt = f"""
                Analyze this business idea and extract key information:
                "{business_idea}"
                
                Return in JSON format:
                {{
                    "target_audience": "Main target customers (concise)",
                    "business_focus": "Main selling point/advantage",
                    "business_summary": "Brief business description"
                }}
                """
                
                analysis_response = st.session_state.flyer_agent.client.chat.completions.create(
                    model=st.session_state.flyer_agent.model,
                    messages=[{"role": "user", "content": analysis_prompt}],
                    temperature=0.3
                )
                
                analysis_content = analysis_response.choices[0].message.content
                json_match = re.search(r'\{.*\}', analysis_content, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                    st.session_state.target_audience = analysis.get('target_audience', business_idea)
                    st.session_state.business_focus = analysis.get('business_focus', 'Quality Service')
                    st.session_state.business_summary = analysis.get('business_summary', business_idea)
                else:
                    st.session_state.target_audience = business_idea
                    st.session_state.business_focus = "Quality Service"
                    st.session_state.business_summary = business_idea
                
                # Extract business name
                st.session_state.business_name = st.session_state.flyer_agent.extract_business_name(business_idea)
                
                # Generate color palettes
                st.session_state.color_palettes = st.session_state.flyer_agent.generate_color_palette_options(business_idea)
                
                # Generate business slogans
                st.session_state.business_slogans = st.session_state.flyer_agent.generate_business_slogans(
                    st.session_state.business_summary,
                    st.session_state.business_name,
                    st.session_state.target_audience
                )
            
            with st.spinner("🎨 Creating amazing flyer concepts..."):
                st.session_state.flyer_concepts = st.session_state.flyer_agent.generate_flyer_concepts(
                    st.session_state.business_summary,
                    st.session_state.target_audience
                )
            st.session_state.flyer_step = 2
            st.rerun()
    
    # Step 2: Slogan Selection
    elif st.session_state.flyer_step == 2:
        st.header("Step 2: Choose Your Business Slogan")
        
        st.info(f"**Business:** {st.session_state.business_name} | **Summary:** {st.session_state.business_summary}")
        
        if st.session_state.business_slogans:
            st.subheader("🎯 AI-Generated Slogans")
            st.markdown("Choose the perfect slogan that captures your business essence:")
            
            slogans = st.session_state.business_slogans['slogans']
            
            # Display slogans in a nice format
            for i, slogan_data in enumerate(slogans):
                with st.container():
                    col1, col2 = st.columns([3, 1])
                    
                    with col1:
                        st.markdown(f"""
                        <div style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 15px;
                            border-radius: 10px;
                            margin: 10px 0;
                            text-align: center;
                            font-size: 20px;
                            font-weight: bold;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                        ">
                            "{slogan_data['slogan']}"
                        </div>
                        """, unsafe_allow_html=True)
                        
                        st.write(f"**Style:** {slogan_data['style']}")
                        st.write(f"**Why it works:** {slogan_data['explanation']}")
                    
                    with col2:
                        if st.button(f"Select This Slogan", key=f"slogan_{i}"):
                            st.session_state.selected_slogan = slogan_data['slogan']
                            st.session_state.flyer_step = 3
                            st.rerun()
                
                st.divider()
            
            # Option to skip slogan selection
            st.subheader("🔄 Other Options")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("← Back"):
                    st.session_state.flyer_step = 1
                    st.rerun()
            
            with col2:
                if st.button("🔄 Generate New Slogans"):
                    with st.spinner("🎯 Creating new slogans..."):
                        st.session_state.business_slogans = st.session_state.flyer_agent.generate_business_slogans(
                            st.session_state.business_summary,
                            st.session_state.business_name,
                            st.session_state.target_audience
                        )
                    st.rerun()
            
            with col3:
                if st.button("Skip Slogans →"):
                    st.session_state.selected_slogan = ""
                    st.session_state.flyer_step = 3
                    st.rerun()
    
    # Step 3: Concept Selection
    elif st.session_state.flyer_step == 3:
        st.header("Step 3: Choose Your Flyer Concept")
        
        st.info(f"**Business:** {st.session_state.business_name} | **Summary:** {st.session_state.business_summary}")
        
        if st.session_state.selected_slogan:
            st.success(f"✅ Selected Slogan: \"{st.session_state.selected_slogan}\"")
        
        if st.session_state.flyer_concepts:
            concepts = st.session_state.flyer_concepts['concepts']
            
            for i, concept in enumerate(concepts):
                with st.expander(f"🎨 Concept {i+1}: {concept['title']}", expanded=i==0):
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        st.write(f"**Style:** {concept['style']}")
                        st.write(f"**Headline:** {concept['headline']}")
                        st.write(f"**Subheadline:** {concept['subheadline']}")
                        
                        st.write("**Key Benefits:**")
                        for benefit in concept['key_benefits']:
                            st.write(f"• {benefit}")
                        
                        st.write(f"**Call to Action:** {concept['call_to_action']}")
                        st.write(f"**Color Scheme:** {concept['color_scheme']}")
                        st.write(f"**Visual Elements:** {concept['visual_elements']}")
                    
                    with col2:
                        if st.button(f"Select Concept {i+1}", key=f"concept_{i}"):
                            st.session_state.selected_concept = concept
                            st.session_state.flyer_step = 4
                            st.rerun()
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("← Back to Slogans"):
                st.session_state.flyer_step = 2
                st.rerun()
        
        with col2:
            if st.button("🔄 Generate New Concepts"):
                with st.spinner("🎨 Creating new flyer concepts..."):
                    st.session_state.flyer_concepts = st.session_state.flyer_agent.generate_flyer_concepts(
                        st.session_state.business_summary,
                        st.session_state.target_audience
                    )
                st.rerun()
    
    # Step 4: Color Selection
    elif st.session_state.flyer_step == 4:
        st.header("Step 4: Choose Your Flyer Colors")
        
        st.info(f"**Business:** {st.session_state.business_name} | **Concept:** {st.session_state.selected_concept['title']}")
        
        if st.session_state.selected_slogan:
            st.success(f"✅ Selected Slogan: \"{st.session_state.selected_slogan}\"")
        
        if st.session_state.color_palettes:
            st.subheader("🎨 AI-Generated Color Palettes")
            
            palettes = st.session_state.color_palettes['palettes']
            
            selected_palette_idx = st.radio(
                "Select a color palette for your flyers:",
                range(len(palettes)),
                format_func=lambda x: palettes[x]['name']
            )
            
            # Display selected palette
            palette = palettes[selected_palette_idx]
            st.write(f"**{palette['name']}**")
            st.write(palette['description'])
            
            # Show color preview with actual color names
            cols = st.columns(len(palette['colors']))
            for i, color in enumerate(palette['colors']):
                with cols[i]:
                    # Create a color representation with the actual color name
                    st.markdown(
                        f"""
                        <div style="
                            background-color: #{'3498db' if i == 0 else 'e74c3c' if i == 1 else 'f39c12'};
                            height: 60px;
                            border-radius: 10px;
                            margin: 5px 0;
                            border: 2px solid #ddd;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                            text-align: center;
                            font-size: 12px;
                        ">
                            {color}
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
            
            st.session_state.selected_colors = palette['colors']
            
            # Option to customize colors
            st.divider()
            st.subheader("🎨 Or Choose Custom Colors")
            
            custom_colors = []
            col1, col2, col3 = st.columns(3)
            
            with col1:
                color1 = st.text_input("Primary Color", placeholder="e.g., deep navy blue", key="custom_color1")
                if color1:
                    custom_colors.append(color1)
            
            with col2:
                color2 = st.text_input("Secondary Color", placeholder="e.g., bright orange", key="custom_color2")
                if color2:
                    custom_colors.append(color2)
            
            with col3:
                color3 = st.text_input("Accent Color", placeholder="e.g., white", key="custom_color3")
                if color3:
                    custom_colors.append(color3)
            
            if custom_colors:
                if st.button("✅ Use Custom Colors"):
                    st.session_state.selected_colors = custom_colors
                    st.success(f"Using custom colors: {', '.join(custom_colors)}")
            
            # Navigation
            col1, col2 = st.columns(2)
            with col1:
                if st.button("← Back to Concepts"):
                    st.session_state.flyer_step = 3
                    st.rerun()
            
            with col2:
                if st.button("Continue to Generation →", disabled=not st.session_state.selected_colors):
                    st.session_state.flyer_step = 5
                    st.rerun()
    
    # Step 5: Copy Generation & Flyer Creation
    elif st.session_state.flyer_step == 5:
        st.header("Step 5: Generate Your World-Class Flyers")
        
        if st.session_state.selected_concept:
            st.subheader(f"✅ Selected: {st.session_state.selected_concept['title']}")
            
            # Show summary
            with st.expander("📋 Project Summary", expanded=True):
                st.write(f"**Business Name:** {st.session_state.business_name}")
                st.write(f"**Business Description:** {st.session_state.business_summary}")
                st.write(f"**Target Audience:** {st.session_state.target_audience}")
                st.write(f"**Business Focus:** {st.session_state.business_focus}")
                if st.session_state.selected_slogan:
                    st.write(f"**Selected Slogan:** \"{st.session_state.selected_slogan}\"")
                st.write(f"**Selected Colors:** {', '.join(st.session_state.selected_colors)}")
                st.write(f"**Concept:** {st.session_state.selected_concept['title']}")
            
            # Generate marketing copy if not done
            if not st.session_state.flyer_copy:
                with st.spinner("✍️ Creating compelling marketing copy..."):
                    st.session_state.flyer_copy = st.session_state.flyer_agent.generate_flyer_copy(
                        st.session_state.selected_concept,
                        st.session_state.business_summary,
                        st.session_state.business_focus
                    )
            
            # Display the marketing copy
            if st.session_state.flyer_copy:
                with st.expander("📝 Marketing Copy Preview", expanded=True):
                    copy_data = st.session_state.flyer_copy
                    st.write(f"**Headline:** {copy_data['headline']}")
                    st.write(f"**Subheadline:** {copy_data['subheadline']}")
                    st.write(f"**Tagline:** {copy_data['tagline']}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write("**Key Benefits:**")
                        for benefit in copy_data['benefits']:
                            st.write(f"• {benefit}")
                    
                    with col2:
                        st.write("**Features:**")
                        for feature in copy_data['features']:
                            st.write(f"• {feature}")
                    
                    st.write(f"**Social Proof:** {copy_data['social_proof']}")
                    st.write(f"**Call to Action:** {copy_data['cta']}")
            
            # Generate flyers button
            if st.button("🚀 Generate World-Class Flyers"):
                with st.spinner("🎨 Creating your amazing flyers..."):
                    
                    # Generate main flyer with business name and colors
                    design_prompt = st.session_state.flyer_agent.generate_flyer_design_prompt(
                        st.session_state.selected_concept,
                        st.session_state.flyer_copy,
                        st.session_state.business_name,
                        st.session_state.selected_colors
                    )
                    
                    main_flyer = st.session_state.flyer_agent.create_flyer_with_pollinations(
                        design_prompt,
                        st.session_state.business_name,
                        st.session_state.business_summary,
                        st.session_state.selected_colors,
                        st.session_state.flyer_copy
                    )
                    
                    if main_flyer and main_flyer.get('success'):
                        st.session_state.generated_flyers = [
                            {
                                'type': 'Main Flyer',
                                'data': main_flyer,
                                'dimensions': '1080x1350'
                            }
                        ]
                        
                        # Generate social media versions
                        st.info("🔄 Creating social media versions...")
                        social_versions = st.session_state.flyer_agent.generate_social_media_versions(
                            st.session_state.selected_concept,
                            st.session_state.business_name,
                            st.session_state.business_summary,
                            st.session_state.flyer_copy
                        )
                        
                        for format_name, version_data in social_versions.items():
                            if version_data.get('success'):
                                st.session_state.generated_flyers.append({
                                    'type': format_name,
                                    'data': version_data,
                                    'dimensions': version_data['dimensions']
                                })
                
                st.success("✅ All flyers generated successfully!")
                st.rerun()
            
            # Display generated flyers
            if st.session_state.generated_flyers:
                st.divider()
                st.header("🎉 Your Social Media Content Is Ready!")
                
                # Social media downloads section
                st.subheader("� Download Your Social Media Formats")
                
                # Create download buttons for social media versions
                social_flyers = st.session_state.generated_flyers[1:]  # Skip main flyer
                
                if social_flyers:
                    cols = st.columns(min(3, len(social_flyers)))
                    for i, flyer in enumerate(social_flyers):
                        if flyer['data'].get('success'):
                            with cols[i % 3]:
                                st.download_button(
                                    label=f"📱 {flyer['type']}",
                                    data=flyer['data']['image_bytes'],
                                    file_name=f"social_{flyer['type'].lower().replace(' ', '_')}.jpg",
                                    mime="image/jpeg",
                                    key=f"download_{flyer['type']}"
                                )
                
                # Show all social media versions
                st.divider()
                st.subheader("📱 Your Social Media Formats")
                
                social_flyers = st.session_state.generated_flyers[1:]
                cols_per_row = 3
                
                for row in range(0, len(social_flyers), cols_per_row):
                    cols = st.columns(cols_per_row)
                    
                    for col_idx in range(cols_per_row):
                        flyer_idx = row + col_idx
                        if flyer_idx < len(social_flyers):
                            flyer = social_flyers[flyer_idx]
                            
                            if flyer['data'].get('success'):
                                with cols[col_idx]:
                                    st.image(
                                        f"data:image/jpeg;base64,{flyer['data']['image_data']}", 
                                        caption=f"{flyer['type']} ({flyer['dimensions']})",
                                        use_container_width=True
                                    )
                
                # Generation details
                with st.expander("🔧 Generation Details"):
                    st.write(f"**Business Name:** {st.session_state.business_name}")
                    st.write(f"**Target Audience:** {st.session_state.target_audience}")
                    st.write(f"**Business Focus:** {st.session_state.business_focus}")
                    st.write(f"**Business Description:** {st.session_state.business_summary}")
                    if st.session_state.selected_slogan:
                        st.write(f"**Selected Slogan:** \"{st.session_state.selected_slogan}\"")
                    st.write(f"**Selected Colors:** {', '.join(st.session_state.selected_colors)}")
                    st.write(f"**Concept:** {st.session_state.selected_concept['title']}")
        
        # Action buttons
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("← Back to Colors"):
                st.session_state.flyer_step = 4
                st.rerun()
        
        with col2:
            if st.button("🔄 Regenerate Flyers"):
                st.session_state.generated_flyers = []
                st.rerun()
        
        with col3:
            if st.button("🆕 Start Over"):
                for key in ['flyer_step', 'target_audience', 'business_focus', 'business_summary', 'business_name',
                           'color_palettes', 'selected_colors', 'business_slogans', 'selected_slogan', 'flyer_concepts', 'selected_concept', 'flyer_copy', 'generated_flyers']:
                    if key in st.session_state:
                        del st.session_state[key]
                st.session_state.flyer_step = 1
                st.rerun()

if __name__ == "__main__":
    main()
