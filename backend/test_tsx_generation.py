#!/usr/bin/env python3

import sys
import os
sys.path.append('.')

from agents.website_generator_agent import WebsiteGeneratorAgent

def test_tsx_generation():
    print("Testing TSX website generation...")
    
    # Initialize agent
    agent = WebsiteGeneratorAgent()
    print(f"Agent created, AI client available: {agent.ai_client is not None}")
    
    # Test business data loading
    business_data = agent.load_business_data()
    loaded_fields = [k for k, v in business_data.items() if v.strip()]
    print(f"Business data loaded: {len(loaded_fields)}/5 fields")
    for field, data in business_data.items():
        if data.strip():
            print(f"  ✅ {field}: {len(data)} chars")
        else:
            print(f"  ❌ {field}: empty")
    
    # Test website generation
    try:
        print("\nGenerating TSX website...")
        result = agent.generate_website(
            business_data, 
            'Create a professional landing page', 
            'modern'
        )
        
        print("✅ Website generated successfully!")
        print(f"🔧 Type: {result.get('component_type', 'html')}")
        print(f"📊 Content length: {len(result['html_code'])} chars")
        print(f"🏢 Company: {result['company_name']}")
        print(f"📝 Version ID: {result['version_info']['version_id']}")
        
        # Show content preview
        content = result['html_code']
        print(f"\n📄 Content preview:")
        print(f"First 200 chars: {content[:200]}...")
        
        if "GeneratedLandingPage" in content:
            print("✅ TSX component detected in output")
        else:
            print("❌ No TSX component found in output")
            
        return True
        
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_tsx_generation()
    exit(0 if success else 1)
