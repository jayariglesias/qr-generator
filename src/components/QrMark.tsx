'use client';

import { useId } from 'react';
import { buildQrModel, type QrDrawInput } from '@/lib/qr';

export type { QrErrorLevel, QrPattern, QrShape } from '@/lib/qr';

export type QrMarkProps = QrDrawInput & {
  title?: string;
};

export default function QrMark({ title, ...input }: QrMarkProps) {
  const reactId = useId();
  const gradientId = `qr-grad-${reactId.replace(/:/g, '')}`;
  const model = buildQrModel(input);
  const fill = model.useGradient ? `url(#${gradientId})` : model.fill;
  const crisp =
    input.pattern === 'normal' && input.shape === 'square' && input.eyeRadius === 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${model.total} ${model.total}`}
      role="img"
      shapeRendering={crisp ? 'crispEdges' : 'geometricPrecision'}
    >
      {title ? <title>{title}</title> : null}
      {model.useGradient ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={model.gradientStart} />
            <stop offset="100%" stopColor={model.gradientEnd} />
          </linearGradient>
        </defs>
      ) : null}
      {model.transparent ? null : (
        <rect width={model.total} height={model.total} fill={model.bgColor} />
      )}
      <path d={model.modules} fill={fill} />
      {model.eyes.map((eye, index) => (
        <g key={index}>
          <path d={eye.ring} fill={model.eyeColor} fillRule="evenodd" />
          <path d={eye.core} fill={model.eyeColor} />
        </g>
      ))}
      {model.logo ? (
        <>
          <rect
            x={model.logo.x - model.logo.pad / 2}
            y={model.logo.y - model.logo.pad / 2}
            width={model.logo.size + model.logo.pad}
            height={model.logo.size + model.logo.pad}
            rx={model.logo.size * 0.12}
            fill={model.transparent ? '#ffffff' : model.bgColor}
          />
          <image
            href={model.logo.src}
            x={model.logo.x}
            y={model.logo.y}
            width={model.logo.size}
            height={model.logo.size}
            preserveAspectRatio="xMidYMid meet"
          />
        </>
      ) : null}
    </svg>
  );
}
