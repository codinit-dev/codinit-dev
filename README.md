<p align="center">
<div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">

<video autoplay muted loop playsinline class="w-full aspect-video rounded-lg mb-6" src="https://mintcdn.com/codinitdev/oNMhfyXlLQz-6G-R/assets/videos/walkthrough.mp4?fit=max&auto=format&n=oNMhfyXlLQz-6G-R&q=85&s=4ed94113f5d1ba95dae65f32e634c9e2" data-path="assets/videos/walkthrough.mp4">
  Your browser does not support the video tag. You can <a href="https://mintcdn.com/codinitdev/oNMhfyXlLQz-6G-R/assets/videos/walkthrough.mp4?fit=max&auto=format&n=oNMhfyXlLQz-6G-R&q=85&s=4ed94113f5d1ba95dae65f32e634c9e2">download the video</a>.
</video>

</div>

<div>
<a href="https://sourceforge.net/projects/codinit-dev/files/latest/download"><img alt="Download CodinIT.dev" src="https://img.shields.io/sourceforge/dm/codinit-dev.svg" ></a>
</div>

</p>

<p align="center">
  <!-- HuntScreens Feature Badge -->
  <a href="https://huntscreens.com/en/products/codinit" 
     target="_blank" 
     title="Featured on HuntScreens" 
     aria-label="Featured on HuntScreens">
    <img src="https://shot.huntscreens.com/badge.svg" 
         alt="Featured on HuntScreens" 
         width="240" 
         height="60" 
         loading="lazy" />
  </a>

  <br/>

  <!-- SourceForge Download Button (moved under HuntScreens badge) -->
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
```

Install Dependencies

```bash
# npm
npm install

# or pnpm
pnpm install

# or yarn
yarn install
```
### 2️⃣ Set Up the Database

Ensure you have a PostgreSQL database running. You can use Supabase for a quick setup.

### 3️⃣ Configure Environment
```bash
cp .env.example .env.local
```

#### Edit .env.local and add your provider keys:

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

The app will be available at 👉 http://localhost:5173

---

🧩 Key Features

🧠 AI-powered full-stack development for Node.js apps

🌐 Integrations with 19+ AI providers (OpenAI, Anthropic, Google, Groq, etc.)

🖥️ Web and Desktop support (Electron app included)

🐳 Docker-ready and deployable to Vercel, Netlify, or GitHub Pages

🔍 Built-in search, diff view, and file locking system

🧰 Supabase integration, data visualization, and voice prompting



---

🔑 API Providers

Easily manage API keys via the settings panel or .env.local file.
Supported providers include:

Cloud: OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Cohere, Mistral, Together, Perplexity, HuggingFace, OpenRouter, and more.
Local: Ollama, LM Studio, OpenAI-compatible endpoints.


---

🖥️ Desktop & Docker Options

Run via Docker

npm run dockerbuild
docker compose --profile development up

Run as Desktop App

Download the latest release for your OS:
[👉 CodinIT Releases](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)


---

🤝 Contributing

We welcome contributions!
Open an issue, submit a pull request, or join discussions to help improve CodinIT.

---

<p align="center">
  <strong>CodinIT.dev — Build Faster. Code Smarter.</strong><br/>

  <a href="https://github.com/Gerome-Elassaad/codinit-app/releases/latest">Download the latest version →</a>
</p>
