# Gemma4 Local Website Chat🚀

A modern, responsive professional website built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, featuring an integrated **AI chat assistant** powered by **Gemma 4** running locally via **Ollama**.

---

## ✨ Features

- ⚡ **Next.js 14** — App Router, SSR, and optimized performance
- 🎨 **Tailwind CSS** — Utility-first responsive styling
- 🔷 **TypeScript** — Full type safety
- 📱 **Mobile-first** — Fully responsive on all devices
- 🔍 **SEO ready** — Open Graph, Twitter Cards, sitemap, robots.txt
- 📦 **PWA manifest** — Web app installable on mobile
- 🤖 **AI Chat** — Free chat assistant powered by Gemma 4 running locally via Ollama (no cloud, no API key required)

---

## 🗂️ Project Structure

```
modern-website/
├── public/
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx       # Root layout + metadata
│   │   ├── manifest.ts      # PWA manifest
│   │   ├── page.tsx         # Home page
│   │   └── sitemap.ts       # Dynamic sitemap
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Services.tsx
│   │   ├── Contact.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   └── styles/
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- [Ollama](https://ollama.com/) installed and running locally

---

## 🤖 AI Chat Setup (Gemma 4 via Ollama)

The chat assistant runs **100% locally** on your machine — no internet connection, no API key, no data sent to the cloud.

### 1. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/download) for your OS (macOS, Linux, Windows).

### 2. Pull the Gemma 4 model

```bash
ollama pull gemma4:e2b
```

> ⚠️ The model is several GB — make sure you have enough disk space and a good connection for the first download.

### 3. Start the Ollama server

```bash
ollama serve
```

Ollama will start listening on `http://localhost:11434` by default.

### 4. Verify it's working

```bash
curl http://localhost:11434/api/tags
```

You should see `gemma4` listed in the response.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/JackSants/Gemma4-Local.git
cd Gemma4-Local
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Make sure Ollama is running (`ollama serve`) before starting the app, otherwise the chat assistant won't respond.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

> ⚠️ Since Gemma 4 runs locally via Ollama, the AI chat feature only works when deployed on a machine with Ollama installed and running. It is **not** compatible with serverless platforms like Vercel out of the box.

For local or self-hosted deployment:

```bash
npm run build
npm run start
```

Make sure `ollama serve` is running alongside the app.

---

## 🧩 Tech Stack

| Technology | Version |
|---|---|
| Next.js | 14.x |
| React | 18.x |
| TypeScript | 5.x |
| Tailwind CSS | 3.x |
| Ollama | latest |
| Gemma 4 | gemma3 (via Ollama) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
