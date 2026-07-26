/* js/app.js */
// Stub `window.dashboardApp` to safely queue calls made before full initialization
(function(){
    if (typeof window !== 'undefined' && !window.dashboardApp) {
        window._queuedProcessarDados = window._queuedProcessarDados || [];
        window._queuedCarregarDados = window._queuedCarregarDados || false;
        window.dashboardApp = {
            processarDados: function(dados){
                window._queuedProcessarDados.push(dados);
            },
            carregarDados: function(){
                window._queuedCarregarDados = true;
            }
        };
    }
})();

const LIMITE_URGENCIA = 10000000;

// ============================================
// CORES PARA AVISOS - CICLO DE 10 CORES
// ============================================

const CORES_AVISOS = [
    '#ef4444', // Vermelho
    '#f97316', // Laranja
    '#eab308', // Amarelo
    '#22c55e', // Verde
    '#3b82f6', // Azul
    '#8b5cf6', // Índigo
    '#a855f7', // Violeta
    '#ec4899', // Rosa
    '#06b6d4', // Ciano
    '#10b981'  // Verde-água
];

/*
const CORES_AVISOS = [
    '#fca5a5', // Vermelho pastel
    '#fdba74', // Laranja pastel
    '#fde047', // Amarelo pastel
    '#86efac', // Verde pastel
    '#93c5fd', // Azul pastel
    '#a5b4fc', // Índigo pastel
    '#d8b4fe', // Violeta pastel
    '#f9a8d4', // Rosa pastel
    '#67e8f9', // Ciano pastel
    '#6ee7b7'  // Verde-água pastel
];*/

class DashboardApp {
    constructor() {
        this.cardsGrid = document.getElementById('cardsGrid');
        this.avisosList = document.getElementById('avisosList');
        this.cardsCount = document.getElementById('cardsCount');
        this.avisosCount = document.getElementById('avisosCount');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.lastUpdate = document.getElementById('lastUpdate');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        this.data = null;
        this.carregando = false;
        
        // 🔑 CHAVES PARA LOCALSTORAGE
        this.CARDS_FECHADOS_KEY = 'dashboard_cards_fechados';
        this.AVISOS_FECHADOS_KEY = 'dashboard_avisos_fechados';
        
        // Carrega lista de itens fechados
        this.cardsFechados = this.carregarFechados(this.CARDS_FECHADOS_KEY);
        this.avisosFechados = this.carregarFechados(this.AVISOS_FECHADOS_KEY);
        
        this.mapaIcones = {
            'Contas': 'fa-file-invoice-dollar',
            'Clientes': 'fa-users',
            'Pedidos': 'fa-shopping-cart',
            'Estoque': 'fa-boxes',
            'Vendas': 'fa-chart-line',
            'Produtos': 'fa-tags',
            'Financeiro': 'fa-dollar-sign',
            'Notas Fiscais': 'fa-file-invoice',
            'Ordens': 'fa-clipboard-list',
            'Funcionários': 'fa-id-card',
            'default': 'fa-chart-bar'
        };
        
        // ============================================
        // CORES PARA AVISOS - CICLO DE 10 CORES
        // ============================================
        // Usa as cores do data.js ou define um fallback
        this.paletaCoresAvisos = typeof CORES_AVISOS !== 'undefined' 
            ? CORES_AVISOS 
            : [
                '#6a6aff', '#3b82f6', '#06b6d4', '#10b981', 
                '#84cc16', '#f59e0b', '#f97316', '#ec4899', 
                '#8b5cf6', '#14b8a6'
              ];
        
        // Índice para controle de cores (inicia em 0)
        this.indiceCorAtual = 0;
        
        this.inicializar();
    }
    
    // ============================================
    // MÉTODO PARA PEGAR PRÓXIMA COR DO CICLO
    // ============================================
    proximaCorAviso() {
        const cor = this.paletaCoresAvisos[this.indiceCorAtual];
        // Avança para a próxima cor, voltando ao início se necessário
        this.indiceCorAtual = (this.indiceCorAtual + 1) % this.paletaCoresAvisos.length;
        return cor;
    }
    
    // ============================================
    // RESETAR O ÍNDICE DE CORES (opcional)
    // ============================================
    resetarIndiceCores() {
        this.indiceCorAtual = 0;
        console.log('🔄 Índice de cores resetado');
    }
    
    // ============================================
    // MÉTODOS DO LOCALSTORAGE
    // ============================================
    
