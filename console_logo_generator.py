import json
import re
from openai import OpenAI
import random

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
    
    def generate_logo_svg(self, business_description, logo_description, selected_colors):
        """Generate SVG logo code based on descriptions and colors"""
        colors_str = ", ".join(selected_colors)
        
        prompt = f"""
        You are the best graphic designer in the world. Create an SVG logo for a business with these specifications:
        
        Business Description: {business_description}
        Logo Description: {logo_description}
        Color Palette: {colors_str}
        
        Requirements:
        1. Create a complete, valid SVG code
        2. Use only the provided colors: {colors_str}
        3. Make it scalable and professional
        4. Include both text and graphic elements if appropriate
        5. Ensure the logo is suitable for business use
        6. SVG should be 300x300 viewBox
        7. Use modern design principles
        8. Make sure the logo is logical for the business idea 
        9. Make sure that you generate the best logo you can 
        10. Be creative and unique
        
        Return ONLY the SVG code, starting with <svg and ending with </svg>.
        Make sure the SVG is complete and can be rendered directly.
        
        Do not include any explanations, just the SVG code.
        """
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract SVG from the response
            svg_match = re.search(r'<svg.*?</svg>', content, re.DOTALL)
            if svg_match:
                return svg_match.group()
            else:
                # If no SVG found, try to clean the response
                content = content.replace('```svg', '').replace('```', '').strip()
                if content.startswith('<svg') and content.endswith('</svg>'):
                    return content
                else:
                    return self._generate_fallback_svg(selected_colors)
                    
        except Exception as e:
            print(f"Error generating logo: {e}")
            return self._generate_fallback_svg(selected_colors)
    
    def _generate_fallback_svg(self, colors):
        """Generate a simple fallback SVG if API fails"""
        primary_color = colors[0] if colors else "#3b82f6"
        secondary_color = colors[1] if len(colors) > 1 else "#1e40af"
        
        return f'''<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" r="120" fill="{primary_color}" />
    <circle cx="150" cy="150" r="80" fill="{secondary_color}" />
    <text x="150" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">LOGO</text>
</svg>'''

def main():
    print("🎨 AI-Powered Logo Generator")
    print("=" * 50)
    print("This agent will help you create a professional logo for your business!")
    print("The AI will dynamically generate everything based on your input.\n")
    
    # Initialize the agent
    agent = LogoGeneratorAgent()
    
    # Step 1: Get business description
    print("Step 1: Describe Your Business")
    print("-" * 30)
    business_description = input("Tell us about your business idea: ")
    print()
    
    # Step 2: Get logo description
    print("Step 2: Describe Your Ideal Logo")
    print("-" * 32)
    print(f"Business: {business_description}")
    logo_description = input("How do you want your logo to look? ")
    print()
    
    # Step 3: Generate and show color palettes
    print("Step 3: Generating Color Palettes...")
    print("-" * 38)
    print("🤖 AI is analyzing your business and generating color palettes...")
    palettes_data = agent.generate_color_palette(business_description)
    
    print("\nAvailable color palettes:")
    for i, palette in enumerate(palettes_data['palettes']):
        print(f"{i+1}. {palette['name']} - {palette['description']}")
        print(f"   Colors: {', '.join(palette['colors'])}")
        print()
    
    while True:
        try:
            choice = int(input(f"Select a palette (1-{len(palettes_data['palettes'])}): ")) - 1
            if 0 <= choice < len(palettes_data['palettes']):
                selected_palette = palettes_data['palettes'][choice]
                break
            else:
                print("Invalid choice. Please try again.")
        except ValueError:
            print("Please enter a valid number.")
    
    print(f"\n✅ Selected: {selected_palette['name']}")
    print(f"Colors: {', '.join(selected_palette['colors'])}")
    print()
    
    # Step 4: Generate logo
    print("Step 4: Generating Your Logo")
    print("-" * 27)
    print(f"🎨 Creating logo with {selected_palette['name']} palette...")
    print("🤖 AI is designing your unique logo...")
    
    svg_code = agent.generate_logo_svg(
        business_description,
        logo_description,
        selected_palette['colors']
    )
    
    # Save the logo
    logo_filename = "generated_logo.svg"
    with open(logo_filename, 'w', encoding='utf-8') as f:
        f.write(svg_code)
    
    print("\n" + "=" * 50)
    print("🎉 SUCCESS! Your logo has been generated!")
    print("=" * 50)
    print(f"📁 File saved as: {logo_filename}")
    print()
    print("📋 Project Summary:")
    print(f"• Business: {business_description}")
    print(f"• Logo Style: {logo_description}")
    print(f"• Color Palette: {selected_palette['name']}")
    print(f"• Colors Used: {', '.join(selected_palette['colors'])}")
    print()
    print("💡 Tips:")
    print("• Open the SVG file in any web browser to view your logo")
    print("• You can use the SVG in websites, print materials, and more")
    print("• The logo is scalable and will look crisp at any size")
    print()
    
    # Show SVG code
    show_code = input("Would you like to see the generated SVG code? (y/n): ").lower().strip()
    if show_code == 'y' or show_code == 'yes':
        print("\n" + "-" * 50)
        print("Generated SVG Code:")
        print("-" * 50)
        print(svg_code)
        print("-" * 50)
    
    print(f"\n🚀 Your dynamic AI-generated logo is ready!")
    print(f"Everything was created on-the-fly based on your unique business idea!")

if __name__ == "__main__":
    main()
