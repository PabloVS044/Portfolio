import { useState, useEffect, useRef, useCallback } from 'react';
import './css/BonziBuddy.css';

const SYSTEM_PROMPT = `Eres Bonzi, el asistente de IA del portafolio de Pablo Vásquez. Respondes preguntas sobre Pablo de forma amigable y concisa (máximo 3 oraciones). Hablas en español.

Cuando sea relevante, sugiere abrir una app añadiendo UNA de estas etiquetas al FINAL de tu respuesta (nunca en medio):
#open:projects #open:career #open:cv #open:skills #open:contact #open:about

Información sobre Pablo Vásquez:
- Desarrollador Full Stack & DevOps. Guatemala.
- Trabajo actual: Desarrollador de Software e IA en Apparel Links S.A. (Ene 2025 - presente).
  Flujos de IA, integración de modelos en apps internas, admin de servidores Linux, Docker, CI/CD, modelos de IA autoalojados.
- Trabajo anterior: Soporte Técnico y Dev Web en Transcafe S.A. (Jul–Nov 2023).
- Educación: Ingeniería en Ciencias de la Computación, Universidad del Valle de Guatemala (2024–2028). Becario de mérito (Fundación Juan Bautista Gutiérrez). Primer lugar Hackatón Copernicus 2025 (SENACYT) con WaterWay+.
- Kinal – Perito en Computación (2021–2023).
- Skills: React, JavaScript, TypeScript, Node.js, Python, Docker, Astro, Next.js, C#, .NET, PostgreSQL, MySQL, MongoDB, Supabase, AWS, Git, Linux, Figma.
- Proyectos: WaterWay+ (monitoreo ambiental de ríos con datos satelitales Copernicus + IA, 1er lugar SENACYT 2025), ChemiQ (portal web para Asociación de Química UVG, en producción).
- GitHub: github.com/PabloVS044 | Email: pvasquezs044@gmail.com`;

const ACTION_MAP = {
	'#open:projects': '[data-open-code]',
	'#open:career':   '[data-open-obsidian]',
	'#open:cv':       '[data-open-cv]',
	'#open:skills':   '[data-skills-shortcut]',
	'#open:contact':  '[data-mail-shortcut]',
	'#open:about':    '[data-open-terminal]',
};

function triggerApp(selector) {
	const el = document.querySelector(selector);
	if (el) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
}

