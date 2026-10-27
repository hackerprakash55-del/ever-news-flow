"""Reject absent, near-silent or truncated narration before YouTube upload."""
import json
import re
import subprocess
import sys


def validate_audio(path):
    probe = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path
    ]))
    audio = [s for s in probe["streams"] if s.get("codec_type") == "audio"]
    if not audio or float(audio[0].get("duration", probe["format"].get("duration", 0))) < 1:
        raise ValueError("Missing or truncated narration; upload stopped.")
    analysis = subprocess.run([
        "ffmpeg", "-hide_banner", "-i", path, "-vn", "-af", "volumedetect", "-f", "null", "-"
    ], capture_output=True, text=True, check=True).stderr
    match = re.search(r"mean_volume:\s*(-?[\d.]+|-inf) dB", analysis)
    if not match or float(match.group(1)) < -50:
        raise ValueError("Silent narration; upload stopped.")
    print("Narration verified:", match.group(1), "dB")


if __name__ == "__main__":
    validate_audio(sys.argv[1])