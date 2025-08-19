#!/bin/bash

# Setup script for vectorization service system dependencies
# Run this before using the vectorization service

echo "🔧 Setting up Self-Hosted Vectorization Service Dependencies..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (Ubuntu/Debian)
    echo "📦 Detected Linux - Installing via apt..."
    
    sudo apt update
    echo "Installing potrace..."
    sudo apt install -y potrace
    
    echo "Installing autotrace..."
    sudo apt install -y autotrace
    
    echo "Installing ImageMagick..."
    sudo apt install -y imagemagick
    
    echo "Installing Python dev dependencies..."
    sudo apt install -y python3-dev python3-pip
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📦 Detected macOS - Installing via Homebrew..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install it first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "Installing potrace..."
    brew install potrace
    
    echo "Installing autotrace..."
    brew install autotrace
    
    echo "Installing ImageMagick..."
    brew install imagemagick
    
else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "Manual installation required:"
    echo "  - potrace: https://potrace.sourceforge.net/"
    echo "  - autotrace: http://autotrace.sourceforge.net/"
    echo "  - ImageMagick: https://imagemagick.org/"
    exit 1
fi

echo ""
echo "🐍 Installing Python dependencies..."
pip install rembg Pillow

echo ""
echo "✅ Verifying installation..."

# Check each tool
tools=("potrace" "autotrace" "convert")
all_good=true

for tool in "${tools[@]}"; do
    if command -v $tool &> /dev/null; then
        version=$($tool --version 2>&1 | head -n1)
        echo "✅ $tool: $version"
    else
        echo "❌ $tool: NOT FOUND"
        all_good=false
    fi
done

# Check Python packages
echo "🐍 Checking Python packages..."
python3 -c "import rembg; print('✅ rembg:', rembg.__version__)" 2>/dev/null || echo "❌ rembg: NOT FOUND"
python3 -c "import PIL; print('✅ Pillow:', PIL.__version__)" 2>/dev/null || echo "❌ Pillow: NOT FOUND"

if $all_good; then
    echo ""
    echo "🎉 All dependencies installed successfully!"
    echo ""
    echo "🚀 You can now use the vectorization service:"
    echo "   • Start your FastAPI server"
    echo "   • Call POST /vectorization/vectorize"
    echo "   • Or use direct upload endpoints"
    echo ""
    echo "📋 Test with curl:"
    echo "   curl -X POST -F \"file=@your_logo.png\" \"http://localhost:8000/vectorization/vectorize/upload/autotrace?color_count=3\" -o result.svg"
else
    echo ""
    echo "⚠️  Some dependencies are missing. Please check the installation."
    echo "   Refer to the error messages above for details."
fi
