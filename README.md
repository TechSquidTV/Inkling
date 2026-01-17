# Inkling (Vibe App Template)

The perfect personal software template for your next self-hosted project. A custom Go + React stack built for ease of use and speed.

<img width="2274" height="1408" alt="image" src="https://github.com/user-attachments/assets/b9300603-8917-4f2c-bedc-5c79347cd1e6" />

## Why does this exist?

When building personal apps, I found myself often wasting a lot of time and tokens rebuilding similar boilerplate code for each app. With this app template, you can begin building all of your personal apps right away with a consistent clean, and fast base.

## ✨ Features

- **🔐 Robust Auth**: OIDC (OpenID Connect) for SSO and secure API Key authentication.
- **⚡️ Modern UI**: Built with Shadcn UI + Animate-UI.
- **🎨 Themable**: Easily customizable design system built on Tailwind CSS v4.
- **🚀 AI-Ready**: Well documented and prepared for AI Agents.
- **📦 SQLite Powered**: Zero-config database setup with GORM.
- **🔥 Hot Reload**: Development servers with hot reload for instant feedback.
- **🛠 Tooling**: Makefile for dev/build workflow.
- **🏃‍♂️‍➡️ FAST**: Go backend for fast performance and low resource usage.
- **📦 Single Binary**: The backend is compiled into a single binary for easy deployment.
- **📊 Log Viewer**: Real-time application logs. Disabled by default.
- **👀 Observability**: OpenTelemetry on the backend + Sentry on the frontend.


---

## 🚀 Quick Start

### Prerequisites
- [Go 1.22+](https://go.dev/dl/)
- [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/)

### Installation
1. **Clone and install dependencies:**
   ```bash
   make install
   ```
2. **Start the development servers:**
   ```bash
   make dev
   ```
   *The backend will run on `localhost:8080` (with OpenAPI docs at `/docs`) and the frontend on `localhost:5173`.*

### Customizing the App

Modify the `web/src/constants.ts` file to change the app name, logo, description, and other metadata.

---

## 🛠 Tech Stack

**Frontend:**
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/) & [Animate-UI](https://animate-ui.com/)
- [LogTape](https://logtape.dev/) (Structured Logging)

**Backend:**
- [Huma](https://github.com/danielgtaylor/huma) (OpenAPI 3.1 & JSON Schema)
- [Chi](https://github.com/go-chi/chi) (Router)
- [GORM](https://gorm.io/) (ORM)
- [Charm Log](https://github.com/charmbracelet/log) (Structured Logging)

---

## 📖 Documentation

Explore the following for more details:
- [Architecture Overview](docs/architecture/backend.md)
- [Authentication Guide (OIDC)](docs/guides/OIDC.md)

---

## AI Agent Support

This project contains an AGENTS.md file in the root directory with basic project context for AI Agents to use. Not _all_ AI Agents respect this file, you may need to add an additional rule file for your agent that points to this file.

## Recommended MCP Servers

- https://ui.shadcn.com/docs/mcp
- https://animate-ui.com/docs/mcp

---

## FAQ

### Why Go + React?

React is not only the most popular frontend framework, supporting the most tooling and community, but is also the framework most LLM Agents will excel at. Typically you might pair this with a Node.js Backend or use Next.js, but not knowing a lower level language like Go is no longer a barrier with AI-assisted coding. We use Go for its efficiency, small size, and ridiculous speed.

### Why not Rust?

[image](https://tenor.com/view/meh-the-simpsons-couch-whatever-gif-25776096)

### Why not Next.js?

Because Go is faster.

## 📜 License
MIT License.
