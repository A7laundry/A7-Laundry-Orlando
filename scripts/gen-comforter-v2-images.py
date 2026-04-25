#!/usr/bin/env python3
"""
Generate 6 dopamine-driven Nike-style images for /blog/comforter-cleaning-service-orlando-v2.html
via Gemini 3.1 Flash Image. Each image is generated in parallel via threads.
Output: blog/img-v2/{slug}.png + .webp (optimized)
"""
import json, base64, urllib.request, os, sys, threading, time, ssl, certifi
from pathlib import Path

SSL_CTX = ssl.create_default_context(cafile=certifi.where())

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set"); sys.exit(1)

MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"
OUT_DIR = Path("/Users/dennisarruda/projects/A7_Laundry_Orlando/blog/img-v2")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Shared visual DNA — applied to every prompt for cohesion
VISUAL_DNA = """Style: Nike Run Club meets Apple Fitness meets Airbnb editorial.
High color saturation, cinematic contrast, dopamine-rich golden hour or warm artificial light.
Shallow depth of field, photorealistic, premium editorial finish.
Color grade: warm highlights, deep crushed shadows, hint of teal in midtones.
Composition: bold, confident, generous negative space allowing for headline overlay."""

NEGATIVES = "No text, no watermarks, no logos, no captions, no UI elements, no hands holding phones."

IMAGES = [
    {
        "slug": "01-hero-family-comforter",
        "prompt": f"""A photorealistic editorial photograph for a luxury laundry service hero banner.
Subject: A warm, joyful young Orlando family (mother in her early 30s, father in his early 30s,
two kids ages 5 and 8) on a bright modern bedroom bed, all of them tossing themselves backwards
laughing onto a freshly cleaned, impossibly fluffy white king-size comforter. Real movement,
authentic joy, captured mid-fall. Light pillows in disarray. Comforter looks pristine, white,
sun-soaked, voluminous.
Environment: Modern Orlando home master bedroom, large floor-to-ceiling window on the left
flooding the scene with golden 5pm Florida sunlight. Subtle palm shadow on the far wall. Linen
curtains slightly billowing. Hardwood floors. White walls with one warm terracotta accent wall.
Technical: Shot at 35mm f/2.0, slight motion blur on the children's hair, sharp focus on the
comforter texture and parents' faces. Wide horizontal composition, room for headline above the
family. Aspect ratio 21:9 cinematic.
{VISUAL_DNA}
{NEGATIVES}""",
    },
    {
        "slug": "02-before-after-split",
        "prompt": f"""A photorealistic dramatic before/after split-screen photograph showing comforter cleaning results.
Subject: Single horizontal frame split exactly down the middle by a sharp vertical line.
Left half: A dingy, grayish, wrinkled, slightly compressed comforter on an unmade bed,
flat lighting, cool desaturated tones, visible dust and dullness, sagging fill.
Right half: The same comforter, now BRIGHT pristine white, fluffy, voluminous, perfectly draped
on a beautifully made bed, lit by warm golden window light, deep saturated whites, voluminous fill.
Same camera angle, same bed, same room — only the state of the comforter and lighting differ.
Environment: Modern Orlando bedroom, identical on both sides except mood/light.
Technical: Shot at 50mm f/4.0, both halves equally sharp. The split line is razor-sharp,
vertical, dead center. 16:9 aspect.
{VISUAL_DNA}
{NEGATIVES}""",
    },
    {
        "slug": "03-commercial-machine",
        "prompt": f"""A photorealistic close-up editorial photograph of a commercial laundry process.
Subject: Strong gloved hands of a laundry professional (male, mid-30s, navy uniform sleeve visible)
loading a large bright-white king comforter into a massive front-loading commercial washing machine.
The comforter is mid-air, billowing into the drum. Soft steam visible rising from the drum interior.
Stainless steel of the machine catches a warm rim light.
Environment: Industrial-clean commercial laundromat space, dimly lit with one strong directional
warm key light from the upper left, deep shadows in the background. A row of similar machines
faded out in the background bokeh. Polished concrete floor.
Technical: Shot at 50mm f/1.8, very shallow depth of field, focus locked on the comforter
entering the drum. Sharp commercial-product feel. Aspect ratio 4:3.
{VISUAL_DNA}
{NEGATIVES}""",
    },
    {
        "slug": "04-delivery-doorstep",
        "prompt": f"""A photorealistic warm editorial photograph of a vacation rental laundry delivery moment.
Subject: A friendly delivery professional (woman, mid-30s, navy polo uniform) handing a beautifully
folded, plastic-wrapped white comforter to a relieved Orlando vacation rental host (man, mid-40s,
casual smart-casual). Real eye contact, genuine smile, hand-off mid-action.
Environment: The doorstep of an upscale Orlando vacation rental — modern Florida architecture,
white stucco, palm tree visible to the right side, golden hour light, the front door painted
deep navy blue, terracotta tile entryway, brass house number visible but not legible. A subtle
glimpse of luxury interior through the open door.
Technical: Shot at 35mm f/2.8, the moment of handover is in sharp focus, slight bokeh on the
background. Warm golden-hour light raking from the right. Aspect ratio 4:3.
{VISUAL_DNA}
{NEGATIVES}""",
    },
    {
        "slug": "05-comforter-macro",
        "prompt": f"""A photorealistic ultra-detailed macro editorial photograph of pure clean comforter texture.
Subject: Extreme close-up of bright white, freshly laundered down comforter fabric and stitching.
Visible quilted square stitching pattern, individual cotton fibers catching warm sidelight,
soft puff of the fill visible inside the channels. Almost abstract, sculptural. The fabric is
pristine, sun-glow on the highlights, deep soft shadows in the valleys of the quilting.
Environment: Just the comforter — no bed, no room, no people. Pure product abstraction.
Technical: Macro lens 100mm f/2.8, extreme shallow depth of field, sharp on the central
stitching, fades to soft bokeh at the edges. Warm directional sidelight from upper right.
Aspect ratio 16:9 ultra-wide. Almost wallpaper-quality.
{VISUAL_DNA}
{NEGATIVES}""",
    },
    {
        "slug": "06-vacation-rental-bedroom",
        "prompt": f"""A photorealistic luxury editorial photograph of a beautifully styled Orlando vacation rental bedroom.
Subject: An immaculately made king bed with a fluffy bright-white comforter as the centerpiece.
Two crisp white pillows, one accent pillow in deep teal. The comforter is voluminous, folded
back at the top revealing a hint of folded white sheet. A soft throw blanket in warm tan draped
diagonally at the foot of the bed.
Environment: Modern Disney-area Orlando vacation rental master bedroom. Floor-to-ceiling window
on the left showing a hint of palm tree and Florida blue sky. Mid-century walnut nightstand with
a single brass lamp glowing warmly. Hardwood floor with a warm beige rug. White walls with one
deep navy blue accent wall behind the headboard. Subtle wall art (abstract, no text). Late
afternoon golden light.
Technical: Shot at 24mm f/4.0 wide environmental, full bed visible, slight one-point perspective.
The comforter is the brightest, most dopamine-rich element in frame. Aspect ratio 16:9 cinematic.
{VISUAL_DNA}
{NEGATIVES}""",
    },
]


