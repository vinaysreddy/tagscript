/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                dark: {
                    bg: '#18181b', // true dark background
                    surface: '#23232b', // card background
                    border: '#27272a',
                    text: '#f3f4f6', // main text
                    muted: '#a1a1aa', // secondary text
                    accent: '#6366f1', // accent (indigo-500)
                }
            }
        },
    },
    plugins: [],
} 