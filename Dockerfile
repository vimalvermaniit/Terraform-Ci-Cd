FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 80
USER node
CMD ["node", "server.js"]
