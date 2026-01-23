FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Expose port
EXPOSE 8067

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8067 || exit 1

# Start app
CMD ["npm", "start"]
