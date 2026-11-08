FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Executa a compilação do React para gerar a pasta /app/dist/index.html necessária pelo servidor
RUN npm run build

# O Render define a porta automaticamente através da variável de ambiente PORT (geralmente 10000)
# Ajustado para 10000 para alinhar com o padrão exibido no log do Render
EXPOSE 10000

CMD [ "npm", "start" ]
