/**
 * Gerenciador de Sugestão de Card
 * Responsável por abrir o modal, coletar dados e enviar via FormSubmit
 * Inclui informações do usuário obtidas do DADOS_DASHBOARD
  */

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG_SUGESTAO = {
                   
    EMAIL_DESTINO: 'celso.lenon.desenvolvimento@gmail.com',
    ASSUNTO: 'Sugestão de Card - Dashboard',
    URL_FORM_SUBMIT: 'https://formsubmit.co/'
};

// ============================================
// CLASSE PRINCIPAL
// ============================================

class GerenciadorSugestaoCard {
    constructor() {
        this.modal = null;
        this.formulario = null;
        this.botaoEnviar = null;
        this.elementoMensagem = null;
        this.inicializar();
    }

    inicializar() {
        this.criarModal();
        this.configurarEventos();
        console.log('✅ Gerenciador de Sugestão de Card v1.0.0 inicializado');
    }

    /**
     * Obtém os dados do usuário do DADOS_DASHBOARD
     */
    obterDadosUsuario() {
        const dados = window.DADOS_DASHBOARD || {};
        return {
            usuario: dados.usuario || 'Usuário não identificado',
            empresa: dados.empresa || 'Empresa não informada',
            sistema: dados.sistema || 'Sistema não informado',
            process_id: dados.process_id || null
        };
    }

