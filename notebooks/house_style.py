"""House style for P10 The Price of Dinner.

Every notebook starts with:

    from house_style import *
    apply_style()

The style follows one rule: a chart shows one finding. Context is grey, the element that
carries the finding gets the highlight colour, the title states the finding, and the
subtitle gives the units. Labels sit next to the data instead of in a legend.
"""

from pathlib import Path

import numpy as np
import matplotlib as mpl
from matplotlib import font_manager
from matplotlib.ft2font import FT2Font
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm, to_rgb

# ---------------------------------------------------------------- colours

INK = "#1A1A1A"        # text, axes, the highlight in black and white charts
GREY = "#8C8C8C"       # context data
LIGHT = "#D9D9D9"      # grid lines, empty bars, faint context
PAPER = "#FFFFFF"

# One colour per shopping channel, always in this order and always with these colours.
# The three colours differ in lightness (L* 50, 25, 75), so they also work in greyscale,
# and they stay apart under protan, deutan and tritan simulation (see cvd_report below).
CHANNEL_ORDER = ["Chợ", "Siêu thị", "App"]
CHANNEL = {"Chợ": "#B85C38", "Siêu thị": "#1F3D55", "App": "#9BBDD6"}
CHANNEL_EN = {"Chợ": "Wet market", "Siêu thị": "Supermarket", "App": "Delivery app"}

# Districts never get their own colour: they get a line style or a marker.
DISTRICT_ORDER = ["Quận 10", "Quận 3"]
DISTRICT_LINE = {"Quận 10": "-", "Quận 3": "--"}
DISTRICT_MARKER = {"Quận 10": "o", "Quận 3": "s"}

HIGHLIGHT = CHANNEL["Chợ"]  # single highlight colour for one-finding charts

# Sequential map for amounts (light to dark blue) and diverging map for changes
# (blue below the centre, terracotta above). Centre the diverging map with
# TwoSlopeNorm at 100 for an index or at 0 for a percentage change.
SEQ = LinearSegmentedColormap.from_list("p10_seq", ["#F2F5F8", "#1F3D55"])
DIV = LinearSegmentedColormap.from_list("p10_div", ["#1F3D55", "#F7F7F7", "#B85C38"])


def div_norm(center=100.0, spread=20.0):
    """A diverging norm centred on `center` (100 for an index, 0 for a % change)."""
    return TwoSlopeNorm(vcenter=center, vmin=center - spread, vmax=center + spread)


# ---------------------------------------------------------------- fonts

# Georgia is the house font. Georgia on Windows lacks some Vietnamese letters (ậ, ả, ệ), and
# matplotlib then draws empty boxes. The repository therefore ships Gelasio (notebooks/fonts,
# SIL Open Font License), a free serif with the letter widths of Georgia and every Vietnamese
# letter. apply_style() keeps Georgia when it has all the letters and uses Gelasio otherwise,
# so every computer draws the same words in the same space.
_FONT_DIR = Path(__file__).resolve().parent / "fonts"
_VIETNAMESE = "Đđàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ"


def _has_vietnamese(family):
    """True when `family` is installed in regular, bold and italic and has every Vietnamese letter."""
    for style, weight in [("normal", "normal"), ("normal", "bold"), ("italic", "normal")]:
        try:
            path = font_manager.findfont(font_manager.FontProperties(family=family, style=style, weight=weight),
                                         fallback_to_default=False)
        except ValueError:
            return False
        charmap = FT2Font(path).get_charmap()
        if any(ord(ch) not in charmap for ch in _VIETNAMESE):
            return False
    return True


def house_fonts():
    """Register the Gelasio files of notebooks/fonts and return the font list for matplotlib."""
    for path in sorted(_FONT_DIR.glob("*.ttf")):
        font_manager.fontManager.addfont(str(path))
    first = "Georgia" if _has_vietnamese("Georgia") else "Gelasio"
    return [first, "Gelasio", "DejaVu Serif"]


# ---------------------------------------------------------------- numbers

def fmt_vnd(x, short=True):
    """45000 -> '45k' (short) or '45,000 VND'."""
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return ""
    if short:
        return f"{x / 1000:,.0f}k" if abs(x) >= 1000 else f"{x:,.0f}"
    return f"{x:,.0f} VND"


