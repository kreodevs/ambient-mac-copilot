#!/usr/bin/env python3
"""Generate Ambient Mac Copilot app + tray icons."""

from __future__ import annotations

import math
import os
import subprocess
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
PUBLIC = ROOT / "public"
ICONS = BUILD / "icons"

# Brand palette (liquid glass theme)
BG_TOP = (11, 18, 32)
BG_MID = (7, 89, 133)
BG_BOTTOM = (14, 165, 233)
GLASS_HI = (255, 255, 255, 95)
GLASS_LO = (255, 255, 255, 18)
WAVE = (240, 249, 255, 255)
WAVE_SOFT = (186, 230, 253, 255)
GLOW_A = (56, 189, 248)
GLOW_B = (125, 211, 252)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_rgb(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    )


def blend(dst: tuple[int, int, int, int], src: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    sa = src[3] / 255
    da = dst[3] / 255
    out_a = sa + da * (1 - sa)
    if out_a <= 0:
        return (0, 0, 0, 0)
    r = int((src[0] * sa + dst[0] * da * (1 - sa)) / out_a)
    g = int((src[1] * sa + dst[1] * da * (1 - sa)) / out_a)
    b = int((src[2] * sa + dst[2] * da * (1 - sa)) / out_a)
    return (r, g, b, int(out_a * 255))


def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    path.write_bytes(png)


def new_canvas(size: int) -> list[list[tuple[int, int, int, int]]]:
    return [[(0, 0, 0, 0) for _ in range(size)] for _ in range(size)]


def fill_background(size: int) -> list[list[tuple[int, int, int, int]]]:
    px = new_canvas(size)
    for y in range(size):
        for x in range(size):
            t = (x / (size - 1) + y / (size - 1)) / 2
            if t < 0.55:
                t2 = t / 0.55
                rgb = lerp_rgb(BG_TOP, BG_MID, t2)
            else:
                t2 = (t - 0.55) / 0.45
                rgb = lerp_rgb(BG_MID, BG_BOTTOM, t2)
            px[y][x] = (*rgb, 255)
    return px


def draw_radial_glow(px: list, cx: float, cy: float, radius: float, color: tuple[int, int, int], peak: float) -> None:
    size = len(px)
    r2 = radius * radius
    for y in range(size):
        for x in range(size):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 > r2:
                continue
            t = 1 - math.sqrt(d2) / radius
            alpha = int(255 * peak * (t ** 1.6))
            px[y][x] = blend(px[y][x], (*color, alpha))


def draw_ellipse(px: list, cx: float, cy: float, rx: float, ry: float, color: tuple[int, int, int, int]) -> None:
    size = len(px)
    for y in range(size):
        for x in range(size):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                px[y][x] = blend(px[y][x], color)


def draw_circle(px: list, cx: float, cy: float, radius: float, color: tuple[int, int, int, int], stroke: tuple[int, int, int, int] | None = None, stroke_w: float = 2) -> None:
    size = len(px)
    r_out = radius + stroke_w
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            if stroke and radius <= d <= r_out:
                px[y][x] = blend(px[y][x], stroke)
            elif d <= radius:
                edge = max(0.0, min(1.0, (radius - d) / 3))
                alpha = int(color[3] * (0.85 + 0.15 * edge))
                px[y][x] = blend(px[y][x], (color[0], color[1], color[2], alpha))


def draw_vertical_bar(px: list, x0: int, y0: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
    radius = w // 2
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= y < len(px) and 0 <= x < len(px[0]):
                in_caps = (y < y0 + radius and (x - x0 - radius) ** 2 + (y - y0 - radius) ** 2 > radius ** 2) or (
                    y > y0 + h - radius and (x - x0 - radius) ** 2 + (y - (y0 + h - radius)) ** 2 > radius ** 2
                )
                if not in_caps:
                    px[y][x] = blend(px[y][x], color)


def draw_star(px: list, cx: float, cy: float, r: float, color: tuple[int, int, int, int]) -> None:
    points = []
    for i in range(8):
        angle = math.pi / 2 + i * math.pi / 4
        dist = r if i % 2 == 0 else r * 0.42
        points.append((cx + math.cos(angle) * dist, cy + math.sin(angle) * dist))

    def inside(pxx: float, pyy: float) -> bool:
        inside_poly = False
        j = len(points) - 1
        for i, (xi, yi) in enumerate(points):
            xj, yj = points[j]
            if ((yi > pyy) != (yj > pyy)) and (pxx < (xj - xi) * (pyy - yi) / (yj - yi + 1e-9) + xi):
                inside_poly = not inside_poly
            j = i
        return inside_poly

    size = len(px)
    box = int(r + 2)
    for y in range(max(0, int(cy - box)), min(size, int(cy + box + 1))):
        for x in range(max(0, int(cx - box)), min(size, int(cx + box + 1))):
            if inside(x + 0.5, y + 0.5):
                px[y][x] = blend(px[y][x], color)


def draw_arc(px: list, cx: float, cy: float, radius: float, stroke: int, width: float) -> None:
    size = len(px)
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            if abs(d - radius) <= width / 2 and y <= cy:
                px[y][x] = blend(px[y][x], (0, 0, 0, stroke))


def render_app_icon(size: int = 1024) -> list[list[tuple[int, int, int, int]]]:
    px = fill_background(size)
    s = size / 1024

    draw_radial_glow(px, 300 * s, 260 * s, 220 * s, GLOW_A, 0.22)
    draw_radial_glow(px, 760 * s, 760 * s, 260 * s, GLOW_B, 0.18)

    # Glass orb
    orb_r = 292 * s
    orb_cx, orb_cy = 512 * s, 530 * s
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - orb_cx, y - orb_cy)
            if d > orb_r:
                continue
            t = (y - (orb_cy - orb_r)) / (2 * orb_r)
            alpha = int(lerp(GLASS_HI[3], GLASS_LO[3], max(0, min(1, t))))
            px[y][x] = blend(px[y][x], (255, 255, 255, alpha))

    draw_circle(px, orb_cx, orb_cy, orb_r, (0, 0, 0, 0), stroke=(255, 255, 255, 55), stroke_w=3 * s)
    draw_ellipse(px, orb_cx, 390 * s, 150 * s, 78 * s, (255, 255, 255, 40))

    bars = [
        (392, 500, 40, 110, 225),
        (452, 455, 40, 200, 255),
        (512, 475, 40, 160, 245),
        (572, 430, 40, 250, 255),
        (632, 510, 40, 90, 210),
    ]
    for bx, by, bw, bh, alpha in bars:
        draw_vertical_bar(px, int(bx * s), int(by * s), int(bw * s), int(bh * s), (*WAVE[:3], alpha))

    draw_circle(px, 512 * s, 700 * s, 10 * s, (240, 249, 255, 230))
    draw_star(px, 812 * s, 242 * s, 34 * s, (240, 249, 255, 245))

    return px


def render_tray_icon(size: int = 44) -> list[list[tuple[int, int, int, int]]]:
    px = new_canvas(size)
    s = size / 44
    black = (0, 0, 0, 255)

    # Equalizer bars — readable at 18px in the menu bar
    base_y = int(30 * s)
    bars = [
        (11, 8),
        (16, 14),
        (21, 18),
        (26, 12),
        (31, 9),
    ]
    bar_w = max(2, int(2.6 * s))
    for x, h in bars:
        draw_vertical_bar(px, int(x * s), base_y - int(h * s), bar_w, int(h * s), black)

    draw_circle(px, 22 * s, 33 * s, 1.8 * s, black)
    draw_star(px, 35 * s, 10 * s, 3.4 * s, black)

    return px


def save_iconset(app_px: list, iconset_dir: Path) -> None:
    iconset_dir.mkdir(parents=True, exist_ok=True)
    mapping = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
    ]
    base = render_app_icon(1024)
    for dim, name in mapping:
        if dim == 1024:
            scaled = base
        else:
            scaled = scale_nearest(base, dim)
        write_png(iconset_dir / name, scaled)