    carregarFechados(chave) {
        try {
            const dados = localStorage.getItem(chave);
            if (dados) {
                return JSON.parse(dados);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar fechados:', e);
        }
        return [];
    }
    
    salvarFechado(chave, id) {
        try {
            let lista = this.carregarFechados(chave);
            if (!lista.includes(id)) {
                lista.push(id);
                localStorage.setItem(chave, JSON.stringify(lista));
                console.log(`💾 Item ${id} salvo como fechado`);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao salvar fechado:', e);
        }
    }
    
    isFechado(chave, id) {
        const lista = this.carregarFechados(chave);
        return lista.includes(id);
    }
    
    limparFechados() {
        localStorage.removeItem(this.CARDS_FECHADOS_KEY);
        localStorage.removeItem(this.AVISOS_FECHADOS_KEY);
        this.cardsFechados = [];
        this.avisosFechados = [];
        console.log('🧹 Lista de fechados limpa');
        this.carregarDados();
    }

    resetarFechados() {
        console.log('🔄 Resetando itens fechados...');
        
        localStorage.removeItem(this.CARDS_FECHADOS_KEY);
        localStorage.removeItem(this.AVISOS_FECHADOS_KEY);
        
        this.cardsFechados = [];
        this.avisosFechados = [];
        
        this.carregarDados();
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(0, 0, 'resetFechados', {
                mensagem: 'Itens fechados resetados pelo usuário'
            });
        }
        
        this.mostrarFeedback('✅ Todos os itens foram restaurados!');
        console.log('✅ Reset completo!');
    }    
    
   
    inicializar() {
        console.log('🚀 Dashboard v5.0 - Com PDF e Botões de Configuração');
        console.log(`⚙️ Limite de urgência: quantidade > ${LIMITE_URGENCIA}`);
        console.log(`💾 Cards fechados: ${this.cardsFechados.length}`);
        console.log(`💾 Avisos fechados: ${this.avisosFechados.length}`);
        console.log(`🎨 Cores disponíveis: ${this.paletaCoresAvisos.length} cores em ciclo`);
        
        this.mostrarCarregamento();
        this.configurarEventos();
        this.carregarDados();
        this.verificarConexao();
    }
    
    mostrarCarregamento() {
        this.cardsGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner"></i>
                <span>Carregando indicadores...</span>
            </div>`;
        
        this.avisosList.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner"></i>
                <span>Carregando avisos...</span>
            </div>`;
    }
    
    configurarEventos() {
        console.log('🔧 Configurando eventos...');
        
        // Botão Atualizar
        this.refreshBtn.addEventListener('click', () => this.atualizarDados());

        // Botão Reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm('⚠️ Resetar todos os itens fechados?\n\nIsso fará com que TODOS os cards e avisos apareçam novamente.')) {
                    this.resetarFechados();
                    // Resetar o índice de cores também
                    this.resetarIndiceCores();
                }
            });
        }
        
        // ============================================
        // BOTÃO DE ENGRENAGEM - INDICADORES
        // ============================================
        const btnGearCards = document.getElementById('btnGearCards');
        if (btnGearCards) {
            btnGearCards.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('⚙️ Botão de configuração de INDICADORES clicado');
                
                if (window.delphiBridge) {
                    window.delphiBridge.executar(0, 0, 'abrirConfigCards');
                } else {
                    console.warn('⚠️ delphiBridge não disponível para abrirConfigCards');
                    this.mostrarFeedback('⚠️ Bridge não disponível');
                }
                
                this.mostrarFeedback('⚙️ Abrindo configuração de Indicadores...');
            });
        }
        
        // ============================================
        // BOTÃO DE ENGRENAGEM - ALERTAS & AVISOS
        // ============================================
        const btnGearAvisos = document.getElementById('btnGearAvisos');
        if (btnGearAvisos) {
            btnGearAvisos.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('⚙️ Botão de configuração de ALERTAS & AVISOS clicado');
                
                if (window.delphiBridge) {
                    window.delphiBridge.executar(0, 0, 'abrirConfigAvisos');
                } else {
                    console.warn('⚠️ delphiBridge não disponível para abrirConfigAvisos');
                    this.mostrarFeedback('⚠️ Bridge não disponível');
                }
                
                this.mostrarFeedback('⚙️ Abrindo configuração de Alertas...');
            });
        }
        
        // ============================================
        // BOTÃO HELP (AJUDA)
        // ============================================
        const btnHelp = document.getElementById('btnHelp');
        const modalHelp = document.getElementById('modalHelp');
        const modalClose = document.getElementById('modalClose');
        const helpUpdateTime = document.getElementById('helpUpdateTime');
        
        if (btnHelp && modalHelp) {
            // Abrir modal
            btnHelp.addEventListener('click', () => {
                console.log('❓ Botão HELP clicado');
                
                // Atualiza a data/hora no modal
                if (helpUpdateTime) {
                    helpUpdateTime.textContent = new Date().toLocaleString('pt-BR');
                }
                
                modalHelp.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
            
            // Fechar modal - botão X
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    modalHelp.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
            
            // Fechar modal - clique fora
            modalHelp.addEventListener('click', (e) => {
                if (e.target === modalHelp) {
                    modalHelp.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
            
            // Fechar modal - tecla ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modalHelp.style.display === 'flex') {
                    modalHelp.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
            
            console.log('✅ Evento HELP configurado');
        } else {
            console.warn('⚠️ Botão Help ou Modal não encontrado');
        }
        
        // Botão PDF
        const btnPdf = document.getElementById('btnPdf');
        if (btnPdf) {
            btnPdf.addEventListener('click', () => this.gerarPDF());
        }
        
        let timeoutResize;
        window.addEventListener('resize', () => {
            clearTimeout(timeoutResize);
            timeoutResize = setTimeout(() => {}, 300);
        });
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                this.atualizarDados();
            }
        });
    }    
    carregarDados() {
        if (this.carregando) return;
        this.carregando = true;

        if (typeof DADOS_DASHBOARD !== 'undefined') {
            console.log('📦 Dados carregados de data/data.js');
            this.processarDados(DADOS_DASHBOARD);
            this.carregando = false;
            this.atualizarTimestamp();
            return;
        }
        
        console.warn('⚠️ DADOS_DASHBOARD não encontrado');
        this.usarDadosFallback();
        this.carregando = false;
        this.atualizarTimestamp();
    }
    
    processarDados(dados) {
        if (!dados?.cards || !dados?.avisos) {
            this.usarDadosFallback();
            return;
        }
        
        this.data = dados;
        
        const cardsFiltrados = dados.cards.filter(card => 
            !this.isFechado(this.CARDS_FECHADOS_KEY, card.IDDASH)
        );
        
        const avisosFiltrados = dados.avisos.filter(aviso => 
            !this.isFechado(this.AVISOS_FECHADOS_KEY, aviso.IDAVISO)
        );
        
        console.log(`📊 Cards: ${dados.cards.length} → ${cardsFiltrados.length} (${dados.cards.length - cardsFiltrados.length} fechados)`);
        console.log(`📊 Avisos: ${dados.avisos.length} → ${avisosFiltrados.length} (${dados.avisos.length - avisosFiltrados.length} fechados)`);
        
        // Resetar o índice de cores antes de renderizar os avisos
        this.resetarIndiceCores();
        
        this.renderizarCards(cardsFiltrados);
        this.renderizarAvisos(avisosFiltrados);
        this.atualizarContadores(cardsFiltrados.length, avisosFiltrados.length);
    }
    
    usarDadosFallback() {
        this.processarDados({
            cards: [{ IDDASH: 0, Titulo: 'Erro', IDFormRegistro: 0, Cor: '#e74c3c', Valor: 0, Texto: 'Falha' }],
            avisos: [{ IDAVISO: 0, Mensagem: 'Erro', IDFormRegistro: 0, DescricaoAviso: 'Falha', Avisar: 'S', TemAviso: true, Valor: 0, Texto: 'Erro', quantidade: 999 }]
        });
    }
    
    renderizarCards(cards) {
        this.cardsGrid.innerHTML = '';
        
        if (!cards?.length) {
            this.cardsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><span>Nenhum indicador</span></div>';
            return;
        }
        
        cards.forEach((card, i) => {
            this.cardsGrid.appendChild(this.criarCard(card, i));
        });
    }
    
    criarCard(card, indice) {
        const artigo = document.createElement('article');
        artigo.className = 'dash-card';
        artigo.style.setProperty('--card-color', card.Cor || '#6a6aff');
        artigo.style.animationDelay = `${indice * 0.08}s`;
        artigo.setAttribute('tabindex', '0');
        artigo.setAttribute('role', 'button');
        artigo.setAttribute('aria-label', `${card.Titulo}: ${card.Texto} - Clique para abrir`);
        artigo.title = `Clique para abrir: ${card.Titulo}`;
        
        const icone = this.obterIcone(card.Titulo);
        const badge = this.obterBadge(card.Valor, card.Titulo);
        
        artigo.innerHTML = `
            <div class="card-acoes">
                <button class="card-abrir" title="Abrir card">
                    <i class="fas fa-arrow-right"></i>
                </button>
                <button class="card-desativar" title="Remover card">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="card-fechar" title="Fechar card">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-header">
                <div class="card-icon"><i class="fas ${icone}"></i></div>
            </div>
            <h3 class="card-title">${this.escapeHtml(card.Titulo)}</h3>
            <div class="card-value">${this.formatarNumero(card.Valor)}</div>
            <div class="card-text">${this.escapeHtml(card.Texto || '')}</div>
        `;
        
        artigo.addEventListener('click', (e) => {
            if (!e.target.closest('.card-abrir') && 
                !e.target.closest('.card-fechar') && 
                !e.target.closest('.card-desativar')) {
                this.cliqueCard(card);
            }
        });
        
        artigo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.cliqueCard(card);
            }
        });
        
        const btnAbrir = artigo.querySelector('.card-abrir');
        if (btnAbrir) {
            btnAbrir.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cliqueCard(card);
            });
        }
        
        const btnDesativar = artigo.querySelector('.card-desativar');
        if (btnDesativar) {
            btnDesativar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.desativarCardTeste(artigo, card);
            });
        }
        
        const btnFechar = artigo.querySelector('.card-fechar');
        if (btnFechar) {
            btnFechar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fecharCard(artigo, card);
            });
        }
        
        return artigo;
    }

    // ============================================
    // DESATIVAR CARD - TESTE
    // ============================================
    desativarCardTeste(elemento, card) {
        console.log(`🔽 DESATIVAR CARD TESTE: ${card.Titulo} (ID: ${card.IDDASH})`);

        if (window.delphiBridge) {
            window.delphiBridge.executar(
                card.IDFormRegistro,
                card.IDDASH,
                'desativarCard',
                {
                    titulo: card.Titulo,
                    valor: card.Valor,
                    texto: card.Texto
                }
            );
        }
        
        this.salvarFechado(this.CARDS_FECHADOS_KEY, card.IDDASH);
        
        if (this.data && this.data.cards) {
            this.data.cards = this.data.cards.filter(c => c.IDDASH !== card.IDDASH);
        }
        
        elemento.style.transition = 'all 0.3s ease-out';
        elemento.style.opacity = '0.3';
        elemento.style.transform = 'scale(0.95)';
        elemento.style.filter = 'grayscale(1)';
        
        setTimeout(() => {
            elemento.style.opacity = '0';
            elemento.style.transform = 'scale(0.8)';
            elemento.style.maxHeight = elemento.offsetHeight + 'px';
        }, 200);
        
        setTimeout(() => {
            elemento.style.maxHeight = '0';
            elemento.style.padding = '0';
            elemento.style.margin = '0';
            elemento.style.border = 'none';
            elemento.style.overflow = 'hidden';
        }, 400);
        
        setTimeout(() => {
            elemento.remove();
            this.atualizarContadoresCards();
            this.mostrarFeedback(`✅ Card "${card.Titulo}" desativado (TESTE)`);
        }, 600);
    }    

    // ============================================
    // FECHAR CARD 
    // ============================================
    fecharCard(elemento, card) {
        console.log(`🔕 Fechando card: ${card.Titulo} (ID: ${card.IDDASH})`);

        this.salvarFechado(this.CARDS_FECHADOS_KEY, card.IDDASH);

        if (window.delphiBridge) {
            window.delphiBridge.executar(
                card.IDFormRegistro,
                card.IDDASH,
                'fecharCard',
                {
                    titulo: card.Titulo,
                    valor: card.Valor,
                    texto: card.Texto
                }
            );
        }        
        
        if (this.data && this.data.cards) {
            this.data.cards = this.data.cards.filter(c => c.IDDASH !== card.IDDASH);
        }
        
        elemento.style.transition = 'all 0.3s ease-out';
        elemento.style.opacity = '0';
        elemento.style.transform = 'scale(0.95)';
        elemento.style.maxHeight = elemento.offsetHeight + 'px';
        
        setTimeout(() => {
            elemento.style.maxHeight = '0';
            elemento.style.padding = '0';
            elemento.style.margin = '0';
            elemento.style.border = 'none';
            elemento.style.overflow = 'hidden';
        }, 100);
        
        setTimeout(() => {
            elemento.remove();
            this.atualizarContadoresCards();
        }, 400);
    }

    atualizarContadoresCards() {
        const cardsVisiveis = this.cardsGrid.querySelectorAll('.dash-card').length;
        
        this.cardsCount.textContent = cardsVisiveis > 0 
            ? `${cardsVisiveis} indicadores` 
            : 'Nenhum indicador';
        
        if (cardsVisiveis === 0) {
            this.cardsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><span>Nenhum indicador</span></div>';
        }
    }
    
    isUrgente(quantidade) {
        return (quantidade || 0) > LIMITE_URGENCIA;
    }
    
    renderizarAvisos(avisos) {
        this.avisosList.innerHTML = '';
        const avisosSection = document.getElementById('avisosSection');
        
        if (!avisos?.length) {
            if (avisosSection) {
                avisosSection.style.display = 'none';
            }
            return;
        }
        
        if (avisosSection) {
            avisosSection.style.display = 'block';
        }
        
        const ordenados = [...avisos].sort((a, b) => {
            const aU = this.isUrgente(a.quantidade);
            const bU = this.isUrgente(b.quantidade);
            if (aU && !bU) return -1;
            if (!aU && bU) return 1;
            return 0;
        });
        
        // Resetar índice de cores antes de renderizar os avisos
        this.resetarIndiceCores();
        
        ordenados.forEach((aviso, i) => {
            this.avisosList.appendChild(this.criarAviso(aviso, i));
        });
    }
    
    // ============================================
    // CRIA AVISO COM CORES CICLICAS
    // ============================================
    criarAviso(aviso, indice) {
        if (typeof this.desativarAvisoTeste !== 'function') {
            console.warn('⚠️ desativarAvisoTeste não é uma função! Recarregue a página.');
        }
        
        const urgente = this.isUrgente(aviso.quantidade);
        
        let corAviso;
        if (urgente) {
            corAviso = '#e74c3c'; // Vermelho fixo para urgentes
        } else {
            // Usa a próxima cor do ciclo
            corAviso = this.proximaCorAviso();
        }
        
        // Converte hex para RGB para usar no background com opacidade
        const r = parseInt(corAviso.slice(1,3), 16);
        const g = parseInt(corAviso.slice(3,5), 16);
        const b = parseInt(corAviso.slice(5,7), 16);
        const corRgb = `${r}, ${g}, ${b}`;
        
        const div = document.createElement('div');
        div.className = `aviso-item ${urgente ? 'urgente' : ''}`;
        div.style.setProperty('--aviso-color', corAviso);
        div.style.background = `rgba(${corRgb}, 0.08)`;
        div.style.animationDelay = `${indice * 0.06}s`;
        div.setAttribute('tabindex', '0');
        div.setAttribute('role', 'button');
        div.setAttribute('aria-label', `${aviso.Mensagem}: ${aviso.DescricaoAviso} - Clique para abrir`);
        div.title = `Clique para abrir: ${aviso.Mensagem}`;
        
        const quantidade = aviso.quantidade || 0;
        const quantidadeFormatada = this.formatarQuantidade(quantidade);
        const icone = urgente ? 'fa-exclamation-triangle' : this.obterIconeAviso(aviso.Mensagem);
        
        div.innerHTML = `
            <div class="aviso-acoes">
                <button class="aviso-abrir" title="Abrir aviso">
                    <i class="fas fa-arrow-right"></i>
                </button>
                <button class="aviso-desativar" title="Remover aviso">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="aviso-fechar" title="Fechar aviso">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="aviso-header">
                <span class="aviso-icon" style="background: ${corAviso}">
                    <i class="fas ${icone}"></i>
                </span>
                <span class="aviso-mensagem">${this.escapeHtml(aviso.Mensagem)}</span>
            </div>
            <div class="aviso-descricao">
                <span class="aviso-qtd-destaque" style="color: ${corAviso}; background: rgba(${corRgb}, 0.1); border-color: rgba(${corRgb}, 0.15);">
                    ${quantidadeFormatada}
                </span>
                <span class="aviso-descricao-texto">${this.escapeHtml(aviso.DescricaoAviso || '')}</span>
            </div>
        `;
        
        // Hover com a mesma cor
        div.addEventListener('mouseenter', () => {
            div.style.background = `rgba(${corRgb}, 0.14)`;
        });
        
        div.addEventListener('mouseleave', () => {
            div.style.background = `rgba(${corRgb}, 0.08)`;
        });
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.aviso-abrir') && 
                !e.target.closest('.aviso-fechar') && 
                !e.target.closest('.aviso-desativar')) {
                this.cliqueAviso(aviso);
            }
        });
        
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.cliqueAviso(aviso);
            }
        });
        
        const btnAbrir = div.querySelector('.aviso-abrir');
        if (btnAbrir) {
            btnAbrir.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cliqueAviso(aviso);
            });
        }
        
        const btnDesativar = div.querySelector('.aviso-desativar');
        if (btnDesativar) {
            btnDesativar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.desativarAvisoTeste(div, aviso);
            });
        }
        
        const btnFechar = div.querySelector('.aviso-fechar');
        if (btnFechar) {
            btnFechar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fecharAviso(div, aviso);
            });
        }
        
        return div;
    }
    
    // ============================================
    // FORMATAR QUANTIDADE PARA NÚMEROS GRANDES
    // ============================================
    formatarQuantidade(valor) {
        if (valor == null || valor === undefined) return '0';
        if (valor >= 1000000000) return (valor / 1000000000).toFixed(1) + 'B';
        if (valor >= 1000000) return (valor / 1000000).toFixed(1) + 'M';
        if (valor >= 1000) return (valor / 1000).toFixed(1) + 'K';
        return String(valor);
    }

    obterIconeAviso(mensagem) {
        if (!mensagem) return 'fa-info-circle';
        
        const m = mensagem.toLowerCase();
        
        if (m.includes('estoque') || m.includes('produto')) return 'fa-box';
        if (m.includes('cliente') || m.includes('pessoa')) return 'fa-user';
        if (m.includes('venda') || m.includes('pedido')) return 'fa-shopping-cart';
        if (m.includes('financeiro') || m.includes('conta') || m.includes('pagamento')) return 'fa-coins';
        if (m.includes('fiscal') || m.includes('nota')) return 'fa-file-invoice';
        if (m.includes('sistema') || m.includes('erro')) return 'fa-server';
        if (m.includes('segurança') || m.includes('seguranca')) return 'fa-shield-alt';
        if (m.includes('prazo') || m.includes('data')) return 'fa-calendar-alt';
        if (m.includes('entrega') || m.includes('envio')) return 'fa-truck';
        if (m.includes('qualidade') || m.includes('qualidad')) return 'fa-check-circle';
        if (m.includes('produção') || m.includes('producao')) return 'fa-industry';
        if (m.includes('recursos') || m.includes('pessoas')) return 'fa-users-cog';
        
        return 'fa-info-circle';
    }

    // ============================================
    // DESATIVAR AVISO - TESTE
    // ============================================
    desativarAvisoTeste(elemento, aviso) {
        console.log(`🔽 DESATIVAR AVISO TESTE: ${aviso.Mensagem} (ID: ${aviso.IDAVISO})`);

        if (window.delphiBridge) {
            window.delphiBridge.executar(
                aviso.IDFormRegistro,
                aviso.IDAVISO,
                'desativarAviso',
                {
                    mensagem: aviso.Mensagem,
                    quantidade: aviso.quantidade,
                    descricao: aviso.DescricaoAviso,
                    urgente: this.isUrgente(aviso.quantidade)
                }
            );
        }
        
        this.salvarFechado(this.AVISOS_FECHADOS_KEY, aviso.IDAVISO);
        
        if (this.data && this.data.avisos) {
            this.data.avisos = this.data.avisos.filter(a => a.IDAVISO !== aviso.IDAVISO);
        }
        
        elemento.style.transition = 'all 0.3s ease-out';
        elemento.style.opacity = '0.3';
        elemento.style.transform = 'scale(0.95)';
        elemento.style.filter = 'grayscale(1)';
        
        setTimeout(() => {
            elemento.style.opacity = '0';
            elemento.style.transform = 'scale(0.8)';
            elemento.style.maxHeight = elemento.offsetHeight + 'px';
        }, 200);
        
        setTimeout(() => {
            elemento.style.maxHeight = '0';
            elemento.style.padding = '0';
            elemento.style.margin = '0';
            elemento.style.border = 'none';
            elemento.style.overflow = 'hidden';
        }, 400);
        
        setTimeout(() => {
            elemento.remove();
            this.atualizarContadoresAposFechar();
            
            const avisosRestantes = this.avisosList.querySelectorAll('.aviso-item').length;
            if (avisosRestantes === 0) {
                const avisosSection = document.getElementById('avisosSection');
                if (avisosSection) {
                    avisosSection.style.display = 'none';
                }
            }
            this.mostrarFeedback(`✅ Aviso "${aviso.Mensagem}" desativado (TESTE)`);
        }, 600);
    }    
    
    // ============================================
    // FECHAR AVISO 
    // ============================================
    fecharAviso(elemento, aviso) {
        console.log(`🔕 Fechando aviso: ${aviso.Mensagem} (ID: ${aviso.IDAVISO})`);

        this.salvarFechado(this.AVISOS_FECHADOS_KEY, aviso.IDAVISO);

        if (window.delphiBridge) {
            window.delphiBridge.executar(
                aviso.IDFormRegistro,
                aviso.IDAVISO,
                'fecharAviso',
                {
                    mensagem: aviso.Mensagem,
                    quantidade: aviso.quantidade,
                    descricao: aviso.DescricaoAviso,
                    urgente: this.isUrgente(aviso.quantidade)
                }
            );
        }       
        
        if (this.data && this.data.avisos) {
            this.data.avisos = this.data.avisos.filter(a => a.IDAVISO !== aviso.IDAVISO);
        }
        
        elemento.style.transition = 'all 0.3s ease-out';
        elemento.style.opacity = '0';
        elemento.style.transform = 'scale(0.95)';
        elemento.style.maxHeight = elemento.offsetHeight + 'px';
        
        setTimeout(() => {
            elemento.style.maxHeight = '0';
            elemento.style.padding = '0';
            elemento.style.margin = '0';
            elemento.style.border = 'none';
            elemento.style.overflow = 'hidden';
        }, 100);
        
        setTimeout(() => {
            elemento.remove();
            this.atualizarContadoresAposFechar();
            
            const avisosRestantes = this.avisosList.querySelectorAll('.aviso-item').length;
            if (avisosRestantes === 0) {
                const avisosSection = document.getElementById('avisosSection');
                if (avisosSection) {
                    avisosSection.style.display = 'none';
                }
            }
        }, 400);
    }

    atualizarContadoresAposFechar() {
        const avisosVisiveis = this.avisosList.querySelectorAll('.aviso-item').length;
        const urgentesVisiveis = this.avisosList.querySelectorAll('.aviso-item.urgente').length;
        
        if (this.data && this.data.cards) {
            this.cardsCount.textContent = `${this.data.cards.length} indicadores`;
        }
        
        if (avisosVisiveis === 0) {
            this.avisosCount.textContent = 'Nenhum aviso';
            const avisosSection = document.getElementById('avisosSection');
            if (avisosSection) {
                avisosSection.style.display = 'none';
            }
        } else if (urgentesVisiveis > 0) {
            this.avisosCount.textContent = `${avisosVisiveis} avisos (${urgentesVisiveis} urgentes)`;
            const avisosSection = document.getElementById('avisosSection');
            if (avisosSection) {
                avisosSection.style.display = 'block';
            }
        } else {
            this.avisosCount.textContent = `${avisosVisiveis} avisos`;
            const avisosSection = document.getElementById('avisosSection');
            if (avisosSection) {
                avisosSection.style.display = 'block';
            }
        }
    }
    
    cliqueCard(card) {
        console.log(`🖱️ Card: ${card.Titulo} (ID: ${card.IDDASH})`);
        this.mostrarFeedback(`Abrindo: ${card.Titulo}`);
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(card.IDFormRegistro, card.IDDASH, 'abrirFormulario');
        } else {
            console.warn('⚠️ delphiBridge não disponível');
        }
    }
    
    cliqueAviso(aviso) {
        console.log(`🖱️ Aviso: ${aviso.Mensagem} (ID: ${aviso.IDAVISO}) | Qtd: ${aviso.quantidade} | Urgente: ${this.isUrgente(aviso.quantidade)}`);
        this.mostrarFeedback(`Abrindo: ${aviso.Mensagem}`);
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(aviso.IDFormRegistro, aviso.IDAVISO, 'abrirAviso');
        } else {
            console.warn('⚠️ delphiBridge não disponível');
        }
    }
    
    atualizarDados() {
        const icone = this.refreshBtn.querySelector('i');
        icone.classList.add('fa-spin');
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(0, 0, 'atualizar');
            console.log('🔄 Notificando Delphi: atualizar');
        }
        
        this.carregarDados();
        setTimeout(() => icone.classList.remove('fa-spin'), 1000);
    }
    
    atualizarContadores(totalCards, totalAvisos) {
        this.cardsCount.textContent = `${totalCards} indicadores`;
        
        if (this.data) {
            const urgentes = this.data.avisos.filter(a => this.isUrgente(a.quantidade)).length;
            this.avisosCount.textContent = urgentes > 0 
                ? `${totalAvisos} avisos (${urgentes} urgentes)` 
                : `${totalAvisos} avisos`;
        }
    }
    
    atualizarTimestamp() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `Atualizado: ${new Date().toLocaleString('pt-BR')}`;
        }
    }
    
    verificarConexao() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (!connectionStatus) return;
        
        if (window.delphiBridge) {
            const ok = window.delphiBridge.verificarConexao();
            connectionStatus.innerHTML = ok 
                ? '<i class="fas fa-circle" style="color:var(--accent-success)"></i><span>Conectado ao Delphi</span>'
                : '<i class="fas fa-circle" style="color:var(--accent-warning)"></i><span>Modo Desenvolvimento</span>';
        } else {
            connectionStatus.innerHTML = '<i class="fas fa-circle" style="color:var(--accent-error)"></i><span>Bridge não carregado</span>';
        }
    }
    
    gerarPDF() {
        console.log('📄 Iniciando geração de PDF...');
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(0, 0, 'gerarPDF');
        }
               
        // Mostra loading
        const loading = document.getElementById('pdfLoading');
        if (loading) loading.style.display = 'flex';
        
        // Verifica se html2pdf está disponível
        if (typeof html2pdf === 'undefined') {
            console.warn('⚠️ html2pdf não encontrado, usando fallback via print');
            this.mostrarFeedback('⚠️ Gerando PDF via impressão...');
            setTimeout(() => {
                if (loading) loading.style.display = 'none';
                window.print();
            }, 500);
            return;
        }
        
        // Clone do dashboard para não afetar a visualização atual
        const container = document.querySelector('.dashboard-container');
        if (!container) {
            console.error('❌ Container não encontrado');
            if (loading) loading.style.display = 'none';
            this.mostrarFeedback('❌ Erro: container não encontrado');
            return;
        }
        
        // Salva estado atual dos cards para restauração
        const cardsOriginal = document.querySelector('.cards-grid')?.innerHTML || '';
        
        // Cria um container para o PDF
        const pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdfContainer';
        pdfContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-120vw);
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 20mm 15mm 15mm 15mm;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1a1a2e;
            z-index: 99998;
            box-sizing: border-box;
            opacity: 1;
            pointer-events: none;
            visibility: visible;
            overflow: visible;
        `;
        
        // HEADER DO PDF
        const headerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 3px solid #6a6aff;">
                <div>
                    <h1 style="font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 2px 0; letter-spacing: -0.5px;">
                        📊 Dashboard
                    </h1>
                    <p style="font-size: 12px; color: #6c757d; margin: 0;">
                        ${this.data?.usuario || 'Usuário'} • ${this.data?.empresa || 'Empresa'}
                    </p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #6c757d; line-height: 1.4;">
                    <div style="font-weight: 600; color: #1a1a2e;">Gerado em:</div>
                    <div>${new Date().toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })}</div>
                </div>
            </div>
        `;
        
        // CARDS - Grid 4 colunas
        const cardsAtuais = document.querySelectorAll('.dash-card');
        let cardsHTML = '';
        if (cardsAtuais.length > 0) {
            cardsHTML = `
                <div style="margin-bottom: 16px;">
                    <h2 style="font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #6a6aff;">■</span> Indicadores
                        <span style="font-size: 11px; font-weight: 400; color: #6c757d; margin-left: 6px;">(${cardsAtuais.length})</span>
                    </h2>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        ${Array.from(cardsAtuais).map(card => {
                            const titulo = card.querySelector('.card-title')?.textContent || '';
                            const valor = card.querySelector('.card-value')?.textContent || '0';
                            const texto = card.querySelector('.card-text')?.textContent || '';
                            const cor = card.style.getPropertyValue('--card-color') || '#6a6aff';
                            const icone = card.querySelector('.card-icon i')?.className || 'fa fa-chart-bar';
                            
                            return `
                                <div style="background: #f8f9fa; border-radius: 10px; padding: 12px 14px; border: 1px solid #e9ecef; border-top: 4px solid ${cor}; display: flex; flex-direction: column;">
                                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                        <span style="width: 28px; height: 28px; border-radius: 8px; background: ${cor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                                            <i class="${icone}"></i>
                                        </span>
                                        <span style="font-size: 11px; font-weight: 600; color: #6c757d;">${this.escapeHtml(titulo)}</span>
                                    </div>
                                    <div style="font-size: 20px; font-weight: 900; color: #1a1a2e; line-height: 1.2;">${valor}</div>
                                    ${texto ? `<div style="font-size: 11px; color: #6c757d; margin-top: 1px;">${this.escapeHtml(texto)}</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // AVISOS - Lista
        const avisosAtuais = document.querySelectorAll('.aviso-item');
        let avisosHTML = '';
        if (avisosAtuais.length > 0) {
            const urgentes = document.querySelectorAll('.aviso-item.urgente').length;
            avisosHTML = `
                <div>
                    <h2 style="font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #e74c3c;">■</span> Alertas & Avisos
                        <span style="font-size: 11px; font-weight: 400; color: #6c757d; margin-left: 6px;">
                            (${avisosAtuais.length}${urgentes > 0 ? ` • ${urgentes} urgentes` : ''})
                        </span>
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${Array.from(avisosAtuais).map(aviso => {
                            const mensagem = aviso.querySelector('.aviso-mensagem')?.textContent || '';
                            const descricao = aviso.querySelector('.aviso-descricao-texto')?.textContent || '';
                            const qtd = aviso.querySelector('.aviso-qtd-destaque')?.textContent || '0';
                            const isUrgente = aviso.classList.contains('urgente');
                            const cor = aviso.style.getPropertyValue('--aviso-color') || (isUrgente ? '#e74c3c' : '#6a6aff');
                            const icone = aviso.querySelector('.aviso-icon i')?.className || 'fa fa-info-circle';
                            
                            return `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: ${isUrgente ? '#fff5f5' : '#f8f9fa'}; border-radius: 8px; border-left: 4px solid ${isUrgente ? '#e74c3c' : cor};">
                                    <span style="width: 22px; height: 22px; border-radius: 6px; background: ${isUrgente ? '#e74c3c' : cor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; flex-shrink: 0;">
                                        <i class="${icone}"></i>
                                    </span>
                                    <span style="font-size: 13px; font-weight: 700; color: ${isUrgente ? '#e74c3c' : '#1a1a2e'}; min-width: 30px;">${qtd}</span>
                                    <span style="font-size: 12px; font-weight: 600; color: #1a1a2e; flex: 1;">${this.escapeHtml(mensagem)}</span>
                                    <span style="font-size: 11px; color: #6c757d;">${this.escapeHtml(descricao)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // FOOTER DO PDF
        const footerHTML = `
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; font-size: 10px; color: #adb5bd;">
                <span>Dashboard gerado automaticamente</span>
                <span>Página 1/1</span>
            </div>
        `;
        
        // Monta o HTML completo
        pdfContainer.innerHTML = headerHTML + cardsHTML + avisosHTML + footerHTML;
        document.body.appendChild(pdfContainer);
        
        // Busca os ícones Font Awesome que não estão carregados
        const linksFontAwesome = document.querySelectorAll('link[href*="font-awesome"]');
        const linkFonts = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        
        // Adiciona os links de fonte no container do PDF
        linksFontAwesome.forEach(link => {
            if (!pdfContainer.querySelector(`link[href="${link.href}"]`)) {
                const clone = link.cloneNode(true);
                pdfContainer.appendChild(clone);
            }
        });
        
        linkFonts.forEach(link => {
            if (!pdfContainer.querySelector(`link[href="${link.href}"]`)) {
                const clone = link.cloneNode(true);
                pdfContainer.appendChild(clone);
            }
        });
        
        // Garante que as fontes sejam carregadas
        if (!pdfContainer.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            pdfContainer.appendChild(faLink);
        }
        
        // Pequeno delay para garantir que os estilos sejam aplicados
        setTimeout(() => {
            const opt = {
                margin: 0,
                filename: `dashboard_${this.formatarData()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: function(doc) {
                        const container = doc.getElementById('pdfContainer');
                        if (container) {
                            container.style.position = 'static';
                            container.style.top = 'auto';
                            container.style.left = 'auto';
                            container.style.opacity = '1';
                            container.style.pointerEvents = 'auto';
                            container.style.visibility = 'visible';
                            container.style.width = '210mm';
                            container.style.minHeight = '297mm';
                            container.style.overflow = 'visible';
                        }
                    }
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                }
            };
            
            html2pdf()
                .set(opt)
                .from(pdfContainer)
                .save()
                .then(() => {
                    console.log('✅ PDF gerado com sucesso!');
                    this.mostrarFeedback('✅ PDF gerado com sucesso!');
                    document.body.removeChild(pdfContainer);
                    if (loading) loading.style.display = 'none';
                })
                .catch(erro => {
                    console.error('❌ Erro ao gerar PDF:', erro);
                    this.mostrarFeedback('❌ Erro ao gerar PDF. Tentando fallback...');
                    document.body.removeChild(pdfContainer);
                    
                    // Fallback: tenta print
                    setTimeout(() => {
                        if (loading) loading.style.display = 'none';
                        window.print();
                    }, 500);
                });
        }, 500);
    }        

    // ============================================
    // MÉTODO DE FALLBACK PARA PDF
    // ============================================
    gerarPDFFallback(elemento) {
        const loading = document.getElementById('pdfLoading');
        
        const opcoesFallback = {
            margin: 10,
            filename: `dashboard_${this.formatarData()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: true,
                width: 1000,
                height: elemento.scrollHeight + 50
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4',
                orientation: 'portrait'
            }
        };
        
        html2pdf()
            .set(opcoesFallback)
            .from(elemento)
            .save()
            .then(() => {
                console.log('✅ PDF gerado com sucesso (fallback)!');
                this.mostrarFeedback('✅ PDF gerado com sucesso!');
                if (loading) loading.style.display = 'none';
            })
            .catch(erro => {
                console.error('❌ Erro no fallback:', erro);
                this.mostrarFeedback('❌ Erro ao gerar PDF. Tente novamente.');
                if (loading) loading.style.display = 'none';
                
                // Último recurso: tenta imprimir
                console.log('🔄 Último recurso: tentando window.print()...');
                setTimeout(() => window.print(), 500);
            });
    }

    // ============================================
    // MÉTODO PARA RESTAURAR O LAYOUT
    // ============================================
    restaurarLayout(container, temaAnterior, cardsGrid) {
        document.documentElement.setAttribute('data-theme', temaAnterior);
        container.classList.remove('pdf-version');
        
        container.style.width = '';
        container.style.maxWidth = '';
        container.style.margin = '';
        container.style.padding = '';
        container.style.background = '';
        container.style.minWidth = '';
        
        if (cardsGrid) {
            cardsGrid.style.display = '';
            cardsGrid.style.gridTemplateColumns = '';
            cardsGrid.style.gap = '';
            cardsGrid.style.width = '';
        }
        
        // Restaura max-height dos cards
        const cards = document.querySelectorAll('.dash-card');
        cards.forEach(card => {
            card.style.maxHeight = '';
            card.style.height = '';
        });
    }

    formatarData() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        const seg = String(agora.getSeconds()).padStart(2, '0');
        
        return `${ano}${mes}${dia}_${hora}${min}${seg}`;
    }
    
    obterIcone(titulo) {
        if (!titulo) return this.mapaIcones.default;
        for (const [k, v] of Object.entries(this.mapaIcones)) {
            if (titulo.toLowerCase().includes(k.toLowerCase())) return v;
        }
        return this.mapaIcones.default;
    }
    
    obterBadge(valor, titulo) {
        if (!titulo) return null;
        
        const t = titulo.toLowerCase();
        
        if (t.includes('hoje')) return 'HOJE';
        if (t.includes('ontem')) return 'ONTEM';
        if (t.includes('semana')) return 'SEMANAL';
        if (t.includes('mês') || t.includes('mes')) return 'MENSAL';
        if (t.includes('ano')) return 'ANUAL';
        
        if (t.includes('pendente')) return 'PENDENTE';
        if (t.includes('atraso') || t.includes('atrasado')) return 'ATRASADO';
        if (t.includes('vencido') || t.includes('vencendo')) return 'VENCIDO';
        if (t.includes('cancelado')) return 'CANCELADO';
        if (t.includes('concluído') || t.includes('concluido')) return 'CONCLUÍDO';
        if (t.includes('aprovado')) return 'APROVADO';
        
        if (t.includes('estoque')) return 'ESTOQUE';
        if (t.includes('venda')) return 'VENDAS';
        if (t.includes('cliente')) return 'CLIENTES';
        if (t.includes('financeiro') || t.includes('conta')) return 'FINANCEIRO';
        if (t.includes('fiscal') || t.includes('nota')) return 'FISCAL';
        if (t.includes('pedido')) return 'PEDIDOS';
        
        if (t.includes('urgente')) return 'URGENTE';
        if (t.includes('crítico') || t.includes('critico')) return 'CRÍTICO';
        if (t.includes('atenção') || t.includes('atencao')) return 'ATENÇÃO';
        
        return null;
    }
    
    formatarNumero(valor) {
        if (valor == null) return '0';
        return valor >= 1000 ? valor.toLocaleString('pt-BR') : String(valor);
    }
    
    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';
        if (valor < 1) return String(valor);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }
    
    escapeHtml(texto) {
        if (!texto) return '';
        const d = document.createElement('div');
        d.textContent = texto;
        return d.innerHTML;
    }
    
    mostrarFeedback(msg) {
        const antigo = document.querySelector('.click-feedback');
        if (antigo) antigo.remove();
        
        const el = document.createElement('div');
        el.className = 'click-feedback';
        el.textContent = msg;
        document.body.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => el.remove(), 300);
        }, 2000);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
    // Drain any calls that were queued before the full initialization
    if (window._queuedProcessarDados && window._queuedProcessarDados.length) {
        window._queuedProcessarDados.forEach(d => {
            try { window.dashboardApp.processarDados(d); } catch (e) { console.error(e); }
        });
        window._queuedProcessarDados = [];
    }
    if (window._queuedCarregarDados) {
        try { window.dashboardApp.carregarDados(); } catch (e) { console.error(e); }
        window._queuedCarregarDados = false;
    }
});

// ============================================
// FUNÇÕES GLOBAIS (chamadas pelo Delphi)
// ============================================

function atualizarDados(dados) {
    if (window.dashboardApp) {
        window.dashboardApp.processarDados(dados);
    }
}

function recarregarDataJson() {
    if (window.dashboardApp) {
        window.dashboardApp.carregarDados();
    }
}