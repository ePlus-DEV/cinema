/**
 * Visual seat colors derive from SeatsInfo.SeatTypes, not guesses based on
 * names such as VIP, WAKU WAKU, DOKI DOKI, or Sweetbox.
 */
const FALLBACK_COLORS = Object.freeze([
  '#8056d9', '#ef4763', '#eb9b3c', '#d846a6',
  '#228ea8', '#34a173', '#c2a42f', '#6372d6',
  '#a96a4f', '#a44fa1', '#5374aa', '#b9617c'
]);

export function parseSeatColor(raw) {
  if (typeof raw !== 'string') return null;
  const color = raw.trim();
  const hex3 = /^#([0-9a-f]{3})$/i.exec(color);
  if (hex3) return '#' + [...hex3[1]].map((x) => x + x).join('').toLowerCase();
  const hex6 = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex6) return '#' + hex6[1].toLowerCase();
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(color);
  if (rgb) {
    const values = rgb.slice(1).map(Number);
    if (values.every((x) => x >= 0 && x <= 255)) {
      return '#' + values.map((x) => x.toString(16).padStart(2, '0')).join('');
    }
  }
  return null;
}

function hslToRgb(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

function fallbackColor(used, index) {
  for (let offset = 0; offset < FALLBACK_COLORS.length; offset++) {
    const color = FALLBACK_COLORS[(index + offset) % FALLBACK_COLORS.length];
    if (!used.has(color)) return color;
  }
  const hue = (index * 137.508) % 360;
  const rgb = hslToRgb(hue / 360, 0.55, 0.48);
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Numeric label contrast against a given RGB background. */
export function seatForeground(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = rgb.map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
  return luminance > 0.18 ? '#132033' : '#ffffff';
}

export function seatTypePalette(types = []) {
  const colors = new Set();
  const palette = new Map();
  for (const [index, type] of types.entries()) {
    if (type?.Type === undefined || type.Type === null) continue;
    const key = String(type.Type);
    if (palette.has(key)) continue;
    let color = parseSeatColor(type.Color);
    // Treat repeated upstream colors as ambiguous and render a distinct
    // fallback, so different labels cannot look like the same category.
    if (!color || colors.has(color)) color = fallbackColor(colors, index);
    colors.add(color);
    palette.set(key, {
      key,
      label: String(type.Name || 'Loại ghế ' + key),
      color,
      foreground: seatForeground(color)
    });
  }
  return palette;
}

/** CSS custom properties can only receive normalized hex colors above. */
export function seatColorStyle(type) {
  return '--seat-type-color:' + type.color + ';--seat-type-foreground:' + type.foreground;
}
