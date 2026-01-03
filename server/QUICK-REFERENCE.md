# Quick Reference: BRANDYFICATION + Coqui TTS

## 🚀 Quick Start

```bash
cd /workspace/bambisleep-church-storage/BRANDYFICATION/server
./start.sh
```

## 📡 Endpoints

### Local TTS (Coqui)

```bash
POST /local/xtts
```

```json
{
  "text": "Your text here",
  "voice": "AUDIOS/Bambi-DASIT.mp3",
  "language": "en",
  "speed": 1.0,
  "format": "mp3"
}
```

### VastAI TTS (Remote)

```bash
POST /vastai/xtts
```

```json
{
  "text": "Your text here",
  "language": "en"
}
```

### Check Status

```bash
GET /health
```

## 🎵 Generate Audio

```bash
# Local TTS
curl -X POST http://localhost:PORT/local/xtts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'

# VastAI TTS
curl -X POST http://localhost:PORT/vastai/xtts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'
```

## 🌍 Supported Languages

```
en (English)    es (Spanish)     fr (French)      de (German)
it (Italian)    pt (Portuguese)  pl (Polish)      tr (Turkish)
ru (Russian)    nl (Dutch)       cs (Czech)       ar (Arabic)
zh-cn (Chinese) hu (Hungarian)   ko (Korean)      ja (Japanese)
hi (Hindi)
```

## ⚙️ Configuration

Edit `.env`:

```bash
XTTS_MODEL_DIR=/workspace/TTS
XTTS_DEFAULT_VOICE=AUDIOS/Bambi-DASIT.mp3
XTTS_DEFAULT_LANGUAGE=en
XTTS_TEMPERATURE=0.85
```

## 🎤 Voice Cloning

1. Add reference audio to `AUDIOS/` directory (6-30 seconds)
2. Use in request:

```json
{
  "text": "Text to speak",
  "voice": "AUDIOS/my-voice.wav",
  "language": "en"
}
```

## 🧪 Testing

```bash
# Test local TTS setup
./test-local-tts.sh

# Test API
curl http://localhost:PORT/health
```

## 📁 File Structure

```
server/
├── .env                    # Configuration
├── server.mjs              # Main server
├── local-tts.py           # Python TTS wrapper
├── start.sh               # Startup script
├── test-local-tts.sh      # Test script
└── README.md              # Documentation
```

## 🔧 Troubleshooting

### Local TTS not available

```bash
cd /workspace/TTS
pip install -e .
```

### Model download fails

- Check internet connection
- Ensure ~2GB disk space available

### Voice file not found

```bash
# Check path
ls -la ../AUDIOS/

# Use absolute path
"voice": "/workspace/bambisleep-church-storage/AUDIOS/file.wav"
```

## 📚 Documentation

- **Full Integration Guide**: `LOCAL-TTS-INTEGRATION.md`
- **Integration Summary**: `INTEGRATION-SUMMARY.md`
- **Server README**: `README.md`

## 💡 Tips

1. **GPU vs CPU**: GPU is 5-10x faster
2. **Voice Quality**: Use clean 6-30s reference audio
3. **Languages**: Match voice and text language for best results
4. **Speed**: Adjust between 0.5 (slow) to 2.0 (fast)
5. **Format**: MP3 for smaller files, WAV for quality

## 🎯 Common Tasks

### Generate TTS with custom voice

```bash
curl -X POST http://localhost:PORT/local/xtts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Custom voice test",
    "voice": "AUDIOS/custom.wav",
    "language": "en"
  }'
```

### List all generated files

```bash
curl http://localhost:PORT/api/files
```

### Download generated file

```bash
curl http://localhost:PORT/download/{file_id} -o output.mp3
```

### Check TTS status

```bash
curl http://localhost:PORT/health | jq '.tts'
```

## 🚀 Performance

| Mode        | Speed   | Cost | Offline |
| ----------- | ------- | ---- | ------- |
| Local (GPU) | 2-5s    | Free | ✓       |
| Local (CPU) | 10-30s  | Free | ✓       |
| VastAI      | Network | $$   | ✗       |

---

**Integration Complete!** 🎉

Start server: `./start.sh`  
Generate audio: `POST /local/xtts`  
Get help: Read `LOCAL-TTS-INTEGRATION.md`
