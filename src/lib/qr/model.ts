import { encode, QrCodeDataType } from 'uqr';
import type { QrDrawInput, QrModel, QrPattern, QrShape } from './types';

function rectPath(x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0.001) {
    return `M${x} ${y}h${w}v${h}h${-w}z`;
  }

  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr} ${y}`,
    `H${x + w - rr}`,
    `A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
    `V${y + h - rr}`,
    `A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
    `H${x + rr}`,
    `A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
    `V${y + rr}`,
    `A${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    'z',
  ].join(' ');
}

function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`;
}

function modulePath(x: number, y: number, inset: number, kind: QrPattern | QrShape) {
  const px = x + inset;
  const py = y + inset;
  const w = 1 - inset * 2;

  if (kind === 'dots' || kind === 'circle') {
    return circlePath(px + w / 2, py + w / 2, w / 2);
  }

  if (kind === 'diamonds') {
    const cx = px + w / 2;
    const cy = py + w / 2;
    return `M${cx} ${py}L${px + w} ${cy}L${cx} ${py + w}L${px} ${cy}z`;
  }

  if (kind === 'rounded') {
    return rectPath(px, py, w, w, w * 0.32);
  }

  return rectPath(px, py, w, w, 0);
}

function finderOrigins(n: number) {
  return [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ] as const;
}

export function buildQrModel(input: QrDrawInput): QrModel {
  let qr;
  try {
    qr = encode(input.value || 'https://example.com', {
      ecc: input.errorLevel,
      border: 0,
      boostEcc: Boolean(input.logoSrc),
    });
  } catch {
    qr = encode('https://example.com', { ecc: input.errorLevel, border: 0 });
  }

  const n = qr.size;
  const margin = Math.max(0, Math.floor(input.quietZone));
  const total = n + margin * 2;
  const inset = (8 - input.moduleSize) * 0.025;
  const moduleKind: QrPattern | QrShape =
    input.pattern === 'normal' ? input.shape : input.pattern;
  const t = Math.max(0, Math.min(input.eyeRadius, 50)) / 50;
  const logo = input.logoSrc?.trim();
  const logoSpan = logo ? n * (input.logoScale / 100) : 0;
  const logoPad = logoSpan * 0.12;
  const hole = logoSpan + logoPad * 2;
  const mid = n / 2;
  const half = hole / 2;
  const parts: string[] = [];

  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (!qr.data[y][x]) continue;
      if (qr.types[y][x] === QrCodeDataType.Position) continue;
      if (logo && Math.abs(x + 0.5 - mid) < half && Math.abs(y + 0.5 - mid) < half) {
        continue;
      }
      parts.push(modulePath(x + margin, y + margin, inset, moduleKind));
    }
  }

  const eyes = finderOrigins(n).map(([fx, fy]) => {
    const x = fx + margin;
    const y = fy + margin;
    const outer =
      t >= 0.92
        ? circlePath(x + 3.5, y + 3.5, 3.5 - inset)
        : rectPath(x + inset, y + inset, 7 - inset * 2, 7 - inset * 2, 3.5 * t);
    const cut =
      t >= 0.92
        ? circlePath(x + 3.5, y + 3.5, 2.5)
        : rectPath(x + 1, y + 1, 5, 5, 2.5 * t);
    const core =
      t >= 0.92
        ? circlePath(x + 3.5, y + 3.5, 1.5 - inset * 0.3)
        : rectPath(x + 2 + inset, y + 2 + inset, 3 - inset * 2, 3 - inset * 2, 1.5 * t);

    return { ring: `${outer}${cut}`, core };
  });

  const logoX = margin + (n - logoSpan) / 2;

  return {
    total,
    modules: parts.join(''),
    fill: input.fgColor,
    bgColor: input.bgColor,
    eyeColor: input.eyeColor,
    eyes,
    logo: logo
      ? { src: logo, x: logoX, y: logoX, size: logoSpan, pad: logoPad }
      : undefined,
    useGradient: input.useGradient,
    gradientStart: input.gradientStart,
    gradientEnd: input.gradientEnd,
    transparent: Boolean(input.transparent),
  };
}
