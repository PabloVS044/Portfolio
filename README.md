# Pablo Vásquez — Portfolio OS

Portfolio personal construido como un **desktop de Linux tuneado al estilo macOS** — ventanas arrastrables, redimensionables, wallpapers intercambiables y un asistente de IA integrado. Diseñado para que se sienta como un producto, no como una tarea.

**[→ Ver en vivo](#)** · **[GitHub](https://github.com/PabloVS044)**

---

## Por qué este stack

| Decisión | Por qué |
|---|---|
| **Astro** | Hidratación parcial (Islands Architecture). Los componentes WebGL son React puro; el resto es HTML estático. Sin overhead de un SPA completo donde no se necesita. |
| **React** | Para los componentes con estado complejo: el player de música (YouTube API + estado del playlist), el asistente IA (historial de conversación, estados de animación), el selector de wallpapers. |
| **OGL / Three.js** | Dos librerías WebGL distintas. OGL para Aurora y Faulty Terminal (shaders GLSL custom, sin overhead). Three.js para Color Bends y Floating Lines — más ecosistema para geometría y uniforms complejos. |
| **Astro SSR (Node adapter)** | El chat con el LLM requiere un endpoint server-side para no exponer la API key al cliente. `output: "server"` con `@astrojs/node` convierte el portfolio en un servidor real, no solo un sitio estático. |

---

## Features

- **Desktop OS simulado** — menubar macOS-like con reloj, shortcuts en el escritorio, dock inferior
- **6 ventanas interactivas** — drag, resize (8 handles), maximize/restore, z-index stacking, cierre con ESC
- **Wallpapers dinámicos** — 4 fondos WebGL intercambiables via click derecho + persistencia en `localStorage`
  - *Aurora* (GLSL shader custom con OGL)
  - *Faulty Terminal* (matrix-style con OGL)
  - *Color Bends* (fluid art con Three.js)
  - *Floating Lines* (wave lines interactivas con Three.js)
- **Bonzi Buddy AI** — asistente LLM (Qwen 27B) que responde sobre mi perfil y puede abrir apps del desktop
- **Music player** — integrado con YouTube API, lista de reproducción personalizada
- **Terminal interactiva** — shell simulado con comandos reales (`whoami`, `skills`, `projects`, `cv`, etc.)
- **Formulario de contacto** — envío real via Web3Forms

---

## Estructura del proyecto

```
src/
├── components/
│   ├── desktop/          # Ventanas: Terminal, Obsidian, VSCode, CV, Music, Skills, Mail, BonziBuddy
│   └── react/            # Componentes React: WallpaperManager, BonziBuddy, MusicWidget, backgrounds WebGL
├── pages/
│   ├── index.astro       # Entry point
│   └── api/
│       └── chat.ts       # Endpoint SSR — proxy al LLM (API key server-side)
├── scripts/
│   └── desktop.js        # Lógica del desktop: window manager, drag/resize, clock, terminal
└── styles/
    └── desktop.css       # Sistema de estilos del OS
```

---

## Correr localmente

```bash
# Instalar dependencias
npm install

# Variables de entorno (copiar y completar)
cp .env.example .env

# Dev server
npm run dev

# Build de producción
npm run build

# Correr servidor de producción
node dist/server/entry.mjs
```

### Variables de entorno requeridas

```env
PUBLIC_WEB3FORMS_ACCESS_KEY=   # web3forms.com — formulario de contacto
PUBLIC_AGENT_API_URL=          # URL base del LLM (OpenAI-compatible)
PUBLIC_AGENT_API_KEY=          # API key del LLM
PUBLIC_AGENT_MODEL=            # Nombre del modelo
```

---

## Tech stack completo

**Frontend** — Astro 6, React 19, Three.js, OGL, GLSL shaders  
**Backend** — Node.js (Astro SSR), fetch server-side a LLM externo  
**Integraciones** — YouTube IFrame API, Web3Forms, LLM OpenAI-compatible  
**Tooling** — Vite, npm

---

## Proyectos destacados dentro del portfolio

### WaterWay+ — 1er lugar Hackatón Copernicus 2025 (SENACYT)
Plataforma colaborativa para monitoreo y protección de ríos. Datos satelitales del programa Copernicus + análisis con OpenAI. Stack: React, Node.js, Express, MongoDB.

### ChemiQ — En producción
Portal web para la Asociación de Química de la Universidad del Valle de Guatemala. Backend con PostgreSQL, Supabase y Knex.js. Stack: React, Node.js, PostgreSQL, Express.
