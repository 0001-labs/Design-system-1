"""Write the Kotlin package's typefaces (native/android/fonts) as TrueType, from the same
woff2 files the web loads and the Swift package carries: Android cannot read woff2.
Run with fontTools and brotli installed: python3 scripts/fonts/build-android-fonts.py.
Inter Arrows, Iosevka and Olivetti Dot are committed, so a product's Sync 1 copy needs no Python;
GT America is licensed and the repository public, so its builds stay on this Mac (gitignored)."""
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[2]
faces = {
    "Inter-Arrows.woff2": "DS1/1-root/fonts/Inter-Arrows.woff2",
    "Iosevka-Regular.woff2": "DS1/1-root/fonts/Iosevka-Regular.woff2",
    "GT-America-Standard-Regular.woff2": "DS1/1-root/fonts/GT-America-Standard-Regular.woff2",
    "GT-America-Standard-Medium.woff2": "DS1/1-root/fonts/GT-America-Standard-Medium.woff2",
    "GT-America-Compressed-Regular.woff2": "DS1/1-root/fonts/GT-America-Compressed-Regular.woff2",
    "OlivettiDot-Regular.woff2": "website/src/assets/fonts/OlivettiDot-Regular.woff2",
}
out = root / "native/android/fonts"
out.mkdir(parents=True, exist_ok=True)
for name, source in faces.items():
    font = TTFont(root / source)
    font.flavor = None
    # Keep the face's own dates, so building again writes the same bytes.
    font.recalcTimestamp = False
    ext = ".otf" if "CFF " in font or "CFF2" in font else ".ttf"
    target = out / (Path(name).stem + ext)
    font.save(target)
    print(f"{target.relative_to(root)}: {target.stat().st_size // 1024} KB")
