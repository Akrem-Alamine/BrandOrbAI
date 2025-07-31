import os
import json
import re

# --- 1. HELPER FUNCTIONS ---

def _safe_float(value):
    """Safely converts a value to a float, returning 0.0 on failure."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def _safe_int(value):
    """Safely converts a value to an integer, returning 0 on failure."""
    if value is None:
        return 0
    try:
        return int(float(value)) # Use float first to handle "12.0"
    except (ValueError, TypeError):
        return 0

def extract_json_from_text(text_content):
    """
    Finds and extracts a JSON object from a string that might contain other text.
    It looks for the first '{' and the last '}' to define the JSON boundaries.
    """
    try:
        # Find the first opening curly brace
        start_index = text_content.find('{')
        # Find the last closing curly brace
        end_index = text_content.rfind('}')
        
        if start_index == -1 or end_index == -1:
            print("  -> Warning: Could not find a JSON object in the file.")
            return None
            
        # Extract the potential JSON string
        json_str = text_content[start_index : end_index + 1]
        
        # Parse the extracted string
        return json.loads(json_str)
        
    except json.JSONDecodeError as e:
        print(f"  -> Error decoding the extracted JSON string: {e}")
        return None
    except Exception as e:
        print(f"  -> An unexpected error occurred during JSON extraction: {e}")
        return None

# --- 2. PARSING AND STRUCTURING FUNCTIONS ---

def extract_financial_data(financial_assessment_dict):
    """
    Extracts and structures financial data from a dictionary.
    """
    if not financial_assessment_dict:
        return {"chiffres": {}, "text": {}}

    chiffres = {
        "market_size_estimate_tam": _safe_float(financial_assessment_dict.get("market_size_estimate_tam", {}).get("amount")),
        "estimated_initial_funding": _safe_float(financial_assessment_dict.get("estimated_initial_funding", {}).get("amount")),
        "funding_breakdown": [
            {"category": item.get("category"), "amount": _safe_float(item.get("amount"))}
            for item in financial_assessment_dict.get("funding_breakdown", [])
        ],
        "estimated_monthly_burn_rate": _safe_float(financial_assessment_dict.get("estimated_monthly_burn_rate", {}).get("amount")),
        "estimated_time_to_break_even_months": _safe_int(financial_assessment_dict.get("estimated_time_to_break_even_months", {}).get("months")),
        "three_year_projections": {
            "estimated_annual_revenue_y3": _safe_float(financial_assessment_dict.get("three_year_projections", {}).get("estimated_annual_revenue_y3", {}).get("amount")),
            "estimated_annual_profit_y3": _safe_float(financial_assessment_dict.get("three_year_projections", {}).get("estimated_annual_profit_y3", {}).get("amount")),
            "expected_roi_3_years_percent": _safe_float(financial_assessment_dict.get("three_year_projections", {}).get("expected_roi_3_years_percent", {}).get("percentage")),
        },
        "cash_flow_projection_annual": [
            {
                "year": item.get("year"),
                "inflow": _safe_float(item.get("inflow")),
                "outflow": _safe_float(item.get("outflow")),
                "net_cash_flow": _safe_float(item.get("net_cash_flow"))
            } for item in financial_assessment_dict.get("cash_flow_projection_annual", [])
        ],
    }

    text = {
        "business_concept": financial_assessment_dict.get("business_concept"),
        "justifications": {
            "market_size": financial_assessment_dict.get("market_size_estimate_tam", {}).get("justification"),
            "initial_funding": financial_assessment_dict.get("estimated_initial_funding", {}).get("justification"),
            "monthly_burn_rate": financial_assessment_dict.get("estimated_monthly_burn_rate", {}).get("justification"),
            "time_to_break_even": financial_assessment_dict.get("estimated_time_to_break_even_months", {}).get("justification"),
            "annual_revenue_y3": financial_assessment_dict.get("three_year_projections", {}).get("estimated_annual_revenue_y3", {}).get("justification"),
            "annual_profit_y3": financial_assessment_dict.get("three_year_projections", {}).get("estimated_annual_profit_y3", {}).get("justification"),
            "roi_3_years": financial_assessment_dict.get("three_year_projections", {}).get("expected_roi_3_years_percent", {}).get("justification"),
        },
        "revenue_streams": financial_assessment_dict.get("revenue_streams"),
        "main_cost_drivers": financial_assessment_dict.get("main_cost_drivers"),
        "potential_risks": financial_assessment_dict.get("potential_risks"),
        "mitigation_strategies": financial_assessment_dict.get("mitigation_strategies"),
        "key_growth_factors": financial_assessment_dict.get("key_growth_factors"),
        "financial_success_likelihood": financial_assessment_dict.get("financial_success_likelihood"),
    }

    return {"chiffres": chiffres, "text": text}


def parse_legal_text(text_block):
    """
    Parses a markdown-style text block into a structured dictionary.
    """
    if not text_block:
        return {}
    
    structure = {}
    lines = [line.strip() for line in text_block.strip().split('\n') if line.strip()]
    
    current_heading = "introduction"
    if lines and not lines[0].endswith(':**'):
        structure[current_heading] = [lines.pop(0)]
    else:
         structure[current_heading] = []

    for line in lines:
        clean_line = line.strip()
        if clean_line.endswith(':**'):
            current_heading = clean_line.replace('**', '').replace(':', '').strip().lower().replace(' ', '_')
            structure[current_heading] = []
        elif clean_line.startswith(('*', '+', '-')):
            item_text = re.sub(r'^[*\+\-]\s*', '', clean_line)
            if current_heading not in structure:
                structure[current_heading] = []
            structure[current_heading].append(item_text)
        elif current_heading in structure:
            structure[current_heading].append(clean_line)

    return {k: v for k, v in structure.items() if v}


def parse_market_competitor_data(content):
    """
    Parses the content of the market/competitor file.
    """
    competitor_data = {}
    market_data = {}

    try:
        competitor_match = re.search(r"=== Competitor Analysis ===\s*(\{.*?\})", content, re.DOTALL)
        if competitor_match:
            competitor_str = competitor_match.group(1).replace('Competitor(', 'dict(')
            competitor_data = eval(competitor_str)
    except Exception as e:
        print(f"Warning: Could not parse competitor analysis. Error: {e}")

    try:
        market_match = re.search(r"=== Market Analysis ===\s*(\{.*?\})", content, re.DOTALL)
        if market_match:
            market_str = market_match.group(1).replace('MarketSegment(', 'dict(').replace('MarketTrend(', 'dict(')
            market_data = eval(market_str)
    except Exception as e:
        print(f"Warning: Could not parse market analysis. Error: {e}")

    return competitor_data, market_data


# --- 3. MAIN EXECUTION LOGIC ---

def main():
    """
    Main function to run the script.
    """
    input_folder = "./Backend/agents/output"
    output_filename = "structured_business_analysis.json"
    
    if not os.path.exists(input_folder):
        print(f"Error: Input folder '{input_folder}' not found.")
        return

    final_data = {
        "financial_data": {},
        "legal_analysis": {},
        "competitor_analysis": {},
        "market_analysis": {},
        "suppliers": []
    }

    print(f"--- Starting Data Processing from '{input_folder}' folder ---")

    for filename in os.listdir(input_folder):
        filepath = os.path.join(input_folder, filename)
        if not os.path.isfile(filepath):
            continue

        print(f"Processing '{filename}'...")
        
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        try:
            if 'assessment_output' in filename:
            # FIX: Use the new function to extract JSON safely
                assessment_json = extract_json_from_text(content)
                if assessment_json:
                    financial_dict = assessment_json.get("financial_assessment", {})
                    final_data["financial_data"] = extract_financial_data(financial_dict)

            elif 'legal_output' in filename:
                final_data["legal_analysis"] = parse_legal_text(content)

            elif 'market_analysis_competitors' in filename:
                competitor_data, market_data = parse_market_competitor_data(content)
                final_data["competitor_analysis"] = competitor_data
                final_data["market_analysis"] = market_data
                
            elif 'opportunities_output' in filename:
                final_data["suppliers"] = json.loads(content)

        except json.JSONDecodeError as e:
            print(f"  -> Error decoding JSON in {filename}: {e}")
        except Exception as e:
            print(f"  -> An unexpected error occurred while processing {filename}: {e}")

    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
        print(f"\n--- Success! ---")
        print(f"All data has been processed and saved to '{output_filename}'")
    except Exception as e:
        print(f"\n--- Error ---")
        print(f"Could not write the final JSON file. Error: {e}")


if __name__ == "__main__":
    main()




