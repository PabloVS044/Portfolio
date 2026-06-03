const WINDOW_MARGIN = 12;
const WINDOW_HIDE_DELAY = 220;
const DEFAULT_WINDOW_Z_INDEX = 4;

let desktopInitialized = false;
let topDesktopWindowZIndex = 5;

const managedWindows = [];

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

const getTopInset = () => {
	const menubar = document.querySelector('.desktop-menubar');
	return Math.round((menubar?.getBoundingClientRect().bottom ?? 28) + 10);
};

const getViewportLimits = () => ({
	minX: WINDOW_MARGIN,
	minY: getTopInset(),
	maxX: window.innerWidth - WINDOW_MARGIN,
	maxY: window.innerHeight - WINDOW_MARGIN,
});

const getWindowZIndex = (windowElement) => {
	const inlineValue = Number.parseInt(windowElement.style.zIndex, 10);

	if (Number.isFinite(inlineValue)) {
		return inlineValue;
	}

	const computedValue = Number.parseInt(window.getComputedStyle(windowElement).zIndex, 10);
	return Number.isFinite(computedValue) ? computedValue : DEFAULT_WINDOW_Z_INDEX;
};

const bringWindowToFront = (windowElement) => {
	windowElement.style.zIndex = String(topDesktopWindowZIndex);
	topDesktopWindowZIndex += 1;
};

const isInteractiveTarget = (target) =>
	target instanceof Element &&
	Boolean(target.closest('button, input, a, textarea, select, label, [role="button"]'));

const getTopOpenWindow = () => {
	let topWindow = null;
	let highestZIndex = -Infinity;

	for (const entry of managedWindows) {
		if (entry.windowElement.getAttribute('data-open') !== 'true') {
			continue;
		}

		const zIndex = getWindowZIndex(entry.windowElement);

		if (zIndex > highestZIndex) {
			highestZIndex = zIndex;
			topWindow = entry;
		}
	}

	return topWindow;
};

const initClock = () => {
	const clockNode = document.querySelector('[data-desktop-clock]');

	if (!clockNode) {
		return;
	}

	const formatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});

	const updateClock = () => {
		clockNode.textContent = formatter.format(new Date());
	};

	updateClock();
	window.setInterval(updateClock, 30000);
};

