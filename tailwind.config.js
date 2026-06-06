/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ['"Nunito Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        casino: {
          bg: "#11131a",
          surface: "#1b1e2b",
          "surface-2": "#1d1f27",
          "surface-3": "#282a31",
          lowest: "#0c0e15",
        },
        gold: {
          DEFAULT: "#f5a623",
          dim: "#f7b84e",
          deep: "#d4891f",
        },
        electric: {
          DEFAULT: "#3498db",
          bright: "#5dade2",
          deep: "#2980b9",
        },
        suit: {
          red: "#e74c3c",
          yellow: "#f1c40f",
          green: "#2ecc71",
          blue: "#3498db",
        },
        felt: {
          DEFAULT: "#7a1216",
          glow: "#b5181f",
          deep: "#43090c",
        },
        ink: {
          DEFAULT: "#0b0b0f",
          800: "#141419",
          700: "#1c1c24",
          600: "#262630",
        },
        unored: {
          DEFAULT: "#e74c3c",
          deep: "#c0392b",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glow-cyan": "0 0 24px rgba(39,217,248,0.45)",
        "glow-cyan-lg": "0 0 40px rgba(39,217,248,0.55)",
        "glow-gold": "0 0 24px rgba(255,209,92,0.45)",
        "glow-red": "0 0 28px rgba(228,50,43,0.6)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 20px 40px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "glow-pulse": {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}