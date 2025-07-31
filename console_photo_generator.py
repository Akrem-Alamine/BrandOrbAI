#!/usr/bin/env python3
"""
Console Photo Generator - Professional Business Photo Generation using Pollinations AI
"""

import json
import re
import requests
from openai import OpenAI
import random
import base64
from io import BytesIO
from PIL import Image

# Initialize OpenAI client with OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

class PhotoGeneratorAgent:
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
        
        Make sure all hex codes are valid and the palettes are professional and suitable for photos.
        """
        
        try:
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
                return self._fallback_palettes()
        except Exception as e:
            print(f"Error generating color palette: {e}")
            return self._fallback_palettes()
    
    def _fallback_palettes(self):
        """Fallback color palettes if API fails"""
        return {
            "palettes": [
                {
                    "name": "Professional Blue",
                    "description": "Trust and reliability",
                    "colors": ["#1e3a8a", "#3b82f6", "#e0f2fe"]
                },
                {
                    "name": "Modern Green",
                    "description": "Growth and innovation",
                    "colors": ["#065f46", "#10b981", "#d1fae5"]
                },
                {
                    "name": "Creative Orange",
                    "description": "Energy and creativity",
                    "colors": ["#ea580c", "#fb923c", "#fed7aa"]
                },
                {
                    "name": "Elegant Purple",
                    "description": "Luxury and sophistication",
                    "colors": ["#581c87", "#a855f7", "#e9d5ff"]
                },
                {
                    "name": "Bold Red",
                    "description": "Passion and strength",
                    "colors": ["#dc2626", "#ef4444", "#fecaca"]
                }
            ]
        }
    
    def generate_photo(self, business_description, photo_description, selected_colors):
        """Generate a professional LOGO FOR THR BUISSNESS using Pollinations API based on descriptions and colors"""
        
        # Create color description from hex codes
        color_names = []
        for color in selected_colors:
            # Convert hex to color name description
            if color.lower() in ['#ff0000', '#dc2626', '#ef4444']:
                color_names.append('red')
            elif color.lower() in ['#00ff00', '#10b981', '#065f46']:
                color_names.append('green')
            elif color.lower() in ['#0000ff', '#3b82f6', '#1e3a8a']:
                color_names.append('blue')
            elif color.lower() in ['#ffa500', '#ea580c', '#fb923c']:
                color_names.append('orange')
            elif color.lower() in ['#800080', '#581c87', '#a855f7']:
                color_names.append('purple')
            elif color.lower() in ['#ffff00', '#fbbf24', '#f59e0b']:
                color_names.append('yellow')
            elif color.lower() in ['#ffc0cb', '#f472b6', '#ec4899']:
                color_names.append('pink')
            elif color.lower() in ['#000000', '#374151', '#1f2937']:
                color_names.append('black')
            elif color.lower() in ['#ffffff', '#f9fafb', '#f3f4f6']:
                color_names.append('white')
            else:
                # Extract basic color from hex
                r = int(color[1:3], 16)
                g = int(color[3:5], 16)
                b = int(color[5:7], 16)
                if r > g and r > b:
                    color_names.append('red-toned')
                elif g > r and g > b:
                    color_names.append('green-toned')
                elif b > r and b > g:
                    color_names.append('blue-toned')
                else:
                    color_names.append('neutral-toned')
        
        color_palette_text = ', '.join(color_names[:3])  # Use max 3 colors
        
        # Generate enhanced prompt using AI
        prompt = f"""
        Create a detailed, professional LOGO prompt for: "{business_description}"
        
        Photo style description: "{photo_description}"
        Color scheme to incorporate: {color_palette_text}

        Generate a professional logo prompt that includes:
        - Professional logo design style WITH well-defined shapes white background
        - High quality, commercial logo design
        - The specified colors naturally integrated 
        - Appropriate lighting and composition
        - Business-appropriate aesthetic 

        Return ONLY the final logo prompt, no explanations. Make it detailed and specific for best results.
        """
        
        try:
            # Get enhanced prompt from AI
            print("🤖 Enhancing logo prompt with AI...")
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            
            enhanced_prompt = response.choices[0].message.content.strip()
            print(f"📝 Enhanced prompt: {enhanced_prompt}")
            
            # Generate photo using Pollinations API
            return self._generate_photo_with_pollinations(enhanced_prompt)
                    
        except Exception as e:
            print(f"Error generating photo: {e}")
            return self._generate_fallback_photo()
    
    def _generate_photo_with_pollinations(self, prompt):
        """Generate photo using Pollinations API"""
        try:
            print("📸 Generating photo with Pollinations AI...")
            
            # Pollinations API endpoint
            base_url = "https://image.pollinations.ai/prompt/"
            encoded_prompt = requests.utils.quote(prompt)
            
            # Parameters for high-quality photo
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
            
            print(f"🌐 Calling Pollinations API...")
            print(f"🔗 URL: {full_url}")
            
            # Make request to Pollinations
            response = requests.get(full_url, timeout=60)
            
            if response.status_code == 200:
                print("✅ Photo generated successfully!")
                
                # Save the image
                image_bytes = response.content
                with open('generated_photo.jpg', 'wb') as f:
                    f.write(image_bytes)
                
                print(f"💾 Photo saved as 'generated_photo.jpg'")
                
                return {
                    'success': True,
                    'image_bytes': image_bytes,
                    'prompt': prompt,
                    'url': full_url,
                    'filename': 'generated_photo.jpg'
                }
            else:
                print(f"❌ Pollinations API error: {response.status_code}")
                return self._generate_fallback_photo()
                
        except Exception as e:
            print(f"❌ Error calling Pollinations API: {e}")
            return self._generate_fallback_photo()
    
    def _generate_fallback_photo(self):
        """Generate a simple fallback photo if API fails"""
        print("⚠️ Generating fallback photo...")
        
        # Create a simple colored rectangle as fallback
        from PIL import Image, ImageDraw, ImageFont
        
        img = Image.new('RGB', (1024, 1024), color='#f0f0f0')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple design
        draw.rectangle([100, 100, 924, 924], fill='#e0e0e0', outline='#c0c0c0', width=5)
        
        # Add text
        try:
            font = ImageFont.load_default()
            text = "Professional Photo\nGeneration Unavailable"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (1024 - text_width) // 2
            y = (1024 - text_height) // 2
            draw.text((x, y), text, fill='#666666', font=font, anchor="mm")
        except:
            pass
        
        # Save fallback image
        img.save('fallback_photo.jpg', 'JPEG')
        
        # Convert to bytes
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        image_bytes = buffer.getvalue()
        
        print("💾 Fallback photo saved as 'fallback_photo.jpg'")
        
        return {
            'success': False,
            'image_bytes': image_bytes,
            'prompt': 'Fallback image',
            'url': None,
            'filename': 'fallback_photo.jpg'
        }

def main():
    print("📸 Professional Photo Generator")
    print("=" * 50)
    print("Generate professional business photos using AI")
    print()
    
    agent = PhotoGeneratorAgent()
    
    # Step 1: Business Description
    print("Step 1: Business Description")
    print("-" * 30)
    business_description = input("📋 Describe your business: ").strip()
    
    if not business_description:
        print("❌ Business description is required!")
        return
    
    print()
    
    # Step 2: Photo Description
    print("Step 2: Photo Style Description")
    print("-" * 35)
    photo_description = input("📸 How do you want your business LOGO to look? ").strip()
    
    if not photo_description:
        print("❌ Photo description is required!")
        return
    
    print()
    
    # Step 3: Generate and Select Color Palette
    print("Step 3: Color Palette Selection")
    print("-" * 33)
    print("🎨 Generating color palettes...")
    
    palettes_data = agent.generate_color_palette(business_description)
    
    if not palettes_data or 'palettes' not in palettes_data:
        print("❌ Failed to generate color palettes!")
        return
    
    palettes = palettes_data['palettes']
    print(f"✅ Generated {len(palettes)} color palettes:\n")
    
    # Display palettes
    for i, palette in enumerate(palettes):
        print(f"{i+1}. {palette['name']}")
        print(f"   Description: {palette['description']}")
        print(f"   Colors: {', '.join(palette['colors'])}")
        print()
    
    # Get user choice
    while True:
        try:
            choice = input(f"Choose a palette (1-{len(palettes)}): ").strip()
            palette_idx = int(choice) - 1
            if 0 <= palette_idx < len(palettes):
                selected_palette = palettes[palette_idx]
                break
            else:
                print(f"❌ Please enter a number between 1 and {len(palettes)}")
        except ValueError:
            print("❌ Please enter a valid number")
    
    print(f"✅ Selected: {selected_palette['name']}")
    print(f"🎨 Colors: {', '.join(selected_palette['colors'])}")
    print()
    
    # Step 4: Generate Photo
    print("Step 4: Photo Generation")
    print("-" * 25)
    print(f"📋 Business: {business_description}")
    print(f"📸 Style: {photo_description}")
    print(f"🎨 Colors: {', '.join(selected_palette['colors'])}")
    print()
    
    result = agent.generate_photo(
        business_description,
        photo_description,
        selected_palette['colors']
    )
    
    if result and result.get('success', False):
        print("🎉 Photo generation completed successfully!")
        print(f"📁 Saved as: {result['filename']}")
        print(f"📝 Enhanced prompt used: {result['prompt']}")
        if result.get('url'):
            print(f"🔗 API URL: {result['url']}")
    else:
        print("⚠️ Photo generation failed, but a fallback image was created.")
        if result:
            print(f"📁 Saved as: {result['filename']}")
    
    print("\n✨ Thank you for using the Professional Photo Generator!")

if __name__ == "__main__":
    main()
