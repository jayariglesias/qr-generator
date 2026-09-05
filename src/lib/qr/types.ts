export type QrShape = 'square' | 'circle' | 'rounded';
export type QrPattern = 'normal' | 'dots' | 'diamonds';
export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type QrContentType = 'text' | 'wifi' | 'email' | 'phone' | 'sms';

export type QrDrawInput = {
  value: string;
  fgColor: string;
  bgColor: string;
  quietZone: number;
  shape: QrShape;
  pattern: QrPattern;
  eyeRadius: number;
  eyeColor: string;
  errorLevel: QrErrorLevel;
  moduleSize: number;
  useGradient: boolean;
  gradientStart: string;
  gradientEnd: string;
  logoSrc?: string;
  logoScale: number;
  transparent?: boolean;
};

export type QrModel = {
  total: number;
  modules: string;
  fill: string;
  bgColor: string;
  eyeColor: string;
  eyes: { ring: string; core: string }[];
  logo?: { src: string; x: number; y: number; size: number; pad: number };
  useGradient: boolean;
  gradientStart: string;
  gradientEnd: string;
  transparent: boolean;
};

export type WifiPayload = {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
};

export type EmailPayload = {
  to: string;
  subject?: string;
  body?: string;
};

export type SmsPayload = {
  phone: string;
  message?: string;
};
