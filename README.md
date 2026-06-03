# Pablo Vásquez — Portfolio OS

Portfolio personal construido como un **desktop de Linux tuneado al estilo macOS** — ventanas arrastrables, redimensionables, wallpapers intercambiables y un asistente de IA integrado. Diseñado para que se sienta como un producto, no como una tarea.

**[→ Ver en vivo](https://pvasquez.dev)** · **[GitHub](https://github.com/PabloVS044)**

---

## Por qué este stack

| Decisión | Por qué |
|---|---|
| **Astro** | Hidratación parcial (Islands Architecture). Los componentes WebGL son React puro; el resto es HTML estático. Sin overhead de un SPA completo donde no se necesita. |
| **React** | Para los componentes con estado complejo: el player de música (YouTube API + estado del playlist), el asistente IA (historial de conversación, estados de animación), el selector de wallpapers. |
| **OGL / Three.js** | Dos librerías WebGL distintas. OGL para Aurora y Faulty Terminal (shaders GLSL custom, sin overhead). Three.js para Color Bends y Floating Lines — más ecosistema para geometría y uniforms complejos. |
| **Astro SSR + `/api/chat`** | El chat con Bonzi requiere un endpoint server-side para que la API key no salga al cliente. El endpoint hace el fetch al servidor LLM y devuelve la respuesta — el browser nunca ve las credenciales. |
| **Docker (deploy alternativo)** | El portfolio corre como servidor Node standalone. `astro.config.docker.mjs` usa el Node adapter; `Dockerfile` hace el build multi-stage y sirve con `node dist/server/entry.mjs`. |

---

## Backend de IA — Infraestructura interna Apparel Links

El asistente **Bonzi Buddy** no consume ninguna API de terceros como OpenAI o Anthropic. Consume un servidor de inferencia LLM privado que monté desde cero en Apparel Links S.A.:

- **Modelo**: Qwen3-27B-FP8 (27B parámetros, quantizado a FP8)
- **Engine de inferencia**: sglang con tensor parallelism en multi-GPU
- **Hardware**: Intel Xeon W7-3455 · Dual NVIDIA RTX Pro 6000 Blackwell · 256GB RAM
- **Interfaz**: OpenAI-compatible (`/v1/chat/completions`) — las apps consumen el mismo formato sin cambiar código
- **Autenticación**: backend propio con sistema de API keys; cada consumidor tiene su propia key
- **Persistencia**: modelo montado en volumen Docker desde SSD NVMe local — sin re-descarga al reiniciar contenedores

El mismo servidor también alimenta FilesToData (extracción de datos desde PDFs), apps internas web y móvil, y el coding asistido del equipo de desarrollo vía OpenCode.

El endpoint `/api/chat` del portfolio actúa como proxy: recibe el mensaje del browser, hace el fetch al servidor LLM con la API key guardada en el servidor, y devuelve la respuesta.

---

## Features

- **Desktop OS simulado** — menubar macOS-like con reloj, shortcuts en el escritorio, dock inferior
- **7 ventanas interactivas** — drag, resize (8 handles), maximize/restore, z-index stacking, cierre con ESC
- **Wallpapers dinámicos** — 4 fondos WebGL intercambiables via click derecho + persistencia en `localStorage`
  - *Aurora* (GLSL shader custom con OGL)
  - *Faulty Terminal* (matrix-style con OGL)
  - *Color Bends* (fluid art con Three.js)
  - *Floating Lines* (wave lines interactivas con Three.js)
- **Bonzi Buddy AI** — asistente con Qwen3-27B real que responde sobre mi perfil y abre apps del desktop
- **Music player** — integrado con YouTube API, playlist personalizada
- **Terminal interactiva** — shell simulado con comandos reales (`whoami`, `age`, `skills`, `projects`, `cv`, etc.)
- **Formulario de contacto** — envío real via Web3Forms

---

## Estructura del proyecto

```
src/
├── components/
│   ├── desktop/          # Ventanas: Terminal, Obsidian, VSCode, CV, Music, Skills, Mail, BonziBuddy
│   └── react/            # React: WallpaperManager, BonziBuddy, MusicWidget, backgrounds WebGL
├── pages/
│   ├── index.astro       # Entry point
│   └── api/
│       └── chat.ts       # Endpoint SSR — proxy autenticado al servidor LLM interno
├── scripts/
│   └── desktop.js        # Window manager, drag/resize, clock, terminal, VSCode showcase
└── styles/
    └── desktop.css       # Sistema de estilos del OS
```

---

## Correr localmente

```bash
npm install
cp .env.example .env   # completar variables

npm run dev            # dev server con hot reload
npm run build          # build para Vercel (producción)
```

## Correr con Docker

```bash
cp .env.example .env   # completar variables

docker compose up -d   # build + run en puerto 4321
docker compose down    # detener
```

El `Dockerfile` usa `astro.config.docker.mjs` (Node adapter) en lugar del Vercel adapter. El build es multi-stage: imagen final ~180MB, usuario no-root, healthcheck incluido.

---

## Variables de entorno

```env
PUBLIC_WEB3FORMS_ACCESS_KEY=   # web3forms.com — formulario de contacto

# Servidor LLM on-premise (Apparel Links) — interfaz OpenAI-compatible
PUBLIC_AGENT_API_URL=          # URL base del servidor sglang
PUBLIC_AGENT_API_KEY=          # API key de acceso
PUBLIC_AGENT_MODEL=            # Nombre del modelo (ej: Qwen/Qwen3.6-27B-FP8)
```

---

## Tech stack completo

**Frontend** — Astro 6, React 19, Three.js, OGL, GLSL shaders  
**Backend** — Node.js (Astro SSR), proxy server-side a LLM on-premise  
**IA** — Qwen3-27B-FP8 via sglang (infraestructura interna Apparel Links)  
**Integraciones** — YouTube IFrame API, Web3Forms  
**Deploy** — Vercel (producción) / Docker + Node standalone (self-hosted)  
**Tooling** — Vite, npm, Docker

---

## Proyectos dentro del portfolio

| Proyecto | Descripción | Stack |
|---|---|---|
| **FilesToData** | Sistema enterprise de extracción de datos desde PDFs industriales. En producción en Apparel Links. | Blazor, .NET 10, FastAPI, Docker, Azure DI |
| **AI Inference Server** | Servidor LLM privado on-premise con sglang + Qwen3-27B-FP8. Backend con auth y multi-tenant. | sglang, Docker, Python, NVIDIA CUDA |
| **WaterWay+** | Monitoreo del Río Motagua. 1er lugar Hackathon Copernicus 2025 (SENACYT). | React, Leaflet, Node.js, MongoDB |
| **ChemiQ** | Portal en producción para Asociación de Química UVG. | React, Node.js, PostgreSQL, Supabase |
| **SeaSOS** | Landing educativa sobre ecosistemas marinos. Mapa interactivo + heatmap. | React, Leaflet, Google Charts, Firebase |
