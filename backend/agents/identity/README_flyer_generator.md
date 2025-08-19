# 📄 Professional Flyer Generator

**AI-Powered Marketing Material Creator** • Create stunning business flyers with real text overlays, professional layouts, and multiple social media formats.

## 🌟 Features

### 🎨 **Complete Flyer Creation System**
- **Real Flyers**: Not just pictures - actual marketing materials with text, headlines, and professional layouts
- **Business Name Integration**: Your business name prominently featured on all materials
- **Marketing Copy Generation**: AI-created headlines, benefits, call-to-actions, and taglines
- **Professional Text Overlays**: Dynamic font sizing, readable text placement, and proper hierarchy

### 📱 **Multi-Format Social Media Ready**
- **Instagram Square** (1080x1080) - Perfect for Instagram posts
- **Instagram Story** (1080x1920) - Vertical format for stories
- **Facebook Post** (1200x630) - Optimized Facebook dimensions
- **Twitter Header** (1500x500) - Wide banner format
- **LinkedIn Post** (1200x627) - Professional network ready

### 🧠 **AI-Powered Content Generation**
- **Business Analysis**: Extract key information from business descriptions
- **Concept Generation**: 5 unique flyer concepts tailored to your business
- **Color Palette Creation**: Professional color schemes matching your industry
- **Slogan Generation**: Catchy, memorable business slogans
- **Marketing Copy**: Compelling headlines, benefits, and calls-to-action

### 🎯 **Professional Design Elements**
- **Dynamic Text Sizing**: Automatically adjusts for different formats
- **Semi-transparent Overlays**: Ensures text readability on all backgrounds
- **Professional Typography**: Clean fonts and proper spacing
- **Color Coordination**: Uses selected colors for accents and branding
- **Layout Optimization**: Different layouts for various social media platforms

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- OpenRouter API key (for AI text generation)
- Internet connection (for Pollinations AI image generation)

### Installation

1. **Clone or download the project**
```bash
git clone <your-repo-url>
cd LOG_FLYRS
```

2. **Install dependencies**
```bash
pip install -r requirements_flyer_generator.txt
```

3. **Configure API Key**
   - Open `flyer_generator.py`
   - Replace the API key on line 23 with your OpenRouter API key:
   ```python
   api_key="your-openrouter-api-key-here"
   ```

4. **Run the application**
```bash
streamlit run flyer_generator.py
```

5. **Open in browser**
   - Navigate to `http://localhost:8501`

## 📖 How to Use

### Step 1: Describe Your Business
- Enter detailed information about your business
- Include what you do, target customers, and unique selling points
- The more details, the better the AI-generated content

### Step 2: Choose Your Slogan
- Review AI-generated slogans
- Select the one that best represents your business
- Or skip if you prefer to use your own

### Step 3: Select Flyer Concept
- Browse 5 unique flyer concepts
- Each includes style, headlines, benefits, and visual elements
- Choose the concept that matches your vision

### Step 4: Pick Color Palette
- Select from AI-generated color palettes
- Or create custom colors
- Colors will be used throughout all flyer formats

### Step 5: Generate Professional Flyers
- Click "Generate World-Class Flyers"
- Get main flyer plus 5 social media formats
- Download individual formats or all at once

## 🎨 What You Get

### Main Flyer (1080x1350)
- Business name prominently displayed
- Marketing headline and subheadline
- Key benefits list
- Call-to-action button
- Professional layout and typography

### Social Media Versions
Each format optimized for its platform:
- **Instagram Square**: Perfect square format for posts
- **Instagram Story**: Vertical format for stories
- **Facebook Post**: Optimized dimensions for Facebook
- **Twitter Header**: Wide banner format for profiles
- **LinkedIn Post**: Professional network dimensions

## 🔧 Technical Details

### AI Models Used
- **Text Generation**: QWEN 2.5 Coder 32B (via OpenRouter)
- **Image Generation**: Pollinations AI
- **Text Overlay**: Python PIL (Pillow)

### APIs Required
- **OpenRouter API**: For AI text generation
  - Sign up at: https://openrouter.ai/
  - Models used: `qwen/qwen-2.5-coder-32b-instruct`
- **Pollinations AI**: For background image generation
  - Free service, no API key required
  - URL: https://image.pollinations.ai/

### File Structure
```
flyer_generator.py          # Main application
requirements_flyer_generator.txt  # Python dependencies
README_flyer_generator.md   # This documentation
```

## 🛠️ Customization

### Modify Text Overlay Layout
Edit the `create_flyer_with_text_overlay()` method to:
- Change font sizes and colors
- Adjust text positioning
- Modify background overlays
- Add new design elements

### Add New Social Media Formats
Modify the `social_formats` dictionary in `generate_social_media_versions()`:
```python
social_formats = {
    "Your Format": (width, height),
    # Add new formats here
}
```

### Change AI Models
Update the model in the `__init__` method:
```python
self.model = "different/model/name"
```

## 📝 Example Business Input

```
TuniCraft is an online marketplace connecting Tunisian artisans and small 
producers with global and local customers. We offer a platform to showcase 
and sell handmade crafts like ceramics, textiles, leather goods, and olive 
wood products. Our main selling point is authentic, high-quality handmade 
products directly from skilled Tunisian artisans, supporting traditional 
craftsmanship and fair trade practices.
```

## 🎯 Generated Output Example

**Business Name**: TuniCraft  
**Generated Headline**: "Discover Authentic Tunisian Craftsmanship"  
**Subheadline**: "Connect directly with skilled artisans"  
**Key Benefits**:
- ✓ Authentic handmade products
- ✓ Direct from Tunisian artisans  
- ✓ Fair trade practices
**Call-to-Action**: "Shop Authentic Crafts Today!"

## 🐛 Troubleshooting

### Common Issues

**"Module not found" errors**
- Run: `pip install -r requirements_flyer_generator.txt`

**API errors**
- Check your OpenRouter API key
- Ensure you have credits in your OpenRouter account
- Verify internet connection

**Font errors on Windows**
- Default fonts will be used if Arial is not available
- Install Arial or modify font paths in the code

**Pollinations API timeouts**
- The app includes retry logic
- Wait a moment and try again
- Check your internet connection

### Performance Tips
- Close other applications to free up memory
- Use a stable internet connection
- Generate one format at a time if experiencing issues

## 📄 License

This project is for educational and personal use. Please respect the terms of service of the APIs used:
- OpenRouter: https://openrouter.ai/terms
- Pollinations AI: https://pollinations.ai/

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all requirements are installed
3. Ensure API keys are configured correctly

## 🎉 Enjoy Creating Professional Marketing Materials!

Transform your business ideas into stunning, professional flyers ready for print and social media! 🚀
