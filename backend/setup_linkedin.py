#!/usr/bin/env python3
"""
LinkedIn Setup Script for BrandOrbAI
This script helps you set up LinkedIn OAuth credentials
"""

import os
from pathlib import Path

def setup_linkedin_credentials():
    """Interactive setup for LinkedIn credentials"""
    print("=== LinkedIn Integration Setup ===")
    print()
    print("To post to LinkedIn, you need to create a LinkedIn App and get OAuth credentials.")
    print()
    print("Follow these steps:")
    print("1. Go to https://www.linkedin.com/developers/apps")
    print("2. Create a new app for your business/personal use")
    print("3. In the 'Auth' tab, add this redirect URL: http://localhost:8001/social/linkedin/callback")
    print("4. In the 'Products' tab, add 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect'")
    print("5. Copy the Client ID and Client Secret from the 'Auth' tab")
    print()
    
    # Get user input
    client_id = input("Enter your LinkedIn Client ID: ").strip()
    client_secret = input("Enter your LinkedIn Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("❌ Both Client ID and Client Secret are required!")
        return False
    
    # Update .env file
    env_path = Path(__file__).parent / '.env'
    
    # Read existing .env content
    env_content = ""
    if env_path.exists():
        with open(env_path, 'r') as f:
            env_content = f.read()
    
    # Remove existing LinkedIn entries
    lines = env_content.split('\n')
    filtered_lines = [line for line in lines if not line.startswith('LINKEDIN_')]
    
    # Add new LinkedIn credentials
    filtered_lines.extend([
        '',
        '# LinkedIn OAuth Credentials',
        f'LINKEDIN_CLIENT_ID={client_id}',
        f'LINKEDIN_CLIENT_SECRET={client_secret}',
        'LINKEDIN_REDIRECT_URI=http://localhost:8001/social/linkedin/callback',
        '# LINKEDIN_ACCESS_TOKEN will be set after OAuth flow'
    ])
    
    # Write back to .env
    with open(env_path, 'w') as f:
        f.write('\n'.join(filtered_lines))
    
    print()
    print("✅ LinkedIn credentials saved to .env file!")
    print()
    print("Next steps:")
    print("1. Restart your backend server")
    print("2. Visit http://localhost:8001/linkedin/auth to get the authorization URL")
    print("3. Complete the OAuth flow to get your access token")
    print("4. After OAuth, you'll be able to post to LinkedIn!")
    
    return True

if __name__ == "__main__":
    success = setup_linkedin_credentials()
    if success:
        print("\n🎉 Setup completed! Your LinkedIn integration is ready to configure.")
    else:
        print("\n❌ Setup failed. Please try again.")
