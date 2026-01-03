# XTTS v2 Coqui TTS Integration

This server now supports **local TTS generation** using the Coqui TTS library, in addition to VastAI remote instances.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Server (server.mjs)              │
│                                                             │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │  Local TTS       │           │  VastAI TTS      │       │
│  │  /local/xtts     │           │  /vastai/xtts    │       │
│  └────────┬─────────┘           └────────┬─────────┘       │
│           │                              │                 │
│           ▼                              ▼                 │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │ local-tts.py     │           │ HTTP Fetch       │       │
│  │ Python Wrapper   │           │ to VastAI        │       │
│  └────────┬─────────┘           └──────────────────┘       │
└───────────┼──────────────────────────────────────────────┐
            │                                                │
            ▼                                                │
   ┌────────────────────┐                                    │
   │  Coqui TTS API     │                                    │
   │  /workspace/TTS    │                                    │
   └────────────────────┘                                    │
            │                                                │
            ▼                                                │
   ┌────────────────────┐                                    │
   │  XTTS v2 Model     │                                    │
   │  (Auto-download)   │                                    │
   └────────────────────┘                                    │
```

## Files

- **`server.mjs`** - Main Node.js server with local TTS integration
- **`local-tts.py`** - Python wrapper for Coqui TTS API
- **`.env`** - Configuration file with TTS settings
- **`test-local-tts.sh`** - Test script for local TTS setup

## Configuration

All TTS parameters are loaded from the `.env` file:

### Model Paths

```bash
XTTS_MODEL_DIR=/workspace/TTS              # Coqui TTS installation
XTTS_CHECKPOINT_PATH=...                   # Optional: specific model checkpoint
XTTS_CONFIG_PATH=...                       # Optional: specific config
XTTS_VOCAB_PATH=...                        # Optional: specific vocab file
```

If `XTTS_MODEL_DIR` is not set, the model will be auto-downloaded on first use.

### Inference Parameters

```bash
XTTS_TEMPERATURE=0.85          # Creativity vs stability (0.0-1.0)
XTTS_LENGTH_PENALTY=1.0        # Sequence length control
XTTS_REPETITION_PENALTY=2.0    # Prevent repetitions
XTTS_TOP_K=50                  # Top-K sampling
XTTS_TOP_P=0.85                # Nucleus sampling
```

### Generation Defaults

```bash
XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3  # Reference voice file
XTTS_DEFAULT_LANGUAGE=en                    # Default language
XTTS_DEFAULT_SPEED=1.0                      # Speech speed (0.5-2.0)
XTTS_OUTPUT_FORMAT=mp3                      # Output format (mp3/wav)
```

## API Usage

### Local TTS Generation

**Endpoint:** `POST /local/xtts`

**Request:**

```json
{
  "text": "Hello, this is a test of text to speech",
  "voice": "AUDIOS/Bambi-DASIT.mp3", // Optional: voice reference
  "language": "en", // Optional: language code
  "speed": 1.0, // Optional: speech speed
  "format": "mp3" // Optional: mp3 or wav
}
```

**Response:**

```json
{
  "success": true,
  "file": {
    "id": "a1b2c3d4e5f6g7h8",
    "filename": "local-xtts-hello-this-is-bambi-dasit-2026-01-03T12-34-56.mp3",
    "url": "http://localhost:8080/files/a1b2c3d4/local-xtts-hello-this-is-...",
    "directUrl": "http://localhost:8080/AUDIOS/local-xtts-hello-this-is-...",
    "downloadUrl": "http://localhost:8080/download/a1b2c3d4",
    "metadata": {
      "id": "a1b2c3d4e5f6g7h8",
      "type": "audio",
      "source": "local-xtts-coqui",
      "prompt": "Hello, this is a test of text to speech",
      "voice": "Bambi-DASIT",
      "language": "en",
      "speed": 1.0,
      "format": "mp3",
      "size": 245632
    }
  }
}
```

### Supported Languages

XTTSv2 supports 17 languages:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `pl` - Polish
- `tr` - Turkish
- `ru` - Russian
- `nl` - Dutch
- `cs` - Czech
- `ar` - Arabic
- `zh-cn` - Chinese (Simplified)
- `hu` - Hungarian
- `ko` - Korean
- `ja` - Japanese
- `hi` - Hindi

## Voice Cloning

XTTS v2 supports zero-shot voice cloning. Provide a reference audio file (6-30 seconds recommended):

```bash
curl -X POST http://localhost:8080/local/xtts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This will sound like the reference voice",
    "voice": "AUDIOS/my-custom-voice.wav",
    "language": "en"
  }'
```

**Voice file requirements:**

- Format: WAV, MP3, FLAC, or OGG
- Length: 6-30 seconds (optimal)
- Quality: Clean audio, minimal background noise
- Content: Natural speech in target language

## Testing

Run the test script to verify local TTS setup:

```bash
cd /workspace/bambisleep-church-storage/BRANDYFICATION/server
./test-local-tts.sh
```

This will:

1. Check Python and TTS installation
2. Download XTTS v2 model (if needed)
3. Generate test audio file
4. Verify output

## Performance

### Local TTS

- **First run**: ~5-10 minutes (model download ~2GB)
- **Subsequent runs**: ~2-5 seconds per sentence (GPU)
- **CPU-only**: ~10-30 seconds per sentence

### GPU Acceleration

The Python wrapper automatically uses GPU if available (CUDA). To force CPU:

```bash
# In local-tts.py, add --no-gpu flag
python3 local-tts.py --text "..." --speaker_wav "..." --output "..." --no-gpu
```

## Troubleshooting

### "Local TTS not available"

- Ensure `local-tts.py` exists in server directory
- Install Coqui TTS: `cd /workspace/TTS && pip install -e .`

### "Speaker wav file not found"

- Check voice file path is correct
- Use absolute path or path relative to BASE_DIR
- Verify file exists: `ls -la /workspace/bambisleep-church-storage/AUDIOS/`

### "Invalid language"

- Check language code is one of the 17 supported
- Use lowercase language codes (e.g., `en` not `EN`)

### Model download fails

- Check internet connection
- Ensure sufficient disk space (~2GB)
- Model downloads to `~/.local/share/tts/`

### Out of memory

- Reduce batch size in config
- Use CPU instead of GPU
- Split long text into shorter segments

## Comparison: Local vs VastAI

| Feature       | Local TTS                 | VastAI TTS             |
| ------------- | ------------------------- | ---------------------- |
| Setup         | Install Python + TTS      | Configure endpoint URL |
| First run     | Model download (~2GB)     | Instant                |
| Latency       | 2-5s (GPU)                | Network dependent      |
| Cost          | Free (uses local GPU/CPU) | VastAI instance cost   |
| Offline       | ✓ Works offline           | ✗ Requires internet    |
| Customization | Full model control        | Limited to endpoint    |

## Next Steps

1. **Install TTS** (if not already):

   ```bash
   cd /workspace/TTS
   pip install -e .
   ```

2. **Configure `.env`**:

   ```bash
   XTTS_MODEL_DIR=/workspace/TTS
   XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3
   ```

3. **Test local TTS**:

   ```bash
   ./test-local-tts.sh
   ```

4. **Start server**:

   ```bash
   node server.mjs
   ```

5. **Generate audio**:
   ```bash
   curl -X POST http://localhost:8080/local/xtts \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world", "language": "en"}'
   ```
