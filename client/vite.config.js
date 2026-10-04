import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      proxy: {
        "/auth": "http://localhost:5000",
        "/projects": "http://localhost:5000",
        "/api": "http://localhost:5000", 
        "/v1": "http://localhost:5000", 
      },
    },
  },
});
