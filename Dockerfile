# Multi-stage production build
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --no-optional && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8067

# Copy built dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data dir with correct permissions
RUN mkdir -p /app/data && \
    chown -R 1000:1000 /app/data && \
    chmod 755 /app/data

USER node

EXPOSE 8067
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "app.js"]
