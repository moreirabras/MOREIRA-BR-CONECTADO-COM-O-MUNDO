import React from 'react';
import { AsaasWebhookManager } from './AsaasWebhookManager.tsx';
import { AsaasWebhookConnectivityTester } from './AsaasWebhookConnectivityTester.tsx';
import { AsaasWebhooksDashboard } from './AsaasWebhooksDashboard.tsx';
import { Webhook, Activity } from 'lucide-react';

export const AsaasWebhookDiagnosticCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Webhook className="w-6 h-6 text-sky-400" />
          Central de Diagnóstico e Configuração de Webhooks Asaas
        </h2>
        <p className="text-sm text-slate-400">
          Gerencie configurações, teste conectividade e analise logs de falhas em tempo real.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AsaasWebhookManager />
        <AsaasWebhookConnectivityTester />
      </div>
      
      <AsaasWebhooksDashboard />
    </div>
  );
};
