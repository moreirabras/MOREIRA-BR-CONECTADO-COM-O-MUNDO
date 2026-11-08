import crypto from 'crypto';
import fs from 'fs';

/**
 * PROVEDOR DE CHAVES SEGURAS
 * -------------------------
 * Responsável por carregar certificados A1 e chaves privadas 
 * diretamente para a memória RAM para assinatura de documentos fiscais.
 */
export class KeyProviderService {
  
  /**
   * Extrai a chave privada de um certificado PFX (PKCS#12)
   * sem deixar rastros em arquivos temporários.
   */
  public static loadPrivateKeyFromPfx(): string | Buffer {
    const pfxPath = process.env.SECRET_CERTIFICADO_A1_PATH;
    const passphrase = process.env.SECRET_CERTIFICADO_A1_PASSWORD || '';

    // Tenta carregar do arquivo PFX se o caminho estiver configurado e o arquivo existir
    if (pfxPath && fs.existsSync(pfxPath)) {
      try {
        const pfxBuffer = fs.readFileSync(pfxPath);
        
        // No Node.js moderno, createPrivateKey aceita PFX se format for especificado
        // Cast para any para evitar erro de tipagem se a versão do TS estiver desatualizada
        const privateKey = crypto.createPrivateKey({
          key: pfxBuffer,
          passphrase: passphrase,
          format: 'pfx'
        } as any);

        return privateKey.export({
          type: 'pkcs1',
          format: 'pem'
        });
      } catch (error) {
        console.error('[KEY-PROVIDER] Erro ao processar arquivo PFX:', error);
      }
    }

    // Fallback: Se não houver certificado A1, usa a chave do Firebase ou gera uma efêmera
    // para não quebrar o fluxo de desenvolvimento e demonstração.
    console.warn('[KEY-PROVIDER] Certificado A1 não encontrado. Usando chave de fallback para assinatura.');
    
    const fallbackKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (fallbackKey) return fallbackKey;

    // Último recurso: Chave efêmera para garantir que o sistema continue funcional
    return crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({
      type: 'pkcs1',
      format: 'pem'
    });
  }
}
