# Dockerfile for PMO Frontend (multi-stage)
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache wget
RUN npm install -g serve
RUN chown -R node:node /usr/local/lib/node_modules
RUN chown -R node:node /app
COPY --from=build /app/dist ./dist
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1
USER node
CMD ["npx", "serve", "-s", "dist", "-l", "5173"]
