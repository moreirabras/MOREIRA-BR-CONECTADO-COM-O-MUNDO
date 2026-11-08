# Usa o Node 22 (versão exigida pelas dependências atuais do projeto)
FROM node:22-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo o react-is se já estiver no package.json)
RUN npm install --legacy-peer-deps

# Copia todo o código do projeto
COPY . .

# Executa a compilação do React para gerar a pasta /app/dist necessária pelo servidor
RUN npm run build

# Expõe a porta padrão exigida pelo Render
EXPOSE 10000

# Comando para iniciar o servidor (definido no package.json como "tsx server.ts")
CMD [ "npm", "start" ]