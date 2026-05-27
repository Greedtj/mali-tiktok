from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "hero-roadtrip.png"
OUT_DIR = ROOT / "assets" / "demo"
GIF_OUT = OUT_DIR / "mali-demo.gif"
FRAMES_DIR = OUT_DIR / "frames"

WIDTH, HEIGHT = 720, 1280
FPS = 24
DURATION = 4
FRAMES = FPS * DURATION


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def cover_crop(img: Image.Image, w: int, h: int, zoom: float, x_shift: float, y_shift: float) -> Image.Image:
    src_w, src_h = img.size
    target_ratio = w / h
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        crop_h = src_h / zoom
        crop_w = crop_h * target_ratio
    else:
        crop_w = src_w / zoom
        crop_h = crop_w / target_ratio

    max_x = src_w - crop_w
    max_y = src_h - crop_h
    left = max(0, min(max_x, max_x * x_shift))
    top = max(0, min(max_y, max_y * y_shift))
    return img.crop((left, top, left + crop_w, top + crop_h)).resize((w, h), Image.Resampling.LANCZOS)


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def draw_caption(frame: Image.Image, i: int) -> None:
    draw = ImageDraw.Draw(frame)
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rectangle((0, 0, WIDTH, HEIGHT), fill=(0, 0, 0, 28))
    odraw.rectangle((0, HEIGHT * 0.56, WIDTH, HEIGHT), fill=(0, 0, 0, 78))
    frame.alpha_composite(overlay)

    title_font = font(54, True)
    body_font = font(30)
    small_font = font(24, True)

    t = i / (FRAMES - 1)
    if t < 0.34:
        title = "Morning drive"
        body = "5-sec slow-life vlog"
    elif t < 0.68:
        title = "Cafe stop"
        body = "Auto caption + upload ready"
    else:
        title = "Mali TikTok Studio"
        body = "Short vlog automation demo"

    alpha = min(255, int(255 * min(1, (t % 0.34) / 0.08 if t < 0.98 else (1 - t) / 0.04)))
    text_layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(text_layer)

    chip = "DEMO"
    chip_w = int(tdraw.textlength(chip, font=small_font)) + 42
    rounded_rect(tdraw, (46, 760, 46 + chip_w, 808), 8, (21, 128, 90, alpha))
    tdraw.text((67, 771), chip, font=small_font, fill=(255, 255, 255, alpha))
    tdraw.text((46, 836), title, font=title_font, fill=(255, 255, 255, alpha))
    tdraw.text((48, 908), body, font=body_font, fill=(245, 248, 246, alpha))

    bar_w = int(628 * t)
    rounded_rect(tdraw, (46, 1162, 674, 1172), 5, (255, 255, 255, int(alpha * 0.36)))
    rounded_rect(tdraw, (46, 1162, 46 + bar_w, 1172), 5, (255, 90, 69, alpha))
    frame.alpha_composite(text_layer)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    frames = []

    for i in range(FRAMES):
        t = i / (FRAMES - 1)
        ease = 0.5 - 0.5 * math.cos(math.pi * t)
        zoom = 1.05 + ease * 0.12
        x_shift = 0.26 + ease * 0.2
        y_shift = 0.1 + ease * 0.08
        frame = cover_crop(source, WIDTH, HEIGHT, zoom, x_shift, y_shift).convert("RGBA")
        frame = frame.filter(ImageFilter.UnsharpMask(radius=1.2, percent=112, threshold=4))
        draw_caption(frame, i)
        frame_rgb = frame.convert("RGB")
        frame_path = FRAMES_DIR / f"frame_{i:04d}.jpg"
        frame_rgb.save(frame_path, quality=92)
        frames.append(frame_rgb)

    frames[0].save(
        GIF_OUT,
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=False,
    )
    print(GIF_OUT)


if __name__ == "__main__":
    main()
