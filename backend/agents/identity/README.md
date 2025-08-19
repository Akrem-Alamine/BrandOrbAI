# 🎨 AI-Powered Logo & Flyer Generator

A comprehensive design suite that uses artificial intelligence to create stunning logos and marketing flyers for your business. Built with Streamlit for UI, FastAPI for REST endpoints, OpenAI's QWEN model for content generation, and Pollinations API for high-quality image creation.

## ✨ Features

### 🚀 Logo Generator
- **AI-Driven Design**: Uses QWEN 2.5 Coder model for intelligent prompt generation
- **Multiple Logo Variations**: Generate multiple logo designs from different style descriptions
- **Dynamic Color Palettes**: AI-generated color schemes tailored to your business
- **Professional Quality**: High-resolution (1024x1024) logo generation via Pollinations API
- **3D Logo Generation**: Convert any logo into stunning 3D versions with realistic lighting
- **Multiple Export Formats**: Download logos as JPG, PNG or SVG
- **REST API**: Full RESTful API with comprehensive endpoints for integration

### 📄 Flyer Generator
- **Professional Marketing Materials**: Create world-class promotional flyers
- **Multi-Format Output**: Generate flyers for all major social media platforms
- **AI-Powered Copywriting**: Intelligent headline, slogan, and marketing copy generation
- **Business Analysis**: AI analyzes your business to suggest appropriate designs
- **Color Intelligence**: Smart color palette generation based on your industry
- **Text Overlay Technology**: Automatically adds professional text layouts to designs
- **Social Media Ready**: Instagram, Facebook, Twitter, LinkedIn formats included
- **Complete Campaigns**: Generate entire marketing campaigns with one click

### 🌐 Dual Interface
- **Web UI**: User-friendly Streamlit interfaces for both logo and flyer generation
- **REST APIs**: Programmatic access for developers and integrations
- **Comprehensive Documentation**: Full API documentation with examples

### 🎯 Intelligent Features
- **Business Analysis**: AI analyzes your business description to suggest appropriate styles
- **Color Intelligence**: Converts hex colors to descriptive names for better AI understanding
- **Design Consistency**: Maintains design elements when creating 3D versions
- **Style Suggestions**: AI-powered recommendations for logo styles and keywords
- **Real-time Preview**: Instant logo generation and selection

### 🔧 User Experience
- **4-Step Workflow**: Simple, guided process from business description to final logo
- **Interactive Selection**: Visual logo gallery with easy selection
- **Live Modifications**: Quick style changes and regeneration
- **Progress Tracking**: Real-time generation progress with visual feedback

## 🛠️ Technology Stack

- **Frontend UI**: Streamlit (Logo & Flyer web interfaces)
- **Backend APIs**: FastAPI (REST endpoints for both services)
- **AI Model**: QWEN 2.5 Coder (32B) via OpenRouter API
- **Image Generation**: Pollinations AI with Flux model
- **Image Processing**: Pillow (PIL) for text overlays and format conversion
- **HTTP Requests**: Requests library for API communications
- **API Documentation**: Swagger UI / ReDoc for interactive docs
- **Language**: Python 3.7+

## 📋 Prerequisites

- Python 3.7 or higher
- OpenRouter API key (for QWEN model access)
- Internet connection (for AI services)

## 🚀 Quick Start

### Option 1: Run Setup Script (Recommended)
```bash
# Windows
.\setup_and_run.bat

# Or with PowerShell
.\setup_and_run.ps1
```

### Option 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-logo-flyer-generator.git
   cd ai-logo-flyer-generator
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up API key**
   
   Update the OpenRouter API key in both `main.py`, `api.py`, and `flyer_generator.py`, `flyer_api.py`:
   ```python
   api_key="your-openrouter-api-key-here"
   ```

4. **Run the services**
   
   **All services (recommended):**
   ```bash
   python run_all_services.py
   ```
   
   **Logo services only:**
   ```bash
   python run_services.py
   ```
   
   **Flyer services only:**
   ```bash
   # Start API in background
   python run_flyer_api.py &
   # Start UI
   python run_flyer_streamlit.py
   ```
   
   **Individual services:**
   ```bash
   # Logo UI only
   python run_streamlit.py
   
   # Logo API only  
   python run_api.py
   
   # Flyer UI only
   python run_flyer_streamlit.py
   
   # Flyer API only
   python run_flyer_api.py
   ```

