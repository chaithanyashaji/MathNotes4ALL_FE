import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Allow the app to be accessed from outside the container (important for Render)
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173, // Use the dynamic port provided by Render, fallback to 5173 for local development
  },
})
