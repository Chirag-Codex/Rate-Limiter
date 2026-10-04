/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        elevated: 'var(--bg-elevated)',
        chip: 'var(--bg-chip)',
        'border-subtle': 'var(--border-subtle)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'accent-teal': 'var(--accent-teal)',
        'accent-purple': 'var(--accent-purple)',
        'accent-magenta': 'var(--accent-magenta)',
        'btn-light-bg': 'var(--button-light-bg)',
        'btn-light-text': 'var(--button-light-text)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}