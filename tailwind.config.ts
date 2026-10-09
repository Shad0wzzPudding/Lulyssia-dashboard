import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['"Asap Condensed"', 'Kanit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Persona 5 accent scale built around #3aadd0 (500)
				p5: {
					50: '#eefafd',
					100: '#d4f1f9',
					200: '#ade3f2',
					300: '#77cfe6',
					400: '#4bbcdb',
					500: '#3aadd0',
					600: '#2a8cad',
					700: '#24718c',
					800: '#215d73',
					900: '#1f4e61',
					950: '#0f3341'
				},
				'welcome-primary': 'hsl(var(--welcome-primary))',
				'welcome-secondary': 'hsl(var(--welcome-secondary))',
				'main-focus': 'hsl(var(--main-focus))',
				'upcoming-events': 'hsl(var(--upcoming-events))',
				'events-theme': 'hsl(var(--events-theme))',
				'recent-changes': 'hsl(var(--recent-changes))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				// Page transition crowd: back and front rows drift in opposite directions for depth
				'crowd-drift-slow': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(140px)' }
				},
				'crowd-drift-fast': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-160px)' }
				},
				// Drawer scene: bubbles drift, wings flap, Lulyssia floats, sparkles twinkle
				'bubble-float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-14px)' }
				},
				'butterfly-flap': {
					'0%, 100%': { transform: 'scaleX(1)' },
					'50%': { transform: 'scaleX(0.25)' }
				},
				'character-float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'sparkle-twinkle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.2' }
				},
				// Water on the cyan band: each dot layer rises by a whole number of its own
				// tiles (18, 11 and 31 px), so the loop is seamless; layers move at different speeds
				'water-rise': {
					from: { backgroundPosition: '0 0, 5px 7px, 12px 3px, 0 0' },
					to: { backgroundPosition: '0 -180px, 5px -103px, 12px -307px, 0 0' }
				},
				// Light pulse along the neon wave (one full dash pattern = 100 path units)
				'wave-flow': {
					from: { strokeDashoffset: '0' },
					to: { strokeDashoffset: '-100' }
				},
				// KEEP OUT text sliding along the tape by exactly one of its two copies
				'tape-scroll': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'crowd-drift-slow': 'crowd-drift-slow 2s linear forwards',
				'crowd-drift-fast': 'crowd-drift-fast 2s linear forwards',
				'bubble-float': 'bubble-float 5s ease-in-out infinite',
				'butterfly-flap': 'butterfly-flap 1.2s ease-in-out infinite',
				'character-float': 'character-float 4s ease-in-out infinite',
				'sparkle-twinkle': 'sparkle-twinkle 1.8s ease-in-out infinite',
				'water-rise': 'water-rise 14s linear infinite',
				'wave-flow': 'wave-flow 8s linear infinite',
				'tape-scroll': 'tape-scroll 20s linear infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
