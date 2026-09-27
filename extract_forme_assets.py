"""Extract only the approved FORME assets needed by the current production slice.

The source sheet is authoritative. This script removes low-alpha spill outside
the artwork, while leaving every retained source pixel and alpha value intact.
"""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "public" / "forme_logo_assets_master_sheet.png.png"
OUTPUT = ROOT / "apps" / "web" / "public" / "brand" / "forme"

# Nonoverlapping regions of the supplied 1536 x 1024 sheet, in source pixels.
REGIONS = {
    "forme-logo-primary.png": (55, 55, 680, 250),
    "forme-logo-symbol.png": (65, 70, 254, 245),
    "forme-app-icon-light.png": (995, 302, 1195, 503),
}


def extract(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[Image.Image, tuple[int, int, int, int]]:
    region = image.crop(box)
    alpha = region.getchannel("A")
    core = alpha.point(lambda value: 255 if value >= 64 else 0)
    assert core.getbbox(), f"Missing opaque artwork in region {box}"
    # A two-pixel halo around the opaque core retains the original soft edge.
    # Distant splatter/glow/background is excluded even if its RGB is nonzero.
    nearby = core.filter(ImageFilter.MaxFilter(5))
    cleaned_alpha = Image.new("L", region.size, 0)
    cleaned_alpha.paste(alpha, (0, 0), nearby)
    clean = region.copy()
    clean.putalpha(cleaned_alpha)

    bounds = cleaned_alpha.getbbox()
    assert bounds is not None
    padding = 4
    padded = (
        max(0, bounds[0] - padding),
        max(0, bounds[1] - padding),
        min(region.width, bounds[2] + padding),
        min(region.height, bounds[3] + padding),
    )
    result = clean.crop(padded)
    result.putdata([(r, g, b, a) if a else (0, 0, 0, 0) for r, g, b, a in result.getdata()])
    absolute = (
        box[0] + padded[0],
        box[1] + padded[1],
        box[0] + padded[2],
        box[1] + padded[3],
    )

    # All opaque artwork and its original RGBA values survive bit-for-bit.
    original = image.crop(absolute)
    for before, after in zip(original.getdata(), result.getdata()):
        if before[3] >= 64:
            assert before == after, "Source artwork pixel was changed"
    assert result.getchannel("A").getextrema()[0] == 0, "Transparency was lost"
    return result, absolute


def main() -> None:
    with Image.open(SOURCE) as original:
        source = original.convert("RGBA")
    assert source.size == (1536, 1024), "Unexpected canonical sheet dimensions"
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for name, region in REGIONS.items():
        result, bounds = extract(source, region)
        result.save(OUTPUT / name, optimize=True)
        print(f"{name}: crop={bounds} size={result.size} alpha={result.getchannel('A').getextrema()} bbox={result.getchannel('A').getbbox()}")

        if name == "forme-logo-symbol.png":
            white = Image.new("RGBA", result.size, (255, 255, 255, 0))
            white.putalpha(result.getchannel("A"))
            assert white.getchannel("A").tobytes() == result.getchannel("A").tobytes()
            white.save(OUTPUT / "forme-logo-mark-white.png", optimize=True)
            print(f"forme-logo-mark-white.png: same geometry/alpha as {name}; visible RGB=(255,255,255)")


if __name__ == "__main__":
    main()
