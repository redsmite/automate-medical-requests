FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

# Production stage — serve via FastAPI, so we just export the dist
FROM alpine:3.19
WORKDIR /dist
COPY --from=builder /app/dist .