def gen(item):
    slug = item["slug"]
    prompt = item["prompt"]
    out_path = OUT_DIR / f"{slug}.png"
    if out_path.exists():
        print(f"[skip] {slug} already exists")
        return
    print(f"[start] {slug}")
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.9
        }
    }).encode()
    req = urllib.request.Request(URL, data=payload, headers={
        "Content-Type": "application/json",
        "User-Agent": "A7Laundry-ImgGen/1.0"
    })
    try:
        t0 = time.time()
        resp = urllib.request.urlopen(req, timeout=180, context=SSL_CTX)
        result = json.loads(resp.read())
        for part in result["candidates"][0]["content"]["parts"]:
            if "inlineData" in part:
                img_data = base64.b64decode(part["inlineData"]["data"])
                with open(out_path, "wb") as f:
                    f.write(img_data)
                dt = time.time() - t0
                print(f"[ok] {slug}: {len(img_data):,} bytes in {dt:.1f}s")
                return
        print(f"[fail] {slug}: no image in response. Raw keys: {list(result.keys())}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:500]
        print(f"[error] {slug}: HTTP {e.code} — {body}")
    except Exception as e:
        print(f"[error] {slug}: {type(e).__name__}: {e}")


if __name__ == "__main__":
    threads = []
    for item in IMAGES:
        t = threading.Thread(target=gen, args=(item,))
        t.start()
        threads.append(t)
        time.sleep(0.3)  # gentle stagger to avoid rate burst
    for t in threads:
        t.join()
    print("\n=== DONE ===")
    for item in IMAGES:
        p = OUT_DIR / f"{item['slug']}.png"
        status = "OK" if p.exists() else "MISSING"
        size = f"{p.stat().st_size:,}" if p.exists() else "-"
        print(f"  [{status}] {item['slug']}.png ({size} bytes)")
