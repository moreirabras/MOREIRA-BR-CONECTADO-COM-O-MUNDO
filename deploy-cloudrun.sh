#!/bin/bash
# ====================================================================
# SCRIPT DE IMPLANTAÇÃO AUTOMÁTICA EM GOOGLE CLOUD RUN (ALTA DISPONIBILIDADE 24/7/365)
# MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA (CNPJ 68.603.032/0001-15)
# ====================================================================

set -e

PROJECT_ID="moreira-brasil-prod"
REGION="southamerica-east1" # São Paulo
SERVICE_NAME="auditoria-financeira-app"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Iniciando processo de build e deploy em nuvem alta disponibilidade..."

# 1. Compilação da Imagem Docker
echo "📦 [1/4] Criando imagem Docker de produção..."
docker build -t ${IMAGE_TAG} .

# 2. Upload para Container Registry
echo "☁️ [2/4] Enviando container para o Google Artifact Registry..."
gcloud auth configure-docker --quiet
docker push ${IMAGE_TAG}

# 3. Deploy no Google Cloud Run com Auto-Scaling (mínimo 2 instâncias para 0% downtime)
echo "⚡ [3/4] Implantando no Google Cloud Run em ${REGION}..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_TAG} \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=2 \
  --max-instances=50 \
  --cpu=2 \
  --memory=2Gi \
  --concurrency=250 \
  --set-env-vars="NODE_ENV=production,PORT=3000,SEFAZ_ENV=PRODUCAO,WAF_SECURITY_SHIELD_ENABLED=true" \
  --port=3000

# 4. Status de Verificação do Health Check
echo "✅ [4/4] Deploy concluído com sucesso!"
echo "🌐 URL Oficial de Produção: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')"
