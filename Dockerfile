# Use official Node 20 image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json & package-lock.json first (caching)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy all app files
COPY . .

# Expose port 8067
EXPOSE 8067

# Start the app
CMD ["npm", "start"]
