import json
import requests
import os
from typing import List, Dict, Any
import requests
import json
import os
from fastapi import HTTPException
from datetime import datetime

# Together AI API credentials
TOGETHER_API_KEY = "tgp_v1_wW2zTwc3ZZQrmlewVdd4Vr9utNs3YvYfJYYZVf5Noek"
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"

def load_investors(file_path=None):
    """
    Loads investor data from a JSON file.
    This function should ideally load data once and cache it,
    or use a database for larger datasets.
    """
    if file_path is None:
        # Try to find the full_investor.json file in the backend directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(current_dir)
        file_path = os.path.join(backend_dir, "full_investor.json")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Transform the data to match our expected format
            transformed_data = []
            for investor in data:
                if isinstance(investor, dict) and investor.get("Investor name"):
                    transformed_investor = {
                        "fund_name": investor.get("Investor name", ""),
                        "investor_name": investor.get("Investor name", ""),
                        "website_link": investor.get("Website", ""),
                        "headquarters_address": investor.get("Global HQ", ""),
                        "target_countries": [investor.get("Countries of investment", "Global")] if investor.get("Countries of investment") else ["Global"],
                        "funding_stages": investor.get("Stage of investment", "").split(",") if investor.get("Stage of investment") else ["All stages"],
                        "firm_type": investor.get("Investor type", "VC"),
                        "check_size_min": investor.get("First cheque minimum", ""),
                        "check_size_max": investor.get("First cheque maximum", ""),
                        "check_size": f"{investor.get('First cheque minimum', 'N/A')} - {investor.get('First cheque maximum', 'N/A')}",
                        "overview": investor.get("Investment thesis", f"Investment firm focused on {investor.get('Stage of investment', 'various stages')}"),
                        "funding_requirements": investor.get("Investment thesis", "Growth-oriented companies with strong potential"),
                        "team_members": []
                    }
                    transformed_data.append(transformed_investor)
            
            print(f"✅ Loaded {len(transformed_data)} investors from {file_path}")
            return transformed_data
            
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        # Return sample data if file not found
        return get_sample_investors_data()
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from '{file_path}'.")
        return get_sample_investors_data()

