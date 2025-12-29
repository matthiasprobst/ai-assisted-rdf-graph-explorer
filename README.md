<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI-Assisted RDF Graph Explorer

A React application for visualizing and exploring RDF data graphs with AI-powered chat assistance using Google Gemini.

View your app in AI Studio: https://ai.studio/apps/drive/1uz7ybBFbh3Um2LahtlURTJioAaSLfAu9

## Quick Start

### Docker (Recommended)

**Prerequisites:** Docker, Gemini API key

1. **Pull and run with API key:**
   ```bash
   docker run -d \
     --name rdf-explorer \
     -p 8080:80 \
     -e GEMINI_API_KEY=your_gemini_api_key \
     ghcr.io/your-username/ai-assisted-rdf-graph-explorer:latest
   ```

2. **Access:** Open http://localhost:8080

For detailed Docker instructions, see [README-DOCKER.md](README-DOCKER.md).

### Local Development

**Prerequisites:** Node.js, npm/yarn

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up API key:**
   Create `.env.local` with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access:** Open http://localhost:3000

## Features

- 📊 **Interactive RDF Visualization** - Explore RDF graphs with D3.js
- 🐢 **Turtle Format Support** - Parse and visualize RDF/Turtle data
- 🤖 **AI Assistant** - Chat with Gemini to analyze your RDF data
- 📱 **Responsive Design** - Works on desktop and mobile
- 🐳 **Docker Support** - Easy deployment with Docker

## Requirements

- **Gemini API Key** - Required for AI functionality
- **Modern Browser** - Chrome, Firefox, Safari, Edge
