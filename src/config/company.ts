/**
 * CONFIGURAÇÃO DE IDENTIDADE LEGAL DA EMPRESA
 * -----------------------------------------
 * Dados extraídos do Cartão CNPJ para emissão de notas fiscais 
 * e conformidade com os órgãos reguladores.
 */

export const COMPANY_INFO = {
  name: "MOREIRA BRASIL CONSTRUCOES E SERVICOS LTDA",
  tradeName: "BRAZIL CONSTRUCOES",
  cnpj: "68.603.032/0001-15",
  address: {
    street: "AV TANCREDO NEVES",
    number: "002539",
    complement: "EDIF CEO SALVADOR SHOPPING TORRE LONDRES SALA 2609",
    neighborhood: "CAMINHO DAS ARVORES",
    city: "SALVADOR",
    state: "BA",
    zipCode: "41.820-021"
  },
  // CNAEs selecionados (apenas relacionados a Web/TI conforme solicitado)
  activities: [
    { code: "62.01-5-01", description: "Desenvolvimento de programas de computador sob encomenda" },
    { code: "62.01-5-02", description: "Web design" },
    { code: "63.11-9-00", description: "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet" }
  ],
  contact: {
    email: "JOSEMOREIRA24@GMAIL.COM",
    phones: ["(11) 9295-33394", "(71) 9938-4766"]
  }
};
