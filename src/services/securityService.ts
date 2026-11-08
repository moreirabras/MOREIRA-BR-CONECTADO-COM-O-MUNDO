import crypto from 'crypto';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  ip: string;
  attackType: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'BRUTE_FORCE' | 'PROTOTYPE_POLLUTION' | 'SESSION_HIJACK_ATTEMPT';
  severity: 'MÉDIA' | 'ALTA' | 'CRÍTICA' | 'EMERGÊNCIA MILITAR';
  endpoint: string;
  method: string;
  payloadSample: string;
  actionTaken: 'BLOQUEADO_NA_BORDA' | 'IP_BANIDO_AUTOMATICAMENTE' | 'DESVIADO_PARA_HONEYPOT' | 'CHALLENGE_CAPTCHA';
  location?: string;
  userAgent?: string;
}

export interface FirewallRule {
  id: string;
  pattern: string;
  category: string;
  enabled: boolean;
  blockedCount: number;
}

export interface SecuritySystemState {
  threatLevel: 'PADRAO' | 'ELEVADO' | 'BANK_GRADE' | 'DEFCON_1_LOCKDOWN';
  activeBannedIps: string[];
  totalThreatsBlocked: number;
  lastAttackTimestamp?: string;
  isWafActive: boolean;
  isIdpsActive: boolean;
  isE2eEncryptionActive: boolean;
  isAntiTamperActive: boolean;
}

/**
 * SERVIÇO CLIENT-SIDE DE SEGURANÇA BANCÁRIA / MILITAR (SOC)
 * --------------------------------------------------------
 * Fornece algoritmos de verificação de integridade, sanitização de entrada,
 * simulação criptográfica AES-256-GCM e escudos de sessão.
 */
export class SecurityService {
  /**
   * Calcula hash SHA-256 de dados ou payloads
   */
  public static async calculateSha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validador de integridade de sessão (Anti-Hijacking)
   */
  public static generateSessionFingerprint(): string {
    const ua = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language;
    const raw = `${ua}|${screenRes}|${tz}|${lang}`;
    
    // Hash simples síncrono para o cliente
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `FP-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36)}`;
  }

  /**
   * Sanitiza strings contra XSS no lado do cliente
   */
  public static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Detecta assinaturas maliciosas conhecidas em entradas de formulário
   */
  public static detectMaliciousPattern(text: string): { isMalicious: boolean; type?: string } {
    const sqli = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC)\b)|('--')|(\/\*)|(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i;
    const xss = /(<script\b[^>]*>|javascript:|onerror\s*=|onload\s*=|eval\(|document\.cookie)/i;
    const pathTraversal = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/)/i;
    const cmdInjection = /(;\s*cat\s+|;\s*ls\s+|\|\s*nc\s+|;\s*rm\s+|-rf\s+\/)/i;

    if (sqli.test(text)) return { isMalicious: true, type: 'SQL_INJECTION' };
    if (xss.test(text)) return { isMalicious: true, type: 'XSS_ATTACK' };
    if (pathTraversal.test(text)) return { isMalicious: true, type: 'PATH_TRAVERSAL' };
    if (cmdInjection.test(text)) return { isMalicious: true, type: 'COMMAND_INJECTION' };

    return { isMalicious: false };
  }
}
