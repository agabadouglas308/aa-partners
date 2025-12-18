FROM node:18-alpine

# Create app directory and copy project
WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package.json backend/package-lock.json* ./backend/

WORKDIR /app/backend
RUN npm install --production

# Copy entire repository (serves static HTML one level up)
WORKDIR /app
COPY . /app

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "server.js"]
