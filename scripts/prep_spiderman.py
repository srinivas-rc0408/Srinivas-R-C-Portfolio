# scripts/prep_spiderman.py
from PIL import Image
from pathlib import Path
import json

SRC = Path("raw-assets")          # 12 original PNGs live here
OUT = Path("public/spiderman")    # trimmed output
OUT.mkdir(parents=True, exist_ok=True)

FILES = ["1.png","2.png","3.png","5.png","6.png","7.png",
         "8.png","9.png","10.png","11.png","12.png","14.png"]
WEB_FILES = {"1.png", "8.png"}    # hanging images — web thread must stay at top edge

manifest = {}
for name in FILES:
    im = Image.open(SRC / name).convert("RGBA")
    alpha = im.split()[3]
    bbox = alpha.point(lambda p: 255 if p > 10 else 0).getbbox()
    l, t, r, b = bbox
    if name in WEB_FILES:
        t = 0                     # never cut the web thread's top anchor
    trimmed = im.crop((l, t, r, b))
    trimmed.save(OUT / name, optimize=True)

    entry = {"w": trimmed.width, "h": trimmed.height}
    if name in WEB_FILES:
        cols = [x for x in range(trimmed.width)
                for y in range(4) if trimmed.getpixel((x, y))[3] > 10]
        entry["webX"] = round((min(cols) + max(cols)) / 2 / trimmed.width, 4)
    manifest[name] = entry

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest, indent=2))