export default function BonziBuddy() {
	const [pos, setPos] = useState({ x: -1, y: -1 });
	const posRef = useRef({ x: -1, y: -1 });
	const [agentState, setAgentState] = useState('idle');
	const [chatOpen, setChatOpen] = useState(false);
	const [bubble, setBubble] = useState(null);
	const [inputVal, setInputVal] = useState('');
	const [loading, setLoading] = useState(false);
	const [history, setHistory] = useState([]);
	const bubbleTimer = useRef(null);
	const dragMoved = useRef(false);
	const inputRef = useRef(null);
	// Init position: right edge, vertically centered
	useEffect(() => {
		const x = window.innerWidth - 138;
		const y = Math.round(window.innerHeight / 2) - 70;
		setPos({ x, y });
		posRef.current = { x, y };
	}, []);

	// Focus input when panel opens
	useEffect(() => {
		if (chatOpen) setTimeout(() => inputRef.current?.focus(), 60);
	}, [chatOpen]);

	// Drag
	const handlePointerDown = useCallback((e) => {
		if (e.button !== 0) return;
		if (e.target.closest('.bonzi-chat-panel, .bonzi-input, .bonzi-send-btn, .bonzi-chat-close')) return;

		e.preventDefault();
		dragMoved.current = false;

		const startX = e.clientX - posRef.current.x;
		const startY = e.clientY - posRef.current.y;

		const onMove = (ev) => {
			const nx = Math.min(Math.max(0, ev.clientX - startX), window.innerWidth - 130);
			const ny = Math.min(Math.max(36, ev.clientY - startY), window.innerHeight - 150);
			const dx = Math.abs(ev.clientX - (startX + posRef.current.x));
			const dy = Math.abs(ev.clientY - (startY + posRef.current.y));
			if (dx > 3 || dy > 3) dragMoved.current = true;
			posRef.current = { x: nx, y: ny };
			setPos({ x: nx, y: ny });
		};

		const onUp = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}, []);

	const handleSpriteClick = useCallback(() => {
		if (dragMoved.current) return;
		setChatOpen(prev => !prev);
		if (bubble) {
			clearTimeout(bubbleTimer.current);
			setBubble(null);
			setAgentState('idle');
		}
	}, [bubble]);

	const showBubble = (text, ms = 9000) => {
		clearTimeout(bubbleTimer.current);
		setBubble(text);
		setAgentState('talking');
		bubbleTimer.current = setTimeout(() => {
			setBubble(null);
			setAgentState('idle');
		}, ms);
	};

	const sendMessage = useCallback(async () => {
		const text = inputVal.trim();
		if (!text || loading) return;

		setInputVal('');
		setLoading(true);
		setAgentState('thinking');
		setBubble(null);

		const newHistory = [...history, { role: 'user', content: text }];
		setHistory(newHistory);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [
						{ role: 'system', content: SYSTEM_PROMPT },
						...newHistory,
					],
				}),
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const data = await res.json();
			const msg = data.choices?.[0]?.message;
			const rawReply = msg?.content ?? msg?.reasoning ?? null;
			let reply = rawReply?.trim() || 'No pude responder, intenta de nuevo.';

			// Extract action tag
			let action = null;
			for (const [tag, selector] of Object.entries(ACTION_MAP)) {
				if (reply.includes(tag)) {
					action = selector;
					reply = reply.replaceAll(tag, '').trim();
					break;
				}
			}

			setHistory([...newHistory, { role: 'assistant', content: reply }]);
			setLoading(false);
			showBubble(reply);

			if (action) {
				setTimeout(() => triggerApp(action), 1400);
			}
		} catch (err) {
			setLoading(false);
			showBubble('¡Oops! No pude conectar al servidor. Intenta de nuevo.');
			setAgentState('idle');
		}
	}, [inputVal, loading, history]);

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
		if (e.key === 'Escape') setChatOpen(false);
	};

	if (pos.x === -1) return null;

	// Panel side: left if bonzi is in right half, right if in left half
	const panelSide = pos.x > window.innerWidth / 2 ? 'left' : 'right';

	return (
		<div
			className="bonzi-root"
			style={{ left: pos.x, top: pos.y }}
		>
			{/* Speech bubble */}
			{bubble && (
				<div className="bonzi-bubble">
					{bubble}
				</div>
			)}

			{/* Sprite */}
			<div
				className={`bonzi-sprite bonzi-sprite--${agentState}`}
				onPointerDown={handlePointerDown}
				onClick={handleSpriteClick}
				aria-label="Bonzi — asistente de IA. Click para chatear."
				role="button"
				tabIndex={0}
			>
				<img src="/desktop/bonzi.png" alt="Bonzi Buddy" draggable={false} />
				{agentState === 'thinking' && (
					<div className="bonzi-thinking-dots" aria-hidden="true">
						<span /><span /><span />
					</div>
				)}
			</div>

			{/* Chat panel */}
			{chatOpen && (
				<div
					className={`bonzi-chat-panel bonzi-chat-panel--${panelSide}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="bonzi-chat-header">
						<span>💬 Pregúntale a Bonzi</span>
						<button
							className="bonzi-chat-close"
							onClick={() => setChatOpen(false)}
							aria-label="Cerrar"
						>×</button>
					</div>

					<div className="bonzi-chat-input-row">
						<input
							ref={inputRef}
							className="bonzi-input"
							type="text"
							placeholder={loading ? 'Pensando…' : '¿Qué proyectos tiene Pablo?'}
							value={inputVal}
							onChange={(e) => setInputVal(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={loading}
							autoComplete="off"
							spellCheck={false}
						/>
						<button
							className="bonzi-send-btn"
							onClick={sendMessage}
							disabled={loading || !inputVal.trim()}
							aria-label="Enviar"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<line x1="22" y1="2" x2="11" y2="13" />
								<polygon points="22 2 15 22 11 13 2 9 22 2" />
							</svg>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
