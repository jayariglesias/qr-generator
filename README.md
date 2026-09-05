# qr. generator

A free, open-source QR code generator. Encode a link, Wi‑Fi network, email, phone number, or SMS, style the mark, then download PNG or SVG — no account, no paywall.

## Try it

**[Open the live app →](https://jayariglesias.github.io/qr-generator/)**

Works in the browser. Nothing to install.

---

## What you can do

- Make a QR code for a **website link**, **Wi‑Fi network**, **email**, **phone call**, or **SMS**
- Put your **logo** in the middle (upload a file or paste an image link)
- Change the **look**: colors, shapes, rounded corners, gradients
- Download as **PNG** or **SVG**
- **Copy** the image to your clipboard

Everything updates live as you type.

---

## How to use

1. Open the [live app](https://jayariglesias.github.io/qr-generator/).
2. Choose what you want to encode (link, Wi‑Fi, email, phone, or SMS).
3. Fill in the fields.
4. Optional: add a logo, tweak colors and style.
5. Click **Download PNG** or **Download SVG**.

Tips:

- For logos, **High** error correction scans more reliably.
- Leave a little blank space around the code (the quiet zone) so phones can read it easily.
- Test the download with your phone camera before you print or share it.

---

## Run locally

### Docker (easiest)

```bash
docker compose up --build
```

Open **http://localhost:3000**. Stop with `Ctrl+C` or `docker compose down`.

Without Compose:

```bash
docker build -t qr-generator .
docker run --rm -p 3000:3000 qr-generator
```

### Node.js

You need [Node.js](https://nodejs.org/) **20.9 or newer**.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the production app |
| `npm start` | Runs the production build |
| `npm run lint` | Checks the code |

---

## Deploy on GitHub Pages

Pushes to `main` run the Next.js Pages workflow (static `out/` → GitHub Pages).

1. Repo **Settings → Pages**.
2. **Source:** GitHub Actions.

Live URL: **https://jayariglesias.github.io/qr-generator/**

Local static build:

```bash
# Windows PowerShell
$env:GITHUB_PAGES='true'; npm run build

# macOS / Linux
GITHUB_PAGES=true npm run build
```

Docker and `npm start` still use the Node `standalone` build (no `GITHUB_PAGES` env).

---

## Using the code in your own project

The drawing helpers live in `src/lib/qr`. You can import them into another React / Next.js app:

```ts
import {
  buildQrModel,
  downloadQrPng,
  downloadQrSvg,
  encodeWifi,
  paintQrToPng,
} from '@/lib/qr'

const value = encodeWifi({
  ssid: 'Cafe Guest',
  password: 'secret',
  encryption: 'WPA',
})

const input = {
  value,
  fgColor: '#15171c',
  bgColor: '#f3f4f6',
  quietZone: 4,
  shape: 'rounded' as const,
  pattern: 'normal' as const,
  eyeRadius: 20,
  eyeColor: '#15171c',
  errorLevel: 'H' as const,
  moduleSize: 8,
  useGradient: false,
  gradientStart: '#15171c',
  gradientEnd: '#c47a12',
  logoScale: 24,
}

await downloadQrPng(input, 512, 'wifi.png')
```

Preview component:

```tsx
import QrMark from '@/components/QrMark'

<QrMark {...input} title="Wi-Fi QR" />
```

---

## Project layout

```
src/app/page.tsx                         Website entry
src/app/generator/GeneratorScreen.tsx    Interactive generator
src/components/QrMark.tsx                On-screen QR preview
src/lib/qr/                              QR build & download helpers
Dockerfile                               Docker image
docker-compose.yml                       One-command Docker run
.github/workflows/deploy.yml             GitHub Pages deploy
```

---

## Contributing

Ideas, bug reports, and pull requests are welcome.

Keep changes focused. If you are not changing the design on purpose, leave the look and feel as-is. Before you open a pull request, run:

```bash
npm run lint
npm run build
```
