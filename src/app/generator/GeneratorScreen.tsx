'use client';

import { useEffect, useRef, useState } from 'react';
import QrMark, {
  type QrErrorLevel,
  type QrPattern,
  type QrShape,
} from '@/components/QrMark';
import {
  copyQrPng,
  downloadBaseName,
  downloadQrPng,
  downloadQrSvg,
  encodeEmail,
  encodePhone,
  encodeSms,
  encodeWifi,
  type QrContentType,
  type QrDrawInput,
} from '@/lib/qr';
import Choices from './Choices';
import styles from './generator-screen.module.css';

const MAX_LOGO_BYTES = 3 * 1024 * 1024;
const SAMPLE_VALUE = 'https://example.com';

const DEFAULTS = {
  text: '',
  size: 512,
  fgColor: '#15171c',
  bgColor: '#f3f4f6',
  includeMargin: true,
  qrShape: 'square' as QrShape,
  qrPattern: 'normal' as QrPattern,
  eyeRadius: 0,
  eyeColor: '#15171c',
  errorLevel: 'H' as QrErrorLevel,
  quietZone: 4,
  moduleSize: 8,
  useGradient: false,
  gradientStart: '#15171c',
  gradientEnd: '#c47a12',
  logoScale: 24,
  transparent: false,
  contentType: 'text' as QrContentType,
  wifiSsid: '',
  wifiPassword: '',
  wifiEncryption: 'WPA' as 'WPA' | 'WEP' | 'nopass',
  wifiHidden: false,
  emailTo: '',
  emailSubject: '',
  emailBody: '',
  phone: '',
  smsMessage: '',
};