5. **Access the applications**
   
   - **Logo UI**: `http://localhost:8501`
   - **Logo API**: `http://localhost:8000`
   - **Logo API Docs**: `http://localhost:8000/docs`
   - **Flyer UI**: `http://localhost:8502`
   - **Flyer API**: `http://localhost:8001`
   - **Flyer API Docs**: `http://localhost:8001/flyer-docs`

## 🌐 API Endpoints

### Logo Generator API (Port 8000)
- `POST /api/v1/color-palettes` - Generate color palettes
- `POST /api/v1/suggestions` - Get design suggestions  
- `POST /api/v1/generate-logo` - Generate single logo
- `POST /api/v1/generate-3d-logo` - Generate 3D logo
- `POST /api/v1/batch-generate` - Generate multiple logos
- `GET /api/v1/logo/{logo_id}` - Get logo details
- `GET /api/v1/download/{logo_id}` - Download logo

### Flyer Generator API (Port 8001)
- `POST /api/v1/analyze-business` - Analyze business idea
- `POST /api/v1/generate-concepts` - Generate flyer concepts
- `POST /api/v1/generate-slogans` - Generate business slogans
- `POST /api/v1/generate-colors` - Generate color palettes
- `POST /api/v1/generate-copy` - Generate marketing copy
- `POST /api/v1/generate-flyer` - Generate single flyer
- `POST /api/v1/generate-social-media` - Generate social media formats
- `POST /api/v1/generate-complete-campaign` - Generate complete campaign
- `GET /api/v1/flyer/{flyer_id}` - Get flyer details
- `GET /api/v1/download-flyer/{flyer_id}` - Download flyer

For detailed API documentation:
- **Logo API**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Flyer API**: [FLYER_API_DOCUMENTATION.md](FLYER_API_DOCUMENTATION.md)

## 🔧 API Usage Examples

### Python Client Example
```python
import requests

# Generate color palettes
response = requests.post("http://localhost:8000/api/v1/color-palettes", 
                        json={"description": "Tech startup"})
palettes = response.json()

# Generate logo
logo_request = {
    "business_description": "Modern AI tech company",
    "logo_description": "minimalist and professional",
    "colors": ["#2563eb", "#1f2937", "#f8fafc"]
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

### JavaScript/Node.js Example
```javascript
// Generate logo
const response = await fetch("http://localhost:8000/api/v1/generate-logo", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    business_description: "Modern AI tech company",
    logo_description: "minimalist and professional", 
    colors: ["#2563eb", "#1f2937", "#f8fafc"]
  })
});
const logo = await response.json();
console.log("Generated logo:", logo.logo_id);
```

### cURL Example
```bash
# Generate logo
curl -X POST "http://localhost:8000/api/v1/generate-logo" \
     -H "Content-Type: application/json" \
     -d '{
       "business_description": "Modern AI tech company",
       "logo_description": "minimalist and professional",
       "colors": ["#2563eb", "#1f2937", "#f8fafc"]
     }'

