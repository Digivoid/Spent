# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy built node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S spentuser -u 1001
USER spentuser

EXPOSE 8067
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8067 || exit 1

CMD ["npm", "start"]