const initManagedWindow = ({
	shortcutSelector,
	windowSelector,
	closeSelector,
	minimizeSelector,
	maximizeSelector,
	dragHandleSelector,
	minWidth,
	minHeight,
	defaultWidth,
	defaultHeight,
	defaultXRatio,
	defaultYOffset,
	openMode = 'dblclick',
}) => {
	const shortcut = document.querySelector(shortcutSelector);
	const windowElement = document.querySelector(windowSelector);

	if (!(shortcut instanceof HTMLElement) || !(windowElement instanceof HTMLElement)) {
		return null;
	}

	const closeButton = windowElement.querySelector(closeSelector);
	const minimizeButton = windowElement.querySelector(minimizeSelector);
	const maximizeButton = windowElement.querySelector(maximizeSelector);
	const dragHandle = windowElement.querySelector(dragHandleSelector);
	const resizeHandles = Array.from(windowElement.querySelectorAll('[data-resize-handle]'));
	let hideTimer = 0;
	let interaction = null;
	const frame = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		maximized: false,
		lastNormal: null,
	};

	const clampFrame = (nextFrame) => {
		const limits = getViewportLimits();
		const availableWidth = Math.max(320, limits.maxX - limits.minX);
		const availableHeight = Math.max(280, limits.maxY - limits.minY);
		const constrainedMinWidth = Math.min(minWidth, availableWidth);
		const constrainedMinHeight = Math.min(minHeight, availableHeight);
		const width = clamp(nextFrame.width, constrainedMinWidth, availableWidth);
		const height = clamp(nextFrame.height, constrainedMinHeight, availableHeight);
		const x = clamp(nextFrame.x, limits.minX, limits.maxX - width);
		const y = clamp(nextFrame.y, limits.minY, limits.maxY - height);

		return {
			x,
			y,
			width,
			height,
			maximized: Boolean(nextFrame.maximized),
			lastNormal: nextFrame.lastNormal ?? frame.lastNormal,
		};
	};

	const applyFrame = (nextFrame) => {
		const clampedFrame = clampFrame(nextFrame);
		frame.x = clampedFrame.x;
		frame.y = clampedFrame.y;
		frame.width = clampedFrame.width;
		frame.height = clampedFrame.height;
		frame.maximized = clampedFrame.maximized;
		frame.lastNormal = clampedFrame.lastNormal;

		windowElement.style.left = `${clampedFrame.x}px`;
		windowElement.style.top = `${clampedFrame.y}px`;
		windowElement.style.width = `${clampedFrame.width}px`;
		windowElement.style.height = `${clampedFrame.height}px`;
		windowElement.style.right = 'auto';
		windowElement.style.bottom = 'auto';
		windowElement.setAttribute('data-maximized', clampedFrame.maximized ? 'true' : 'false');
	};

	const getDefaultFrame = () => {
		const limits = getViewportLimits();
		const availableWidth = limits.maxX - limits.minX;
		const availableHeight = limits.maxY - limits.minY;
		const width = Math.min(defaultWidth, availableWidth);
		const height = Math.min(defaultHeight, availableHeight);
		const x = clamp(Math.round(window.innerWidth * defaultXRatio), limits.minX, limits.maxX - width);
		const y = clamp(Math.round(getTopInset() + defaultYOffset), limits.minY, limits.maxY - height);

		return {
			x,
			y,
			width,
			height,
			maximized: false,
			lastNormal: null,
		};
	};

	const maximizeWindow = () => {
		const limits = getViewportLimits();

		if (!frame.maximized) {
			frame.lastNormal = {
				x: frame.x,
				y: frame.y,
				width: frame.width,
				height: frame.height,
			};
		}

		applyFrame({
			x: limits.minX,
			y: limits.minY,
			width: limits.maxX - limits.minX,
			height: limits.maxY - limits.minY,
			maximized: true,
			lastNormal: frame.lastNormal,
		});
	};

	const restoreWindow = () => {
		const restoreFrame = frame.lastNormal ?? getDefaultFrame();

		applyFrame({
			...restoreFrame,
			maximized: false,
			lastNormal: restoreFrame,
		});
	};

	const toggleMaximize = () => {
		if (frame.maximized) {
			restoreWindow();
			return;
		}

		maximizeWindow();
	};

	const showWindow = () => {
		window.clearTimeout(hideTimer);

		if (!frame.width || !frame.height) {
			const nextFrame = getDefaultFrame();
			applyFrame({
				...nextFrame,
				lastNormal: {
					x: nextFrame.x,
					y: nextFrame.y,
					width: nextFrame.width,
					height: nextFrame.height,
				},
			});
		}

		windowElement.hidden = false;
		windowElement.setAttribute('aria-hidden', 'false');
		windowElement.setAttribute('data-open', 'false');
		shortcut.setAttribute('aria-expanded', 'true');
		shortcut.classList.add('desktop-shortcut--active');
		bringWindowToFront(windowElement);
		requestAnimationFrame(() => {
			windowElement.setAttribute('data-open', 'true');
		});
	};

	const hideWindow = () => {
		windowElement.setAttribute('data-open', 'false');
		windowElement.setAttribute('aria-hidden', 'true');
		shortcut.setAttribute('aria-expanded', 'false');
		window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(() => {
			windowElement.hidden = true;
		}, WINDOW_HIDE_DELAY);
	};

	const handleInteractionMove = (event) => {
		if (!interaction) {
			return;
		}

		const limits = getViewportLimits();

		if (interaction.mode === 'drag') {
			const nextX = clamp(
				interaction.originX + (event.clientX - interaction.startX),
				limits.minX,
				limits.maxX - interaction.originWidth,
			);
			const nextY = clamp(
				interaction.originY + (event.clientY - interaction.startY),
				limits.minY,
				limits.maxY - interaction.originHeight,
			);

			applyFrame({
				x: nextX,
				y: nextY,
				width: interaction.originWidth,
				height: interaction.originHeight,
				maximized: false,
				lastNormal: frame.lastNormal,
			});
			return;
		}

		const deltaX = event.clientX - interaction.startX;
		const deltaY = event.clientY - interaction.startY;
		let nextX = interaction.originX;
		let nextY = interaction.originY;
		let nextWidth = interaction.originWidth;
		let nextHeight = interaction.originHeight;
		const currentMinWidth = Math.min(minWidth, limits.maxX - limits.minX);
		const currentMinHeight = Math.min(minHeight, limits.maxY - limits.minY);

		if (interaction.direction.includes('e')) {
			nextWidth = clamp(
				interaction.originWidth + deltaX,
				currentMinWidth,
				limits.maxX - interaction.originX,
			);
		}

		if (interaction.direction.includes('s')) {
			nextHeight = clamp(
				interaction.originHeight + deltaY,
				currentMinHeight,
				limits.maxY - interaction.originY,
			);
		}

		if (interaction.direction.includes('w')) {
			nextX = clamp(
				interaction.originX + deltaX,
				limits.minX,
				interaction.originX + interaction.originWidth - currentMinWidth,
			);
			nextWidth = interaction.originWidth + (interaction.originX - nextX);
		}

		if (interaction.direction.includes('n')) {
			nextY = clamp(
				interaction.originY + deltaY,
				limits.minY,
				interaction.originY + interaction.originHeight - currentMinHeight,
			);
			nextHeight = interaction.originHeight + (interaction.originY - nextY);
		}

		applyFrame({
			x: nextX,
			y: nextY,
			width: nextWidth,
			height: nextHeight,
			maximized: false,
			lastNormal: frame.lastNormal,
		});
	};

	const stopInteraction = () => {
		if (!interaction) {
			return;
		}

		if (!frame.maximized) {
			frame.lastNormal = {
				x: frame.x,
				y: frame.y,
				width: frame.width,
				height: frame.height,
			};
		}

		window.removeEventListener('pointermove', handleInteractionMove);
		window.removeEventListener('pointerup', stopInteraction);
		document.body.classList.remove('desktop--grabbing', 'desktop--resizing');
		document.body.style.userSelect = '';
		interaction = null;
	};

	const startInteraction = (event, mode, direction = '') => {
		if (event.button !== 0 || windowElement.getAttribute('data-open') !== 'true') {
			return;
		}

		event.preventDefault();
		window.clearTimeout(hideTimer);
		bringWindowToFront(windowElement);
		interaction = {
			mode,
			direction,
			startX: event.clientX,
			startY: event.clientY,
			originX: frame.x,
			originY: frame.y,
			originWidth: frame.width,
			originHeight: frame.height,
		};
		document.body.classList.add(mode === 'drag' ? 'desktop--grabbing' : 'desktop--resizing');
		document.body.style.userSelect = 'none';
		window.addEventListener('pointermove', handleInteractionMove);
		window.addEventListener('pointerup', stopInteraction);
	};

	shortcut.addEventListener('click', (event) => {
		shortcut.classList.add('desktop-shortcut--active');

		if (openMode === 'click') {
			event.preventDefault();
			showWindow();
		}
	});

	if (openMode === 'dblclick') {
		shortcut.addEventListener('dblclick', (event) => {
			event.preventDefault();
			showWindow();
		});
	}

	closeButton?.addEventListener('click', hideWindow);
	minimizeButton?.addEventListener('click', hideWindow);
	maximizeButton?.addEventListener('click', toggleMaximize);

	dragHandle?.addEventListener('pointerdown', (event) => {
		if (frame.maximized || isInteractiveTarget(event.target)) {
			return;
		}

		startInteraction(event, 'drag');
	});

	dragHandle?.addEventListener('dblclick', (event) => {
		if (!isInteractiveTarget(event.target)) {
			toggleMaximize();
		}
	});

	for (const handle of resizeHandles) {
		handle.addEventListener('pointerdown', (event) => {
			if (frame.maximized) {
				return;
			}

			startInteraction(event, 'resize', handle.getAttribute('data-resize-handle') ?? '');
		});
	}

	windowElement.addEventListener('pointerdown', () => {
		if (windowElement.getAttribute('data-open') !== 'true') {
			return;
		}

		shortcut.classList.add('desktop-shortcut--active');
		bringWindowToFront(windowElement);
	});

	window.addEventListener('resize', () => {
		if (!frame.width || !frame.height) {
			return;
		}

		if (frame.maximized) {
			maximizeWindow();
			return;
		}

		applyFrame({
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			maximized: false,
			lastNormal: frame.lastNormal,
		});
	});

	document.addEventListener('pointerdown', (event) => {
		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		const clickedShortcut = shortcut.contains(target);
		const clickedWindow = !windowElement.hidden && windowElement.contains(target);

		if (clickedShortcut || clickedWindow) {
			return;
		}

		if (windowElement.getAttribute('data-open') !== 'true') {
			shortcut.classList.remove('desktop-shortcut--active');
		}
	});

	const managedWindow = {
		windowElement,
		hideWindow,
		showWindow,
	};

	managedWindows.push(managedWindow);
	return managedWindow;
};

