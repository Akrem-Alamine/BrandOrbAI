# Self-Hosted Vectorization Service Documentation

## Overview

This is a completely free, self-hosted PNG-to-SVG vectorization pipeline that runs locally without requiring any API keys or external services. It combines background removal with vectorization using open-source tools.

## Features

- **Background Removal**: Uses `rembg` (local, no API required)
- **Vectorization**: Two methods available:
  - **Autotrace**: Multi-color vectorization (best for colorful logos)
  - **Potrace**: Monochrome vectorization (excellent for simple logos)
- **Image Preprocessing**: Automatic upscaling and sharpening for better results
- **FastAPI Integration**: RESTful API endpoints
- **Offline Operation**: No internet required after setup

## Architecture

```
Input Image → Background Removal (rembg) → Preprocessing (ImageMagick) → Vectorization (potrace/autotrace) → SVG Output
```

## Installation

### 1. System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y potrace autotrace imagemagick python3-dev
```

**macOS:**
```bash
brew install potrace autotrace imagemagick
```

**Windows:**
Use Chocolatey or MSYS2 to install the tools.

### 2. Python Dependencies

```bash
pip install rembg Pillow
```

### 3. Automatic Setup

Run the setup script (Linux/macOS only):
```bash
chmod +x backend/agents/identity/setup_vectorization.sh
./backend/agents/identity/setup_vectorization.sh
```

## API Endpoints

### 1. Main Vectorization Endpoint

**POST** `/vectorization/vectorize`

Vectorize an image from URL using the specified method.

```json
{
  "imageUrl": "https://example.com/logo.png",
  "method": "autotrace",
  "colorCount": 3,
  "threshold": "60%"
}
```

**Response:**
```json
{
  "success": true,
  "svg_content": "<svg>...</svg>",
  "data_url": "data:image/svg+xml;base64,...",
  "method": "autotrace",
  "files": {
    "no_background_png": "/path/to/no_bg_logo.png",
    "vectorized_svg": "/path/to/vectorized_logo.svg"
  },
  "metadata": {
    "original_size": 12345,
    "processed_size": 8765,
    "svg_size": 4321,
    "method_used": "autotrace",
    "parameters": {"color_count": 3}
  }
}
```

### 2. Upload Endpoints

**POST** `/vectorization/vectorize/upload/autotrace`

Upload and vectorize using autotrace (multi-color).

- **File**: Multipart file upload
- **Query Parameter**: `color_count` (1-16, default: 3)
- **Returns**: Raw SVG content

**POST** `/vectorization/vectorize/upload/potrace`

Upload and vectorize using potrace (monochrome).

- **File**: Multipart file upload  
- **Query Parameter**: `threshold` (e.g., "60%", default: "60%")
- **Returns**: Raw SVG content

### 3. Utility Endpoints

**GET** `/vectorization/health`

Check service health and dependencies.

**GET** `/vectorization/methods`

Get available methods and their parameters.

## Methods Comparison

| Method | Best For | Parameters | Output |
|--------|----------|------------|--------|
| **Autotrace** | Colorful logos, brand marks, illustrations | `color_count` (2-8 recommended) | Multi-color SVG |
| **Potrace** | Simple logos, text, monochrome designs | `threshold` (50%-75%) | Monochrome SVG |

## Usage Examples

### cURL Examples

**Autotrace (Multi-color):**
```bash
curl -X POST -F "file=@logo.png" \
  "http://localhost:8000/vectorization/vectorize/upload/autotrace?color_count=3" \
  -o result.svg
```

**Potrace (Monochrome):**
```bash
curl -X POST -F "file=@logo.png" \
  "http://localhost:8000/vectorization/vectorize/upload/potrace?threshold=60%" \
  -o result.svg
```

**URL-based Vectorization:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/logo.png",
    "method": "autotrace",
    "colorCount": 3
  }' \
  http://localhost:8000/vectorization/vectorize
```

### Python Client Example

