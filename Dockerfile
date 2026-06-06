# ---- Build stage ----
# Builds the React frontend (dist/public) and bundles the backend into a single
# self-contained dist/boot.js so the runtime image needs no node_modules.
FROM node:20-slim AS build
WORKDIR /app

# Install all deps (including dev) for the build.
COPY package*.json ./
RUN npm ci

# Build frontend + bundle server.
COPY . .
RUN npm run build

# ---- Runtime stage ----
# Minimal image: just Node + the built artifacts. Low memory, fast cold start.
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist

# Railway provides PORT at runtime; the app reads process.env.PORT and binds 0.0.0.0.
EXPOSE 3000
CMD ["node", "dist/boot.js"]
