<p align="center">
  <img src="/readme_assets/readme.png" alt="CodinIT Hero" width="80%" />
</p>

<p align="center">
  <strong>⚡ CodinIT.dev — The AI-Powered Full-Stack Development Platform ⚡</strong><br/>
  Build, manage, and deploy intelligent applications directly from your browser or desktop.
</p>

---

## 🚀 Quick Start

Get up and running with **CodinIT** in just a few steps.

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Gerome-Elassaad/codinit-app.git
cd codinit-app
````

### 2️⃣ Install Dependencies

```bash
# npm
npm install

# or pnpm
pnpm install

# or yarn
yarn install
```

### 3️⃣ Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your provider keys:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 4️⃣ Run the Dev Server

```bash
pnpm run dev
```

The app will be available at 👉 [http://localhost:5173](http://localhost:5173)

---

## 🧩 Key Features

* 🧠 **AI-powered full-stack development** for Node.js apps
* 🌐 **Integrations with 19+ AI providers** (OpenAI, Anthropic, Google, Groq, etc.)
* 🖥️ **Web and Desktop support** (Electron app included)
* 🐳 **Docker-ready** and deployable to **Vercel**, **Netlify**, or **GitHub Pages**
* 🔍 **Built-in search, diff view, and file locking system**
* 🧰 **Supabase integration**, **data visualization**, and **voice prompting**

---

## 🔑 API Providers

Easily manage API keys via the settings panel or `.env.local` file.
Supported providers include:

**Cloud:** OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Cohere, Mistral, Together, Perplexity, HuggingFace, OpenRouter, and more.
**Local:** Ollama, LM Studio, OpenAI-compatible endpoints.

---

## 🖥️ Desktop & Docker Options

### Run via Docker

```bash
npm run dockerbuild
docker compose --profile development up
```

### Run as Desktop App

Download the latest release for your OS:
👉 [CodinIT Releases](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)

---

## 🤝 Contributing

We welcome contributions!
Open an issue, submit a pull request, or join discussions to help improve CodinIT.

---

<p align="center">
  <strong>🧠 CodinIT.dev — Build Faster. Code Smarter.</strong><br/>
  <a href="https://github.com/Gerome-Elassaad/codinit-app/releases/latest">Download the latest version →</a>
</p>
```
