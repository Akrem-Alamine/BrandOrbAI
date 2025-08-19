#!/usr/bin/env python3
"""
Test script for the Enhanced Website Generator Agent with MoonshotAI
"""

import os
import sys
sys.path.append(os.path.dirname(__file__))

from agents.website_generator_agent import WebsiteGeneratorAgent

def test_enhanced_website_generator():
    """Test the enhanced website generator with MoonshotAI"""
    print("🚀 Testing Enhanced Website Generator Agent with MoonshotAI")
    print("=" * 60)
    
    # Initialize the agent
    agent = WebsiteGeneratorAgent()
    
    # Test business data loading
    print("\n📊 Testing business data loading...")
    business_data = agent.load_business_data()
    
    for key, value in business_data.items():
        status = "✅" if value.strip() else "❌"
        length = len(value) if value else 0
        print(f"{key}: {status} ({length} chars)")
    
    # Test website generation with enhanced prompt
    print("\n🎨 Testing enhanced website generation...")
    try:
        user_prompt = "Create a modern, professional website with glass-morphism effects, smooth animations, and a premium design using Tailwind CSS v4"
        
        result = agent.generate_website(
            business_data=business_data,
            user_prompt=user_prompt,
            style_preferences="premium_modern"
        )
        
        if result.get("success"):
            print("✅ Website generated successfully!")
            print(f"📄 Website ID: {result['website_id']}")
            print(f"🏢 Company: {result['company_name']}")
            print(f"⏰ Generated: {result['generation_time']}")
            print(f"📝 HTML Size: {len(result['html_code'])} characters")
            
            # Check for Tailwind CSS and custom CSS
            html_code = result['html_code']
            has_tailwind = 'tailwindcss.com' in html_code or '@import "tailwindcss"' in html_code
            has_custom_css = '--background:' in html_code and '--primary:' in html_code
            has_glass_effects = 'glass' in html_code or 'backdrop-filter' in html_code
            has_animations = 'animation' in html_code or 'transition' in html_code
            
            print(f"🎨 Tailwind CSS: {'✅' if has_tailwind else '❌'}")
            print(f"🎯 Custom CSS Variables: {'✅' if has_custom_css else '❌'}")
            print(f"✨ Glass Effects: {'✅' if has_glass_effects else '❌'}")
            print(f"🎭 Animations: {'✅' if has_animations else '❌'}")
            
            # Save for inspection
            output_file = f"test_output_enhanced_{result['website_id']}.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_code)
            print(f"💾 Saved to: {output_file}")
            
        else:
            print("❌ Website generation failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test version management
    print("\n📚 Testing version management...")
    try:
        versions = agent.get_website_versions("test-website")
        print(f"📊 Found {len(versions)} versions")
        for version in versions[:3]:  # Show first 3
            print(f"  - {version.get('version_id', 'Unknown')} ({version.get('timestamp', 'Unknown')})")
    except Exception as e:
        print(f"❌ Version management error: {e}")

if __name__ == "__main__":
    test_enhanced_website_generator()
