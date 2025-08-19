import os
import json
import logging
import requests
import random
from groq import Groq
from dotenv import load_dotenv
import base64
from PIL import Image
from io import BytesIO

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Groq client with the provided API key
GROQ_API_KEY = "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"
client = Groq(api_key=GROQ_API_KEY)

def generate_image_prompt(business_summary: str, business_idea: str) -> str:
    """
    Generate an image prompt using Groq's Qwen model based on business summary and idea
    """
    try:
        # Create a detailed prompt for Qwen to generate image description
        system_prompt = """You are a professional graphic designer creating clean, consumer-focused visual concepts for business presentations.
        Given a business idea and summary, create a simple but engaging visual prompt that would work as a professional background image.
        
        Think like a graphic designer - focus on:
        - Clean, consumer-friendly aesthetics
        - Professional but approachable design
        - Relevant everyday objects and environments
        - Natural lighting and realistic textures
        - Modern but not overly futuristic elements
        - Wide 21:9 aspect ratio composition
        
        Visual style should be:
        - Contemporary and consumer-oriented
        - Professional photography style
        - Clean layouts with breathing room
        - Warm, inviting color palettes
        - Relatable business environments
        
        Include elements like: office spaces, retail environments, everyday products, people in natural poses, clean workspaces, or relevant business tools.
        Avoid: complex technology, futuristic elements, overwhelming details, neon colors, sci-fi aesthetics.
        
        Keep prompt concise (max 80 words) and use hyphens instead of spaces.
        No text, logos, or brand names.
        
        Example: "clean modern office space with wooden desk, laptop, coffee cup, natural window lighting, soft shadows, people collaborating in background, neutral color palette, professional photography, shallow depth-of-field, warm atmosphere"
        """
        
        user_message = f"""Business Idea: {business_idea}

Business Summary: {business_summary}

Generate a detailed visual prompt for creating a professional background image that represents this business concept."""

        # Generate prompt using Groq - try multiple models for better reliability
        models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
        
        completion = None
        for model in models_to_try:
            try:
                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=150,
                    top_p=0.9
                )
                logger.info(f"Successfully used model: {model}")
                break
            except Exception as model_error:
                logger.warning(f"Model {model} failed: {str(model_error)}")
                continue
        
        if not completion:
            raise Exception("All Groq models failed")
        
        generated_prompt = completion.choices[0].message.content.strip()
        logger.info(f"Generated image prompt: {generated_prompt}")
        return generated_prompt
        
    except Exception as e:
        logger.error(f"Error generating image prompt: {str(e)}")
        # Fallback prompt - simple and consumer-friendly
        return f"clean modern workspace representing {business_idea}, professional photography, natural lighting, consumer-friendly design"

def generate_business_image(business_summary: str, business_idea: str) -> str:
    """
    Generate a business background image using Pollinations AI
    Returns the image URL
    """
    try:
        # Generate the prompt using Groq
        image_prompt = generate_image_prompt(business_summary, business_idea)
        
        # Add specific styling for 21:9 ratio and background use
        enhanced_prompt = f"{image_prompt}, wide-shot, professional-photography, natural-lighting, clean-composition"
        
        # Clean up the prompt by replacing spaces with hyphens and removing problematic characters
        cleaned_prompt = enhanced_prompt.replace(" ", "-").replace(",", "").replace(".", "").replace("'", "").replace('"', '').replace(":", "")
        
        # Limit prompt length to avoid URL issues
        if len(cleaned_prompt) > 200:
            cleaned_prompt = cleaned_prompt[:200]
        
        # Generate image URL using Pollinations AI with cleaned prompt and no watermark
        # Use seed for consistency and direct image generation
        import random
        seed = random.randint(1, 1000000)
        image_url = f"https://image.pollinations.ai/prompt/{cleaned_prompt}?width=1344&height=640&model=flux&nologo=true&private=true&seed={seed}"
        
        # Alternative URL format that sometimes works better for direct downloads
        # image_url = f"https://pollinations.ai/p/{cleaned_prompt}?width=1344&height=640&model=flux&nologo=true&private=true&seed={seed}"
        
        logger.info(f"Generated image URL: {image_url}")
        
        # Test if the image URL is accessible
        try:
            response = requests.head(image_url, timeout=10)
            if response.status_code == 200:
                logger.info("Image URL is accessible")
            else:
                logger.warning(f"Image URL returned status code: {response.status_code}")
        except requests.RequestException as e:
            logger.warning(f"Could not verify image URL accessibility: {str(e)}")
        
        return image_url
        
    except Exception as e:
        logger.error(f"Error generating business image: {str(e)}")
        # Return a fallback image URL with cleaned prompt
        safe_idea = business_idea.replace(' ', '-').replace('/', '-').replace('\\', '-')
        safe_idea = ''.join(c for c in safe_idea if c.isalnum() or c in ('-', '_'))[:50]  # Limit length
        fallback_prompt = f"clean-business-workspace-{safe_idea}-professional-photography"
        return f"https://image.pollinations.ai/prompt/{fallback_prompt}?width=1344&height=640&nologo=true&private=true"

