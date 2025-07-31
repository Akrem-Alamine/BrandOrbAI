import json
import re
import requests
from openai import OpenAI
import random
import base64

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
        """Generate a professional logo using Pollinations API based on descriptions and colors"""
        
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
                    color_names.append('red')
                elif g > r and g > b:
                    color_names.append('green')
                elif b > r and b > g:
                    color_names.append('blue')
                else:
                    color_names.append('black')
        
        color_palette_text = ''.join(color_names[:1])  # Use only first color
        
        # Generate enhanced prompt using QWEN in specific format
        prompt = f"""
        Based on this business: "{business_description}"
        And this description: "{logo_description}"
        
        Create a Pollinations prompt in this EXACT format (no spaces, all lowercase, separated by hyphens):
        flat-highresolution-logo-[BUSINESS_TYPE]-all{color_palette_text}-company-whitebackground-oneelement-oneblock-flatemblem
        
        Replace [BUSINESS_TYPE] with a single word describing the business type (like: tech, fashion, food, ecommerce, etc.)
        Use the color: {color_palette_text}
        
        Return ONLY the formatted prompt, nothing else.
        """
        
        # Get enhanced prompt from QWEN
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        enhanced_prompt = response.choices[0].message.content.strip()
        
        # Generate logo using Pollinations API
        return self._generate_logo_with_pollinations(enhanced_prompt)
    
    def _generate_logo_with_pollinations(self, prompt):
        """Generate logo using Pollinations API"""
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
            print(f"Pollinations API error: {response.status_code}")
            return None

def main():
    print("🎨 Professional Logo Generator")
    print("=" * 40)
    
    # Initialize the agent
    agent = LogoGeneratorAgent()
    
    # Step 1: Get business description
    print("\nStep 1: Describe Your Business")
    business_description = input("Tell us about your business: ").strip()
    
    if not business_description:
        print("❌ Business description is required!")
        return
    
    # Step 2: Get logo description
    print("\nStep 2: Describe Your Ideal Logo")
    print(f"Business: {business_description}")
    logo_description = input("How do you want your business logo to look? ").strip()
    
    if not logo_description:
        print("❌ Logo description is required!")
        return
    
    # Step 3: Generate and select color palette
    print("\nStep 3: Generating Color Palettes...")
    try:
        palettes_data = agent.generate_color_palette(business_description)
        palettes = palettes_data['palettes']
        
        print("\nAvailable Color Palettes:")
        for i, palette in enumerate(palettes):
            print(f"{i+1}. {palette['name']} - {palette['description']}")
            print(f"   Colors: {', '.join(palette['colors'])}")
        
        while True:
            try:
                choice = int(input(f"\nSelect a palette (1-{len(palettes)}): "))
                if 1 <= choice <= len(palettes):
                    selected_palette = palettes[choice-1]
                    break
                else:
                    print(f"❌ Please enter a number between 1 and {len(palettes)}")
            except ValueError:
                print("❌ Please enter a valid number")
        
    except Exception as e:
        print(f"❌ Error generating palettes: {e}")
        return
    
    # Step 4: Generate logo
    print(f"\nStep 4: Generating Logo...")
    print(f"Selected Palette: {selected_palette['name']}")
    print("🔄 This may take a moment...")
    
    try:
        logo_result = agent.generate_logo(
            business_description,
            logo_description,
            selected_palette['colors']
        )
        
        if logo_result and logo_result.get('success', False):
            print("✅ Logo generated successfully!")
            print(f"📸 Enhanced Prompt: {logo_result['prompt']}")
            print(f"🌐 Direct URL: {logo_result['url']}")
            
            # Save logo to file
            filename = "generated_logo.jpg"
            with open(filename, 'wb') as f:
                f.write(logo_result['image_bytes'])
            print(f"💾 Logo saved as: {filename}")
            
            print("\n" + "="*50)
            print("🎉 LOGO GENERATION COMPLETE!")
            print("="*50)
            print(f"Business: {business_description}")
            print(f"Style: {logo_description}")
            print(f"Colors: {', '.join(selected_palette['colors'])}")
            print(f"File: {filename}")
            print(f"Prompt: {logo_result['prompt']}")
            
        else:
            print("❌ Failed to generate logo. Please try again.")
            
    except Exception as e:
        print(f"❌ Error generating logo: {e}")

if __name__ == "__main__":
    main()
