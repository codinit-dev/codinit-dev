<p align="center">
  <a href="/readme_assets/walkthrough.mp4">
    ▶️ Watch Full Demo Video
  </a>
</p>

<p align="center">
  <a href="https://sourceforge.net/projects/codinit-dev/files/latest/download">
    <img alt="Download CodinIT.dev" src="https://img.shields.io/sourceforge/dm/codinit-dev.svg">
  </a>
</p>

<p align="center">
  <a href="https://huntscreens.com/en/products/codinit" target="_blank" title="Featured on HuntScreens">
    <img src="https://shot.huntscreens.com/badge.svg" alt="Featured on HuntScreens" width="240" height="60"/>
  </a>
  <br/><br/>
  <a href="https://sourceforge.net/projects/codinit-dev/files/latest/download">
    <img alt="Download CodinIT.dev"
         src="https://a.fsdn.com/con/app/sf-download-button"
         width="276"
         height="48"
         srcset="https://a.fsdn.com/con/app/sf-download-button?button_size=2x 2x">
  </a>
</p>

<p align="center">
  <strong>⚡ CodinIT.dev — OpenSource AI App Builder ⚡</strong><br/>
  Build, manage, and deploy intelligent applications directly from your browser or desktop.
</p>

---

## 🚀 Quick Start

Get up and running with **CodinIT.dev** in just a few steps.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Gerome-Elassaad/codinit-app.git
cd codinit-app
````

### Install Dependencies

```bash
# npm
npm install

# or pnpm
pnpm install

# or yarn
yarn install
```

### 2️⃣ Set Up the Database

Ensure you have a PostgreSQL database running. (Supabase recommended.)

### 3️⃣ Configure Environment

```bash
cp .env.example .env.local
```

Add your keys:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Run the Dev Server

```bash
pnpm run dev
```

The app will be available at:
👉 [http://localhost:5173](http://localhost:5173)

---

## 🧩 Key Features

* 🧠 AI-powered full-stack development for Node.js apps
* 🌐 Integrations with 19+ AI providers
* 🖥️ Web + Desktop (Electron) support
* 🐳 Docker-ready, deployable to Vercel/Netlify/GitHub Pages
* 🔍 Built-in search, diff view, and file locking system
* 🧰 Supabase integration, data visualization, and voice prompting

---

## 🔑 API Providers

**Cloud Providers:**
OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Cohere, Mistral, Together, Perplexity, HuggingFace, OpenRouter, and more.

**Local:**
Ollama, LM Studio, OpenAI-compatible local endpoints.

---

## 🖥️ Desktop & Docker Options

### Run via Docker

```bash
npm run dockerbuild
docker compose --profile development up
```

### Run as Desktop App

Download the latest release:
👉 [https://github.com/Gerome-Elassaad/codinit-app/releases/latest](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)

---

## 🤝 Contributing

We welcome contributions!
Open an issue, submit a PR, or join discussions to help shape the future of CodinIT.dev.

---

<p align="center">
  <strong>CodinIT.dev — Build Faster. Code Smarter.</strong><br/>
  <a href="https://codinit.dev/download">Download the latest version →</a>
</p>
```

