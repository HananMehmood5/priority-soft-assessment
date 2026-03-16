import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './libs/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ps: {
          bg: 'var(--ps-bg)',
          'bg-elevated': 'var(--ps-bg-elevated)',
          'bg-card': 'var(--ps-bg-card)',
          surface: 'var(--ps-surface)',
          'surface-hover': 'var(--ps-surface-hover)',
          primary: 'var(--ps-primary)',
          'primary-hover': 'var(--ps-primary-hover)',
          'primary-muted': 'var(--ps-primary-muted)',
          'primary-foreground': 'var(--ps-primary-foreground)',
          success: 'var(--ps-success)',
          warning: 'var(--ps-warning)',
          error: 'var(--ps-error)',
          info: 'var(--ps-info)',
          border: 'var(--ps-border)',
          'border-focus': 'var(--ps-border-focus)',
          fg: 'var(--ps-fg)',
          'fg-muted': 'var(--ps-fg-muted)',
          'fg-subtle': 'var(--ps-fg-subtle)',
        },
      },
      fontSize: {
        'ps-xs': 'var(--ps-text-xs)',
        'ps-sm': 'var(--ps-text-sm)',
        'ps-base': 'var(--ps-text-base)',
        'ps-lg': 'var(--ps-text-lg)',
        'ps-xl': 'var(--ps-text-xl)',
        'ps-2xl': 'var(--ps-text-2xl)',
        'ps-3xl': 'var(--ps-text-3xl)',
      },
      borderRadius: {
        ps: 'var(--ps-radius)',
        'ps-lg': 'var(--ps-radius-lg)',
      },
      boxShadow: {
        ps: 'var(--ps-shadow)',
        'ps-lg': 'var(--ps-shadow-lg)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

