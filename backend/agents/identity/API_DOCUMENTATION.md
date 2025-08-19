# AI Logo Generator API Documentation

## Overview

The AI Logo Generator API provides RESTful endpoints for generating professional logos using AI. It combines QWEN for intelligent prompt generation and Pollinations for high-quality image creation.

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, the API does not require authentication. In production, implement proper API key authentication.

## Endpoints

### General Endpoints

#### GET `/`
Get API information and available endpoints.

**Response:**
```json
{
  "message": "AI Logo Generator API",
  "version": "1.0.0",
  "docs": "/docs",
  "endpoints": {
    "color_palettes": "/api/v1/color-palettes",
    "suggestions": "/api/v1/suggestions",
    "generate_logo": "/api/v1/generate-logo",
    "generate_3d_logo": "/api/v1/generate-3d-logo",
    "batch_generate": "/api/v1/batch-generate",
    "logo_details": "/api/v1/logo/{logo_id}",
    "download_logo": "/api/v1/download/{logo_id}"
  }
}
```

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-07T12:00:00"
}
```

### Color Palette Generation

#### POST `/api/v1/color-palettes`
Generate AI-powered color palettes based on business description.

**Request Body:**
```json
{
  "description": "A modern tech startup focusing on AI-powered solutions"
}
```

**Response:**
```json
{
  "palettes": [
    {
      "name": "Tech Professional",
      "description": "Modern and trustworthy colors for tech companies",
      "colors": ["#2563eb", "#1f2937", "#f8fafc"]
    }
  ]
}
```

### Logo Suggestions

#### POST `/api/v1/suggestions`
Get AI-generated suggestions for logo styles and keywords.

**Request Body:**
```json
{
  "description": "A modern tech startup focusing on AI-powered solutions"
}
```

**Response:**
```json
{
  "suggested_styles": [
    "modern and minimalist",
    "bold and geometric",
    "elegant and sophisticated"
  ],
  "suggested_keywords": [
    "clean lines",
    "modern typography",
    "simple icon"
  ],
  "industry_specific": [
    "tech-focused elements",
    "business-appropriate colors"
  ]
}
```

### Logo Generation

#### POST `/api/v1/generate-logo`
Generate a single logo based on business description, style, and colors.

**Request Body:**
```json
{
  "business_description": "A modern tech startup focusing on AI-powered solutions",
  "logo_description": "modern minimalist with geometric shapes",
  "colors": ["#2563eb", "#1f2937", "#f8fafc"]
}
```

**Response:**
```json
{
  "success": true,
  "logo_id": "uuid-123-456-789",
  "image_data": "base64-encoded-image-data",
  "image_url": "https://pollinations.ai/...",
  "prompt": "Enhanced AI prompt used for generation",
  "description": "modern minimalist with geometric shapes",
  "colors": ["#2563eb", "#1f2937", "#f8fafc"],
  "generation_time": "2025-08-07T12:00:00"
}
```

#### POST `/api/v1/generate-3d-logo`
Generate a 3D version of a logo.

**Request Body:**
```json
{
  "business_description": "A modern tech startup focusing on AI-powered solutions",
  "logo_description": "modern minimalist with geometric shapes",
  "colors": ["#2563eb", "#1f2937", "#f8fafc"],
  "base_logo_prompt": "Original logo prompt for consistency"
}
```

**Response:** Same format as `/api/v1/generate-logo`

#### POST `/api/v1/batch-generate`
Generate multiple logos with different styles for the same business.

**Request Body:**
```json
{
  "business_description": "A modern tech startup focusing on AI-powered solutions",
  "logo_descriptions": [
    "modern minimalist",
    "bold and geometric",
    "elegant and sophisticated"
  ],
  "colors": ["#2563eb", "#1f2937", "#f8fafc"]
}
```

**Response:**
```json
[
  {
    "success": true,
    "logo_id": "uuid-123-456-789",
    "image_data": "base64-encoded-image-data",
    "description": "modern minimalist",
    "colors": ["#2563eb", "#1f2937", "#f8fafc"],
    "generation_time": "2025-08-07T12:00:00"
  }
]
```

### Logo Management

#### GET `/api/v1/logo/{logo_id}`
Get detailed information about a generated logo.

**Response:**
```json
{
  "success": true,
  "logo_id": "uuid-123-456-789",
  "image_data": "base64-encoded-image-data",
  "image_url": "https://pollinations.ai/...",
  "prompt": "Enhanced AI prompt used for generation",
  "description": "modern minimalist with geometric shapes",
  "colors": ["#2563eb", "#1f2937", "#f8fafc"],
  "generation_time": "2025-08-07T12:00:00"
}
```

#### GET `/api/v1/download/{logo_id}?format={format}`
Download a generated logo in specified format.

**Query Parameters:**
- `format`: jpg, png, or svg (default: jpg)

**Response:** File download stream

#### GET `/api/v1/logos?limit={limit}&offset={offset}`
List all generated logos with pagination.

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Starting position (default: 0)

**Response:**
```json
{
  "total": 100,
  "limit": 50,
  "offset": 0,
  "logos": [
    {
      "logo_id": "uuid-123-456-789",
      "description": "modern minimalist",
      "colors": ["#2563eb", "#1f2937", "#f8fafc"],
      "generation_time": "2025-08-07T12:00:00",
      "type": "standard"
    }
  ]
}
```

#### DELETE `/api/v1/logo/{logo_id}`
Delete a generated logo from storage.

**Response:**
```json
{
  "message": "Logo uuid-123-456-789 deleted successfully"
}
```

#### POST `/api/v1/convert-svg/{logo_id}`
Convert an existing logo to SVG format.

**Response:**
```json
{
  "success": true,
  "logo_id": "uuid-123-456-789",
  "svg_content": "<?xml version=\"1.0\"...",
  "download_url": "/api/v1/download/uuid-123-456-789?format=svg"
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input data
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server-side error

## Usage Examples

### Python Example
```python
import requests

# Generate color palettes
response = requests.post("http://localhost:8000/api/v1/color-palettes", 
                        json={"description": "Tech startup"})
palettes = response.json()

# Generate logo
logo_request = {
    "business_description": "Tech startup",
    "logo_description": "modern minimalist",
    "colors": palettes["palettes"][0]["colors"]
}
response = requests.post("http://localhost:8000/api/v1/generate-logo", 
                        json=logo_request)
logo = response.json()

# Download logo
logo_id = logo["logo_id"]
response = requests.get(f"http://localhost:8000/api/v1/download/{logo_id}?format=png")
with open("logo.png", "wb") as f:
    f.write(response.content)
```

### JavaScript Example
```javascript
// Generate logo
const logoRequest = {
  business_description: "Tech startup",
  logo_description: "modern minimalist",
  colors: ["#2563eb", "#1f2937", "#f8fafc"]
};

fetch("http://localhost:8000/api/v1/generate-logo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(logoRequest)
})
.then(response => response.json())
.then(data => {
  console.log("Logo generated:", data.logo_id);
  // Display image using data.image_data
});
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting based on:
- IP address
- API key
- Request type

## Interactive Documentation

Visit the following URLs when the API is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## WebSocket Support

The API includes a WebSocket endpoint for real-time generation updates:
- Endpoint: `ws://localhost:8000/ws/generation`
- Use for receiving real-time updates during logo generation

## Deployment Notes

For production deployment:

1. **Security**: Implement authentication and API keys
2. **Storage**: Replace in-memory storage with a database
3. **Caching**: Add Redis for caching generated logos
4. **Rate Limiting**: Implement proper rate limiting
5. **CORS**: Configure CORS appropriately for your frontend domain
6. **HTTPS**: Use HTTPS in production
7. **Environment Variables**: Use environment variables for API keys
8. **Monitoring**: Add logging and monitoring
9. **Scaling**: Consider using multiple workers with Gunicorn
