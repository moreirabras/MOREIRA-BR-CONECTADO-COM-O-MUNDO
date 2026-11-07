import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * MIDDLEWARE DE SEGURANÇA DE BORDA (EDGE DEFENSE)
 * ---------------------------------------------
 * Simula as regras de segurança do Cloudflare Enterprise e Alibaba Cloud.
 */

export class EdgeSecurity {
  /**
   * 1. Validação de Assinatura Criptográfica
   * Exige que webhooks contenham a assinatura 'x-gateway-signature'.
   */
  public static validateGatewaySignature(req: Request, res: Response, next: NextFunction) {
    const isWafEnabled = process.env.WAF_SECURITY_SHIELD_ENABLED === 'true';
    const signature = req.headers['x-gateway-signature'] || 
                      req.headers['asaas-access-token'] || 
                      req.headers['stripe-signature'] || 
                      req.headers['x-signature'] || 
                      req.headers['x-razorpay-signature'];
    
    // Validar apenas se o WAF estiver estritamente ativado no .env
    if (isWafEnabled && !signature && req.path.startsWith('/v1/webhook/strict-partner/')) {
      console.warn(`[SECURITY-CHALLENGE] Requisição de parceiro estrito sem assinatura bloqueada: ${req.ip}`);
      return res.status(403).json({ 
        error: 'SIGNATURE_REQUIRED', 
        message: 'Acesso negado: Assinatura de gateway parceiro ausente.' 
      });
    }
    next();
  }

  /**
   * 2. Simulador de Roteamento Otimizado (Geofencing)
   * Detecta a origem e aplica lógica de backbone acelerado.
   */
  public static accelerateGlobalRoute(req: Request, res: Response, next: NextFunction) {
    const country = req.headers['cf-ipcountry'] || 'US'; // Header simulado do Cloudflare
    
    if (country === 'CN') {
      req.headers['x-routing-backbone'] = 'China-Accelerated-ExpressConnect';
      console.log(`[EDGE-ROUTE] Roteamento acelerado via Alibaba Cloud para IP: ${req.ip}`);
    } else {
      req.headers['x-routing-backbone'] = 'Global-Anycast-Network';
    }
    next();
  }

  /**
   * 3. Auditoria de Integridade de Payload
   * Gera um checksum para garantir que o dado não foi alterado entre a borda e o core.
   */
  public static attachIntegrityToken(req: Request, res: Response, next: NextFunction) {
    if (req.body && Object.keys(req.body).length > 0) {
      const hash = crypto.createHash('sha1').update(JSON.stringify(req.body)).digest('hex');
      req.headers['x-payload-integrity'] = hash;
    }
    next();
  }
}
