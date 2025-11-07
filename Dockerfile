FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN make

FROM node:20-slim

WORKDIR /app

COPY --from-builder /app /app

RUN mkdir -p /app/hgt_files

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "server.js"]
