# Usa o Node 22 (versão exigida pelas dependências atuais do projeto)
FROM node:22-alpine AS builder

WORKDIR /app

# Instala curl para health probes do Render
RUN apk add --no-cache curl

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências incluindo explicitamente o react-is exigido pelo recharts
RUN npm install --legacy-peer-deps && npm install react-is --legacy-peer-deps

# Copia o restante do código
COPY . .

# Compila a aplicação Vite/React
RUN npm run build

# Expõe a porta do Render
EXPOSE 10000

# Inicia o servidor
CMD [ "npm", "start" ]
