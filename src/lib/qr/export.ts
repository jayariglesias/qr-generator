import { buildQrModel } from './model';
import type { QrDrawInput } from './types';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

export async function paintQrToCanvas(input: QrDrawInput, size: number) {
  const model = buildQrModel(input);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas');

  const scale = size / model.total;
  if (!model.transparent) {
    ctx.fillStyle = model.bgColor;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.save();
  ctx.scale(scale, scale);

  if (model.useGradient) {
    const gradient = ctx.createLinearGradient(0, 0, model.total, model.total);
    gradient.addColorStop(0, model.gradientStart);
    gradient.addColorStop(1, model.gradientEnd);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = model.fill;
  }
  ctx.fill(new Path2D(model.modules));

  ctx.fillStyle = model.eyeColor;
  for (const eye of model.eyes) {
    ctx.fill(new Path2D(eye.ring), 'evenodd');
    ctx.fill(new Path2D(eye.core));
  }

  if (model.logo) {
    const { x, y, size: logoSize, pad, src } = model.logo;
    ctx.fillStyle = model.transparent ? '#ffffff' : model.bgColor;
    const r = logoSize * 0.12;
    ctx.beginPath();
    ctx.roundRect(x - pad / 2, y - pad / 2, logoSize + pad, logoSize + pad, r);
    ctx.fill();
    const img = await loadImage(src).catch(() => null);
    if (img) {
      ctx.drawImage(img, x, y, logoSize, logoSize);
    }
  }

  ctx.restore();
  return canvas;
}

export async function paintQrToPng(input: QrDrawInput, size: number) {
  const canvas = await paintQrToCanvas(input, size);
  return canvas.toDataURL('image/png');
}

export async function downloadQrPng(
  input: QrDrawInput,
  size: number,
  filename: string,
) {
  const png = await paintQrToPng(input, size);
  triggerDownload(png, filename);
}

export async function copyQrPng(input: QrDrawInput, size: number) {
  const canvas = await paintQrToCanvas(input, size);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Could not create PNG.');
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export function renderQrSvgMarkup(input: QrDrawInput, gradientId = 'qr-grad') {
  const model = buildQrModel(input);
  const fill = model.useGradient ? `url(#${gradientId})` : model.fill;
  const crisp =
    input.pattern === 'normal' && input.shape === 'square' && input.eyeRadius === 0;

  const gradient = model.useGradient
    ? `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${model.gradientStart}"/><stop offset="100%" stop-color="${model.gradientEnd}"/></linearGradient></defs>`
    : '';

  const background = model.transparent
    ? ''
    : `<rect width="${model.total}" height="${model.total}" fill="${model.bgColor}"/>`;

  const eyes = model.eyes
    .map(
      (eye) =>
        `<path d="${eye.ring}" fill="${model.eyeColor}" fill-rule="evenodd"/><path d="${eye.core}" fill="${model.eyeColor}"/>`,
    )
    .join('');

  let logo = '';
  if (model.logo) {
    const padFill = model.transparent ? '#ffffff' : model.bgColor;
    logo = `<rect x="${model.logo.x - model.logo.pad / 2}" y="${model.logo.y - model.logo.pad / 2}" width="${model.logo.size + model.logo.pad}" height="${model.logo.size + model.logo.pad}" rx="${model.logo.size * 0.12}" fill="${padFill}"/><image href="${model.logo.src}" x="${model.logo.x}" y="${model.logo.y}" width="${model.logo.size}" height="${model.logo.size}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.total} ${model.total}" shape-rendering="${crisp ? 'crispEdges' : 'geometricPrecision'}">${gradient}${background}<path d="${model.modules}" fill="${fill}"/>${eyes}${logo}</svg>`;
}

export function downloadQrSvg(input: QrDrawInput, filename: string) {
  const svg = renderQrSvgMarkup(input);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}
