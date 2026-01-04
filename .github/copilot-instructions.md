# BRANDYFICATION File Host - AI Coding Agent Instructions

## Project Overview

ES2024 Node.js file host for AI-generated content (audio/images) with **dual-mode TTS**: local Coqui XTTS v2 + remote VastAI instances. Supports voice cloning, prompt-based filenames, and 17 languages.

## Architecture

**TTS Strategy:**

- **Local mode** (`/local/xtts`): Node.js → Python wrapper ([local-tts.py](../server/local-tts.py)) → Coqui TTS library
- **Flux1** (`/vastai/flux1`): Image generation via VastAI

**Key data flow:**

1. HTTP request → [server.mjs](../server/server.mjs) route handlers
2. TTS generation → temp file → save to `BRANDYFICATION/AUDIOS/`
3. File registry ([registry.json](../server/registry.json)) → metadata tracking
4. Response includes: file ID, prompt-based filename, direct/download URLs

## Configuration System

**Priority:** `.env` > `config.json` > system auto-detection

Critical `.env` variables:

```bash
XTTS_MODEL_DIR=/workspace/TTS          # Local TTS (empty = auto-download)
XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3
PORT=                                   # Empty = random port 49152-65535
BASE_DIR=                               # Auto-detected if empty
```

**Auto-detection logic** (`server.mjs` ~lines 80-120):

- Random high port assignment (49152-65535 range)
- External IP from network interfaces
- Memory-based upload limits (25% RAM, max 2GB)
- CPU count influences timeout defaults

## Critical Patterns

### 1. Voice Path Resolution

`resolveVoicePath()` handles 3 formats:

- Relative: `AUDIOS/voice.mp3` → resolved to `BASE_DIR/AUDIOS/voice.mp3`
- Absolute: `/workspace/path/voice.wav` → used as-is
- Default: `"default"` → uses `CONFIG.defaults.xtts.voice`

### 2. Prompt-Based Filenames

`sanitizePrompt()` converts text → URL-safe filenames:

```javascript
"Hello, world!" → "hello-world"
// Pattern: lowercase, alphanumeric+hyphens, 64 char max
```

### 3. Python Integration

Local TTS spawns Python process with environment variables:

```javascript
execFile(
  "python3",
  [
    "local-tts.py",
    "--text",
    text,
    "--speaker_wav",
    resolvedVoice,
    "--output",
    tempOutput,
    "--json", // Returns structured JSON result
  ],
  { env, timeout }
);
```

### 4. File Registry System

In-memory Map synced to disk ([registry.json](../server/registry.json)):

- Keys: 16-char hex file IDs
- Values: metadata (prompt, voice, language, size, URLs)
- Auto-saves after each generation

## Development Workflows

### Starting the Server

```bash
cd server
./start.sh  # Auto-creates .env, checks deps, starts server
# OR directly: node server.mjs
```

### Testing Local TTS

```bash
./test-local-tts.sh  # Validates Python, TTS install, model download
```

### Adding New Endpoints

Follow pattern in [server.mjs](../server/server.mjs) ~lines 1400-1500:

1. Parse request body with `parseJsonBody(req)`
2. Validate inputs (language codes, file paths)
3. Generate content (TTS/image)
4. Save to appropriate directory (`AUDIOS/`, `IMAGES/`)
5. Update file registry
6. Return JSON with file metadata + URLs

## Language Support

XTTS v2 supports 17 languages (see [local-tts.py](../server/local-tts.py) ~line 87):

```python
valid_languages = ["en", "es", "fr", "de", "it", "pt", "pl", "tr",
                   "ru", "nl", "cs", "ar", "zh-cn", "hu", "ko", "ja", "hi"]
```

## Common Pitfalls

1. **Voice file paths**: Always use relative paths (to `BASE_DIR`) or absolute paths. Paths in requests are resolved via `resolveVoicePath()`.

2. **First local TTS run**: ~2GB model download to `~/.local/share/tts/`. Takes 5-10 minutes. Subsequent runs are 2-5s (GPU).

3. **Port conflicts**: Server auto-assigns random port if `PORT` env var is empty. Check startup logs for actual port.

4. **Registry corruption**: [registry.json](../server/registry.json) uses Map → JSON serialization. Always use `saveRegistry()` after modifications.

5. **Python environment**: Local TTS requires Python 3.8+ with Coqui TTS installed: `cd /workspace/TTS && pip install -e .`

## Key Files

- [server/server.mjs](../server/server.mjs) - Main Node.js HTTP server (1645 lines)
- [server/local-tts.py](../server/local-tts.py) - Python TTS wrapper (183 lines)
- [server/.env](../server/.env) - Configuration (see template in file)
- [server/start.sh](../server/start.sh) - Startup script with dep checks
- [BRANDYFICATION/AUDIOS/](../BRANDYFICATION/AUDIOS/) - Generated audio storage
- [BRANDYFICATION/IMAGES/](../BRANDYFICATION/IMAGES/) - Generated images storage

## Documentation

- [LOCAL-TTS-INTEGRATION.md](../server/LOCAL-TTS-INTEGRATION.md) - Architecture, API usage, troubleshooting
- [INTEGRATION-SUMMARY.md](../server/INTEGRATION-SUMMARY.md) - What changed when local TTS was added
- [QUICK-REFERENCE.md](../server/QUICK-REFERENCE.md) - Command cheat sheet

## Special Considerations

- **ES2024 modules**: Uses `import.meta.dirname`, `node:` protocol imports
- **No external dependencies**: Pure Node.js 22+ (check [package.json](../server/package.json))
- **Git branch**: Currently on `vastai-filehost` (default is `main`)
- **Multipart parsing**: Custom implementation in `parseMultipart()` - no libraries
- **CORS**: Wildcard `*` by default (see `ALLOWED_ORIGINS` in `.env`)
