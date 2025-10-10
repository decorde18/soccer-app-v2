/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map your theme names to HSL CSS variables for dynamic opacity
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        secondary: "hsl(var(--color-secondary) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",
        text: "hsl(var(--color-text) / <alpha-value>)",
        white: "hsl(var(--color-white) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        success: "hsl(var(--color-success) / <alpha-value>)",
        warningborder: "hsl(var(--color-warningborder) / <alpha-value>)",
        warningtext: "hsl(var(--color-warningtext) / <alpha-value>)",
        warningbg: "hsl(var(--color-warningbg) / <alpha-value>)",
        danger: "hsl(var(--color-danger) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        purple: "hsl(var(--color-purple) / <alpha-value>)",
        textlabel: "hsl(var(--color-text-label) / <alpha-value>)",
        errorhover: "hsl(var(--color-error-hover) / <alpha-value>)",
        accenthover: "hsl(var(--color-accent-hover) / <alpha-value>)",
      },
      // Extend other properties based on your theme.js
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        default: "var(--radius-default)",
      },
      spacing: {
        "p-sm": "var(--padding-small)",
        "p-md": "var(--padding-medium)",
        "p-lg": "var(--padding-large)",
        "p-xl": "var(--padding-xlarge)",
      },
      fontFamily: {
        body: "var(--font-family-body)",
        heading: "var(--font-family-heading)",
      },
      fontSize: {
        title: "var(--font-size-title)",
        subtitle: "var(--font-size-subtitle)",
        body: "var(--font-size-body)",
        button: "var(--font-size-button)",
        small: "var(--font-size-small)",
        medium: "var(--font-size-medium)",
        large: "var(--font-size-large)",
        xlarge: "var(--font-size-xlarge)",
      },
    },
  },
  plugins: [],
};
