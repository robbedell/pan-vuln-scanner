# PAN-OS Vulnerability Scanner

A fast, Next.js-based web application that performs passive external reconnaissance against Palo Alto Networks firewalls. It checks for exposed GlobalProtect and Management interfaces and maps them against critical recent CVEs (2024–2026).

## Features

- **Passive Reconnaissance**: Identifies exposed interfaces safely without executing disruptive exploit payloads.
- **Accurate Fingerprinting**: Strictly identifies GlobalProtect and PAN-OS Management portals using precise HTML structure checks.
- **CVE Database**: Automatically cross-references exposed interfaces with high-severity vulnerabilities like CVE-2024-3400, CVE-2026-0257, and CVE-2025-0108.
- **Premium UI**: Modern, glassmorphism-inspired interface with a responsive dashboard.

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)

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

The application is fully containerized using Next.js standalone mode and can be run effortlessly on any system supporting Docker.

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
This tool is for educational and defensive auditing purposes only. Ensure you have explicit authorization before scanning any network infrastructure that does not belong to you.
