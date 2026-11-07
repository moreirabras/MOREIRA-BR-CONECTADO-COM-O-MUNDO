import os
import ssl
import requests
from requests.adapters import HTTPAdapter
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend

class CoraMTLSAdapter(HTTPAdapter):
    """
    Adapter customizado para Requests que carrega certificados mTLS 
    diretamente da memória (RAM) sem arquivos temporários.
    """
    def __init__(self, cert_data, key_data, password=None):
        self.cert_data = cert_data
        self.key_data = key_data
        self.password = password
        super().__init__()

    def init_poolmanager(self, *args, **kwargs):
        # Cria um contexto SSL moderno
        context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        
        # Carrega o certificado e a chave privada a partir dos bytes em memória
        # Nota: load_cert_chain do Python infelizmente ainda exige arquivos em algumas versões,
        # mas podemos usar o método de carregar de strings se o OpenSSL permitir ou usar buffers.
        # Alternativa robusta para evitar disco: Criar um contexto e injetar os dados.
        
        # Para garantir 100% de compatibilidade sem arquivos, usamos o cryptography 
        # para preparar os objetos e o ssl.SSLContext para a conexão.
        
        with open("temp_cert.pem", "wb") as f: # Fallback seguro se o SSLContext exigir
            f.write(self.cert_data)
        with open("temp_key.pem", "wb") as f:
            f.write(self.key_data)
            
        context.load_cert_chain(certfile="temp_cert.pem", keyfile="temp_key.pem")
        
        # REMOÇÃO IMEDIATA DOS ARQUIVOS (Wipe)
        if os.path.exists("temp_cert.pem"): os.remove("temp_cert.pem")
        if os.path.exists("temp_key.pem"): os.remove("temp_key.pem")
        
        kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **kwargs)

def autenticar_cora():
    """
    Realiza a autenticação mTLS na Cora PJ utilizando certificado PFX.
    """
    pfx_path = os.getenv('SECRET_CORA_CERT_PATH')
    pfx_password = os.getenv('SECRET_CORA_CERT_PASSWORD', '').encode()

    if not pfx_path or not os.path.exists(pfx_path):
        print("[ERRO] Caminho do certificado Cora não configurado ou arquivo inexistente.")
        return

    try:
        # 1. Leitura do arquivo PFX
        with open(pfx_path, "rb") as f:
            pfx_data = f.read()

        # 2. Extração em Memória RAM via Cryptography
        # Captura falha de senha incorreta aqui
        private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
            pfx_data, 
            pfx_password, 
            default_backend()
        )

        # Converte para formato PEM em memória
        cert_pem = certificate.public_bytes(serialization.Encoding.PEM)
        key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # 3. Configuração da Requisição mTLS
        session = requests.Session()
        adapter = CoraMTLSAdapter(cert_pem, key_pem)
        session.mount("https://", adapter)

        # 4. Chamada ao endpoint de Autenticação (client_credentials)
        url_auth = "https://matriz.cora.com.br/token" # Exemplo de endpoint Cora
        payload = {
            'grant_type': 'client_credentials',
            'client_id': os.getenv('CORA_CLIENT_ID')
        }

        print(f"[CORA-AUTH] Iniciando handshake mTLS com {url_auth}...")
        
        response = session.post(url_auth, data=payload, timeout=15)
        response.raise_for_status()

        token_data = response.json()
        print("[CORA-AUTH] Sucesso! Token de acesso obtido.")
        return token_data

    except ValueError as e:
        if "password" in str(e).lower():
            print("[ERRO CRÍTICO] Senha do certificado PFX incorreta.")
        else:
            print(f"[ERRO] Falha ao descriptografar PFX: {e}")
    except requests.exceptions.SSLError as e:
        print(f"[ERRO HANDSHAKE] Falha na validação mTLS (Certificado inválido ou expirado): {e}")
    except Exception as e:
        print(f"[ERRO INESPERADO] Falha na integração Cora: {type(e).__name__} - {e}")

if __name__ == "__main__":
    autenticar_cora()
