"""Build an inline SVG travel map (Europe to East Asia) from world-atlas TopoJSON.

Countries visited are filled; pins mark places. Output: travel-map.svg (fragment).
"""
import json, math, sys

SRC = sys.argv[1]
OUT = sys.argv[2]

topo = json.load(open(SRC, encoding="utf-8"))
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]

# decode quantised, delta-encoded arcs into lon/lat
arcs = []
for arc in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx; y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def ring(idx_list):
    out = []
    for i in idx_list:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(a if not out else a[1:])
    return out


# Miller projection, cropped to the region of interest
LON0, LON1, LAT0, LAT1 = -14.0, 150.0, -12.0, 63.0
W = 1000.0


def my(lat):
    return 1.25 * math.log(math.tan(math.pi / 4 + 0.4 * math.radians(lat)))


K = W / math.radians(LON1 - LON0)
YTOP = my(LAT1)
H = (YTOP - my(LAT0)) * K


def proj(lon, lat):
    return (math.radians(lon - LON0) * K, (YTOP - my(lat)) * K)


VISITED = {"392": "Japan", "764": "Thailand", "704": "Vietnam", "826": "United Kingdom",
           "156": "China", "702": "Singapore"}

land, visited = [], []
for g in topo["objects"]["countries"]["geometries"]:
    if g["type"] == "Polygon":
        polys = [g["arcs"]]
    elif g["type"] == "MultiPolygon":
        polys = g["arcs"]
    else:
        continue
    d = []
    for poly in polys:
        for r in poly:
            pts = ring(r)
            # skip rings entirely outside the crop (with margin)
            if all(p[0] < LON0 - 2 or p[0] > LON1 + 2 or p[1] < LAT0 - 2 or p[1] > LAT1 + 2 for p in pts):
                continue
            xy, last = [], None
            for lon, lat in pts:
                lat = max(min(lat, 84), -80)
                X, Y = proj(lon, lat)
                q = (round(X), round(Y))
                if q != last:
                    xy.append(q); last = q
            if len(xy) < 3:
                continue
            d.append("M" + "L".join(f"{a:g},{b:g}" for a, b in xy) + "Z")
    if not d:
        continue
    name = g.get("properties", {}).get("name", "")
    path = f'<path d="{"".join(d)}"><title>{VISITED.get(g.get("id"), name)}</title></path>'
    (visited if g.get("id") in VISITED else land).append(path)

# pins: (label, lon, lat, note, label dx, label dy, anchor)
PINS = [
    ("Vietnam", 105.85, 21.03, "Home", 14, 4, "start"),
    ("Japan", 139.69, 35.69, "Research exchange at SIT, 2023", -10, -8, "end"),
    ("China", 104.0, 34.0, "Travel", 0, -12, "middle"),
    ("Thailand", 100.50, 13.75, "CPESE conference, 2022", -10, 4, "end"),
    ("Singapore", 103.82, 1.35, "Travel", 14, 4, "start"),
    ("England", -0.13, 51.51, "Study: MSc at UCL, London", 14, 6, "start"),
    ("Scotland", -3.19, 55.95, "Travel", 14, -3, "start"),
]
pins = []
for label, lon, lat, note, dx, dy, anchor in PINS:
    X, Y = proj(lon, lat)
    tip = f"{label} · {note}" if note else label
    pins.append(
        f'<g class="map-pin" transform="translate({X:.1f},{Y:.1f})"><title>{tip}</title>'
        f'<g class="beer" transform="scale(1.7)">'
        f'<circle class="spot" r="1.8"/>'
        f'<path class="handle" d="M4,-15.5h2.2a2.6,2.6 0 0 1 2.6,2.6v2.2a2.6,2.6 0 0 1 -2.6,2.6h-2.2"/>'
        f'<rect class="glass" x="-6.5" y="-17.5" width="11" height="13.5" rx="1.6"/>'
        f'<path class="bubbles" d="M-3,-12v4M0,-13v5M2.5,-11v3"/>'
        f'<path class="foam" d="M-7,-16.5a2.6,2.6 0 0 1 2.4,-3.6a3.2,3.2 0 0 1 5.6,-0.8a2.8,2.8 0 0 1 4.6,1.6a2,2 0 0 1 -0.4,2.8z"/>'
        f'</g>'
        f'<text x="{dx * 1.7:g}" y="{dy * 1.7 - 14:g}" text-anchor="{anchor}">{label}</text></g>'
    )

svg = (
    f'<svg class="travel-map" viewBox="0 0 {W:g} {H:.0f}" role="img" '
    f'aria-label="Map of countries visited: Vietnam, Japan, China, Thailand, Singapore, England and Scotland">\n'
    f'  <g class="map-land">{"".join(land)}</g>\n'
    f'  <g class="map-visited">{"".join(visited)}</g>\n'
    f'  <g class="map-pins">{"".join(pins)}</g>\n'
    f'</svg>'
)
open(OUT, "w", encoding="utf-8").write(svg)
print("size", len(svg), "H", round(H), "visited", len(visited), "land", len(land))
