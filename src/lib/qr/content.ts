import type { EmailPayload, QrContentType, WifiPayload } from './types';

export function encodeWifi({ ssid, password, encryption, hidden }: WifiPayload) {
  const escape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1');
  const auth = encryption === 'nopass' ? 'nopass' : encryption;
  const pass = auth === 'nopass' ? '' : `P:${escape(password)};`;
  const hide = hidden ? 'H:true;' : '';
  return `WIFI:T:${auth};S:${escape(ssid.trim())};${pass}${hide};`;
}

export function encodeEmail({ to, subject, body }: EmailPayload) {
  const parts: string[] = [];
  if (subject?.trim()) {
    parts.push(`subject=${encodeURIComponent(subject.trim())}`);
  }
  if (body?.trim()) {
    parts.push(`body=${encodeURIComponent(body.trim())}`);
  }
  const query = parts.join('&');
  return `mailto:${to.trim()}${query ? `?${query}` : ''}`;
}

export function encodePhone(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function encodeSms(phone: string, message = '') {
  const number = phone.replace(/[^\d+]/g, '');
  if (!message.trim()) return `sms:${number}`;
  return `sms:${number}?body=${encodeURIComponent(message.trim())}`;
}

function slug(value: string, fallback: string) {
  const cleaned = value
    .slice(0, 32)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || fallback;
}

export function downloadBaseName(
  text: string,
  contentType: QrContentType = 'text',
) {
  if (contentType === 'wifi') {
    const match = text.match(/S:((?:\\.|[^;])*)/i);
    const ssid = match?.[1]?.replace(/\\(.)/g, '$1').trim() || 'network';
    return `wifi-${slug(ssid, 'network')}`;
  }

  if (contentType === 'email') {
    const address = text.replace(/^mailto:/i, '').split('?')[0].trim();
    return `email-${slug(address, 'mail')}`;
  }

  if (contentType === 'phone') {
    const number = text.replace(/^tel:/i, '').trim();
    return `phone-${slug(number.replace(/^\+/, 'plus-'), 'number')}`;
  }

  if (contentType === 'sms') {
    const number = text.replace(/^sms:/i, '').split('?')[0].trim();
    return `sms-${slug(number.replace(/^\+/, 'plus-'), 'message')}`;
  }

  try {
    const host = new URL(text).hostname.replace(/^www\./, '');
    return slug(host, 'qr');
  } catch {
    return slug(text, 'qr-code');
  }
}