# Download logo
curl -O "http://localhost:8000/api/v1/download/{logo_id}?format=png"
```

## 📱 Usage Guide

### Step 1: Business Description
- Enter a detailed description of your business
- Include industry, target audience, and business goals
- Example: "A modern tech startup focusing on AI-powered solutions for small businesses"

### Step 2: Logo Style Selection
- Choose from AI-generated style suggestions
- Add custom style descriptions
- Mix and match different design approaches
- Examples: "modern minimalist", "bold geometric", "elegant sophisticated"

### Step 3: Color Palette
- Select from AI-generated color palettes
- Each palette is tailored to your business type
- Preview colors with visual swatches
- Colors are automatically analyzed and converted for optimal AI understanding

### Step 4: Generation & Download
- Generate multiple logo variations simultaneously
- Preview all logos in a visual gallery
- Select your favorite design
- Generate 3D versions with realistic lighting
- Download in JPG or SVG formats

## 🎨 Features in Detail

### AI-Powered Prompt Generation
The system uses QWEN 2.5 Coder to create sophisticated prompts that include:
- Business context analysis
- Color palette integration
- Style requirement specification
- Professional design guidelines

### Dynamic Color Processing
- Converts hex codes to descriptive color names
- Ensures color consistency across generations
- Maintains brand color integrity in 3D versions

### 3D Logo Conversion
- Analyzes original logo design elements
- Preserves composition and style
- Adds realistic depth, shadows, and lighting
- Maintains exact color palette from original

### Smart Business Name Extraction
- AI extracts or generates appropriate business names
- Ensures logo-friendly naming conventions
- Integrates seamlessly into logo designs

## 🔧 Configuration

### API Settings
- **Model**: qwen/qwen-2.5-coder-32b-instruct
- **Image Resolution**: 1024x1024 pixels
- **Image Model**: Flux (via Pollinations)
- **Temperature**: Optimized for consistency (0.1-0.4)

### Generation Parameters
- **Logo Quality**: High-resolution, professional grade
- **Color Accuracy**: Enhanced color matching and enforcement
- **3D Rendering**: Realistic materials and lighting
- **Background**: Clean white/transparent

## 📁 Project Structure

```
ai-logo-flyer-generator/
│
├── main.py                    # Logo Generator Streamlit UI
├── api.py                     # Logo Generator FastAPI server
├── flyer_generator.py         # Flyer Generator Streamlit UI
├── flyer_api.py              # Flyer Generator FastAPI server
├── requirements.txt           # Python dependencies
├── README.md                  # Project documentation
├── API_DOCUMENTATION.md       # Logo API documentation
├── FLYER_API_DOCUMENTATION.md # Flyer API documentation
│
├── run_all_services.py        # Run all services (comprehensive)
├── run_services.py            # Run logo services only
├── run_streamlit.py           # Run logo UI only
├── run_api.py                 # Run logo API only
├── run_flyer_streamlit.py     # Run flyer UI only
├── run_flyer_api.py           # Run flyer API only
│
├── api_client_example.py      # Logo API usage examples
├── flyer_api_client_example.py # Flyer API usage examples
│
├── setup_and_run.bat          # Windows batch setup script
├── setup_and_run.ps1          # PowerShell setup script
│
└── Generated Content/         # (Created automatically)
    ├── Logos/
    │   ├── JPG exports
    │   ├── PNG exports
    │   ├── SVG exports
    │   └── 3D versions
    └── Flyers/
        ├── Main flyers
        ├── Instagram formats
        ├── Facebook formats
        ├── Twitter formats
        └── LinkedIn formats
```

## 🎯 Use Cases

### Business Types
- **Tech Startups**: Modern, innovative designs
- **Professional Services**: Clean, trustworthy aesthetics
- **Creative Agencies**: Bold, artistic expressions
- **E-commerce**: Friendly, approachable designs
- **Healthcare**: Calm, professional imagery

### Logo Applications
- Website headers and favicons
- Business cards and letterheads
- Social media profiles
- Marketing materials
- Product packaging
- Mobile app icons

## 🔧 Customization

### Adding New Styles
Modify the `generate_suggested_keywords()` function to include additional style categories:
```python
"suggested_styles": [
    "your custom style",
    "another style option"
]
```

### Color Palette Modifications
Adjust the color palette generation in `generate_color_palette()` to suit specific industries or preferences.

### 3D Effects
Customize 3D rendering parameters in `generate_3d_logo()` for different visual effects and lighting conditions.

## 🚨 Important Notes

### API Usage
- Requires active OpenRouter API key
- Pollinations API is free but has rate limits
- Monitor API usage for cost management

### Performance
- Generation time depends on API response times
- Multiple logo generation may take 30-60 seconds
- 3D conversion adds additional processing time

### Quality Factors
- Business description detail affects logo relevance
- Style description specificity improves results
- Color palette selection impacts final appearance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- **OpenRouter** for QWEN model access
- **Pollinations AI** for high-quality image generation
- **Streamlit** for the intuitive web framework
- **OpenAI** for the API infrastructure

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

 ## 🔮 Future Enhancements

- [ ] Vector logo generation (true SVG)
- [ ] Animation and motion graphics
- [ ] Brand kit generation (multiple formats)
- [ ] Advanced 3D customization
- [ ] Batch processing capabilities
- [ ] Integration with design tools
- [ ] Custom font integration
- [ ] Logo usage guidelines generation

---

 ## - Transform your business vision into stunning visual identity.
