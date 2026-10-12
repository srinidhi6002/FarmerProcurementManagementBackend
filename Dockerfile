# Bulletproof Dockerfile for Node.js Express API
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install exact backend dependencies directly
RUN npm install express cors dotenv pg --no-audit --no-fund

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
