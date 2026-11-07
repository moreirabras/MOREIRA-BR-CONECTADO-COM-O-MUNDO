# Estágio 1: Build e Compilação
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Estágio 2: Execução em Produção
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
EXPOSE 8080
CMD [ "npm", "start" ]
