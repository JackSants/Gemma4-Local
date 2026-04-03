# ModernSite 🚀

A modern, responsive professional website built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- ⚡ **Next.js 14** — App Router, SSR, and optimized performance
- 🎨 **Tailwind CSS** — Utility-first responsive styling
- 🔷 **TypeScript** — Full type safety
- 📱 **Mobile-first** — Fully responsive on all devices
- 🔍 **SEO ready** — Open Graph, Twitter Cards, sitemap, robots.txt
- 📦 **PWA manifest** — Web app installable on mobile

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

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/modern-website.git
cd modern-website
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

This project is ready to deploy on **Vercel** (recommended for Next.js):

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect Next.js and deploy automatically

Alternatively, build manually:

```bash
npm run build
npm run start
```

---

## 🧩 Tech Stack

| Technology | Version |
|---|---|
| Next.js | 14.x |
| React | 18.x |
| TypeScript | 5.x |
| Tailwind CSS | 3.x |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