const initVscodeShowcase = () => {
	const codeWindow = document.querySelector('[data-code-window]');

	if (!(codeWindow instanceof HTMLElement)) {
		return;
	}

	const projectButtons = Array.from(codeWindow.querySelectorAll('[data-code-project]'));
	const tabButtons = Array.from(codeWindow.querySelectorAll('[data-code-tab]'));
	const panels = Array.from(codeWindow.querySelectorAll('[data-code-project-panel]'));
	const detailPanels = Array.from(codeWindow.querySelectorAll('[data-code-project-info]'));
	const currentProjectLabel = codeWindow.querySelector('[data-code-current-project-label]');

	if (projectButtons.length === 0 || tabButtons.length === 0 || panels.length === 0) {
		return;
	}

	const state = {
		projectId: projectButtons[0].getAttribute('data-code-project') ?? '',
		tabId: tabButtons[0].getAttribute('data-code-tab') ?? '',
	};

	const render = () => {
		for (const button of projectButtons) {
			const projectId = button.getAttribute('data-code-project');
			const isActive = projectId === state.projectId;
			button.classList.toggle('code-window__project-item--active', isActive);
			button.setAttribute('aria-selected', isActive ? 'true' : 'false');
		}

		for (const button of tabButtons) {
			const tabId = button.getAttribute('data-code-tab');
			const isActive = tabId === state.tabId;
			button.classList.toggle('code-window__tab--active', isActive);
			button.setAttribute('aria-selected', isActive ? 'true' : 'false');
		}

		for (const panel of panels) {
			const projectId = panel.getAttribute('data-code-project-panel');
			const tabId = panel.getAttribute('data-code-tab-panel');
			panel.hidden = !(projectId === state.projectId && tabId === state.tabId);
		}

		for (const panel of detailPanels) {
			panel.hidden = panel.getAttribute('data-code-project-info') !== state.projectId;
		}

		const activeProjectButton = projectButtons.find(
			(button) => button.getAttribute('data-code-project') === state.projectId,
		);
		const nextLabel = activeProjectButton?.getAttribute('data-code-project-label') ?? state.projectId;

		if (currentProjectLabel) {
			currentProjectLabel.textContent = nextLabel;
		}
	};

	for (const button of projectButtons) {
		button.addEventListener('click', () => {
			const nextProjectId = button.getAttribute('data-code-project');

			if (!nextProjectId) {
				return;
			}

			state.projectId = nextProjectId;
			state.tabId = 'readme';
			render();
		});
	}

	for (const button of tabButtons) {
		button.addEventListener('click', () => {
			const nextTabId = button.getAttribute('data-code-tab');

			if (!nextTabId) {
				return;
			}

			state.tabId = nextTabId;
			render();
		});
	}

	render();
};

