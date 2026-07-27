const LIMITE_URGENCIA = window.DashboardConfig?.LIMITE_URGENCIA ?? 10000000;

// ============================================
// CORES PARA AVISOS - CICLO DE 10 CORES
// ============================================

const CORES_AVISOS = window.DashboardConfig?.CORES_AVISOS ?? [
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
        // this.ULTIMO_ENVIO_KEY = 'dashboard_ultimo_envio_pdf'; // ❌ REMOVIDO – não usamos mais controle diário
        this._envioAgendado = false;
        
        // Carrega lista de itens fechados
        this.cardsFechados = this.carregarFechados(this.CARDS_FECHADOS_KEY);
        this.avisosFechados = this.carregarFechados(this.AVISOS_FECHADOS_KEY);
        
        this.mapaIcones = window.DashboardConfig?.MAPA_ICONES || {
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

        this.cardRenderer = new window.DashboardCardRenderer(this);
        this.avisoRenderer = new window.DashboardAvisoRenderer(this);

        
        // ============================================
        // CORES PARA AVISOS - CICLO DE 10 CORES
        // ============================================
        this.paletaCoresAvisos = typeof CORES_AVISOS !== 'undefined' 
            ? CORES_AVISOS 
            : [
                '#6a6aff', '#3b82f6', '#06b6d4', '#10b981', 
                '#84cc16', '#f59e0b', '#f97316', '#ec4899', 
                '#8b5cf6', '#14b8a6'
              ];
        
        // Índice para controle de cores (inicia em 0)
        this.indiceCorAtual = 0;
        
        // LOG: Informações do dashboard
        console.log('🏗️ DashboardApp instanciado');
        console.log(`📊 Dashboard ID: ${window.__DASHBOARD_ID || 'default'}`);
        console.log(`📁 Arquivo de dados: ${window.__DASHBOARD_DATA_FILE || 'desconhecido'}`);
        
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
        console.log(`🏷️ ID atual: ${window.__DASHBOARD_ID || 'default'}`);
        
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

        // Botão Salvar PDF no Disco
        const btnSavePdfDisco = document.getElementById('btnSavePdfDisco');
        if (btnSavePdfDisco) {
            btnSavePdfDisco.addEventListener('click', () => {
                console.log('💾 Solicitando salvamento do PDF no disco...');
                if (window.pdfExportManager) {
                    window.pdfExportManager.salvarPdfNoDisco(False);
                } else {
                    console.warn('⚠️ PdfExportManager não disponível');
                    this.mostrarFeedback('⚠️ Gerenciador de PDF não disponível');
                }
            });
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

		console.log(`🔄 Carregando dados do arquivo: ${window.__DASHBOARD_DATA_FILE || 'desconhecido'}`);
		console.log(`🏷️ ID: ${window.__DASHBOARD_ID || 'default'}`);

		// 🔥 NOVO: Aguarda o carregamento do arquivo específico
		if (window.__DASHBOARD_ID && window.__DASHBOARD_ID !== 'default') {
			// Tem ID específico, aguarda o arquivo carregar
			console.log(`⏳ Aguardando arquivo data/data_${window.__DASHBOARD_ID}.js carregar...`);
			
			// Verifica se o DADOS_DASHBOARD já existe
			if (typeof DADOS_DASHBOARD !== 'undefined') {
				console.log(`📦 Dados carregados de ${window.__DASHBOARD_DATA_FILE}`);
				this.processarDados(DADOS_DASHBOARD);
				this.carregando = false;
				this.atualizarTimestamp();
				return;
			}
			
			// Se não existe, tenta novamente em 100ms (até 10 tentativas)
			let tentativas = 0;
			const maxTentativas = 20; // 2 segundos no total
			
			const aguardarDados = () => {
				tentativas++;
				if (typeof DADOS_DASHBOARD !== 'undefined') {
					console.log(`📦 Dados carregados após ${tentativas} tentativa(s)`);
					this.processarDados(DADOS_DASHBOARD);
					this.carregando = false;
					this.atualizarTimestamp();
					return;
				}
				
				if (tentativas >= maxTentativas) {
					console.warn(`⚠️ DADOS_DASHBOARD não encontrado após ${maxTentativas} tentativas, usando fallback`);
					this.usarDadosFallback();
					this.carregando = false;
					this.atualizarTimestamp();
					return;
				}
				
				console.log(`⏳ Aguardando dados... (${tentativas}/${maxTentativas})`);
				setTimeout(aguardarDados, 100);
			};
			
			aguardarDados();
			return;
		}

		// Sem ID específico, usa data/data.js
		if (typeof DADOS_DASHBOARD !== 'undefined') {
			console.log(`📦 Dados carregados de ${window.__DASHBOARD_DATA_FILE || 'data/data.js'}`);
			console.log(`📊 Cards: ${DADOS_DASHBOARD.cards?.length || 0}`);
			console.log(`📊 Avisos: ${DADOS_DASHBOARD.avisos?.length || 0}`);
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

    // ============================================
    // CONTROLE DE ENVIO AUTOMÁTICO DE PDF
    // ============================================

    // ❌ MÉTODOS REMOVIDOS:
    // _deveEnviarPDFAutomatico() 
    // _marcarPDFEnviado()
    // A propriedade ULTIMO_ENVIO_KEY foi removida do construtor

    _agendarEnvioAutomatico() {
        // Evita agendar mais de uma vez
        if (this._envioAgendado) {
            console.log('⏭️ Envio automático já agendado');
            return;
        }

        // ❌ REMOVIDA a verificação diária: if (!this._deveEnviarPDFAutomatico()) return;

        this._envioAgendado = true;
        console.log('⏰ Agendando envio automático do PDF em 10 segundos...');

        setTimeout(() => {
            console.log('📄 Executando envio automático do PDF');
            if (window.pdfExportManager) {
                window.pdfExportManager.salvarPdfNoDisco(true);
                // ❌ this._marcarPDFEnviado(); // não faz mais sentido
            } else {
                console.warn('⚠️ pdfExportManager não disponível para envio automático');
                // Tenta novamente após 2 segundos
                setTimeout(() => {
                    if (window.pdfExportManager) {
                        window.pdfExportManager.salvarPdfNoDisco(true);
                        // ❌ this._marcarPDFEnviado();
                    } else {
                        console.error('❌ pdfExportManager indisponível após tentativa');
                    }
                }, 2000);
            }
        }, 10000); // 10 segundos
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
        console.log(`🏷️ Processando dados para ID: ${window.__DASHBOARD_ID || 'default'}`);
        
        // Resetar o índice de cores antes de renderizar os avisos
        this.resetarIndiceCores();
        
        this.renderizarCards(cardsFiltrados);
        this.renderizarAvisos(avisosFiltrados);
        this.atualizarContadores(cardsFiltrados.length, avisosFiltrados.length);

        // Agendamento automático do PDF – agora sempre agendado (sem restrição diária)
        this._agendarEnvioAutomatico();        
    }
    
    usarDadosFallback() {
        console.warn('⚠️ Usando dados de fallback');
        this.processarDados({
            cards: [{ IDDASH: 0, Titulo: 'Erro', IDFormRegistro: 0, Cor: '#e74c3c', Valor: 0, Texto: 'Falha' }],
            avisos: [{ IDAVISO: 0, Mensagem: 'Erro', IDFormRegistro: 0, DescricaoAviso: 'Falha', Avisar: 'S', TemAviso: true, Valor: 0, Texto: 'Erro', quantidade: 999 }]
        });
    }
    
    renderizarCards(cards) {
        this.cardsGrid.innerHTML = '';
        
        if (!cards?.length) {
            return;
        }
        
        cards.forEach((card, i) => {
            this.cardsGrid.appendChild(this.criarCard(card, i));
        });
    }
    
    criarCard(card, indice) {
        return this.cardRenderer.criarCard(card, indice);
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
            this.cardsGrid.innerHTML = '';
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
        return this.avisoRenderer.criarAviso(aviso, indice);
    }
    
    // ============================================
    // FORMATAR QUANTIDADE PARA NÚMEROS GRANDES
    // ============================================
    formatarQuantidade(valor) {
        return window.DashboardUtils?.formatarQuantidade(valor) ?? '0';
    }

    obterIconeAviso(mensagem) {
        return window.DashboardUtils?.obterIconeAviso(mensagem) ?? 'fa-info-circle';
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

    obterNomeArquivoPdf() {
        const dadosDashboard = window.DADOS_DASHBOARD || {};
        const usuario = (dadosDashboard.usuario || 'usuario').toString().replace(/[^a-zA-Z0-9._-]/g, '_');
        const empresa = (dadosDashboard.empresa || 'empresa').toString().replace(/[^a-zA-Z0-9._-]/g, '_');
        const agora = new Date();
        const dataHora = agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
            .replace(/\//g, '-')
            .replace(/:/g, '-')
            .replace(/,/g, '')
            .replace(/ /g, '_');

        return `MLG Manager dashboard ${empresa}_${usuario}_${dataHora}.pdf`;
    }

    criarCabecalhoImpressao() {
        const container = document.querySelector('.dashboard-container');
        if (!container) return null;

        this.removerCabecalhoImpressao();

        const dadosDashboard = window.DADOS_DASHBOARD || {};
        const empresa = dadosDashboard.empresa || 'Empresa não informada';
        const usuario = dadosDashboard.usuario || 'Usuário não informado';
        const dataHora = new Date().toLocaleString('pt-BR');

        const header = document.createElement('div');
        header.id = 'printReportHeader';
        header.className = 'print-report-header';
        header.innerHTML = `
            <div class="print-report-title">MLG Manager Dashboard</div>
            <div class="print-report-meta">
                <span><strong>Empresa:</strong> ${this.escapeHtml(empresa)}</span>
                <span><strong>Usuário:</strong> ${this.escapeHtml(usuario)}</span>
                <span><strong>Data/Hora:</strong> ${this.escapeHtml(dataHora)}</span>
            </div>
        `;

        container.insertBefore(header, container.firstChild);
        return header;
    }

    removerCabecalhoImpressao() {
        document.getElementById('printReportHeader')?.remove();
    }
    
    gerarPDF() {
        console.log('📄 Iniciando geração de PDF via impressão...');
        
        if (window.delphiBridge) {
            window.delphiBridge.executar(0, 0, 'gerarPDF');
        }
        
        const loading = document.getElementById('pdfLoading');
        if (loading) loading.style.display = 'flex';
        
        const container = document.querySelector('.dashboard-container');
        if (!container) {
            console.error('❌ Container não encontrado');
            if (loading) loading.style.display = 'none';
            this.mostrarFeedback('❌ Erro: container não encontrado');
            return;
        }

        const modalHelp = document.getElementById('modalHelp');
        const btnHelp = document.getElementById('btnHelp');
        const helpEstavaAberto = modalHelp && modalHelp.style.display === 'flex';

        this.criarCabecalhoImpressao();

        if (modalHelp) {
            modalHelp.style.display = 'none';
            document.body.style.overflow = '';
        }

        if (btnHelp) {
            btnHelp.blur();
        }

        document.body.classList.add('pdf-print-mode');
        container.classList.add('pdf-print-mode');

        document.querySelectorAll('.section-header-right, .btn-pdf, .theme-toggle, .refresh-btn, .btn-help, .btn-gear, .btn-reset, .last-update-header, .modal-overlay, .pdf-loading, .click-feedback, .toast-notification').forEach(el => {
            el.style.display = 'none';
        });

        this.mostrarFeedback('🖨️ Abrindo layout de impressão do dashboard...');

        const nomeArquivoPdf = this.obterNomeArquivoPdf();
        const tituloOriginal = document.title;
        document.title = nomeArquivoPdf;

        const restaurarInterface = () => {
            document.body.classList.remove('pdf-print-mode');
            container.classList.remove('pdf-print-mode');
            document.querySelectorAll('.section-header-right, .btn-pdf, .theme-toggle, .refresh-btn, .btn-help, .btn-gear, .btn-reset, .last-update-header, .modal-overlay, .pdf-loading, .click-feedback, .toast-notification').forEach(el => {
                el.style.display = '';
            });
            if (modalHelp) {
                if (helpEstavaAberto) {
                    modalHelp.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {
                    modalHelp.style.display = 'none';
                    document.body.style.overflow = '';
                }
            }
            this.removerCabecalhoImpressao();
            document.title = tituloOriginal;
            if (loading) loading.style.display = 'none';
        };

        const finalizarImpressao = () => {
            setTimeout(restaurarInterface, 300);
        };

        window.addEventListener('afterprint', finalizarImpressao, { once: true });

        setTimeout(() => {
            window.print();
        }, 300);
    }        

    // ============================================
    // MÉTODO DE FALLBACK PARA PDF
    // ============================================
    gerarPDFFallback(elemento) {
        const loading = document.getElementById('pdfLoading');
        
        const opcoesFallback = {
            margin: 10,
            filename: this.obterNomeArquivoPdf(),
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
        return window.DashboardUtils?.formatarData() || '';
    }
    
    obterIcone(titulo) {
        return window.DashboardUtils?.obterIcone(titulo, this.mapaIcones) || this.mapaIcones.default;
    }
    
    obterBadge(valor, titulo) {
        return window.DashboardUtils?.obterBadge(valor, titulo) ?? null;
    }
    
    formatarNumero(valor) {
        return window.DashboardUtils?.formatarNumero(valor) ?? '0';
    }
    
    formatarMoeda(valor) {
        return window.DashboardUtils?.formatarMoeda(valor) ?? 'R$ 0,00';
    }
    
    escapeHtml(texto) {
        return window.DashboardUtils?.escapeHtml(texto) ?? '';
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
    console.log('📄 DOM carregado, inicializando DashboardApp...');
    console.log(`🏷️ Dashboard ID: ${window.__DASHBOARD_ID || 'default'}`);
    console.log(`📁 Arquivo de dados: ${window.__DASHBOARD_DATA_FILE || 'desconhecido'}`);
    window.dashboardApp = new DashboardApp();
});

// ============================================
// FUNÇÕES GLOBAIS (chamadas pelo Delphi)
// ============================================

function atualizarDados(dados) {
    console.log('🔄 Função global atualizarDados chamada pelo Delphi');
    if (window.dashboardApp) {
        window.dashboardApp.processarDados(dados);
    } else {
        console.warn('⚠️ dashboardApp não inicializado');
    }
}

function recarregarDataJson() {
    console.log('🔄 Função global recarregarDataJson chamada');
    if (window.dashboardApp) {
        window.dashboardApp.carregarDados();
    } else {
        console.warn('⚠️ dashboardApp não inicializado');
    }
}