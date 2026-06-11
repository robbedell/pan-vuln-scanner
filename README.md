# PAN-OS Vulnerability Scanner

A fast, Next.js-based web application that performs both **passive external reconnaissance** and **active exploitation** against Palo Alto Networks firewalls. It identifies exposed GlobalProtect and Management interfaces and maps them against critical recent CVEs (2024–2026), with the option to fire active payloads for definitive exploit confirmation.

## Features

- **Passive Reconnaissance**: Identifies exposed interfaces safely without executing disruptive exploit payloads, preventing false positives through strict HTML structure fingerprinting.
- **Active Exploitation Engine (Nuclei)**: Optionally execute active exploit payloads using ProjectDiscovery's Nuclei engine to definitively confirm vulnerabilities.
- **Live Terminal Streaming**: Watch the backend Nuclei engine execute templates in real-time through a beautifully styled, colorized NDJSON-streamed console directly in the UI.
- **Version Awareness**: Specify the target's PAN-OS version to receive dynamic vulnerability assessments (e.g., "Not Exposed, but Firmware Vulnerable").
- **Technical Breakdowns & Lab Setups**: Every CVE card expands to reveal deep technical explanations of the root cause, and step-by-step instructions on how to configure a vulnerable lab device for testing.
- **In-App Updater**: Deploy the latest CVE database additions and scanner code directly from GitHub with a single click in the UI.
- **Premium UI**: Modern, glassmorphism-inspired interface with dynamic animations and color-coded status badges.

## Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Git** (Required for the In-App Updater to function)
- **Nuclei** (Required *only* if you intend to use the Active Exploitation feature locally). You can install it on macOS via `brew install nuclei`.

### Installation & Run

1. Clone the repository and navigate into the project folder:
   ```bash
   git clone https://github.com/robbedell/pan-vuln-scanner.git
   cd pan-vuln-scanner
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Start the development server (runs on port 9999 by default):
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to [http://localhost:9999](http://localhost:9999).

## Running via Docker (Production)

The application is fully containerized using Next.js standalone mode. The Docker container automatically downloads and installs the Nuclei engine, so no host-level dependencies are required!

1. Build the Docker image:
   ```bash
   docker build -t pan-vuln-scanner .
   ```

2. Run the container on port 9999:
   ```bash
   docker run -p 9999:9999 pan-vuln-scanner
   ```

3. Open your browser and navigate to [http://localhost:9999](http://localhost:9999).

## Disclaimer
This tool is for educational and defensive auditing purposes only. Ensure you have explicit authorization before scanning any network infrastructure that does not belong to you, especially when using the Active Exploitation feature.