const initDesktopKeyboard = () => {
	window.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') {
			return;
		}

		const topWindow = getTopOpenWindow();
		topWindow?.hideWindow();
	});
};

export const initDesktop = () => {
	if (desktopInitialized || typeof document === 'undefined') {
		return;
	}

	desktopInitialized = true;
	initClock();
	initManagedWindow({
		shortcutSelector: '[data-open-obsidian]',
		windowSelector: '[data-obsidian-window]',
		closeSelector: '[data-close-obsidian]',
		minimizeSelector: '[data-minimize-obsidian]',
		maximizeSelector: '[data-toggle-obsidian-maximize]',
		dragHandleSelector: '[data-obsidian-drag-handle]',
		minWidth: 500,
		minHeight: 400,
		defaultWidth: 900,
		defaultHeight: 600,
		defaultXRatio: 0.15,
		defaultYOffset: 50,
		openMode: 'dblclick',
	});
	initManagedWindow({
		shortcutSelector: '[data-open-code]',
		windowSelector: '[data-code-window]',
		closeSelector: '[data-close-code]',
		minimizeSelector: '[data-minimize-code]',
		maximizeSelector: '[data-toggle-code-maximize]',
		dragHandleSelector: '[data-code-drag-handle]',
		minWidth: 860,
		minHeight: 520,
		defaultWidth: 1280,
		defaultHeight: 760,
		defaultXRatio: 0.08,
		defaultYOffset: 26,
		openMode: 'dblclick',
	});
	initManagedWindow({
		shortcutSelector: '[data-open-terminal]',
		windowSelector: '[data-terminal-window]',
		closeSelector: '[data-close-terminal]',
		minimizeSelector: '[data-minimize-terminal]',
		maximizeSelector: '[data-toggle-terminal-maximize]',
		dragHandleSelector: '[data-terminal-drag-handle]',
		minWidth: 400,
		minHeight: 300,
		defaultWidth: 600,
		defaultHeight: 450,
		defaultXRatio: 0.2,
		defaultYOffset: 30,
		openMode: 'dblclick',
	});
	initManagedWindow({
		shortcutSelector: '[data-open-cv]',
		windowSelector: '[data-cv-window]',
		closeSelector: '[data-close-cv]',
		minimizeSelector: '[data-minimize-cv]',
		maximizeSelector: '[data-toggle-cv-maximize]',
		dragHandleSelector: '[data-cv-drag-handle]',
		minWidth: 500,
		minHeight: 400,
		defaultWidth: 920,
		defaultHeight: 680,
		defaultXRatio: 0.15,
		defaultYOffset: 20,
		openMode: 'dblclick',
	});
	initManagedWindow({
		windowSelector: '[data-music-window]',
		shortcutSelector: '[data-music-shortcut]',
		closeSelector: '[data-music-close]',
		minimizeSelector: '[data-music-minimize]',
		maximizeSelector: '[data-music-maximize]',
		dragHandleSelector: '[data-music-drag]',
		minWidth: 400,
		minHeight: 500,
		defaultWidth: 600,
		defaultHeight: 500,
		defaultXRatio: 0.25,
		defaultXRatio: 0.25,
		defaultYOffset: 50,
		openMode: 'dblclick',
	});
	initManagedWindow({
		windowSelector: '[data-skills-window]',
		shortcutSelector: '[data-skills-shortcut]',
		closeSelector: '[data-skills-close]',
		minimizeSelector: '[data-skills-minimize]',
		maximizeSelector: '[data-skills-maximize]',
		dragHandleSelector: '[data-skills-drag]',
		minWidth: 500,
		minHeight: 400,
		defaultWidth: 800,
		defaultHeight: 550,
		defaultXRatio: 0.2,
		defaultYOffset: 40,
		openMode: 'dblclick',
	});
	initManagedWindow({
		windowSelector: '[data-mail-window]',
		shortcutSelector: '[data-mail-shortcut]',
		closeSelector: '[data-mail-close]',
		minimizeSelector: '[data-mail-minimize]',
		maximizeSelector: '[data-mail-maximize]',
		dragHandleSelector: '[data-mail-drag]',
		minWidth: 450,
		minHeight: 400,
		defaultWidth: 650,
		defaultHeight: 500,
		defaultXRatio: 0.15,
		defaultYOffset: 60,
		openMode: 'dblclick',
	});
	initDesktopKeyboard();
	initVscodeShowcase();
	initTerminalLogic();
};

