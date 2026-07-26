📊 Dashboard Empresarial - Sistema Delphi

Dashboard interativo para exibição de indicadores e alertas empresariais, integrado com sistemas Delphi via bridge de comunicação. Desenvolvido com HTML, CSS e JavaScript puro, oferece visualização em tempo real, personalização de temas, geração de PDF e persistência de estado.
🚀 Tecnologias Utilizadas

    HTML5 – Estrutura semântica

    CSS3 – Estilização com variáveis e suporte a temas claro/escuro

    JavaScript (ES6) – Lógica de negócio, manipulação DOM e comunicação

    Font Awesome 6 – Ícones vetoriais

    Google Fonts (Inter) – Tipografia moderna

    html2pdf.js – Geração de PDF diretamente no navegador

    LocalStorage – Persistência de preferências (tema, itens fechados)

📁 Estrutura de Pastas
text

/
├── index.html                     # Página principal do dashboard
├── css/
│   ├── base.css                   # Variáveis CSS, reset, estilos globais e modal de ajuda
│   ├── cards.css                  # Estilos dos indicadores (cards)
│   ├── avisos.css                 # Estilos dos alertas e avisos
│   └── print.css                  # Estilos específicos para impressão e geração de PDF
├── js/
│   ├── app.js                     # Classe principal do DashboardApp (lógica e renderização)
│   ├── bridge.js                  # Ponte de comunicação com Delphi (via console.log)
│   └── theme.js                   # Gerenciador de tema claro/escuro com persistência
└── data/
    └── data.js                    # Dados de exemplo (cards e avisos) em formato JSON

⚙️ Funcionalidades Principais
📈 Indicadores (Cards)

    Exibição de métricas com ícone, título, valor e descrição.

    Cores personalizadas por card.

    Badges para categorização (HOJE, MENSAL, URGENTE, etc.).

    Ações por card:

        Abrir – dispara evento para abrir formulário correspondente no Delphi.

        Desativar – remove o card da visualização (modo teste).

        Fechar – oculta o card até o reset (persistido no LocalStorage).

🔔 Alertas & Avisos

    Lista de avisos com ícone, mensagem, descrição e quantidade em destaque.

    Cores cíclicas (10 cores) para diferenciação visual.

    Destaque automático para avisos urgentes (quantidade > 10.000.000).

    Ações por aviso (mesmo padrão dos cards: abrir, desativar, fechar).

    Exibição condicional da seção quando não há avisos.

🎨 Temas

    Suporte a tema claro e tema escuro.

    Detecção automática da preferência do sistema.

    Persistência da escolha no LocalStorage.

    Botão de alternância com animação.

📄 Geração de PDF

    Geração de relatório em PDF com layout otimizado para impressão.

    Inclui cabeçalho com data/hora, todos os cards e avisos visíveis.

    Utiliza html2pdf.js com fallback para window.print().

    Indicador de carregamento durante a geração.

🧹 Persistência e Controle

    Fechar itens: oculta o card/aviso até o reset (salvo no LocalStorage).

    Reset: restaura todos os itens fechados e reinicia o ciclo de cores.

    Atualizar: recarrega os dados (integração com Delphi).

🔗 Integração com Delphi

    Bridge via console.log com prefixo DELPHI_EVENT:.

    Captura de eventos pelo Delphi para abrir formulários e executar ações.

    Funções de teste para desativação e fechamento com notificação ao Delphi.

❓ Ajuda Interativa

    Modal com explicações detalhadas sobre indicadores, alertas e ferramentas.

    Atalho para abrir configurações (engrenagens) – bridge para Delphi.

🛠️ Pré-requisitos e Instalação
1. Ambiente Web

    Navegador moderno (Chrome, Firefox, Edge, Safari).

    Servidor web local (opcional – pode abrir diretamente o index.html).

2. Integração com Delphi (opcional)

    O sistema Delphi deve capturar mensagens do console (OnConsoleMessage) para processar os eventos.

    O bridge envia JSON no formato:
    json

    {"idForm":0,"idRegistro":0,"acao":"abrirFormulario","timestamp":"..."}

3. Dados

    O arquivo data/data.js contém os dados de exemplo. Substitua pela integração com sua API ou sistema.

▶️ Como Executar

    Clone ou baixe o repositório.

    Abra o arquivo index.html em seu navegador.

    Para melhor experiência, utilize um servidor local (ex: Live Server do VS Code).

    Os dados serão carregados automaticamente a partir de data/data.js.

    Interaja com os cards e avisos, altere o tema, gere PDF.

🧩 Configuração e Personalização
Dados

    Edite data/data.js para modificar os indicadores e avisos.

    Estrutura esperada:
    javascript

    var DADOS_DASHBOARD = {
      cards: [
        { IDDASH, Titulo, IDFormRegistro, Cor, Valor, Texto }
      ],
      avisos: [
        { IDAVISO, Mensagem, IDFormRegistro, DescricaoAviso, Avisar, TemAviso, Valor, Texto, quantidade }
      ]
    };

Limite de Urgência

    Em js/app.js, altere a constante LIMITE_URGENCIA (padrão: 10.000.000).

Cores dos Avisos

    Em js/app.js, modifique o array CORES_AVISOS para definir o ciclo de cores.

Ícones

    Os ícones são mapeados por palavras-chave no título do card. Ajuste o mapaIcones em app.js para novos mapeamentos.

🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

    Faça um fork do projeto.

    Crie uma branch para sua feature (git checkout -b feature/nova-feature).

    Commit suas alterações (git commit -m 'Adiciona nova feature').

    Push para a branch (git push origin feature/nova-feature).

    Abra um Pull Request.

📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.
👨‍💻 Autor

Desenvolvido para integração com sistemas Delphi.
Última atualização: 09/07/2026
📬 Contato

Para dúvidas ou sugestões, entre em contato através do repositório ou via e-mail.

Dashboard v5.0 – Sistema Integrado com Delphi 🚀
