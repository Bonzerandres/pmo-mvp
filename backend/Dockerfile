# Dockerfile for PMO Backend
FROM node:18-alpine
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache wget
RUN npm ci --only=production

COPY . .

RUN mkdir -p ./data && chown -R node:node ./data

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

USER node

CMD ["node", "server.js"]
