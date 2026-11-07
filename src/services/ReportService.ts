import { db } from '../db/index.ts';
import { transactions } from '../db/schema.ts';
import { MailService } from './MailService.ts';

export const ReportService = {
  async generateAndSendWeeklyReport() {
    try {
      const allTxs = await db.select().from(transactions);
      // Extraindo valor do webhookPayload jsonb
      const totalVolume = allTxs.reduce((acc, tx) => {
        const payload = tx.webhookPayload as any;
        const val = payload?.valor || payload?.amount || 0;
        return acc + Number(val);
      }, 0) / 100;
      
      await MailService.sendReport(
        'josemoreirabrazil@gmail.com',
        'Relatório Semanal de Faturamento - Moreira Brasil',
        `Volume total transacionado: R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `<h1>Relatório Semanal de Faturamento</h1>
         <p>Volume total transacionado: <b>R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></p>
         <p>Sistema Moreira Brasil - Operação 24/7/365</p>`
      );
      console.log('Relatório enviado com sucesso para josemoreirabrazil@gmail.com');
    } catch (error) {
      console.error('Erro ao gerar/enviar relatório:', error);
    }
  }
};
