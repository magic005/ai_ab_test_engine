# AI A/B Test Engine

A universal, API-first A/B testing platform that allows you to run AI-generated experiments on any website without touching production code.

This project is built using:
- Next.js (App Router)
- React, Tailwind CSS
- Prisma with SQLite
- Groq AI (Llama 3) for variant generations

## Overview

The platform consists of three main parts:
1. **REST API & Dashboard:** The core hub where tests are tracked, analytics are gathered, and projects are managed.
2. **JS SDK (`sdk.js`):** A lightweight script injected into customer websites to handle deterministic variant assignment and event tracking.
3. **Admin Overlay (`overlay.js`):** A visual editing interface injected directly into the customer's site. It allows you to point-and-click any element, generate AI variants, and launch a test instantly.

## Local Setup

### 1. Installation

```bash
cd ai_ab_test_engine
npm install
```

### 2. Environment Variables

Create a `.env.local` file with your Groq API key:

```env
GROQ_API_KEY=gsk_...
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
```

### 3. Database Initialization

```bash
npx prisma db push
npx prisma generate
```

### 4. Running the Dashboard

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3000`.

## Integrating with a Website

1. Create a project in the Admin Dashboard to receive your unique project snippet.
2. Insert the generated `<script>` tag into the `<head>` of your website:
   ```html
   <script src="https://ai-ab-test-engine.vercel.app/sdk.js" data-project-id="clx..."></script>
   ```
3. For Jekyll or GitHub Pages sites, include `data-site-baseurl` when assets are served from a subpath:
   ```html
   <script src="https://ai-ab-test-engine.vercel.app/sdk.js" data-project-id="clx..." data-site-baseurl="/pages"></script>
   ```
4. To visually create a test, open your website and append `?ab_admin=true` to the URL. This will activate the Admin Overlay, allowing you to click any visual element and harness AI to rewrite it.
