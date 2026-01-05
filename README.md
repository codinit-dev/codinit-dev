<p align="center">
  <img
    width="1270"
    height="630"
    alt="CodinIT.dev Hero"
    src="https://github.com/user-attachments/assets/7d522f08-bbab-47ee-a47f-0b9c92445cdc"
  />
</p>

<p align="center">
  <a href="https://fazier.com/launches/codinit" target="_blank">
    <img
      src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=6267&badge_type=weekly&theme=light"
      width="270"
      alt="Fazier badge"
    />
  </a>
  &nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;
  <a
    href="https://peerpush.net/p/build-your-next-app-with-ai"
    target="_blank"
    rel="noopener"
  >
    <img
      src="https://peerpush.net/p/build-your-next-app-with-ai/badge.png"
      alt="CodinIT.dev badge"
      width="230"
    />
  </a>
</p>

<h1 align="center">CodinIT.dev — Open‑Source AI App Builder</h1>

<p align="center">
  Build, manage, and deploy intelligent applications faster — directly from your browser or desktop.
</p>

---

## Overview

CodinIT.dev is an open‑source, AI full‑stack development platform designed to help developers build modern Node.js applications with speed and precision. It combines code generation, project management, and deployment tools into a single workflow, powered by your choice of AI providers.

Whether you are prototyping, scaling a SaaS product, or experimenting with local LLMs, CodinIT.dev adapts to your stack and workflow.

---

## Quick Start

### Run as a Desktop App

Download the latest prebuilt release for macOS, Windows, and Linux.

[Download Latest Release](https://github.com/codinit-dev/codinit-dev/releases/latest)

Get up and running in minutes.

### 1. Clone the Repository

```bash
git clone https://github.com/codinit-dev/codinit-dev.git
cd codinit-dev

```

### 2. Install Dependencies

```bash
# npm
npm install

# or pnpm
pnpm install

```

### 3. Configure Environment

Create a `.env` file and add your preferred AI provider keys. You can mix and match multiple providers depending on your requirements.

### 4. Run the Development Server

```bash
pnpm run dev

```

The application will be available at: http://localhost:5173

---

## Core Capabilities

- **Automated Full-Stack Engineering:** Streamline the creation and management of complex Node.js architectures using intelligent generation.
- **Universal Model Integration:** Seamlessly connect with over 19 cloud and local AI providers.
- **Hybrid Environment Support:** native compatibility for both Web browsers and Desktop (Electron) environments.
- **Production-Ready Containerization:** Fully Dockerized workflow with preset configurations for Vercel, Netlify, and GitHub Pages.
- **Integrated Development Suite:** Includes robust utilities such as semantic search, diff visualization, and concurrency file-locking.
- **Expanded Ecosystem Connectivity:** Native integration with Supabase, real-time data visualization tools, and voice-command interfaces.
- **Vendor-Neutral Infrastructure:** A flexible architecture designed to prevent vendor lock-in, allowing dynamic switching between backend providers.

---

## Supported AI Providers

CodinIT.dev allows you to use one provider or switch dynamically per task.

### Cloud Providers

OpenAI, Anthropic, Google, Groq, xAI, DeepSeek, Cohere, Mistral, Together, Perplexity, HuggingFace, OpenRouter, and more.

### Local Providers

Ollama, LM Studio, and OpenAI‑compatible local endpoints.

---

## Deployment & Desktop Usage

### Run with Docker

```bash
npm run dockerbuild
docker compose --profile development up

```