function readFile(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function looksLikeImageUrl(value: string) {
  return /^(https?:|data:|blob:)/i.test(value.trim());
}

export default function GeneratorScreen() {
  const [text, setText] = useState(DEFAULTS.text);
  const [size, setSize] = useState(DEFAULTS.size);
  const [fgColor, setFgColor] = useState(DEFAULTS.fgColor);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);
  const [includeMargin, setIncludeMargin] = useState(DEFAULTS.includeMargin);
  const [qrShape, setQrShape] = useState<QrShape>(DEFAULTS.qrShape);
  const [qrPattern, setQrPattern] = useState<QrPattern>(DEFAULTS.qrPattern);
  const [eyeRadius, setEyeRadius] = useState(DEFAULTS.eyeRadius);
  const [eyeColor, setEyeColor] = useState(DEFAULTS.eyeColor);
  const [errorLevel, setErrorLevel] = useState<QrErrorLevel>(DEFAULTS.errorLevel);
  const [quietZone, setQuietZone] = useState(DEFAULTS.quietZone);
  const [moduleSize, setModuleSize] = useState(DEFAULTS.moduleSize);
  const [useGradient, setUseGradient] = useState(DEFAULTS.useGradient);
  const [gradientStart, setGradientStart] = useState(DEFAULTS.gradientStart);
  const [gradientEnd, setGradientEnd] = useState(DEFAULTS.gradientEnd);
  const [transparent, setTransparent] = useState(DEFAULTS.transparent);
  const [contentType, setContentType] = useState<QrContentType>(DEFAULTS.contentType);
  const [wifiSsid, setWifiSsid] = useState(DEFAULTS.wifiSsid);
  const [wifiPassword, setWifiPassword] = useState(DEFAULTS.wifiPassword);
  const [wifiEncryption, setWifiEncryption] = useState(DEFAULTS.wifiEncryption);
  const [wifiHidden, setWifiHidden] = useState(DEFAULTS.wifiHidden);
  const [emailTo, setEmailTo] = useState(DEFAULTS.emailTo);
  const [emailSubject, setEmailSubject] = useState(DEFAULTS.emailSubject);
  const [emailBody, setEmailBody] = useState(DEFAULTS.emailBody);
  const [phone, setPhone] = useState(DEFAULTS.phone);
  const [smsMessage, setSmsMessage] = useState(DEFAULTS.smsMessage);
  const [logoFileSrc, setLogoFileSrc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoScale, setLogoScale] = useState(DEFAULTS.logoScale);
  const [logoName, setLogoName] = useState('');
  const [logoError, setLogoError] = useState('');
  const [logoValidated, setLogoValidated] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);

  const pendingLogo = logoFileSrc || (looksLikeImageUrl(logoUrl) ? logoUrl.trim() : '');
  const logoSrc = pendingLogo && logoValidated === pendingLogo ? pendingLogo : '';
  const margin = includeMargin ? quietZone : 0;

  let encoded = SAMPLE_VALUE;
  let hasContent = false;

  if (contentType === 'wifi' && wifiSsid.trim()) {
    encoded = encodeWifi({
      ssid: wifiSsid,
      password: wifiPassword,
      encryption: wifiEncryption,
      hidden: wifiHidden,
    });
    hasContent = true;
  } else if (contentType === 'email' && emailTo.trim()) {
    encoded = encodeEmail({
      to: emailTo,
      subject: emailSubject,
      body: emailBody,
    });
    hasContent = true;
  } else if (contentType === 'phone' && phone.trim()) {
    encoded = encodePhone(phone);
    hasContent = true;
  } else if (contentType === 'sms' && phone.trim()) {
    encoded = encodeSms(phone, smsMessage);
    hasContent = true;
  } else if (contentType === 'text' && text.trim()) {
    encoded = text.trim();
    hasContent = true;
  }

  const drawInput: QrDrawInput = {
    value: encoded,
    fgColor,
    bgColor,
    quietZone: margin,
    shape: qrShape,
    pattern: qrPattern,
    eyeRadius,
    eyeColor,
    errorLevel,
    moduleSize,
    useGradient,
    gradientStart,
    gradientEnd,
    logoSrc,
    logoScale,
    transparent,
  };

  const baseName = downloadBaseName(encoded, contentType);

  useEffect(() => {
    if (!pendingLogo) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLogoValidated(pendingLogo);
    };
    img.onerror = () => {
      if (!cancelled) {
        setLogoValidated('');
        setLogoError('Could not load that image. Try uploading the file.');
      }
    };
    img.src = pendingLogo;

    return () => {
      cancelled = true;
    };
  }, [pendingLogo]);

  async function applyLogoFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Use a PNG, JPG, SVG, or WebP.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Keep the logo under 3 MB.');
      return;
    }

    try {
      const src = await readFile(file);
      setLogoFileSrc(src);
      setLogoUrl('');
      setLogoName(file.name);
      setLogoError('');
      if (errorLevel === 'L') setErrorLevel('H');
    } catch {
      setLogoError('Could not read that image.');
    }
  }

  function clearLogo() {
    setLogoFileSrc('');
    setLogoUrl('');
    setLogoName('');
    setLogoError('');
    setLogoValidated('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetAll() {
    setText(DEFAULTS.text);
    setSize(DEFAULTS.size);
    setFgColor(DEFAULTS.fgColor);
    setBgColor(DEFAULTS.bgColor);
    setIncludeMargin(DEFAULTS.includeMargin);
    setQrShape(DEFAULTS.qrShape);
    setQrPattern(DEFAULTS.qrPattern);
    setEyeRadius(DEFAULTS.eyeRadius);
    setEyeColor(DEFAULTS.eyeColor);
    setErrorLevel(DEFAULTS.errorLevel);
    setQuietZone(DEFAULTS.quietZone);
    setModuleSize(DEFAULTS.moduleSize);
    setUseGradient(DEFAULTS.useGradient);
    setGradientStart(DEFAULTS.gradientStart);
    setGradientEnd(DEFAULTS.gradientEnd);
    setTransparent(DEFAULTS.transparent);
    setContentType(DEFAULTS.contentType);
    setWifiSsid(DEFAULTS.wifiSsid);
    setWifiPassword(DEFAULTS.wifiPassword);
    setWifiEncryption(DEFAULTS.wifiEncryption);
    setWifiHidden(DEFAULTS.wifiHidden);
    setEmailTo(DEFAULTS.emailTo);
    setEmailSubject(DEFAULTS.emailSubject);
    setEmailBody(DEFAULTS.emailBody);
    setPhone(DEFAULTS.phone);
    setSmsMessage(DEFAULTS.smsMessage);
    setLogoScale(DEFAULTS.logoScale);
    setActionError('');
    setActionNote('');
    clearLogo();
  }

  async function handleDownloadPng() {
    setActionError('');
    setActionNote('');
    if (!hasContent) {
      setActionError('Add content before downloading.');
      return;
    }
    try {
      await downloadQrPng(drawInput, size, `${baseName}.png`);
    } catch {
      setActionError('PNG download failed. Try uploading the logo as a file.');
    }
  }

  function handleDownloadSvg() {
    setActionError('');
    setActionNote('');
    if (!hasContent) {
      setActionError('Add content before downloading.');
      return;
    }
    try {
      downloadQrSvg(drawInput, `${baseName}.svg`);
    } catch {
      setActionError('SVG download failed.');
    }
  }

  async function handleCopy() {
    setActionError('');
    setActionNote('');
    if (!hasContent) {
      setActionError('Add content before copying.');
      return;
    }
    try {
      await copyQrPng(drawInput, size);
      setActionNote('Copied PNG to clipboard.');
    } catch {
      setActionError('Copy failed. Your browser may block clipboard images.');
    }
  }

  const previewReady = hasContent;

  return (
    <div className={styles.page}>
      <header className={styles.brand}>
        <p className={styles.wordmark}>
          qr<span>.</span>
        </p>
        <h1 className={styles.headline}>Encode a link. Style the mark. Take it with you.</h1>
      </header>

      <div className={styles.fields}>
        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Encode</h2>
          <div className={styles.field}>
            <span>Content type</span>
            <Choices
              value={contentType}
              onChange={setContentType}
              options={[
                { value: 'text', label: 'Link / text' },
                { value: 'wifi', label: 'Wi‑Fi' },
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
                { value: 'sms', label: 'SMS' },
              ]}
            />
          </div>

          {contentType === 'text' ? (
            <label className={styles.field}>
              <span>Link or text</span>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="https://your-site.com"
                autoComplete="off"
              />
            </label>
          ) : null}

          {contentType === 'wifi' ? (
            <>
              <label className={styles.field}>
                <span>Network name (SSID)</span>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(event) => setWifiSsid(event.target.value)}
                  placeholder="Cafe Guest"
                  autoComplete="off"
                />
              </label>
              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(event) => setWifiPassword(event.target.value)}
                  placeholder="optional for open networks"
                  autoComplete="off"
                  disabled={wifiEncryption === 'nopass'}
                />
              </label>
              <div className={styles.field}>
                <span>Security</span>
                <Choices
                  value={wifiEncryption}
                  onChange={setWifiEncryption}
                  options={[
                    { value: 'WPA', label: 'WPA/WPA2' },
                    { value: 'WEP', label: 'WEP' },
                    { value: 'nopass', label: 'Open' },
                  ]}
                />
              </div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={wifiHidden}
                  onChange={(event) => setWifiHidden(event.target.checked)}
                />
                Hidden network
              </label>
            </>
          ) : null}

          {contentType === 'email' ? (
            <>
              <label className={styles.field}>
                <span>To</span>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(event) => setEmailTo(event.target.value)}
                  placeholder="hello@example.com"
                  autoComplete="off"
                />
              </label>
              <label className={styles.field}>
                <span>Subject</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="optional"
                  autoComplete="off"
                />
              </label>
              <label className={styles.field}>
                <span>Body</span>
                <input
                  type="text"
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  placeholder="optional"
                  autoComplete="off"
                />
              </label>
            </>
          ) : null}

          {contentType === 'phone' ? (
            <label className={styles.field}>
              <span>Phone number</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 0100"
                autoComplete="off"
              />
            </label>
          ) : null}

          {contentType === 'sms' ? (
            <>
              <label className={styles.field}>
                <span>Phone number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+1 555 0100"
                  autoComplete="off"
                />
              </label>
              <label className={styles.field}>
                <span>Message</span>
                <input
                  type="text"
                  value={smsMessage}
                  onChange={(event) => setSmsMessage(event.target.value)}
                  placeholder="optional"
                  autoComplete="off"
                />
              </label>
            </>
          ) : null}

          {hasContent ? (
            <p className={styles.payload} title={encoded}>
              Encoded: {encoded}
            </p>
          ) : (
            <p className={styles.hint}>Fill in the fields to encode a scannable mark.</p>
          )}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Logo</h2>
          <div className={styles.field}>
            <span>Center image</span>
            <input
              ref={fileRef}
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              aria-label="Upload a logo"
              onChange={(event) => applyLogoFile(event.target.files?.[0])}
            />
            <div
              className={`${styles.drop} ${dragging ? styles.dropActive : ''} ${logoSrc ? styles.dropFilled : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                dragCount.current += 1;
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => {
                dragCount.current -= 1;
                if (dragCount.current <= 0) {
                  dragCount.current = 0;
                  setDragging(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                dragCount.current = 0;
                setDragging(false);
                void applyLogoFile(event.dataTransfer.files[0]);
              }}
            >
              {logoSrc ? (
                <div className={styles.logoRow}>
                  <img src={logoSrc} alt="" className={styles.logoThumb} />
                  <div>
                    <p>{logoName || logoUrl || 'Logo'}</p>
                    <button type="button" className={styles.textButton} onClick={clearLogo}>
                      Remove
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => fileRef.current?.click()}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.dropTrigger}
                  onClick={() => fileRef.current?.click()}
                >
                  Drop a logo in the center, or click to upload.
                </button>
              )}
            </div>
            {logoError ? <p className={styles.error}>{logoError}</p> : null}
          </div>

          <label className={styles.field}>
            <span>Logo URL</span>
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => {
                setLogoUrl(event.target.value);
                if (event.target.value.trim()) setLogoFileSrc('');
                setLogoError('');
              }}
              placeholder="https://.../logo.png"
              autoComplete="off"
            />
          </label>

          {logoSrc ? (
            <label className={styles.field}>
              <span>Logo size {logoScale}%</span>
              <input
                type="range"
                min={12}
                max={36}
                value={logoScale}
                onChange={(event) => setLogoScale(Number(event.target.value))}
              />
            </label>
          ) : null}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Style</h2>
          <div className={styles.field}>
            <span>Module shape</span>
            <Choices
              value={qrShape}
              onChange={setQrShape}
              options={[
                { value: 'square', label: 'Square' },
                { value: 'circle', label: 'Circle' },
                { value: 'rounded', label: 'Rounded' },
              ]}
            />
          </div>
          <div className={styles.field}>
            <span>Pattern</span>
            <Choices
              value={qrPattern}
              onChange={setQrPattern}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'dots', label: 'Dots' },
                { value: 'diamonds', label: 'Diamonds' },
              ]}
            />
          </div>
          <label className={styles.field}>
            <span>Module size {moduleSize}px</span>
            <input
              type="range"
              min={2}
              max={8}
              value={moduleSize}
              onChange={(event) => setModuleSize(Number(event.target.value))}
            />
          </label>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Eyes</h2>
          <label className={styles.field}>
            <span>Eye radius {eyeRadius}%</span>
            <input
              type="range"
              min={0}
              max={50}
              value={eyeRadius}
              onChange={(event) => setEyeRadius(Number(event.target.value))}
            />
          </label>
          <label className={styles.swatch}>
            <span>Eye color</span>
            <input
              type="color"
              value={eyeColor}
              onChange={(event) => setEyeColor(event.target.value)}
            />
          </label>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Ink</h2>
          <div className={styles.swatches}>
            <label className={styles.swatch}>
              <span>Mark</span>
              <input
                type="color"
                value={fgColor}
                onChange={(event) => {
                  const next = event.target.value;
                  setFgColor(next);
                  if (eyeColor === fgColor) setEyeColor(next);
                }}
                disabled={useGradient}
              />
            </label>
            <label className={styles.swatch}>
              <span>Paper</span>
              <input
                type="color"
                value={bgColor}
                onChange={(event) => setBgColor(event.target.value)}
                disabled={transparent}
              />
            </label>
          </div>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={useGradient}
              onChange={(event) => setUseGradient(event.target.checked)}
            />
            Use gradient
          </label>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={transparent}
              onChange={(event) => setTransparent(event.target.checked)}
            />
            Transparent background
          </label>

          {useGradient ? (
            <div className={styles.swatches}>
              <label className={styles.swatch}>
                <span>Start</span>
                <input
                  type="color"
                  value={gradientStart}
                  onChange={(event) => setGradientStart(event.target.value)}
                />
              </label>
              <label className={styles.swatch}>
                <span>End</span>
                <input
                  type="color"
                  value={gradientEnd}
                  onChange={(event) => setGradientEnd(event.target.value)}
                />
              </label>
            </div>
          ) : null}

          <label className={styles.field}>
            <span>Export size {size}px</span>
            <input
              type="range"
              min={128}
              max={1024}
              step={8}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
          </label>
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>Scan</h2>
          <div className={styles.field}>
            <span>Error correction</span>
            <Choices
              value={errorLevel}
              onChange={setErrorLevel}
              options={[
                { value: 'L', label: 'Low 7%' },
                { value: 'M', label: 'Medium 15%' },
                { value: 'Q', label: 'Quartile 25%' },
                { value: 'H', label: 'High 30%' },
              ]}
            />
          </div>
          <label className={styles.field}>
            <span>Quiet zone {quietZone} modules</span>
            <input
              type="range"
              min={0}
              max={8}
              value={quietZone}
              onChange={(event) => setQuietZone(Number(event.target.value))}
              disabled={!includeMargin}
            />
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={includeMargin}
              onChange={(event) => setIncludeMargin(event.target.checked)}
            />
            Include margin
          </label>
          {logoSrc && errorLevel === 'L' ? (
            <p className={styles.hint}>High correction scans more reliably with a logo.</p>
          ) : null}
        </section>

        <section className={styles.block}>
          <button type="button" className={styles.reset} onClick={resetAll}>
            Reset all settings
          </button>
        </section>
      </div>

      <section className={styles.preview} aria-label="QR preview">
        <div
          className={`${styles.mark} ${transparent ? styles.markClear : ''}`}
          style={transparent ? undefined : { background: bgColor }}
        >
          <QrMark {...drawInput} title={previewReady ? encoded : 'Sample QR code'} />
        </div>
        <p className={styles.previewHint}>
          {previewReady ? 'Ready to download' : 'Previewing a sample until you add content'}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.download}
            onClick={handleDownloadPng}
            disabled={!previewReady}
          >
            Download PNG
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleDownloadSvg}
            disabled={!previewReady}
          >
            Download SVG
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleCopy}
            disabled={!previewReady}
          >
            Copy PNG
          </button>
        </div>
        {actionNote ? <p className={styles.note}>{actionNote}</p> : null}
        {actionError ? <p className={styles.error}>{actionError}</p> : null}
      </section>
    </div>
  );
}
