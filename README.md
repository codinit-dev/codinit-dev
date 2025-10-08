<div align="center">

![CodinIT.dev Banner](https://codinit.dev/prompt-enhancer.gif)


**Build & Deploy Full-Stack Applications Locally with 100+ AI Providers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/Gerome-Elassaad/codinit-app?style=social)](https://github.com/Gerome-Elassaad/codinit-app/stargazers)
[![GitHub Release](https://img.shields.io/github/v/release/Gerome-Elassaad/codinit-app)](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)

[📖 Documentation](https://gerome-elassaad.github.io/codinit-app) • [🤝 Contributing](CONTRIBUTING.md) • [🌐 Web Version](https://github.com/Gerome-Elassaad/CodingIT)

</div>

---

CodinIT.dev is the **#1 open-source alternative to Bolt.new and Lovable.dev**, offering unparalleled flexibility and control over your AI-powered development workflow.

### 🌟 What Makes Us Different

| Feature | CodinIT.dev | Bolt.new | Lovable.dev |
|---------|-------------|----------|-------------|
| **AI Provider Choice** | 19+ providers (switch per prompt) | Locked to specific models | Locked to specific models |
| **Local Development** | ✅ Full local support + Desktop app | ❌ Cloud only | ❌ Cloud only |
| **Open Source** | ✅ MIT License | ❌ Proprietary | ❌ Proprietary |
| **Self-Hosting** | ✅ Docker & Local | ❌ No | ❌ No |
| **Cost Control** | ✅ Use your own API keys | Subscription-based | Subscription-based |
| **Offline Capable** | ✅ With local models | ❌ No | ❌ No |
| **Code Ownership** | ✅ 100% yours, no lock-in | Limited export | Limited export |
| **Desktop App** | ✅ Native Electron app | ❌ No | ❌ No |

---

## ✨ Key Features

### 🤖 Multi-Provider AI Flexibility
Choose the best AI model for each specific task. Switch between providers on-the-fly:
- **Cloud Providers**: OpenAI, Anthropic, Google Gemini, Groq, xAI (Grok), DeepSeek, Mistral, Cohere, Together AI, Perplexity, HuggingFace, OpenRouter, and more
- **Local Models**: Ollama, LM Studio, and any OpenAI-compatible endpoint
- **Cost Optimization**: Use cheaper models for simple tasks, powerful models for complex features

![Model Selection](https://codinit.dev/models.png)

### 💻 Three Ways to Run
1. **🖥️ Desktop App** - Native Electron application for Windows, macOS, and Linux
2. **🌐 Web Interface** - Run locally in your browser with full WebContainer support
3. **🐳 Docker** - Self-hosted containerized deployment

### 🛠️ Advanced Developer Tools

<div align="center">

![Control Panel](https://codinit.dev/control-panel.png)

</div>

- **🔒 File Locking System** - Prevents conflicts during AI code generation
- **📊 Diff View** - Visual representation of all AI-made changes
- **🔄 Git Integration** - Clone, commit, and deploy with full version control
- **🎯 Project Snapshots** - Restore projects from any previous state
- **🔍 Codebase Search** - Fast search across your entire project
- **📦 MCP Support** - Model Context Protocol for enhanced AI tool integration
- **🎤 Voice Input** - Speak your prompts naturally
- **🖼️ Image Attachments** - Add screenshots and designs to your prompts

### 🚀 Full-Stack Development

- **Complete Stack Generation** - Frontend, backend, and database from natural language
- **Real-Time Preview** - See changes instantly as AI builds
- **Integrated Terminal** - Run commands and scripts directly
- **Database Management** - Supabase integration for data handling
- **React Native Support** - Build mobile apps with Expo

### 📤 Flexible Deployment

Deploy your applications to:
- **Netlify** - One-click deployment
- **Vercel** - Seamless integration
- **GitHub Pages** - Static site hosting
- **Self-Hosted** - Deploy anywhere with Docker
- **Local Export** - Download as ZIP and run locally

---

## 🚀 Quick Start

### Option 1: Desktop App (Recommended)

**Download the latest release for your platform:**

[![Download for Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)
[![Download for macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)
[![Download for Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/Gerome-Elassaad/codinit-app/releases/latest)

**macOS Users:** If you see "This app is damaged", run:
```bash
xattr -cr /Applications/CodinIT.dev.app


### Option 2: Run Locally (Web)

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Clone the repository
git clone https://github.com/Gerome-Elassaad/codinit-app.git
cd codinit-app

# Install dependencies
pnpm install

# Start the development server
pnpm run dev
```

Visit `http://localhost:5173` in your browser

### Option 3: Docker

```bash
# Build the image
docker build -t codinit-app .

# Run the container
docker run -p 5173:5173 codinit-app
```

Or use Docker Compose:
```bash
docker-compose up
```

---

## ⚙️ Configuration

### Setting Up AI Providers

CodinIT.dev offers two ways to configure AI providers:

#### 1. Visual Interface (Recommended for Beginners)

1. Click the **⚙️ Settings** icon in the sidebar
2. Navigate to **Providers** tab
3. Toggle and configure your desired providers
4. Add API keys directly in the interface

![Provider Settings](https://codinit.dev/chat.png)

#### 2. Environment Variables (Recommended for Production)

Create a `.env` file in the project root:

```env
# Cloud Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=your_xai_key

# Provider Base URLs (optional)
OLLAMA_BASE_URL=http://localhost:11434
LM_STUDIO_BASE_URL=http://localhost:1234
OPENAI_LIKE_API_BASE_URL=https://your-custom-endpoint

# Additional Configuration
VITE_LOG_LEVEL=debug
```

### Supported AI Providers

<details>
<summary><b>☁️ Cloud Providers (19+)</b></summary>

| Provider | Models | Best For |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | General purpose, production apps |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | Complex logic, code generation |
| **Google** | Gemini 1.5 Pro, Gemini 1.5 Flash | Fast prototyping, multimodal |
| **Groq** | Llama 3, Mixtral | Ultra-fast inference |
| **xAI** | Grok-2, Grok-2 Vision | Real-time data, reasoning |
| **DeepSeek** | DeepSeek Coder | Specialized code generation |
| **Mistral** | Mixtral 8x7B, Mistral 7B | Cost-effective, efficient |
| **Cohere** | Command R, Command R+ | Enterprise applications |
| **OpenRouter** | Access to 100+ models | Model comparison, flexibility |

</details>

<details>
<summary><b>🏠 Local Providers</b></summary>

| Provider | Description | Setup |
|----------|-------------|-------|
| **Ollama** | Run models locally (Llama, Mistral, etc.) | [Install Ollama](https://ollama.ai) |
| **LM Studio** | User-friendly local model runner | [Install LM Studio](https://lmstudio.ai) |
| **OpenAI-like** | Any OpenAI-compatible API | Configure base URL |

**Privacy & Cost Benefits:**
- ✅ Complete data privacy
- ✅ No API costs
- ✅ Offline capability
- ✅ Unlimited usage

</details>

---

## 📚 Usage Guide

### Creating Your First Application

1. **Choose Your AI Model**
   - Select from the model dropdown (top of chat interface)
   - Different models excel at different tasks

2. **Describe Your Application**
   ```
   Create a task management app with:
   - User authentication
   - Task creation and editing
   - Categories and tags
   - Due dates and reminders
   - Dark mode support
   ```

3. **Review & Iterate**
   - Watch as AI generates your full-stack application
   - Use the diff view to see what changed
   - Request modifications: "Add a calendar view"

4. **Test & Deploy**
   - Test in the integrated preview
   - Use the terminal for debugging
   - Deploy with one click

### Pro Tips

💡 **Model Selection Strategy:**
- Use **Claude 3.5 Sonnet** or **GPT-4** for initial app generation
- Switch to **GPT-3.5** or **Gemini Flash** for simple UI tweaks
- Use **DeepSeek Coder** for complex algorithmic problems
- Try **local models** for privacy-sensitive projects

💡 **Best Practices:**
- Attach UI mockups or screenshots for better results
- Break complex features into smaller prompts
- Use file locking when making manual edits
- Create snapshots before major changes

---

## 🏗️ Architecture

CodinIT.dev is built with modern web technologies:

### Frontend
- **React** - UI framework
- **Remix** - Full-stack framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **UnoCSS** - Utility-first CSS

### Backend
- **Node.js** - Runtime
- **WebContainer API** - Browser-based runtime
- **Cloudflare Workers** - Serverless functions
- **Supabase** - Database & authentication

### AI Integration
- **Vercel AI SDK** - Unified AI provider interface
- **MCP** - Model Context Protocol support
- **Streaming** - Real-time AI responses

### Desktop
- **Electron** - Native desktop application
- **electron-builder** - Cross-platform builds

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build |
| `pnpm run typecheck` | Run TypeScript checks |
| `pnpm run lint` | Check code quality |
| `pnpm run test` | Run test suite |
| `pnpm run deploy` | Deploy to Cloudflare Pages |

### Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm run dockerbuild:dev` | Build development Docker image |
| `pnpm run dockerbuild:prod` | Build production Docker image |
| `pnpm run dockerrun` | Run Docker container |

### Electron Commands

| Command | Description |
|---------|-------------|
| `pnpm run electron:build` | Build Electron app (unpacked) |
| `pnpm run electron:build:mac` | Build for macOS |
| `pnpm run electron:build:win` | Build for Windows |
| `pnpm run electron:build:linux` | Build for Linux |
| `pnpm run electron:build:all` | Build for all platforms |

---

## 🤝 Contributing

We welcome contributions from the community! CodinIT.dev is a collaborative effort to build the best open-source AI development platform.

### Ways to Contribute

- 🐛 **Report Bugs** - [Open an issue](https://github.com/Gerome-Elassaad/codinit-app/issues)
- 💡 **Request Features** - Share your ideas
- 📖 **Improve Documentation** - Help others get started
- 💻 **Submit Code** - Fix bugs or add features
- 🌍 **Translations** - Make CodinIT.dev multilingual

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/codinit-app.git
cd codinit-app

# Install dependencies
pnpm install

# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes and test
pnpm run dev
pnpm run typecheck
pnpm run lint

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

Then open a Pull Request!

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📖 Documentation

- **[Official Documentation](https://gerome-elassaad.github.io/codinit-app)** - Complete guides and tutorials
- **[FAQ](FAQ.md)** - Frequently asked questions
- **[Changelog](CHANGES.md)** - What's new in each version
- **[Project Roadmap](PROJECT.md)** - Future plans and features

---

## 🆚 Comparison with Alternatives

### vs Bolt.new

**Advantages:**
- ✅ 19+ AI providers vs single provider
- ✅ Open source vs proprietary
- ✅ Local development + desktop app
- ✅ Use your own API keys
- ✅ Self-hosting options
- ✅ Advanced diff view and file locking

**Trade-offs:**
- ⚠️ Requires local setup (or use desktop app)
- ⚠️ Self-managed infrastructure

### vs Lovable.dev

**Advantages:**
- ✅ Model flexibility (switch per prompt)
- ✅ Works offline with local models
- ✅ Complete code ownership
- ✅ No vendor lock-in
- ✅ Free to use (bring your own keys)
- ✅ Desktop application available

**Trade-offs:**
- ⚠️ No built-in managed hosting (but easy deployment)
- ⚠️ Requires API key management

---


### ✅ Completed
- [x] 19+ AI provider integrations
- [x] Electron desktop application
- [x] Docker support
- [x] Git integration
- [x] MCP support
- [x] File locking system
- [x] Diff view
- [x] Voice input
- [x] Project snapshots

### 🚧 In Progress
- [ ] Plugin/Extension system
- [ ] Multi-language support
- [ ] Collaborative editing
- [ ] Cloud sync (optional)
- [ ] Mobile app builder enhancements

### 