def find_investor_by_name(investor_name: str, investors_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Find the complete investor data by matching the fund name.
    """
    for investor in investors_data:
        if investor.get('fund_name', '').lower() == investor_name.lower():
            return investor
    
    # If exact match not found, try partial matching
    for investor in investors_data:
        if investor_name.lower() in investor.get('fund_name', '').lower():
            return investor
    
    return {}

def get_sample_investors_data():
    """
    Returns sample investor data for demonstration purposes.
    """
    return [
        {
            "fund_name": "Sequoia Capital",
            "logo": "https://via.placeholder.com/200x80/1f2937/ffffff?text=Sequoia",
            "overview": "A venture capital firm that helps daring founders build legendary companies.",
            "who_we_are": "Founded in 1972, Sequoia Capital has been building innovative companies for over 50 years.",
            "value_add": "Hands-on support, extensive network, and operational expertise.",
            "firm_type": "VC",
            "headquarters_address": "2800 Sand Hill Road, Menlo Park, CA 94025",
            "funding_requirements": "High-growth potential, scalable business model",
            "funding_stages": ["Series A", "Series B", "Series C"],
            "lead_investor": "Yes",
            "check_size": "$1M - $100M",
            "target_countries": ["USA", "India", "China"],
            "team_members": [
                {"name": "Roelof Botha", "role": "Partner", "bio": "Partner at Sequoia Capital"},
                {"name": "Jim Goetz", "role": "Partner", "bio": "Partner at Sequoia Capital"}
            ],
            "linkedin_link": "https://www.linkedin.com/company/sequoia-capital",
            "website_link": "https://www.sequoiacap.com"
        },
        {
            "fund_name": "Andreessen Horowitz",
            "logo": "https://via.placeholder.com/200x80/2563eb/ffffff?text=a16z",
            "overview": "A venture capital firm that backs entrepreneurs building the future through technology.",
            "who_we_are": "Founded in 2009, we back bold entrepreneurs building the future through technology.",
            "value_add": "Operational support, network access, and technical expertise.",
            "firm_type": "VC",
            "headquarters_address": "2865 Sand Hill Road, Menlo Park, CA 94025",
            "funding_requirements": "Technology-driven solutions with network effects",
            "funding_stages": ["Seed", "Series A", "Series B", "Growth"],
            "lead_investor": "Yes",
            "check_size": "$250K - $50M",
            "target_countries": ["USA", "Global"],
            "team_members": [
                {"name": "Marc Andreessen", "role": "Co-founder", "bio": "Co-founder and General Partner"},
                {"name": "Ben Horowitz", "role": "Co-founder", "bio": "Co-founder and General Partner"}
            ],
            "linkedin_link": "https://www.linkedin.com/company/andreessen-horowitz",
            "website_link": "https://a16z.com"
        }
    ]

def get_investor_recommendations(business_idea_summary: str, investors_data: List[Dict[str, Any]]):
    """
    Uses the Together AI API to get ranked investor recommendations.
    """
    # Format investor data for the prompt
    investors_text = ""
    for investor in investors_data:
        investors_text += f"Investor Name: {investor.get('fund_name', 'N/A')}\n"
        investors_text += f"Overview: {investor.get('overview', 'N/A')}\n"
        investors_text += f"Funding Requirements: {investor.get('funding_requirements', 'N/A')}\n"
        investors_text += f"Funding Stages: {', '.join(investor.get('funding_stages', []))}\n"
        investors_text += f"Target Countries: {', '.join(investor.get('target_countries', []))}\n"
        investors_text += f"Check Size: {investor.get('check_size', 'N/A')}\n"
        investors_text += f"Sectors: {', '.join(investor.get('sectors', []))}\n\n"

    # Construct the prompt for the LLM
    prompt_messages = [
        {"role": "system", "content": "You are a helpful assistant that analyzes business ideas and recommends the most suitable investors. You are given a list of potential investors and a business idea summary. Your task is to rank the top 5 investors based on their relevance to the business idea. The ranking should be based on factors like funding stage, investment focus (sector), target countries, and check size."},
        {"role": "user", "content": f"Here is a list of investors:\n\n{investors_text}\n\nBased on this, please provide the top 5 ranked investors for the following business idea:\n\nBusiness Idea: '{business_idea_summary}'\n\nYour output should be a JSON object with a single key 'recommendations'. The value should be a list of 5 objects. Each object in the list must have 'rank' (integer), 'investor_name' (string), 'score' (float, from 0.0 to 1.0), and 'explanation' (string). The score should be a confidence metric indicating the strength of the match. Use the exact investor names from the list provided."}
    ]

    payload = {
        "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
        "messages": prompt_messages,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(TOGETHER_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        recommendations_str = result['choices'][0]['message']['content']
        recommendations_json = json.loads(recommendations_str)
        ai_recommendations = recommendations_json.get('recommendations', [])
        
        # Enhance recommendations with full investor details
        enhanced_recommendations = []
        for rec in ai_recommendations:
            investor_name = rec.get('investor_name', '')
            investor_details = find_investor_by_name(investor_name, investors_data)
            
            # Create enhanced recommendation with all details
            enhanced_rec = {
                'rank': rec.get('rank'),
                'investor_name': investor_name,
                'score': rec.get('score'),
                'explanation': rec.get('explanation'),
                # Add all investor details
                'fund_name': investor_details.get('fund_name', ''),
                'logo': investor_details.get('logo', ''),
                'overview': investor_details.get('overview', ''),
                'who_we_are': investor_details.get('who_we_are', ''),
                'value_add': investor_details.get('value_add', ''),
                'firm_type': investor_details.get('firm_type', ''),
                'headquarters_address': investor_details.get('headquarters_address', ''),
                'funding_requirements': investor_details.get('funding_requirements', ''),
                'funding_stages': investor_details.get('funding_stages', []),
                'lead_investor': investor_details.get('lead_investor', ''),
                'check_size': investor_details.get('check_size', ''),
                'target_countries': investor_details.get('target_countries', []),
                'team_members': investor_details.get('team_members', []),
                'linkedin_link': investor_details.get('linkedin_link', ''),
                'website_link': investor_details.get('website_link', '')
            }
            enhanced_recommendations.append(enhanced_rec)
        
        return enhanced_recommendations

    except requests.exceptions.RequestException as e:
        print(f"An error occurred while calling the Together AI API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations from AI: {e}")
    except (KeyError, json.JSONDecodeError) as e:
        print(f"Error parsing API response: {e}")
        raise HTTPException(status_code=500, detail=f"Error parsing AI response: {e}")

def analyze_business_for_investors(business_summary: str):
    """
    Analyzes business summary to extract key information for investor matching.
    """
    try:
        # Load investors data
        investors_data = load_investors()
        
        if not investors_data:
            raise HTTPException(status_code=500, detail="Investor data could not be loaded.")
        
        # Get recommendations
        recommendations = get_investor_recommendations(business_summary, investors_data)
        
        # Generate investment readiness score
        readiness_score = calculate_investment_readiness(business_summary)
        
        # Prepare analysis data
        analysis_data = {
            "recommendations": recommendations,
            "readiness_score": readiness_score,
            "total_investors_analyzed": 6089,  # Set to 6089 as requested
            "top_matches": len(recommendations)
        }
        
        # Save to output files
        file_save_result = save_investor_analysis_to_file(analysis_data, business_summary)
        if file_save_result.get("success"):
            print(f"✅ Analysis saved to {len(file_save_result.get('files_created', []))} output files")
        
        return analysis_data
        
    except Exception as e:
        print(f"Error analyzing business for investors: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

def save_investor_analysis_to_file(analysis_data: Dict[str, Any], business_summary: str):
    """
    Save investor analysis results to output files.
    """
    try:
        # Create output directory if it doesn't exist
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(current_dir)
        output_dir = os.path.join(backend_dir, "output")
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Prepare comprehensive output data
        output_data = {
            "timestamp": timestamp,
            "business_summary": business_summary,
            "investment_readiness_score": analysis_data.get("readiness_score", 0),
            "total_investors_analyzed": analysis_data.get("total_investors_analyzed", 6089),
            "top_matches_count": len(analysis_data.get("recommendations", [])),
            "investor_recommendations": analysis_data.get("recommendations", []),
            "analysis_metadata": {
                "generated_by": "BrandOrbAI Investor Recommendation Engine",
                "ai_model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "analysis_version": "v2.0",
                "features_included": [
                    "AI-powered investor matching",
                    "Investment readiness scoring", 
                    "Detailed investor profiles",
                    "Team member information",
                    "Country market analysis",
                    "Funding stage compatibility"
                ]
            }
        }
        
        # Save main investor analysis file
        investor_analysis_file = os.path.join(output_dir, "investor_analysis_output.json")
        with open(investor_analysis_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        # Save simplified recommendations list
        recommendations_file = os.path.join(output_dir, "investor_recommendations.json")
        with open(recommendations_file, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": timestamp,
                "recommendations": analysis_data.get("recommendations", []),
                "summary": f"Found {len(analysis_data.get('recommendations', []))} top investor matches from {analysis_data.get('total_investors_analyzed', 6089)} analyzed investors"
            }, f, indent=2, ensure_ascii=False)
        
        # Save detailed text report
        text_report_file = os.path.join(output_dir, "investor_analysis_report.txt")
        with open(text_report_file, 'w', encoding='utf-8') as f:
            f.write(f"INVESTOR ANALYSIS REPORT\n")
            f.write(f"{'='*50}\n")
            f.write(f"Generated: {timestamp}\n")
            f.write(f"Total Investors Analyzed: {analysis_data.get('total_investors_analyzed', 6089)}\n")
            f.write(f"Investment Readiness Score: {analysis_data.get('readiness_score', 0)*100:.1f}%\n")
            f.write(f"Top Matches Found: {len(analysis_data.get('recommendations', []))}\n\n")
            
            f.write(f"BUSINESS SUMMARY\n")
            f.write(f"{'-'*30}\n")
            f.write(f"{business_summary}\n\n")
            
            f.write(f"INVESTOR RECOMMENDATIONS\n")
            f.write(f"{'-'*30}\n")
            
            for i, rec in enumerate(analysis_data.get("recommendations", []), 1):
                f.write(f"\n{i}. {rec.get('fund_name', 'Unknown Fund')}\n")
                f.write(f"   Match Score: {rec.get('score', 0)*100:.1f}%\n")
                f.write(f"   Rank: #{rec.get('rank', 'N/A')}\n")
                f.write(f"   Check Size: {rec.get('check_size', 'N/A')}\n")
                f.write(f"   Stages: {', '.join(rec.get('funding_stages', []))}\n")
                f.write(f"   Markets: {', '.join(rec.get('target_countries', [])[:5])}\n")
                f.write(f"   Website: {rec.get('website_link', 'N/A')}\n")
                f.write(f"   Explanation: {rec.get('explanation', 'N/A')}\n")
        
        print(f"✅ Investor analysis saved to output files:")
        print(f"   📄 {investor_analysis_file}")
        print(f"   📄 {recommendations_file}")
        print(f"   📄 {text_report_file}")
        
        return {
            "success": True,
            "files_created": [
                investor_analysis_file,
                recommendations_file, 
                text_report_file
            ]
        }
        
    except Exception as e:
        print(f"❌ Error saving investor analysis to file: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def get_all_investors_for_table():
    """
    Get all investors formatted for table display.
    """
    try:
        investors_data = load_investors()
        
        # Format for table display
        formatted_investors = []
        for investor in investors_data:
            # Extract country code for flag display
            country_name = investor.get('target_countries', ['Global'])[0] if investor.get('target_countries') else 'Global'
            
            formatted_investor = {
                "name": investor.get('fund_name', ''),
                "company": investor.get('firm_type', 'VC'),
                "country": get_country_code_from_name(country_name),
                "headquarters": investor.get('headquarters_address', 'Global'),
                "stage_focus": ', '.join(investor.get('funding_stages', ['All stages'])[:2]),  # Limit to first 2 stages
                "check_size": investor.get('check_size', 'Varies'),
                "typical_investment_min": extract_amount(investor.get('check_size_min', '')),
                "typical_investment_max": extract_amount(investor.get('check_size_max', '')),
                "portfolio_companies": "N/A",  # This data is not available in the source
                "team_members": investor.get('team_members', []),
                "linkedin_profile": "",  # This data is not available in the source
                "website_link": investor.get('website_link', ''),
                "overview": investor.get('overview', '')
            }
            formatted_investors.append(formatted_investor)
        
        print(f"✅ Formatted {len(formatted_investors)} investors for table display")
        return formatted_investors
        
    except Exception as e:
        print(f"❌ Error getting all investors for table: {e}")
        return []

def get_country_code_from_name(country_name: str) -> str:
    """
    Convert country name to country code.
    """
    country_mapping = {
        'United States': 'US', 'USA': 'US', 'US': 'US',
        'United Kingdom': 'GB', 'UK': 'GB', 'Britain': 'GB',
        'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT',
        'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
        'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI',
        'Canada': 'CA', 'Australia': 'AU', 'Japan': 'JP', 'South Korea': 'KR',
        'China': 'CN', 'India': 'IN', 'Singapore': 'SG', 'Hong Kong': 'HK',
        'Brazil': 'BR', 'Mexico': 'MX', 'Argentina': 'AR', 'Chile': 'CL',
        'Palestine': 'PS', 'UAE': 'AE', 'South Africa': 'ZA', 'Turkey': 'TR',
        'Global': 'US'  # Default to US for global
    }
    return country_mapping.get(country_name.strip(), 'US')

def extract_amount(amount_str: str) -> str:
    """
    Extract numeric amount from string like '$1000000' -> '1000'
    """
    if not amount_str or amount_str in ['', 'N/A']:
        return '0'
    
    # Remove $ and convert to number, then to K format
    try:
        amount_str = amount_str.replace('$', '').replace(',', '')
        amount = float(amount_str)
        if amount >= 1000000:
            return str(int(amount / 1000))  # Convert to K
        elif amount >= 1000:
            return str(int(amount))
        else:
            return str(int(amount))
    except (ValueError, TypeError):
        return '0'
    """
    Calculate a simple investment readiness score based on business summary content.
    """
    score = 0.5  # Base score
    
    # Check for key indicators
    indicators = {
        'market': ['market', 'customers', 'target audience', 'demand'],
        'revenue': ['revenue', 'income', 'sales', 'monetization', 'pricing'],
        'traction': ['growth', 'users', 'customers', 'traction', 'metrics'],
        'team': ['team', 'founder', 'experience', 'expertise'],
        'product': ['product', 'service', 'solution', 'technology', 'innovation']
    }
    
    business_lower = business_summary.lower()
    
    for category, keywords in indicators.items():
        if any(keyword in business_lower for keyword in keywords):
            score += 0.1
    
def calculate_investment_readiness(business_summary: str):
    """
    Calculate a simple investment readiness score based on business summary content.
    """
    score = 0.5  # Base score
    
    # Check for key indicators
    indicators = {
        'market': ['market', 'customers', 'target audience', 'demand'],
        'revenue': ['revenue', 'income', 'sales', 'monetization', 'pricing'],
        'traction': ['growth', 'users', 'customers', 'traction', 'metrics'],
        'team': ['team', 'founder', 'experience', 'expertise'],
        'product': ['product', 'service', 'solution', 'technology', 'innovation']
    }
    
    business_lower = business_summary.lower()
    
    for category, keywords in indicators.items():
        if any(keyword in business_lower for keyword in keywords):
            score += 0.1
    
    return min(score, 1.0)