def scale_nearest(src: list, size: int) -> list:
    src_size = len(src)
    out = new_canvas(size)
    for y in range(size):
        sy = int(y * src_size / size)
        for x in range(size):
            sx = int(x * src_size / size)
            out[y][x] = src[sy][sx]
    return out


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, cwd=ROOT)


def main() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    print("[icons] Rendering app icon…")
    app_px = render_app_icon(1024)
    icon_png = BUILD / "icon.png"
    write_png(icon_png, app_px)

    print("[icons] Building icon.icns…")
    iconset = BUILD / "icon.iconset"
    if iconset.exists():
        for child in iconset.iterdir():
            child.unlink()
    else:
        iconset.mkdir(parents=True)
    save_iconset(app_px, iconset)
    run(["iconutil", "-c", "icns", str(iconset), "-o", str(BUILD / "icon.icns")])
    for child in iconset.iterdir():
        child.unlink()
    iconset.rmdir()

    print("[icons] Rendering tray icon…")
    tray_px = render_tray_icon(44)
    tray_png = BUILD / "tray-icon.png"
    write_png(tray_png, tray_px)

    print("[icons] Rendering icon.ico…")
    run([
        "magick",
        str(icon_png),
        "-define",
        "icon:auto-resize=256,128,64,48,32,16",
        str(BUILD / "icon.ico"),
    ])

    (PUBLIC / "icon.png").write_bytes(icon_png.read_bytes())
    (PUBLIC / "tray-icon.png").write_bytes(tray_png.read_bytes())
    print("[icons] Done")


if __name__ == "__main__":
    main()
