import { Kafka, Producer, logLevel as KafkaLogLevel } from 'kafkajs';
import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';
import { calcularHashGoldenRecord } from '../../server.ts'; // Importa a engine de hash criada no arquivo principal

export class KafkaIngestionService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;
  private topic = process.env.KAFKA_TOPIC_VENDAS || 'vendas-globais-pendentes';

  constructor() {
    const brokersEnv = process.env.KAFKA_BROKERS;

    if (brokersEnv) {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'vortex-audit-core-ingestion',
        brokers: brokersEnv.split(','),
        logLevel: KafkaLogLevel.ERROR,
        ssl: true,
        sasl: process.env.KAFKA_SASL_USERNAME ? {
          mechanism: 'plain',
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD || ''
        } : undefined
      });
      this.producer = this.kafka.producer();
    }
  }

  /**
   * Conecta ao cluster Kafka na inicialização
   */
  async connect(): Promise<void> {
    if (!this.producer) {
      console.warn("⚠️ [Vortex Kafka]: Brokers não configurados. Modo de contingência Direct SQL Fallback ativo.");
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("⚡ [Vortex Kafka]: Conectado ao cluster com sucesso.");
    } catch (error: any) {
      this.isConnected = false;
      console.error(`🚨 [Vortex Kafka Connection Failed]: ${error.message}. Redirecionando para Direct SQL Fallback.`);
    }
  }

  /**
   * Ingestão de Venda com Fallback Atômico para SQL
   */
  async ingerirVenda(vendaPayload: any, hashAnterior: string = ''): Promise<{ status: string; method: 'KAFKA' | 'SQL_FALLBACK'; hash: string }> {
    // Calcula o Hash do Golden Record para garantir imutabilidade antes da persistência
    const hashAtual = calcularHashGoldenRecord(vendaPayload, hashAnterior);
    const payloadComHash = { ...vendaPayload, blockchainHash: hashAtual };

    // Tenta enviar via Kafka se estiver disponível e conectado
    if (this.isConnected && this.producer) {
      try {
        await this.producer.send({
          topic: this.topic,
          messages: [
            {
              key: vendaPayload.id || `TX-${Date.now()}`,
              value: JSON.stringify(payloadComHash)
            }
          ]
        });

        return { status: '202_ACCEPTED', method: 'KAFKA', hash: hashAtual };
      } catch (kafkaError: any) {
        console.error(`⚠️ [Vortex Kafka Runtime Error]: ${kafkaError.message}. Iniciando Direct SQL Fallback síncrono.`);
        this.isConnected = false; // Força estado desconectado para requisições subsequentes
      }
    }

    // Camada de Resiliência: Direct SQL Fallback
    if (process.env.ALLOW_SQL_FALLBACK === 'true') {
      try {
        // Gravação direta e atômica na tabela de auditoria (Drizzle ORM)
        await db.insert(auditLogs).values({
          action: 'PAYMENT_COMMITTED_FALLBACK',
          payloadSummary: payloadComHash,
          blockchainHash: hashAtual,
          status: 'EM_INVESTIGACAO', // Entra como investigação de contingência
          timestamp: new Date().toISOString()
        });

        return { status: '201_CREATED_SYNCHRONOUS', method: 'SQL_FALLBACK', hash: hashAtual };
      } catch (sqlError: any) {
        console.error("🚨 [Vortex Critical Persistence Collapse]: Falha em ambas as camadas Kafka e SQL Banco de Dados.");
        throw new Error(`CRITICAL_INGESTION_FAILURE: ${sqlError.message}`);
      }
    } else {
      throw new Error("CRITICAL_INGESTION_FAILURE: Broker Kafka offline e SQL Fallback desativado.");
    }
  }
}
