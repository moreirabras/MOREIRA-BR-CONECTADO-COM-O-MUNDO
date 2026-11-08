# Usa o Node 22
FROM node:22-alpine

WORKDIR /app

# Instala o curl necessário para Health Probes do Render
RUN apk add --no-cache curl

# Copia os arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo dependências de desenvolvimento para o tsx funcionar) e o react-is
RUN npm install --legacy-peer-deps && npm install react-is --legacy-peer-deps

# Copia todo o código do projeto
COPY . .

# Faz o build apenas do Frontend (se houver o comando no package.json)
RUN npm run build || true

# Expõe a porta exigida pelo Render
EXPOSE 10000

# Inicia o servidor backend diretamente via tsx (evitando erros de require dinâmico)
CMD [ "npm", "start" ]