def download_and_save_image(image_url: str, business_idea: str) -> dict:
    """
    Download image from URL and save as JPG locally
    Returns local file path and base64 data
    """
    try:
        # Create images directory
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output", "images"))
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate safe filename
        safe_filename = business_idea.replace(' ', '_').replace('/', '_').replace('\\', '_')
        safe_filename = ''.join(c for c in safe_filename if c.isalnum() or c in ('_', '-'))
        image_filename = f"{safe_filename}_{int(__import__('time').time())}.jpg"
        image_path = os.path.join(output_dir, image_filename)
        
        # Download the image with proper headers to get image content
        logger.info(f"Downloading image from: {image_url}")
        headers = {
            'Accept': 'image/*, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(image_url, timeout=30, headers=headers)
        response.raise_for_status()
        
        # Check if response content is actually an image
        content_type = response.headers.get('content-type', '')
        logger.info(f"Response content type: {content_type}")
        logger.info(f"Response content length: {len(response.content)} bytes")
        
        # If we get HTML content, try to extract the actual image URL
        if content_type.startswith('text/html') or 'html' in content_type.lower():
            logger.warning("Received HTML instead of image, attempting to extract image URL")
            html_content = response.text
            logger.info(f"HTML content preview: {html_content[:500]}")
            
            # Look for img src in the HTML
            import re
            img_pattern = r'<img[^>]+src="([^"]+)"'
            img_match = re.search(img_pattern, html_content)
            
            if img_match:
                actual_image_url = img_match.group(1)
                # Clean up URL encoding
                actual_image_url = actual_image_url.replace('&amp;', '&')
                logger.info(f"Found actual image URL in HTML: {actual_image_url}")
                
                # Try downloading the actual image
                try:
                    img_response = requests.get(actual_image_url, timeout=30, headers=headers)
                    img_response.raise_for_status()
                    
                    img_content_type = img_response.headers.get('content-type', '')
                    logger.info(f"Actual image content type: {img_content_type}")
                    logger.info(f"Actual image content length: {len(img_response.content)} bytes")
                    
                    if img_content_type.startswith('image/') and len(img_response.content) > 1000:
                        response = img_response  # Use the actual image response
                        content_type = img_content_type
                        logger.info("Successfully extracted and downloaded actual image")
                    else:
                        logger.error(f"Extracted URL also didn't return valid image: {img_content_type}")
                        return None
                except Exception as extract_error:
                    logger.error(f"Failed to download extracted image URL: {str(extract_error)}")
                    return None
            else:
                logger.error("Could not find image URL in HTML content")
                return None
        
        # Verify we have valid image content
        if not content_type.startswith('image/'):
            logger.error(f"Final content type is not an image: {content_type}")
            return None
            
        # Verify content length
        if len(response.content) < 1000:  # Images should be at least 1KB
            logger.error(f"Response content too small: {len(response.content)} bytes")
            logger.error(f"Content: {response.content}")
            return None
        
        # Open image with PIL and convert to RGB (removes any transparency)
        try:
            image = Image.open(BytesIO(response.content))
        except Exception as img_error:
            logger.error(f"Failed to open image with PIL: {str(img_error)}")
            logger.error(f"Content type: {content_type}")
            logger.error(f"Content length: {len(response.content)}")
            # Save raw content for debugging
            debug_path = os.path.join(output_dir, f"debug_content_{int(__import__('time').time())}.bin")
            with open(debug_path, 'wb') as f:
                f.write(response.content)
            logger.error(f"Raw content saved to: {debug_path}")
            return None
        
        if image.mode in ('RGBA', 'LA', 'P'):
            # Convert to RGB for JPG format
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = rgb_image
        
        # Save as JPG with high quality
        image.save(image_path, 'JPEG', quality=95, optimize=True)
        logger.info(f"Image saved to: {image_path}")
        
        # Convert to base64 for frontend use
        with open(image_path, 'rb') as img_file:
            base64_data = base64.b64encode(img_file.read()).decode('utf-8')
            base64_url = f"data:image/jpeg;base64,{base64_data}"
        
        logger.info(f"Base64 data length: {len(base64_data)} characters")
        logger.info(f"Base64 URL length: {len(base64_url)} characters")
        
        return {
            "local_path": image_path,
            "base64_data": base64_url,
            "filename": image_filename,
            "file_size": os.path.getsize(image_path)
        }
        
    except Exception as e:
        logger.error(f"Error downloading and saving image: {str(e)}")
        return None
        
        # Open image with PIL and convert to RGB (removes any transparency)
        try:
            image = Image.open(BytesIO(response.content))
        except Exception as img_error:
            logger.error(f"Failed to open image with PIL: {str(img_error)}")
            logger.error(f"Content type: {content_type}")
            logger.error(f"Content length: {len(response.content)}")
            # Save raw content for debugging
            debug_path = os.path.join(output_dir, f"debug_content_{int(__import__('time').time())}.bin")
            with open(debug_path, 'wb') as f:
                f.write(response.content)
            logger.error(f"Raw content saved to: {debug_path}")
            return None
        if image.mode in ('RGBA', 'LA', 'P'):
            # Convert to RGB for JPG format
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = rgb_image
        
        # Save as JPG with high quality
        image.save(image_path, 'JPEG', quality=95, optimize=True)
        logger.info(f"Image saved to: {image_path}")
        
        # Convert to base64 for frontend use
        with open(image_path, 'rb') as img_file:
            base64_data = base64.b64encode(img_file.read()).decode('utf-8')
            base64_url = f"data:image/jpeg;base64,{base64_data}"
        
        logger.info(f"Base64 data length: {len(base64_data)} characters")
        logger.info(f"Base64 URL length: {len(base64_url)} characters")
        
        return {
            "local_path": image_path,
            "base64_data": base64_url,
            "filename": image_filename,
            "file_size": os.path.getsize(image_path)
        }
        
    except Exception as e:
        logger.error(f"Error downloading and saving image: {str(e)}")
        return None

def run_image_generation_agent(business_summary: str, business_idea: str) -> dict:
    """
    Main function to run the image generation agent
    Returns a dictionary with image URL, local path, and base64 data
    """
    try:
        logger.info("Starting image generation agent...")
        
        # Generate the image URL
        image_url = generate_business_image(business_summary, business_idea)
        
        # Download and save the image locally
        local_image_data = download_and_save_image(image_url, business_idea)
        
        # If first download failed, try alternative URL formats
        if not local_image_data:
            logger.warning("First download attempt failed, trying alternative URL formats...")
            
            # Try alternative URL format
            import random
            seed = random.randint(1, 1000000)
            alt_url = f"https://pollinations.ai/p/{image_url.split('/')[-1].split('?')[0]}?width=1344&height=640&model=flux&nologo=true&private=true&seed={seed}"
            logger.info(f"Trying alternative URL: {alt_url}")
            local_image_data = download_and_save_image(alt_url, business_idea)
            
            # If still failed, try with different model
            if not local_image_data:
                logger.warning("Second attempt failed, trying with different model...")
                diff_model_url = image_url.replace("model=flux", "model=turbo")
                logger.info(f"Trying different model: {diff_model_url}")
                local_image_data = download_and_save_image(diff_model_url, business_idea)
        
        # Create result dictionary
        result = {
            "image_url": image_url,
            "business_idea": business_idea,
            "generated_at": f"{__import__('datetime').datetime.now().isoformat()}",
            "status": "success"
        }
        
        # Add local image data if download was successful
        if local_image_data:
            # Create direct URL to serve the image via FastAPI
            # Try to get backend URL from environment, fallback to localhost
            backend_base_url = os.getenv('BACKEND_URL', 'http://localhost:8001')
            image_serve_url = f"{backend_base_url}/images/{local_image_data['filename']}"
            
            # Log the base64 data size for debugging
            if 'base64_data' in local_image_data:
                logger.info(f"Base64 data size: {len(local_image_data['base64_data'])} characters")
            
            result.update({
                "local_path": local_image_data["local_path"],
                "filename": local_image_data["filename"],
                "file_size": local_image_data["file_size"],
                "serve_url": image_serve_url,  # Direct URL to serve the image
                "base64_data": local_image_data["base64_data"]  # Keep as backup
            })
        
        # Save result to output file
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "output"))
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, "image_generation_output.json")
        
        # Don't save base64 data to JSON file (too large), save reference instead
        json_result = result.copy()
        if "base64_data" in json_result:
            json_result["has_base64"] = True
            del json_result["base64_data"]  # Remove large base64 data from JSON file
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(json_result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Image generation completed. Output saved to: {output_file}")
        return result
        
    except Exception as e:
        logger.error(f"Image generation agent failed: {str(e)}")
        # Return error result
        error_result = {
            "image_url": None,
            "business_idea": business_idea,
            "generated_at": f"{__import__('datetime').datetime.now().isoformat()}",
            "status": "error",
            "error": str(e)
        }
        return error_result

if __name__ == "__main__":
    # Test the agent
    test_summary = "comprehensive e-commerce platform specifically designed for pet owners to buy pets, pet supplies, and services online."
    test_idea = "ecommerce platform to sell pets"
    
    result = run_image_generation_agent(test_summary, test_idea)
    print(f"Result: {json.dumps(result, indent=2)}")