    criarModal() {
        if (document.getElementById('modalSugestao')) return;

        const htmlModal = `
            <div class="modal-overlay" id="modalSugestao" style="display:none;">
                <div class="modal-container modal-sugestao">
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-plus-circle" style="color: var(--accent-primary);"></i>
                            Sugerir Novo Card
                        </h2>
                        <button class="modal-close" id="fecharModalSugestao">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Mensagem de retorno dentro do modal -->
                        <div id="mensagemModalSugestao" style="display:none; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; border-left: 4px solid;"></div>

                        <!-- Informações do usuário (não editável, apenas exibição) -->
                        <div style="background: var(--bg-hover); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; border: 1px solid var(--border-color);">
                            <div><strong>Usuário:</strong> <span id="infoUsuario">Carregando...</span></div>
                            <div><strong>Empresa:</strong> <span id="infoEmpresa">Carregando...</span></div>
                            <div><strong>Sistema:</strong> <span id="infoSistema">Carregando...</span></div>
                        </div>

                        <form id="formSugestao" novalidate>
                            <div class="grupo-form">
                                <label for="sugerirTitulo">Título do Card <span class="obrigatorio">*</span></label>
                                <input type="text" id="sugerirTitulo" placeholder="Ex: Contas a Receber Hoje" required>
                                <small class="ajuda-campo">Nome do indicador que aparecerá no card</small>
                            </div>

                            <div class="grupo-form">
                                <label for="sugerirOrigemValor">Origem do Valor <span class="obrigatorio">*</span></label>
                                <textarea id="sugerirOrigemValor" rows="2" placeholder="Ex: Soma das contas a receber não baixadas com vencimento hoje" required></textarea>
                                <small class="ajuda-campo">Descreva de onde vem o número que será exibido como valor principal do card</small>
                            </div>

                            <div class="grupo-form">
                                <label for="sugerirTextoComplementar">Texto Complementar <span class="obrigatorio">*</span></label>
                                <input type="text" id="sugerirTextoComplementar" placeholder="Ex: Qtd. lançamentos: 42" required>
                                <small class="ajuda-campo">Texto que aparece abaixo do valor (pode ser dinâmico como 'Qtd. X: 10' ou fixo como 'Verificar estoque')</small>
                            </div>

                            <div class="grupo-form">
                                <label for="sugerirCor">Cor</label>
                                <input type="color" id="sugerirCor" value="#6a6aff">
                            </div>

                            <div class="grupo-form">
                                <label for="sugerirObservacoes">Observações</label>
                                <textarea id="sugerirObservacoes" rows="2" placeholder="Informações adicionais para o desenvolvimento..."></textarea>
                            </div>

                            <div class="acoes-form">
                                <button type="button" class="btn-cancelar" id="cancelarSugestao">Cancelar</button>
                                <button type="submit" class="btn-enviar" id="enviarSugestao">
                                    <i class="fas fa-paper-plane"></i> Enviar Sugestão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', htmlModal);
        this.modal = document.getElementById('modalSugestao');
        this.formulario = document.getElementById('formSugestao');
        this.botaoEnviar = document.getElementById('enviarSugestao');
        this.elementoMensagem = document.getElementById('mensagemModalSugestao');
    }

    configurarEventos() {
        const botaoAbrir = document.getElementById('btnSugerirCard');
        if (botaoAbrir) {
            botaoAbrir.addEventListener('click', () => this.abrir());
        } else {
            this.criarBotaoAbrir();
        }

        document.getElementById('fecharModalSugestao')?.addEventListener('click', () => this.fechar());
        document.getElementById('cancelarSugestao')?.addEventListener('click', () => this.fechar());

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.fechar();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.style.display === 'flex') {
                this.fechar();
            }
        });

        if (this.formulario) {
            this.formulario.addEventListener('submit', (e) => this.enviar(e));
        }
    }

    criarBotaoAbrir() {
        const headerRight = document.querySelector('.section-header-right');
        if (!headerRight) return;

        if (document.getElementById('btnSugerirCard')) return;

        const botao = document.createElement('button');
        botao.id = 'btnSugerirCard';
        botao.className = 'btn-sugerir';
        botao.setAttribute('aria-label', 'Sugerir card');
        botao.title = 'Sugerir novo card';
        botao.innerHTML = '<i class="fas fa-envelope"></i>';
        
        const btnHelp = document.getElementById('btnHelp');
        if (btnHelp) {
            headerRight.insertBefore(botao, btnHelp);
        } else {
            headerRight.appendChild(botao);
        }

        botao.addEventListener('click', () => this.abrir());
        console.log('✅ Botão "Sugerir Card" criado dinamicamente.');
    }

    abrir() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.limparMensagem();

            // Preenche as informações do usuário
            const dados = this.obterDadosUsuario();
            document.getElementById('infoUsuario').textContent = dados.usuario;
            document.getElementById('infoEmpresa').textContent = dados.empresa;
            document.getElementById('infoSistema').textContent = dados.sistema;

            // Define cor padrão
            document.getElementById('sugerirCor').value = '#6a6aff';
            setTimeout(() => document.getElementById('sugerirTitulo')?.focus(), 100);
            console.log('📭 Modal de sugestão aberto');
        }
    }

    fechar() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            if (this.formulario) this.formulario.reset();
            this.limparMensagem();
            if (this.botaoEnviar) {
                this.botaoEnviar.disabled = false;
                this.botaoEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Sugestão';
            }
            console.log('📭 Modal de sugestão fechado');
        }
    }

    exibirMensagemNoModal(mensagem, tipo = 'sucesso') {
        if (!this.elementoMensagem) return;

        const isErro = (tipo === 'aviso' || tipo === 'erro');
        const cores = {
            sucesso: { fundo: '#e6ffed', borda: '#2e7d32', texto: '#1a5a2a' },
            aviso: { fundo: '#fff3cd', borda: '#856404', texto: '#856404' },
            erro: { fundo: '#fee', borda: '#c00', texto: '#c00' }
        };
        const cor = cores[tipo] || cores.erro;

        this.elementoMensagem.textContent = mensagem;
        this.elementoMensagem.style.display = 'block';
        this.elementoMensagem.style.background = cor.fundo;
        this.elementoMensagem.style.borderLeftColor = cor.borda;
        this.elementoMensagem.style.color = cor.texto;

        if (tipo === 'sucesso') {
            setTimeout(() => {
                this.limparMensagem();
            }, 5000);
        }
    }

    limparMensagem() {
        if (this.elementoMensagem) {
            this.elementoMensagem.style.display = 'none';
            this.elementoMensagem.textContent = '';
        }
    }

    exibirMensagem(mensagem, tipo = 'sucesso') {
        if (this.modal && this.modal.style.display === 'flex') {
            this.exibirMensagemNoModal(mensagem, tipo);
            return;
        }

        if (window.dashboardApp && typeof window.dashboardApp.mostrarFeedback === 'function') {
            window.dashboardApp.mostrarFeedback(mensagem);
            return;
        }
        alert(mensagem);
    }

    async enviar(evento) {
        evento.preventDefault();

        // Captura os dados...
        const titulo = document.getElementById('sugerirTitulo')?.value.trim();
        const origemValor = document.getElementById('sugerirOrigemValor')?.value.trim();
        const textoComplementar = document.getElementById('sugerirTextoComplementar')?.value.trim();
        const cor = document.getElementById('sugerirCor')?.value || '#6a6aff';
        const observacoes = document.getElementById('sugerirObservacoes')?.value.trim();
        const dadosUsuario = this.obterDadosUsuario();

        if (!titulo || !origemValor || !textoComplementar) {
            this.exibirMensagem('⚠️ Preencha Título, Origem do Valor e Texto Complementar.', 'aviso');
            return;
        }

        // Cria um iframe oculto
        const iframe = document.createElement('iframe');
        iframe.name = 'iframeFormSubmit';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Clona o formulário (ou cria um novo)
        const form = document.createElement('form');
        form.action = CONFIG_SUGESTAO.URL_FORM_SUBMIT + CONFIG_SUGESTAO.EMAIL_DESTINO;
        form.method = 'POST';
        form.target = 'iframeFormSubmit';

        // Adiciona os campos
        const campos = {
            'Usuário': dadosUsuario.usuario,
            'Empresa': dadosUsuario.empresa,
            'Sistema': dadosUsuario.sistema,
            'Processo ID': dadosUsuario.process_id || '',
            'Título': titulo,
            'Origem do Valor': origemValor,
            'Texto Complementar': textoComplementar,
            'Cor': cor,
            'Observações': observacoes || 'nenhuma',
            '_subject': CONFIG_SUGESTAO.ASSUNTO,
            '_captcha': 'false',
            '_template': 'table'
        };

        for (const [key, value] of Object.entries(campos)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }

        document.body.appendChild(form);

        // Desabilita o botão
        if (this.botaoEnviar) {
            this.botaoEnviar.disabled = true;
            this.botaoEnviar.innerHTML = '<span class="spinner-envio"></span> Enviando...';
        }

        // Envia o formulário
        form.submit();

        // Aguarda o iframe carregar (para saber se deu certo)
        iframe.onload = () => {
            // Verifica se houve erro (o FormSubmit redireciona para uma página de sucesso ou erro)
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const bodyText = iframeDoc.body?.innerText || '';
                if (bodyText.includes('success') || bodyText.includes('OK')) {
                    this.exibirMensagem('✅ Sugestão enviada com sucesso!', 'sucesso');
                    setTimeout(() => this.fechar(), 1500);
                    // Notifica o Delphi
                    if (window.delphiBridge) {
                        window.delphiBridge.executar(0, 0, 'sugerirCard', {
                            usuario: dadosUsuario.usuario,
                            empresa: dadosUsuario.empresa,
                            sistema: dadosUsuario.sistema,
                            titulo,
                            origemValor,
                            textoComplementar,
                            cor,
                            observacoes
                        });
                    }
                } else {
                    this.exibirMensagem('❌ Erro ao enviar. Tente novamente.', 'erro');
                }
            } catch (e) {
                // Se não conseguir ler o iframe (CORS), assume sucesso (já que o FormSubmit geralmente redireciona)
                this.exibirMensagem('✅ Sugestão enviada (verifique seu e-mail).', 'sucesso');
                setTimeout(() => this.fechar(), 1500);
            }

            // Limpa o iframe e o formulário
            setTimeout(() => {
                iframe.remove();
                form.remove();
            }, 1000);

            if (this.botaoEnviar) {
                this.botaoEnviar.disabled = false;
                this.botaoEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Sugestão';
            }
        };

        // Fallback: se o iframe não carregar em 10 segundos, assume sucesso
        setTimeout(() => {
            if (iframe.parentNode) {
                this.exibirMensagem('✅ Sugestão enviada (verifique seu e-mail).', 'sucesso');
                setTimeout(() => this.fechar(), 1500);
                iframe.remove();
                form.remove();
                if (this.botaoEnviar) {
                    this.botaoEnviar.disabled = false;
                    this.botaoEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Sugestão';
                }
            }
        }, 10000);
    }

}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    window.gerenciadorSugestao = new GerenciadorSugestaoCard();
});