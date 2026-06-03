import { useState, useEffect, useCallback, useRef } from 'react';
import DarkVeil from './DarkVeil.jsx';
import FaultyTerminal from './FaultyTerminal.jsx';
import ColorBends from './ColorBends.jsx';
import FloatingLines from './FloatingLines.jsx';
import './css/WallpaperManager.css';

const WALLPAPERS = [
	{
		id: 'aurora',
		name: 'Aurora',
		thumb: 'linear-gradient(135deg, #020403 0%, #0a1628 25%, #1a0b3b 55%, #060d1a 100%)',
		render: () => (
			<DarkVeil
				hueShift={45}
				noiseIntensity={0}
				scanlineIntensity={0}
				speed={1.8}
				scanlineFrequency={50}
				warpAmount={1}
				resolutionScale={1.25}
			/>
		),
	},
	{
		id: 'faulty-terminal',
		name: 'Faulty Terminal',
		thumb: 'linear-gradient(180deg, #010a02 0%, #021504 45%, #010d02 100%)',
		render: () => <FaultyTerminal tint="#4488ff" />,
	},
	{
		id: 'color-bends',
		name: 'Color Bends',
		thumb: 'linear-gradient(135deg, #07001a 0%, #1a0040 35%, #0d1b4b 65%, #2d0860 100%)',
		render: () => (
			<ColorBends
				colors={['#0a0014', '#1e0040', '#0d1b4b', '#2d0060', '#162a6e', '#4c1d95']}
				speed={0.15}
				warpStrength={1.2}
				intensity={1.2}
				noise={0.05}
				transparent={false}
			/>
		),
	},
	{
		id: 'floating-lines',
		name: 'Floating Lines',
		thumb: 'linear-gradient(170deg, #020403 0%, #06091a 40%, #0a0d24 100%)',
		render: () => (
			<FloatingLines
				linesGradient={['#1a0b40', '#2e1260', '#0a1a50', '#083860', '#1e2260']}
				lineCount={[8, 14, 6]}
				lineDistance={[5, 4, 6]}
				animationSpeed={0.8}
				interactive={true}
				parallax={true}
			/>
		),
	},
];

export default function WallpaperManager() {
	const [active, setActive] = useState(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('wallpaper') || 'aurora';
		}
		return 'aurora';
	});

	const [menu, setMenu] = useState(null);
	const menuRef = useRef(null);

	const closeMenu = useCallback(() => setMenu(null), []);

	const handleContextMenu = useCallback((e) => {
		const isEditable = e.target.matches('input, textarea, [contenteditable]');
		const insideWindow = e.target.closest(
			'.desktop-window, .desktop-menubar, .desktop-bottom-ui'
		);

		if (insideWindow && isEditable) return;
		if (insideWindow) {
			e.preventDefault();
			closeMenu();
			return;
		}

		e.preventDefault();

		const MENU_W = 242;
		const MENU_H = 210;
		const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
		const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);
		setMenu({ x, y });
	}, [closeMenu]);

	useEffect(() => {
		const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
		window.addEventListener('contextmenu', handleContextMenu);
		window.addEventListener('click', closeMenu);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('contextmenu', handleContextMenu);
			window.removeEventListener('click', closeMenu);
			window.removeEventListener('keydown', onKey);
		};
	}, [handleContextMenu, closeMenu]);

	const selectWallpaper = (id) => {
		setActive(id);
		localStorage.setItem('wallpaper', id);
		setMenu(null);
	};

	const current = WALLPAPERS.find((w) => w.id === active) ?? WALLPAPERS[0];

	return (
		<>
			<div className="wallpaper-layer" key={active}>
				{current.render()}
			</div>

			{menu && (
				<div
					ref={menuRef}
					className="wallpaper-ctx-menu"
					style={{ left: menu.x, top: menu.y }}
					onClick={(e) => e.stopPropagation()}
					onContextMenu={(e) => e.preventDefault()}
				>
					<div className="wallpaper-ctx-menu__heading">Fondo de pantalla</div>
					<div className="wallpaper-ctx-menu__divider" />
					{WALLPAPERS.map((w) => (
						<div
							key={w.id}
							className={`wallpaper-option${active === w.id ? ' wallpaper-option--active' : ''}`}
							onClick={() => selectWallpaper(w.id)}
						>
							<div
								className="wallpaper-option__thumb"
								style={{ background: w.thumb }}
							/>
							<span className="wallpaper-option__name">{w.name}</span>
							{active === w.id && (
								<span className="wallpaper-option__check">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</>
	);
}
