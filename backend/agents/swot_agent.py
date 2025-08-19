import os
import json
import re
from datetime import datetime
from typing import Dict, Any, List
from groq import Groq

class SWOTAgent:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.output_dir = os.path.join(os.path.dirname(__file__), "output")
        
    def read_agent_outputs(self) -> Dict[str, str]:
        """Read all agent output files including business summary"""
        file_contents = {}
        
        # Define the output files to read
        output_files = {
            "financial_assessment": "assessment_output.txt",
            "legal_analysis": "legal_output.txt",
            "market_analysis": "market_analysis_competitors_output.txt",
            "opportunities": "opportunities_output.txt",
            "business_summary": "business_summary.txt"
        }
        
        for agent_name, filename in output_files.items():
            file_path = os.path.join(self.output_dir, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        file_contents[agent_name] = f.read()
                except Exception as e:
                    print(f"Warning: Could not read {filename}: {str(e)}")
                    file_contents[agent_name] = ""
            else:
                print(f"Warning: {filename} not found")
                file_contents[agent_name] = ""
                
        return file_contents
    
    def generate_swot_analysis(self, business_idea: str, file_contents: Dict[str, str]) -> Dict[str, List[str]]:
        """Generate SWOT analysis using Groq LLM with business summary context"""
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY not configured")
        
        # Get business summary for better context
        business_summary = file_contents.get("business_summary", "")
        
        # Combine all analysis content with emphasis on business summary
        combined_analysis = f"""
        BUSINESS IDEA: {business_idea}
        
        BUSINESS SUMMARY & CONTEXT:
        {business_summary}
        
        SUPPORTING ANALYSIS DATA:
        
        Financial Assessment:
        {file_contents.get("financial_assessment", "No financial assessment available")}
        
        Legal Analysis:
        {file_contents.get("legal_analysis", "No legal analysis available")}
        
        Market Analysis:
        {file_contents.get("market_analysis", "No market analysis available")}
        
        Opportunities Analysis:
        {file_contents.get("opportunities", "No opportunities analysis available")}
        """
        
        swot_prompt = f"""
        Based on the comprehensive business analysis provided, generate a detailed SWOT analysis for this SPECIFIC business.
        
        {combined_analysis}
        
        IMPORTANT: Base your analysis on the actual business details from the Business Summary section. Extract specific information about:
        - Budget and financial constraints
        - Target market and demographics  
        - Product/service category
        - Business model and operations
        - Geographic market
        - Competition level
        
        Return ONLY a JSON object in this exact format:
        {{
            "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
            "weaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4", "weakness 5"],
            "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4", "opportunity 5"],
            "threats": ["threat 1", "threat 2", "threat 3", "threat 4", "threat 5"]
        }}
        
        Guidelines:
        - Strengths: Internal positive factors, competitive advantages, unique capabilities specific to this business
        - Weaknesses: Internal limitations, areas for improvement, resource constraints based on actual budget
        - Opportunities: External positive factors, market trends, growth potential in the target market
        - Threats: External risks, competitive pressures, market challenges specific to the industry
        - Provide exactly 5 specific, actionable items per category
        - Base analysis on the actual business context from the summary
        - Be specific and avoid generic statements
        - Consider the actual budget and scale mentioned in the business summary
        """
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert business analyst specializing in SWOT analysis. Return only valid JSON."},
                    {"role": "user", "content": swot_prompt}
                ],
                model="llama3-8b-8192",
                temperature=0.3,
                max_tokens=2000
            )
            
            swot_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', swot_text, re.DOTALL)
            if json_match:
                swot_data = json.loads(json_match.group())
                return swot_data
            else:
                return self._parse_swot_from_text(swot_text)
                
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            # Get swot_text from response if available, otherwise use empty string
            try:
                swot_text = response.choices[0].message.content.strip()
            except:
                swot_text = ""
            return self._parse_swot_from_text(swot_text)
        except Exception as e:
            raise Exception(f"SWOT analysis generation failed: {str(e)}")
    
    def _parse_swot_from_text(self, text: str) -> Dict[str, List[str]]:
        """Fallback parser for non-JSON SWOT responses"""
        swot = {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}
        
        lines = text.lower().split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if 'strength' in line:
                current_section = 'strengths'
            elif 'weakness' in line:
                current_section = 'weaknesses'
            elif 'opportunit' in line:
                current_section = 'opportunities'
            elif 'threat' in line:
                current_section = 'threats'
            elif line and current_section and any(line.startswith(prefix) for prefix in ['-', '•', '*', '1.', '2.']):
                item = re.sub(r'^[-•*\d\.\s]+', '', line).strip()
                if item and len(swot[current_section]) < 5:
                    swot[current_section].append(item)
        
        # Ensure each category has at least one item
        for category in swot:
            if not swot[category]:
                swot[category] = [f"Analysis needed for {category}"]
        
        return swot
    
    def save_swot_files(self, swot: Dict[str, List[str]], business_idea: str) -> Dict[str, str]:
        """Save SWOT analysis to individual component files and complete file"""
        os.makedirs(self.output_dir, exist_ok=True)
        timestamp = datetime.now().isoformat()
        saved_files = {}
        
        # Save individual component files
        for component, items in swot.items():
            filename = f"swot_{component}.json"
            file_path = os.path.join(self.output_dir, filename)
            
            component_data = {
                "component": component.title(),
                "business_idea": business_idea,
                "items": items,
                "generated_at": timestamp,
                "total_items": len(items)
            }
            
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(component_data, f, indent=2, ensure_ascii=False)
            
            saved_files[component] = file_path
        
        # Save complete SWOT analysis
        complete_filename = "swot_complete.json"
        complete_file_path = os.path.join(self.output_dir, complete_filename)
        
        complete_data = {
            "swot_analysis": swot,
            "business_idea": business_idea,
            "generated_at": timestamp,
            "summary": {f"total_{category}": len(items) for category, items in swot.items()}
        }
        
        with open(complete_file_path, "w", encoding="utf-8") as f:
            json.dump(complete_data, f, indent=2, ensure_ascii=False)
        
        saved_files["complete"] = complete_file_path
        
        return saved_files
    
    def run_swot_analysis(self, business_idea: str = "Business Analysis") -> Dict[str, Any]:
        """Main method to run complete SWOT analysis"""
        try:
            # Read agent outputs
            file_contents = self.read_agent_outputs()
            
            # Check if we have any content
            if not any(content.strip() for content in file_contents.values()):
                raise ValueError("No agent output files found. Please run the business analysis agents first.")
            
            # Generate SWOT analysis
            swot = self.generate_swot_analysis(business_idea, file_contents)
            
            # Save SWOT files
            saved_files = self.save_swot_files(swot, business_idea)
            
            return {
                "status": "success",
                "swot_analysis": swot,
                "saved_files": saved_files,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

def run_swot_agent(business_idea: str = "Business Analysis") -> Dict[str, Any]:
    """Standalone function to run SWOT analysis"""
    agent = SWOTAgent()
    return agent.run_swot_analysis(business_idea)