def fmt_pct(x, digits=0, sign=False):
    """0.123 -> '12%'; with sign=True -> '+12%'."""
    return f"{x:+.{digits}%}" if sign else f"{x:.{digits}%}"


# ---------------------------------------------------------------- matplotlib defaults

def apply_style():
    """Set the house defaults for every figure in the notebook."""
    mpl.rcParams.update({
        "font.family": house_fonts(),
        "font.serif": ["Georgia", "DejaVu Serif", "Times New Roman", "serif"],
        "font.size": 10,
        "text.color": INK,
        "axes.edgecolor": INK,
        "axes.labelcolor": INK,
        "axes.linewidth": 0.8,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.titlelocation": "left",
        "axes.titlesize": 12.5,
        "axes.titleweight": "bold",
        "axes.titlepad": 22,
        "axes.labelsize": 9.5,
        "axes.grid": False,
        "xtick.color": INK,
        "ytick.color": INK,
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.frameon": False,
        "legend.fontsize": 9,
        "figure.dpi": 110,
        "figure.facecolor": PAPER,
        "savefig.dpi": 200,
        "savefig.bbox": "tight",
        "savefig.facecolor": PAPER,
    })


def title(ax, text, subtitle=None):
    """Action title in bold and an italic subtitle with the units, both left aligned."""
    ax.set_title(text, loc="left")
    if subtitle:
        ax.text(0, 1.02, subtitle, transform=ax.transAxes, fontsize=9.5,
                style="italic", color=INK, va="bottom", ha="left")


def figure_title(fig, text, subtitle=None, y=1.0):
    """Headline for a multi-panel figure."""
    fig.text(0.01, y, text, fontsize=17, fontweight="bold", ha="left", va="bottom")
    if subtitle:
        fig.text(0.01, y - 0.012, subtitle, fontsize=10.5, style="italic", ha="left", va="top")


def note(fig, text, y=-0.02):
    """Source and limitation line at the bottom of a figure."""
    fig.text(0.01, y, text, fontsize=8.5, color=INK, ha="left", va="top", style="italic")


def _trim(path, pad=40):
    """Cut the empty white border of a saved PNG (3D axes leave a lot of it)."""
    import time
    from PIL import Image, ImageChops
    for attempt in range(5):
        try:
            with Image.open(path) as raw:
                im = raw.convert("RGB")
                box = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).getbbox()
                if box:
                    cropped = im.crop((max(box[0] - pad, 0), max(box[1] - pad, 0),
                                       min(box[2] + pad, im.width), min(box[3] + pad, im.height)))
                else:
                    cropped = None
            if cropped is not None:
                cropped.save(path)
            break
        except OSError:
            if attempt == 4:
                raise
            time.sleep(0.15)


def save(fig, path, pdf=False):
    """Save a figure as PNG with the house settings; pdf=True also writes a PDF (needed for the M5 dashboard)."""
    import time
    for attempt in range(5):
        try:
            fig.savefig(path)
            break
        except OSError:
            if attempt == 4:
                raise
            time.sleep(0.15)
    if str(path).endswith(".png"):
        _trim(path)
        if pdf:
            fig.savefig(str(path)[:-4] + ".pdf")


# ---------------------------------------------------------------- 3D style
# The team draws its charts as 3D columns. Three rules keep them honest: columns start at zero,
# every column that carries the finding has its value printed, and the view stays low (elev about 20)
# so that the tops of the columns do not drift away from their values.

def tint(color, f):
    """Mix a colour with white (f > 0) or with black (f < 0)."""
    r = np.array(to_rgb(color))
    return tuple(r + (1 - r) * f) if f > 0 else tuple(r * (1 + f))


def faces3d(color):
    """Face colours for one ax.bar3d column: light top, base colour in front, darker sides."""
    # bar3d face order: bottom, top, front (-y), back (+y), left (-x), right (+x)
    return [tint(color, -0.2), tint(color, 0.35), color, color, tint(color, -0.25), tint(color, -0.25)]


def bars3d(ax, x, y, heights, colors, width=0.6, depth=0.6, base=0.0, edge="white"):
    """Draw 3D columns centred on (x, y); `colors` is one colour per column."""
    x, y, h = (np.atleast_1d(np.asarray(v, dtype=float)) for v in (x, y, heights))
    face = sum((faces3d(c) for c in colors), [])
    ax.bar3d(x - width / 2, y - depth / 2, np.full_like(h, base), width, depth, h - base,
             color=face, shade=False, edgecolor=edge, linewidth=0.4)


