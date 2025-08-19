#!/usr/bin/env python3
"""
Test script for enhanced website generator with Groq API integration
"""

import sys
import os
sys.path.append('.')

from website_generator_agent import WebsiteGeneratorAgent

def test_enhanced_website_generator():
    """Test the enhanced website generator agent"""
    print('🧪 Testing Enhanced Website Generator Agent with Groq API...')
    print('=' * 60)
    
    # Check environment variables
    groq_key = os.getenv('GROQ_API_KEY')
    if groq_key:
        print('✅ GROQ_API_KEY found')
    else:
        print('❌ GROQ_API_KEY not found - setting mock key for testing')
        os.environ['GROQ_API_KEY'] = 'mock_key_for_testing'
    
    # Initialize agent
    agent = WebsiteGeneratorAgent()
    
    # Test business data loading
    print('\n📊 Testing Business Data Loading:')
    business_data = agent.load_business_data()
    for key, value in business_data.items():
        status = '✅' if value.strip() else '❌'
        print(f'{status} {key}: {len(value)} characters')
    
    # Test AI client status
    print('\n🔄 AI Client Status:')
    if agent.ai_client:
        print('✅ Groq client initialized successfully')
    else:
        print('❌ Groq client initialization failed')
    
    # Data summary
    print('\n📝 Data Summary:')
    loaded_count = sum(1 for v in business_data.values() if v.strip())
    print(f'📊 Business data: {loaded_count}/5 fields loaded')
    
    if business_data.get('brand_identity_data'):
        print('✅ Brand Identity: Loaded successfully')
        print('🎨 Brand data preview:', business_data['brand_identity_data'][:200] + '...')
    else:
        print('❌ Brand Identity: Not found')
    
    print('\n' + '=' * 60)
    print('🎯 Enhanced Website Generator Test Complete')
    
    return {
        'agent_initialized': agent is not None,
        'groq_client_available': agent.ai_client is not None,
        'business_data_fields': loaded_count,
        'brand_identity_loaded': bool(business_data.get('brand_identity_data'))
    }

if __name__ == '__main__':
    results = test_enhanced_website_generator()
    
    print('\n🎯 Test Results Summary:')
    for key, value in results.items():
        status = '✅' if value else '❌' if isinstance(value, bool) else f'📊 {value}'
        print(f'{status} {key}: {value}')
