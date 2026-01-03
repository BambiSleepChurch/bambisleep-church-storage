# BRANDYFICATION File Host

ES2024 File Host for XTTS v2 Coqui & Flux1 with **local TTS support** and VastAI integration.

## Features

- **Local TTS Generation**: Use local Coqui TTS (XTTSv2) installation for text-to-speech
- **VastAI Integration**: Fallback to remote VastAI instances for TTS and image generation
- **Prompt-based naming**: Generated files use sanitized prompt text in filenames
- **Multiple formats**: MP3, WAV audio output with voice cloning
- **RESTful API**: Simple JSON endpoints for generation and file management

## Configuration

Configuration is loaded with priority: **Environment Variables > config.json > System Defaults**

### Option 1: Environment Variables (.env file recommended)

```bash
# Server
PORT=8080
HOST=0.0.0.0
PUBLIC_URL=https://your-domain.com
BASE_DIR=/path/to/BRANDYFICATION

# Limits
MAX_UPLOAD_SIZE=536870912
MAX_FILENAME_LENGTH=64

# Local Coqui TTS (XTTSv2) Configuration
XTTS_MODEL_DIR=/workspace/TTS
XTTS_CHECKPOINT_PATH=/workspace/TTS/models/xtts_v2/model.pth
XTTS_CONFIG_PATH=/workspace/TTS/models/xtts_v2/config.json
XTTS_VOCAB_PATH=/workspace/TTS/models/xtts_v2/vocab.json

# XTTS Inference Parameters
XTTS_TEMPERATURE=0.85
XTTS_LENGTH_PENALTY=1.0
XTTS_REPETITION_PENALTY=2.0
XTTS_TOP_K=50
XTTS_TOP_P=0.85

# VastAI Endpoints (optional fallback)
VASTAI_XTTS_URL=http://vastai-ip:5000
VASTAI_FLUX1_URL=http://vastai-ip:7860
VASTAI_TIMEOUT=120000

# Directories
DIR_AUDIO=AUDIOS
DIR_IMAGE=IMAGES
DIR_VIDEO=VIDEOS

# XTTS Defaults
XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3
XTTS_DEFAULT_LANGUAGE=en
XTTS_DEFAULT_SPEED=1.0
XTTS_OUTPUT_FORMAT=mp3

# Flux1 Defaults
FLUX1_DEFAULT_WIDTH=1024
FLUX1_DEFAULT_HEIGHT=1024
FLUX1_DEFAULT_STEPS=4
```

### Local TTS Setup

To use local Coqui TTS instead of VastAI:

1. **Install Coqui TTS** (if not already installed):

```bash
cd /workspace/TTS
pip install -e .
```

2. **Set environment variables** in `.env`:

```bash
XTTS_MODEL_DIR=/workspace/TTS
```

3. **The Python wrapper** (`local-tts.py`) will:

   - Auto-download XTTS v2 model on first use (if not found locally)
   - Use GPU if available for faster generation
   - Support all 17 languages (en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh-cn, hu, ko, ja, hi)

4. **Voice cloning**: Place reference audio in `AUDIOS/` directory

### Option 2: Config File

Copy `config.example.json` to `config.json`:

```bash
cp config.example.json config.json
```

Edit values as needed. The server auto-detects and loads `config.json` on startup.

### System Auto-Detection

The server automatically detects:

- **External IP** - First non-internal IPv4 address
- **Memory** - Total system RAM (used for upload limit defaults)
- **CPUs** - Core count (used for timeout defaults)
- **Hostname** - System hostname
- **Platform** - OS platform

## Quick Start

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 2. (Optional) Install Coqui TTS for local generation
cd /workspace/TTS && pip install -e .

# 3. Start server
cd /workspace/bambisleep-church-storage/BRANDYFICATION/server
node server.mjs

# Or with explicit config
XTTS_MODEL_DIR=/workspace/TTS node server.mjs
```

## API Endpoints

### Generation

#### Local TTS (Coqui XTTSv2)

```bash
# Generate TTS using local installation
curl -X POST http://localhost:8080/local/xtts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world, this is a test",
    "voice": "AUDIOS/Bambi-DASIT.mp3",
    "language": "en",
    "speed": 1.0,
    "format": "mp3"
  }'
```

#### VastAI TTS (Remote)

```bash
# Generate TTS via VastAI
curl -X POST http://localhost:8080/vastai/xtts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

#### VastAI Image Generation

curl -X POST http://localhost:8080/vastai/flux1 \
 -H "Content-Type: application/json" \
 -d '{"prompt": "A pink spiral"}'

````

### Info

```bash
# View config
curl http://localhost:8080/config

# Health + system info
curl http://localhost:8080/health

# VastAI status
curl http://localhost:8080/vastai/status
````

### Files

```bash
# List files
curl http://localhost:8080/api/files

# Serve file
curl http://localhost:8080/files/{id}/{filename}
```

## Directory Structure

```
BRANDYFICATION/
├── AUDIOS/              # Generated audio
├── IMAGES/              # Generated images
├── VIDEOS/              # Videos
└── server/
    ├── server.mjs       # Main server
    ├── config.json      # Your config (create from example)
    ├── config.example.json
    ├── registry.json    # File metadata (auto-created)
    └── README.md
```
