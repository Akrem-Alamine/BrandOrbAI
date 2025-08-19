"""
FastAPI endpoints for the self-hosted vectorization service.
Provides HTTP API interface for the vectorization pipeline.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import PlainTextResponse, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from .vectorization_service import create_vectorization_service

logger = logging.getLogger(__name__)

# Create router for vectorization endpoints
vectorization_router = APIRouter(prefix="/vectorization", tags=["vectorization"])

class VectorizationRequest(BaseModel):
    imageUrl: str
    method: str = "autotrace"  # "potrace" or "autotrace"
    colorCount: Optional[int] = 8  # For autotrace - higher default for better quality
    threshold: Optional[str] = "70%"  # For potrace - higher to preserve details
    aggressiveBackgroundRemoval: Optional[bool] = False  # Default to FALSE - use new approach
    noBackgroundRemoval: Optional[bool] = True  # NEW: Vectorize without background removal
    generateVariations: Optional[bool] = True  # Generate color variations
    createPngVariations: Optional[bool] = True  # NEW: Create PNG versions of variations
    paletteColors: Optional[list] = None  # Custom palette for variations

class VectorizationResponse(BaseModel):
    success: bool
    svg_content: Optional[str] = None
    data_url: Optional[str] = None
    method: Optional[str] = None
    files: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None
    variations: Optional[Dict[str, str]] = None  # SVG variations with different palettes
    png_variations: Optional[Dict[str, str]] = None  # NEW: PNG variations file paths
    elements: Optional[Dict[str, Any]] = None  # Separated elements info
    error: Optional[str] = None

# Initialize vectorization service
vectorization_service = create_vectorization_service()

@vectorization_router.post("/vectorize", response_model=VectorizationResponse)
async def vectorize_image_from_url(request: VectorizationRequest):
    """
    Vectorize an image from URL using the specified method.
    
    - **imageUrl**: URL of the image to vectorize
    - **method**: "autotrace" (multi-color) or "potrace" (monochrome)
    - **colorCount**: Number of colors for autotrace (2-8 recommended)
    - **threshold**: Threshold for potrace binary conversion (e.g., "60%")
    """
    logger.info(f"=== VECTORIZATION REQUEST (URL): {request.imageUrl} ===")
    logger.info(f"Method: {request.method}, ColorCount: {request.colorCount}, Threshold: {request.threshold}")
    
    try:
        # Prepare parameters based on method
        kwargs = {
            'aggressive_bg_removal': request.aggressiveBackgroundRemoval,
            'no_background_removal': request.noBackgroundRemoval,  # NEW parameter
            'generate_variations': request.generateVariations,
            'create_png_variations': request.createPngVariations,  # NEW parameter
            'palette_colors': request.paletteColors
        }
        
        if request.method.lower() == "autotrace":
            kwargs["color_count"] = request.colorCount or 6
        elif request.method.lower() == "potrace":
            kwargs["threshold"] = request.threshold or "60%"
        else:
            raise HTTPException(status_code=400, detail=f"Unknown method: {request.method}")
        
        # Perform enhanced vectorization with AI separation
        result = vectorization_service.vectorize_image_with_ai_separation(
            image_url=request.imageUrl,
            method=request.method,
            **kwargs
        )
        
        if result["success"]:
            # Create data URL for frontend display
            data_url = vectorization_service.get_svg_as_data_url(result["svg_content"])
            
            return VectorizationResponse(
                success=True,
                svg_content=result["svg_content"],
                data_url=data_url,
                method=result.get("method"),
                files=result.get("files"),
                metadata=result.get("metadata"),
                variations=result.get("variations"),
                png_variations=result.get("png_variations"),  # NEW: PNG variations
                elements=result.get("elements")
            )
        else:
            return VectorizationResponse(
                success=False,
                error=result.get("error", "Vectorization failed"),
                method=request.method
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vectorization endpoint error: {e}")
        return VectorizationResponse(
            success=False,
            error=str(e),
            method=request.method
        )

@vectorization_router.post("/vectorize/upload/autotrace", response_class=PlainTextResponse)
async def vectorize_upload_autotrace(
    file: UploadFile = File(...), 
    color_count: int = Query(3, ge=1, le=16, description="Number of colors to preserve")
):
    """
    Upload and vectorize image using autotrace (multi-color vectorization).
    Returns raw SVG content.
    """
    logger.info(f"=== AUTOTRACE UPLOAD: {file.filename} (colors: {color_count}) ===")
    
    try:
        # Read uploaded file
        image_bytes = await file.read()
        logger.info(f"File uploaded: {file.filename}, size: {len(image_bytes)} bytes")
        
        # Perform vectorization
        result = vectorization_service.vectorize_image(
            image_bytes=image_bytes,
            method="autotrace",
            color_count=color_count
        )
        
        if result["success"]:
            return result["svg_content"]
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Vectorization failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Autotrace upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@vectorization_router.post("/vectorize/upload/potrace", response_class=PlainTextResponse)
async def vectorize_upload_potrace(
    file: UploadFile = File(...), 
    threshold: str = Query("60%", description="Threshold for binary conversion (e.g., '60%')")
):
    """
    Upload and vectorize image using potrace (monochrome vectorization).
    Returns raw SVG content.
    """
    logger.info(f"=== POTRACE UPLOAD: {file.filename} (threshold: {threshold}) ===")
    
    try:
        # Read uploaded file
        image_bytes = await file.read()
        logger.info(f"File uploaded: {file.filename}, size: {len(image_bytes)} bytes")
        
        # Perform vectorization
        result = vectorization_service.vectorize_image(
            image_bytes=image_bytes,
            method="potrace",
            threshold=threshold
        )
        
        if result["success"]:
            return result["svg_content"]
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Vectorization failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Potrace upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@vectorization_router.get("/health")
async def vectorization_health():
    """Check health and dependencies of vectorization service."""
    logger.info("=== VECTORIZATION HEALTH CHECK ===")
    
    try:
        # Check if service can be created (tests dependencies)
        service = create_vectorization_service()
        
        # Test each dependency
        dependencies = {
            "rembg": True,  # Python package, should be available
            "potrace": service._command_exists("potrace"),
            "autotrace": service._command_exists("autotrace"),
            "imagemagick": service._command_exists("convert")
        }
        
        all_ok = all(dependencies.values())
        
        return {
            "status": "healthy" if all_ok else "degraded",
            "service": "Self-Hosted Vectorization Service",
            "dependencies": dependencies,
            "methods_available": [
                "autotrace" if dependencies["autotrace"] else None,
                "potrace" if dependencies["potrace"] else None
            ],
            "notes": {
                "missing_deps": [k for k, v in dependencies.items() if not v],
                "install_help": {
                    "ubuntu": "sudo apt install potrace autotrace imagemagick",
                    "macos": "brew install potrace autotrace imagemagick"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@vectorization_router.get("/methods")
async def get_available_methods():
    """Get available vectorization methods and their parameters."""
    return {
        "methods": {
            "autotrace": {
                "description": "Multi-color vectorization, best for logos with 2-8 colors",
                "parameters": {
                    "color_count": {
                        "type": "integer",
                        "default": 3,
                        "range": "1-16",
                        "description": "Number of colors to preserve in output"
                    }
                },
                "best_for": ["colorful logos", "brand marks", "illustrations"]
            },
            "potrace": {
                "description": "Monochrome vectorization, excellent for simple black/white logos",
                "parameters": {
                    "threshold": {
                        "type": "string",
                        "default": "60%",
                        "examples": ["50%", "60%", "75%"],
                        "description": "Threshold for converting to binary (black/white)"
                    }
                },
                "best_for": ["simple logos", "text", "monochrome designs"]
            }
        },
        "pipeline": [
            "1. Background removal (rembg)",
            "2. Image preprocessing (upscale + sharpen)",
            "3. Vectorization (potrace/autotrace)",
            "4. SVG optimization"
        ],
        "formats": {
            "input": ["PNG", "JPEG", "WebP", "GIF"],
            "output": "SVG"
        }
    }
