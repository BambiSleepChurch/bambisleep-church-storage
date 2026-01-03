#!/bin/bash
# Start BRANDYFICATION server with Coqui TTS integration

set -e

echo "🚀 BRANDYFICATION Server Startup"
echo "================================="

# Change to server directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'EOF'
# BRANDYFICATION Server Configuration

# Server Settings
PORT=
HOST=0.0.0.0
PUBLIC_URL=
BASE_DIR=

# VastAI Endpoints (optional)
VASTAI_XTTS_URL=
VASTAI_FLUX1_URL=
VASTAI_TIMEOUT=180000

# Upload & File Limits
MAX_UPLOAD_SIZE=536870912
MAX_FILENAME_LENGTH=64

# Directory Names
DIR_AUDIO=AUDIOS
DIR_IMAGE=IMAGES
DIR_VIDEO=VIDEOS

# Local Coqui TTS Configuration
XTTS_MODEL_DIR=/workspace/TTS
XTTS_CHECKPOINT_PATH=
XTTS_CONFIG_PATH=
XTTS_VOCAB_PATH=

# XTTS Inference Parameters
XTTS_TEMPERATURE=0.85
XTTS_LENGTH_PENALTY=1.0
XTTS_REPETITION_PENALTY=2.0
XTTS_TOP_K=50
XTTS_TOP_P=0.85
XTTS_GPT_COND_LEN=12
XTTS_GPT_COND_CHUNK_LEN=4
XTTS_MAX_REF_LEN=10
XTTS_SOUND_NORM_REFS=false

# XTTS Defaults
XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3
XTTS_DEFAULT_LANGUAGE=en
XTTS_DEFAULT_SPEED=1.0
XTTS_OUTPUT_FORMAT=mp3

# Flux1 Defaults
FLUX1_DEFAULT_WIDTH=1024
FLUX1_DEFAULT_HEIGHT=1024
FLUX1_DEFAULT_STEPS=4

# CORS
ALLOWED_ORIGINS=*
EOF
    echo "✓ Created .env file. Please edit it with your settings."
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 22+."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Recommended: 22+"
fi

echo "✓ Node.js $(node --version)"

# Check Python
if command -v python3 &> /dev/null; then
    echo "✓ Python $(python3 --version)"
    
    # Check TTS installation
    if python3 -c "import TTS" 2>/dev/null; then
        echo "✓ Coqui TTS installed (local TTS available)"
    else
        echo "⚠️  Coqui TTS not installed (local TTS unavailable)"
        echo "   To install: cd /workspace/TTS && pip install -e ."
    fi
else
    echo "⚠️  Python3 not found (local TTS unavailable)"
fi

# Check if local-tts.py exists
if [ -f "local-tts.py" ]; then
    echo "✓ local-tts.py wrapper found"
else
    echo "❌ local-tts.py not found"
fi

# Create content directories
echo ""
echo "📁 Setting up content directories..."
mkdir -p ../AUDIOS ../IMAGES ../VIDEOS
echo "✓ Created: AUDIOS, IMAGES, VIDEOS"

# Show configuration
echo ""
echo "⚙️  Configuration:"
if [ -n "$XTTS_MODEL_DIR" ]; then
    echo "   XTTS Model: $XTTS_MODEL_DIR"
else
    echo "   XTTS Model: Not set (will use defaults)"
fi

if [ -n "$VASTAI_XTTS_URL" ]; then
    echo "   VastAI XTTS: $VASTAI_XTTS_URL"
else
    echo "   VastAI XTTS: Not configured"
fi

# Start server
echo ""
echo "🚀 Starting server..."
echo ""

exec node server.mjs
