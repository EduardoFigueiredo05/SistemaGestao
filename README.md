# 💰 COINEST - Dashboard de Controle Financeiro Pessoal

Um sistema web moderno, responsivo e intuitivo para gestão financeira pessoal. Desenvolvido com HTML, CSS e JavaScript puros (Vanilla JS), o projeto foca em performance, acessibilidade e persistência de dados local sem a necessidade de um banco de dados externo ou servidor.

Este projeto foi desenvolvido por Eduardo Soares Figueiredo, como parte das atividades acadêmicas do curso de Sistemas para Internet do Centro Universitário Senac.

## 🚀 Como Executar o Projeto

Como o projeto é construído exclusivamente com tecnologias front-end nativas, executá-lo é extremamente simples. Não há necessidade de instalar Node.js, NPM ou configurar servidores.

1. **Faça o download ou clone o repositório:**
   Baixe os arquivos do projeto para uma pasta no seu computador.
2. **Abra o arquivo principal:**
   Navegue até a pasta onde os arquivos foram salvos e dê um duplo clique no arquivo `index.html`. 
3. **Pronto!**
   O sistema será aberto no seu navegador padrão (Google Chrome, Firefox, Edge, Safari, etc.) e já estará pronto para uso.

> **Nota:** Todos os dados cadastrados são salvos automaticamente no `LocalStorage` do seu navegador. Isso significa que você pode fechar a aba e, ao abrir novamente, suas informações estarão lá (desde que não limpe o cache do navegador).

## ✨ Funcionalidades Disponíveis

O sistema é dividido em três módulos principais, acessíveis através da barra de navegação lateral:

### 1. 📊 Dashboard (Visão Geral)
- **Resumo Financeiro:** Visualização rápida do Saldo Atual, Total de Receitas e Total de Despesas.
- **Gráfico de Fluxo de Caixa:** Gráfico de barras interativo comparando as entradas e saídas mês a mês.
- **Despesas por Categoria:** Gráfico de rosca (donut) mostrando a distribuição percentual e em valores dos seus gastos.
- **Atalhos e Resumo:** Listagem rápida das últimas transações e exibição visual do seu cartão de crédito principal.

### 2. 💱 Transações (Gestão de Movimentações)
- **CRUD Completo:** Adicione, visualize, edite e exclua receitas e despesas.
- **Filtros Avançados:** Filtre seu extrato em tempo real por descrição, valor, período (data inicial e final), tipo (receita/despesa), categoria ou cartão utilizado.
- **Totais Dinâmicos:** As pílulas de resumo no topo da tela são atualizadas instantaneamente calculando o saldo apenas das transações que correspondem aos filtros aplicados.
- **Exportação de Relatórios:** Botão para exportar a lista atual de transações (respeitando os filtros ativos) diretamente para um arquivo `.csv`, compatível com Excel e Google Sheets.

### 3. 💳 Cartões Virtuais (Gestão de Limite e Uso)
- **Gestão de Múltiplos Cartões:** Cadastre cartões virtuais definindo nome, final (últimos 4 dígitos), bandeira e limite de crédito.
- **Personalização Visual:** Escolha uma cor de destaque para cada cartão, que será aplicada ao design do cartão em toda a interface gerando um degradê moderno automático.
- **Vínculo Inteligente:** Ao criar uma despesa, você pode vinculá-la a um cartão específico ou marcá-la como paga em "Dinheiro".
- **Painel Analítico do Cartão:** Ao clicar em um cartão, o sistema calcula automaticamente quanto do limite já foi gasto, exibe uma barra de progresso de uso (que muda de cor caso o limite esteja no fim) e gera um gráfico exclusivo com os gastos daquele cartão específico.

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica e acessível.
- **CSS3:** Estilização moderna utilizando CSS Grid, Flexbox e Variáveis CSS (Custom Properties) para fácil manutenção de temas e responsividade total (Mobile, Tablet e Desktop).
- **JavaScript (ES6+):** Lógica de negócios modular, manipulação do DOM e persistência de dados no formato JSON.
- **API LocalStorage:** Armazenamento dos dados (`appFinancas_transactions` e `appFinancas_cards`) diretamente no navegador do usuário.
- **Chart.js (via CDN):** Renderização dos gráficos de barras e rosca para análise de dados.
- **Lucide Icons (via CDN):** Biblioteca de ícones vetoriais modernos, leves e consistentes.

## 📁 Estrutura de Arquivos

```text
/
├── index.html       # Estrutura principal e tela de Dashboard
├── transacoes.html  # Tela dedicada ao histórico e filtros de transações
├── cartoes.html     # Tela de gerenciamento e analytics de cartões
├── style.css        # Folha de estilos global unificada para todas as telas
├── script.js        # Lógica do Dashboard (CRUD básico, gráficos principais)
├── transacoes.js    # Lógica de filtros avançados, totais dinâmicos e exportação CSV
└── cartoes.js       # Lógica do painel de cartões, cálculos de limite e personalização
