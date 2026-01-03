# BRANDYFICATION File Host

ES2024 File Host for XTTS v2 Coqui & Flux1 with VastAI integration.

## Configuration

Configuration is loaded with priority: **Environment Variables > config.json > System Defaults**

### Option 1: Environment Variables

```bash
# Server
PORT=8080
HOST=0.0.0.0
PUBLIC_URL=https://your-domain.com
BASE_DIR=/path/to/BRANDYFICATION

# Limits
MAX_UPLOAD_SIZE=536870912
MAX_FILENAME_LENGTH=64

# VastAI Endpoints
VASTAI_XTTS_URL=http://vastai-ip:5000
VASTAI_FLUX1_URL=http://vastai-ip:7860
VASTAI_TIMEOUT=120000

# Directories
DIR_AUDIO=AUDIOS
DIR_IMAGE=IMAGES
DIR_VIDEO=VIDEOS

# XTTS Defaults
XTTS_DEFAULT_VOICE=default
XTTS_DEFAULT_LANGUAGE=en
XTTS_DEFAULT_SPEED=1.0

# Flux1 Defaults
FLUX1_DEFAULT_WIDTH=1024
FLUX1_DEFAULT_HEIGHT=1024
FLUX1_DEFAULT_STEPS=4
```

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
# With environment variables
VASTAI_XTTS_URL=http://1.2.3.4:5000 VASTAI_FLUX1_URL=http://1.2.3.4:7860 node server.mjs

# Or with config file
cp config.example.json config.json
# Edit config.json
node server.mjs
```

## API Endpoints

### Generation (VastAI)

```bash
# Generate TTS
curl -X POST http://localhost:8080/vastai/xtts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'

# Generate Image
curl -X POST http://localhost:8080/vastai/flux1 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A pink spiral"}'
```

### Info

```bash
# View config
curl http://localhost:8080/config

# Health + system info
curl http://localhost:8080/health

# VastAI status
curl http://localhost:8080/vastai/status
```

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
