# PAN-OS Vulnerability Scanner

A fast, Next.js-based web application that performs both **passive external reconnaissance** and **active exploitation** against Palo Alto Networks firewalls. It integrates directly with **local AI models** (like Ollama and Open WebUI) to analyze active exploit payloads, generate custom CLI mitigation scripts, and auto-generate comprehensive Penetration Testing PDF reports.

## Core Features

- **Passive Reconnaissance**: Identifies exposed GlobalProtect and Management interfaces safely without executing disruptive exploit payloads.
- **Active Exploitation Engine (Nuclei)**: Optionally execute active exploit payloads using ProjectDiscovery's Nuclei engine to definitively confirm vulnerabilities.
- **Live Terminal Streaming**: Watch the backend Nuclei engine execute templates in real-time through a beautifully styled, colorized NDJSON-streamed console directly in the UI.
- **In-App Updater**: Deploy the latest CVE database additions and scanner code directly from GitHub with a single click in the UI.
- **Premium UI**: Modern, glassmorphism-inspired interface with dynamic animations, responsive flex layouts, and color-coded status badges.

## AI Integration Engine 🤖

The scanner acts as an intelligent proxy, bypassing CORS to securely route requests to your local AI endpoints (`http://localhost:11434` or `http://localhost:3000`).

- **Ask AI Analyst**: Inside any identified vulnerability card, click "Ask AI Analyst" to inject the CVE's root cause and your target's firmware version into your local AI, which will generate exact, firmware-specific PAN-OS CLI mitigation scripts.
- **Smart Payload Analysis**: During an active scan, if an exploit extracts sensitive data (like `/etc/passwd` or configs), the AI instantly analyzes the raw data in the background and prints its assessment directly into the live terminal window!
- **AI-Powered Penetration Reports (PDF)**: Ditch static markdown. The scanner feeds your entire scan context (interfaces, exploits, CVE data) into the AI, prompting it to act as a Senior Security Engineer. The frontend then seamlessly renders the massive markdown response and uses `html2pdf.js` to convert it into a beautifully styled, professional "light-mode" PDF for instant download.

## Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Git** (Required for the In-App Updater to function)
- **Nuclei** (Required *only* if you intend to use the Active Exploitation feature locally). You can install it on macOS via `brew install nuclei`.
- **Local AI** (Optional): Ollama or Open WebUI running locally if you wish to use the AI features.

### Installation & Run

1. Clone the repository and navigate into the project folder:
   ```bash
   git clone https://github.com/robbedell/pan-vuln-scanner.git
   cd pan-vuln-scanner
   ```

2. Install the core dependencies (including `html2pdf.js`, `react-markdown`, and `remark-gfm` for AI rendering):
   ```bash
   npm install
   ```

3. Start the development server (runs on port 9999 by default):
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to [http://localhost:9999](http://localhost:9999).

5. **Configure AI:** Click the ⚙️ icon in the top right corner. Enter your local API base URL (e.g. `http://localhost:3000/api` or `http://localhost:11434/v1`), your model name, and your API Key (for Open WebUI, you can extract the `token` from your browser's Local Storage if you lack admin privileges to generate one). Hit **Test Connection**.

Alternatively, you can set default AI configurations in a `.env.local` file at the root of the project:
```env
NEXT_PUBLIC_AI_BASE_URL=http://localhost:11434/v1
NEXT_PUBLIC_AI_MODEL=llama3
NEXT_PUBLIC_AI_API_KEY=sk-local
```

## Running via Docker (Production)

The application is fully containerized using Next.js standalone mode. The Docker container automatically downloads and installs the Nuclei engine, so no host-level dependencies are required!

1. Build the Docker image:
   ```bash
   docker build -t pan-vuln-scanner .
   ```

2. Run the container on port 9966:
   ```bash
   docker run -p 9966:9966 pan-vuln-scanner
   ```

3. Open your browser and navigate to [http://localhost:9966](http://localhost:9966).

## Disclaimer
This tool is for educational and defensive auditing purposes only. Ensure you have explicit authorization before scanning any network infrastructure that does not belong to you, especially when using the Active Exploitation feature.