```python
import requests

# Using the URL-based endpoint
response = requests.post(
    "http://localhost:8000/vectorization/vectorize",
    json={
        "imageUrl": "https://example.com/logo.png",
        "method": "autotrace",
        "colorCount": 3
    }
)

result = response.json()
if result["success"]:
    svg_content = result["svg_content"]
    # Save or use the SVG content
    with open("vectorized_logo.svg", "w") as f:
        f.write(svg_content)

# Using file upload
with open("logo.png", "rb") as f:
    response = requests.post(
        "http://localhost:8000/vectorization/vectorize/upload/autotrace",
        files={"file": f},
        params={"color_count": 3}
    )
    svg_content = response.text
```

### JavaScript/Frontend Example

```javascript
// URL-based vectorization
async function vectorizeLogo(imageUrl, method = 'autotrace', colorCount = 3) {
  const response = await fetch('/vectorization/vectorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      method,
      colorCount
    })
  });
  
  const result = await response.json();
  if (result.success) {
    // Use the data URL to display in frontend
    return result.data_url;
  } else {
    throw new Error(result.error);
  }
}

// File upload
async function vectorizeUpload(file, method = 'autotrace') {
  const formData = new FormData();
  formData.append('file', file);
  
  const endpoint = method === 'autotrace' 
    ? '/vectorization/vectorize/upload/autotrace?color_count=3'
    : '/vectorization/vectorize/upload/potrace?threshold=60%';
    
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });
  
  return await response.text(); // Raw SVG content
}
```

## Quality Tips

### Input Preparation
1. **Use flat colors**: Avoid gradients and shadows
2. **High resolution**: Start with high-quality images
3. **Simple designs**: Work best for vectorization

### Parameter Tuning

**For Autotrace:**
- `color_count=2-3`: Simple logos
- `color_count=4-6`: Complex brand marks
- `color_count=8+`: Detailed illustrations

**For Potrace:**
- `threshold="50%"`: More detail, potential noise
- `threshold="60%"`: Balanced (default)
- `threshold="75%"`: Cleaner, less detail

### Post-Processing
The service automatically:
- Upscales images 200% before vectorization
- Applies sharpening for cleaner edges
- Removes background using AI
- Optimizes SVG structure

## File Structure

```
backend/agents/identity/
├── vectorization_service.py      # Core vectorization logic
├── vectorization_api.py          # FastAPI endpoints
├── vectorization_requirements.txt # Python dependencies
├── setup_vectorization.sh        # System setup script
└── README_vectorization.md       # This documentation
```

## Integration with BrandOrbAI

The vectorization service is integrated with the main BrandOrbAI API:

1. **Automatic Import**: Added to main.py imports
2. **Router Integration**: Endpoints available under `/vectorization/`
3. **Health Monitoring**: Status available in main health check
4. **File Management**: Outputs saved in `agents/output/` directory

## Troubleshooting

### Common Issues

1. **"Command not found" errors**:
   - Ensure system dependencies are installed
   - Run `./setup_vectorization.sh` or install manually

2. **Poor vectorization quality**:
   - Try different threshold values for potrace
   - Adjust color_count for autotrace
   - Ensure input image has good contrast

3. **Large SVG files**:
   - Reduce color_count parameter
   - Use potrace for simpler designs
   - Pre-process input to have fewer colors

### Health Check

Check service status:
```bash
curl http://localhost:8000/vectorization/health
```

This will show which dependencies are available and provide installation guidance for missing ones.

## Performance Notes

- **Processing Time**: 2-10 seconds depending on image size and complexity
- **Memory Usage**: Moderate (background removal uses ML models)
- **Disk Space**: Output files are saved in `agents/output/`
- **Concurrent Requests**: FastAPI handles multiple requests efficiently

## License & Credits

- **rembg**: MIT License
- **potrace**: GPL License  
- **autotrace**: GPL License
- **ImageMagick**: Apache License

This is completely free and open-source. No API keys or subscriptions required!
