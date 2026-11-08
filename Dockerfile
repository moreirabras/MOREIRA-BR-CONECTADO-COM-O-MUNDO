# ====================================================================
# DOCKERFILE - REQUISITO GO-LIVE 24/7/365
# MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA (CNPJ 68.603.032/0001-15)
# Multi-stage build para Node.js 20 + Vite + Express + SEFAZ XSD + WAF
# ====================================================================

# ----- ETAPA 1: BUILD -----
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifesto de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar todo o código-fonte
COPY . .

# Compilar o código TypeScript / Vite SPA para a pasta dist
RUN npm run build

# ----- ETAPA 2: EXECUTIVE RUNTIME (HIGH AVAILABILITY) -----
FROM node:20-alpine AS runner

WORKDIR /app

# Definir ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000

# Instalar curl para Health Probes de Cloud Load Balancers
RUN apk add --no-co-cache curl

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção para menor consumo de memória e boot rápido
RUN npm ci --only=production

# Copiar dist compilado e código do servidor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src

# Expor a porta padrão 3000
EXPOSE 3000

# Health check automático para Google Cloud Run, AWS Target Groups e Kubernetes
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Executar como usuário não-root por segurança bancária
USER node

# Comando de inicialização do servidor HTTP + WebSockets + WAF
CMD ["npm", "start"]