def style3d(ax, elev=20, azim=-60, aspect=(3, 1.4, 1.6), zoom=1.0, grid=False, zaxis=True, yaxis=True):
    """House look for a 3D axes: no panes, no grid, thin grey axis lines, a low view.

    zaxis=False hides the value axis; use it when every column carries its printed value.
    """
    ax.view_init(elev=elev, azim=azim)
    ax.set_box_aspect(aspect, zoom=zoom)
    ax.grid(grid)
    for a in (ax.xaxis, ax.yaxis, ax.zaxis):
        a.set_pane_color((1, 1, 1, 0))
        a.pane.set_edgecolor((1, 1, 1, 0))
        a._axinfo["grid"]["color"] = (0, 0, 0, 0.08)
        a.line.set_color(GREY)
        a.line.set_linewidth(0.6)
    if not zaxis:
        ax.set_zticks([])
        ax.zaxis.line.set_color((1, 1, 1, 0))
    if not yaxis:
        ax.set_yticks([])
        ax.yaxis.line.set_color((1, 1, 1, 0))
    ax.tick_params(axis="both", pad=0, colors=INK, labelsize=8.5, length=0)


def label3d(ax, x, y, z, text, dx=0, dy=12, **kw):
    """Write `text` at the 3D point (x, y, z), drawn in 2D on top so that no column hides it."""
    from mpl_toolkits.mplot3d import proj3d
    sx, sy, _ = proj3d.proj_transform(x, y, z, ax.get_proj())
    kw.setdefault("fontsize", 9)
    kw.setdefault("ha", "center")
    kw.setdefault("va", "bottom")
    return ax.annotate(text, xy=(sx, sy), xytext=(dx, dy), textcoords="offset points", zorder=20, **kw)


def title3d(ax, text, subtitle=None):
    """Action title and subtitle for a 3D axes (set_title sits too high on 3D axes)."""
    ax.text2D(0, 1.02, text, transform=ax.transAxes, fontsize=12.5, fontweight="bold", va="bottom")
    if subtitle:
        ax.text2D(0, 0.985, subtitle, transform=ax.transAxes, fontsize=9.5, style="italic", va="top")


# ---------------------------------------------------------------- colour vision check

_CVD = {   # Machado, Oliveira and Fernandes (2009), severity 1.0, applied in linear RGB
    "protan": np.array([[0.152286, 1.052583, -0.204868],
                        [0.114503, 0.786281, 0.099216],
                        [-0.003882, -0.048116, 1.051998]]),
    "deutan": np.array([[0.367322, 0.860646, -0.227968],
                        [0.280085, 0.672501, 0.047413],
                        [-0.011820, 0.042940, 0.968881]]),
    "tritan": np.array([[1.255528, -0.076749, -0.178779],
                        [-0.078411, 0.930809, 0.147602],
                        [0.004733, 0.691367, 0.303900]]),
}


def _lin(c):
    c = np.asarray(c, dtype=float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _unlin(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def _lab(rgb):
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    t = (m @ _lin(rgb)) / np.array([0.95047, 1.0, 1.08883])
    f = np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def simulate(color, kind):
    """RGB tuple of `color` as seen with protan, deutan or tritan vision, or in greyscale."""
    rgb = np.array(to_rgb(color))
    if kind == "normal":
        return tuple(rgb)
    if kind == "greyscale":
        y = _unlin(np.array([0.2126, 0.7152, 0.0722]) @ _lin(rgb))
        return (float(y),) * 3
    return tuple(_unlin(_CVD[kind] @ _lin(rgb)))


def cvd_report(colors=None):
    """Smallest colour difference (CIE76 delta E) between any two colours, per vision type.

    A delta E above about 20 is easy to tell apart on screen.
    """
    if colors is None:
        colors = CHANNEL
    if isinstance(colors, dict):
        colors = list(colors.values())
    out = {}
    for kind in ["normal", "protan", "deutan", "tritan", "greyscale"]:
        labs = [_lab(np.array(simulate(c, kind))) for c in colors]
        out[kind] = min(np.linalg.norm(a - b) for i, a in enumerate(labs) for b in labs[i + 1:])
    return out

