# syntax=docker/dockerfile:1

# ---------- Stage 1: deps ----------
# Install dependencies in an isolated layer for better caching.
FROM node:22-alpine AS deps

WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps --ignore-scripts; else npm install --legacy-peer-deps --ignore-scripts; fi

# ---------- Stage 2: builder ----------
# Build static assets for production.
FROM deps AS builder

ENV NODE_ENV=production

COPY . .

RUN npm run build

# ---------- Stage 3: dev ----------
# Development image used by docker compose (hot reload via Vite).
FROM node:22-alpine AS dev

WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chmod +x /app/startup.sh && \
    chown -R node:node /app

USER node

EXPOSE 5173

CMD ["./startup.sh"]

# ---------- Stage 4: production ----------
# Serve the built app with nginx.
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
