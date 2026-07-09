# scripts/prep_heroes.py — hero showcase asset prep
# Modeled on prep_spiderman.py: trim transparent padding, emit manifest.json.
# Also records which original edges the content touched ("bleeds"), so the
# showcase knows which side a character is designed to run off-frame.
from PIL import Image
from pathlib import Path
import json

SRC = Path("raw-assets/heroes")
OUT = Path("public/heroes")
OUT.mkdir(parents=True, exist_ok=True)

FILES = [
    "spider_man.png", "superman.png", "batman.png", "ironman.png",
    "logo-spiderman.png", "logo-superman.png", "logo-batman.png", "logo-ironman.png",
]

manifest = {}
for name in FILES:
    im = Image.open(SRC / name).convert("RGBA")
    alpha = im.split()[3]
    bbox = alpha.point(lambda p: 255 if p > 10 else 0).getbbox()
    l, t, r, b = bbox
    bleeds = {
        "left": l == 0,
        "top": t == 0,
        "right": r == im.width,
        "bottom": b == im.height,
    }
    trimmed = im.crop((l, t, r, b))
    trimmed.save(OUT / name, optimize=True)
    manifest[name] = {
        "w": trimmed.width,
        "h": trimmed.height,
        "bleeds": [k for k, v in bleeds.items() if v],
    }

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