const initTerminalLogic = () => {
	const input = document.querySelector('[data-terminal-input]');
	const output = document.querySelector('[data-terminal-output]');
	const terminalBody = document.querySelector('[data-terminal-body]');
	const terminalWindow = document.querySelector('[data-terminal-window]');

	if (!input || !output) return;

	const printLine = (text, type = 'response') => {
		const line = document.createElement('div');
		line.className = `terminal-line terminal-line--${type}`;
		line.innerHTML = text;
		output.appendChild(line);
		terminalBody.scrollTop = terminalBody.scrollHeight;
	};

	const triggerShortcut = (selector) => {
		const btn = document.querySelector(selector);
		if (btn) btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	};

	const executeCommand = (command) => {
		const cmd = command.trim().toLowerCase();
		
		if (!cmd) return;

		printLine(`pablo@portfolio:~$ ${command}`, 'command');

		switch (cmd) {
			case 'help':
				printLine(`
					<span class="highlight">Comandos disponibles:</span><br>
					<span class="accent">whoami</span>     - ¿Quién soy?<br>
					<span class="accent">age</span>        - Mi edad<br>
					<span class="accent">skills</span>     - Mi stack tecnológico<br>
					<span class="accent">experience</span> - Abre mi historial laboral<br>
					<span class="accent">projects</span>   - Abre mis proyectos en VS Code<br>
					<span class="accent">cv</span>         - Abre mi CV en PDF<br>
					<span class="accent">clear</span>      - Limpia la terminal
				`);
				break;
			case 'whoami':
				printLine(`Soy <span class="highlight">Pablo Vásquez</span>, desarrollador Full Stack & DevOps en Guatemala. Trabajo en Apparel Links S.A. construyendo sistemas internos, pipelines de IA y servidores LLM on-premise. Estudio Ingeniería en Ciencias de la Computación en la UVG.`);
				break;
			case 'age': {
				const birth = new Date(2004, 7, 20);
				const now = new Date();
				let age = now.getFullYear() - birth.getFullYear();
				if (now < new Date(now.getFullYear(), 7, 20)) age--;
				printLine(`Tengo <span class="highlight">${age} años</span>. Nacido el 20 de agosto de 2004.`);
				break;
			}
			case 'skills':
				printLine(`
					<span class="highlight">Frontend:</span> React, TypeScript, Astro, Next.js, Tailwind CSS<br>
					<span class="highlight">Backend:</span> Node.js, Python, FastAPI, .NET / C#, Express<br>
					<span class="highlight">Bases de datos:</span> PostgreSQL, MongoDB, MySQL, Supabase<br>
					<span class="highlight">DevOps / Infra:</span> Docker, Linux, Nginx, CI/CD, sglang<br>
					<span class="highlight">Cloud / Tools:</span> AWS, Azure, Git, Figma
				`);
				break;
			case 'experience':
				printLine(`Abriendo historial de carrera...`);
				triggerShortcut('[data-open-obsidian]');
				break;
			case 'projects':
				printLine(`Abriendo proyectos en VS Code...`);
				triggerShortcut('[data-open-code]');
				break;
			case 'cv':
				printLine(`Abriendo visor de PDF para el CV...`);
				triggerShortcut('[data-open-cv]');
				break;
			case 'clear':
				output.innerHTML = '';
				break;
			case 'sudo':
				printLine(`nice try, pero no tienes permisos de sudo aquí.`);
				break;
			default:
				printLine(`Comando no encontrado: ${cmd}. Escribe <span class="accent">help</span> para ver la lista de comandos.`);
		}
	};

	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			executeCommand(input.value);
			input.value = '';
		}
	});

	terminalWindow.addEventListener('click', () => {
		input.focus();
	});

	// Initial message
	printLine(`Bienvenido a mi portafolio OS (v1.0.0)<br>Escribe <span class="accent">help</span> para ver los comandos disponibles.`);
};
