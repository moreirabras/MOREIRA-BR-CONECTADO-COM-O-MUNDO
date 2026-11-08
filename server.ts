app.put('/api/config/split', (req, res) => {
  asaasSplitConfig = { ...asaasSplitConfig, ...req.body, lastUpdated: new Date().toISOString() };
  res.json(asaasSplitConfig);
});

// ==========================================
// 5. ROTAS DE KAFKA BROKERS & EVENTOS
// ==========================================
app.get('/api/kafka/nodes', (req, res) => {
  res.json(kafkaBrokerNodes);
});

app.get('/api/kafka/messages', (req, res) => {
  res.json(kafkaMessageDeliveryLogs);
});

// ==========================================
// 6. FALLBACK PARA O FRONTEND VITE/SPA
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR (EXPRESS + WEBSOCKET)
// ==========================================
async function startServer() {
  try {
    const server = createServer(app);
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ type: 'WELCOME', message: 'Conectado ao WebSocket BACEN Compliance & Fintech SLP' }));
    });

    const PORT = process.env.PORT || 10000;

    server.listen(PORT, () => {
      console.log(`======================================================================`);
      console.log(`🚀 FINTECH SLP RUNNING ON PORT ${PORT} (ENVIRONMENT: REAL-LIVE)`);
      console.log(`🏢 COMPANY: MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA`);
      console.log(`🛡 BACEN 3.978 COMPLIANCE GENERATIVE SERVICE ACTIVE`);
      console.log(`======================================================================`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();