#!/usr/bin/env python3
"""
Local XTTS v2 Coqui TTS wrapper for Node.js server
Provides local TTS generation using the Coqui TTS library
"""

import sys
import os
import json
import argparse
from pathlib import Path
from typing import Optional

# Add TTS to path
TTS_DIR = os.environ.get('XTTS_MODEL_DIR', '/workspace/TTS')
sys.path.insert(0, TTS_DIR)

from TTS.api import TTS


class XTTSWrapper:
    def __init__(
        self,
        model_dir: Optional[str] = None,
        checkpoint_path: Optional[str] = None,
        config_path: Optional[str] = None,
        use_gpu: bool = True
    ):
        """Initialize XTTS v2 model"""
        self.model_dir = model_dir
        self.checkpoint_path = checkpoint_path
        self.config_path = config_path
        
        # Load model
        if checkpoint_path and config_path:
            # Load from specific paths
            self.tts = TTS(
                model_path=checkpoint_path,
                config_path=config_path,
                gpu=use_gpu
            )
        elif model_dir:
            # Load from model directory
            self.tts = TTS(
                model_path=os.path.join(model_dir, "model.pth"),
                config_path=os.path.join(model_dir, "config.json"),
                gpu=use_gpu
            )
        else:
            # Download and load pretrained model
            self.tts = TTS(
                model_name="tts_models/multilingual/multi-dataset/xtts_v2",
                gpu=use_gpu
            )
    
    def generate(
        self,
        text: str,
        speaker_wav: str,
        language: str = "en",
        speed: float = 1.0,
        output_path: str = "output.wav"
    ) -> dict:
        """
        Generate TTS audio
        
        Args:
            text: Text to synthesize
            speaker_wav: Path to reference voice audio file
            language: Language code (en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh-cn, hu, ko, ja, hi)
            speed: Speech speed (0.5 to 2.0)
            output_path: Output file path
            
        Returns:
            dict with metadata about the generated audio
        """
        try:
            # Validate speaker_wav exists
            if not os.path.exists(speaker_wav):
                return {
                    "success": False,
                    "error": f"Speaker wav file not found: {speaker_wav}"
                }
            
            # Validate language
            valid_languages = [
                "en", "es", "fr", "de", "it", "pt", "pl", "tr", "ru",
                "nl", "cs", "ar", "zh-cn", "hu", "ko", "ja", "hi"
            ]
            if language not in valid_languages:
                return {
                    "success": False,
                    "error": f"Invalid language: {language}. Must be one of {valid_languages}"
                }
            
            # Generate audio
            self.tts.tts_to_file(
                text=text,
                speaker_wav=speaker_wav,
                language=language,
                speed=speed,
                file_path=output_path,
                split_sentences=True
            )
            
            # Get file info
            file_size = os.path.getsize(output_path)
            
            return {
                "success": True,
                "output_path": output_path,
                "file_size": file_size,
                "text": text,
                "speaker_wav": speaker_wav,
                "language": language,
                "speed": speed
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def main():
    parser = argparse.ArgumentParser(description="Local XTTS v2 TTS wrapper")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--speaker_wav", required=True, help="Path to reference voice audio")
    parser.add_argument("--language", default="en", help="Language code")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--model_dir", help="Model directory path")
    parser.add_argument("--checkpoint", help="Model checkpoint path")
    parser.add_argument("--config", help="Model config path")
    parser.add_argument("--no-gpu", action="store_true", help="Disable GPU")
    parser.add_argument("--json", action="store_true", help="Output JSON result")
    
    args = parser.parse_args()
    
    # Get config from environment if not provided
    model_dir = args.model_dir or os.environ.get('XTTS_MODEL_DIR')
    checkpoint = args.checkpoint or os.environ.get('XTTS_CHECKPOINT_PATH')
    config = args.config or os.environ.get('XTTS_CONFIG_PATH')
    
    try:
        # Initialize wrapper
        wrapper = XTTSWrapper(
            model_dir=model_dir,
            checkpoint_path=checkpoint,
            config_path=config,
            use_gpu=not args.no_gpu
        )
        
        # Generate audio
        result = wrapper.generate(
            text=args.text,
            speaker_wav=args.speaker_wav,
            language=args.language,
            speed=args.speed,
            output_path=args.output
        )
        
        if args.json:
            print(json.dumps(result))
        else:
            if result["success"]:
                print(f"✅ Generated: {result['output_path']} ({result['file_size']} bytes)")
            else:
                print(f"❌ Error: {result['error']}", file=sys.stderr)
                sys.exit(1)
                
    except Exception as e:
        if args.json:
            print(json.dumps({"success": False, "error": str(e)}))
        else:
            print(f"❌ Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
