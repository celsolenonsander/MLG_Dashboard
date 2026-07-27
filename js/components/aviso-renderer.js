(function(global) {
    'use strict';

    class DashboardAvisoRenderer {
        constructor(app) {
            this.app = app;
            this.utils = global.DashboardUtils;
        }

        criarAviso(aviso, indice) {
            if (typeof this.app.desativarAvisoTeste !== 'function') {
                console.warn('⚠️ desativarAvisoTeste não é uma função! Recarregue a página.');
            }

            const urgente = this.app.isUrgente(aviso.quantidade);

            let corAviso;
            if (urgente) {
                corAviso = '#e74c3c';
            } else {
                corAviso = this.app.proximaCorAviso();
            }

            const r = parseInt(corAviso.slice(1, 3), 16);
            const g = parseInt(corAviso.slice(3, 5), 16);
            const b = parseInt(corAviso.slice(5, 7), 16);
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
            const quantidadeFormatada = this.utils.formatarQuantidade(quantidade);
            const icone = urgente ? 'fa-exclamation-triangle' : this.utils.obterIconeAviso(aviso.Mensagem);

            div.innerHTML = `
                <div class="aviso-acoes">
                    <button class="aviso-abrir" title="Abrir aviso">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="aviso-desativar" title="Ocultar aviso">
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
                    <span class="aviso-mensagem">${this.utils.escapeHtml(aviso.Mensagem)}</span>
                </div>
                <div class="aviso-descricao">
                    <span class="aviso-qtd-destaque" style="color: ${corAviso}; background: rgba(${corRgb}, 0.1); border-color: rgba(${corRgb}, 0.15);">
                        ${quantidadeFormatada}
                    </span>
                    <span class="aviso-descricao-texto">${this.utils.escapeHtml(aviso.DescricaoAviso || '')}</span>
                </div>
            `;

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
                    this.app.cliqueAviso(aviso);
                }
            });

            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.app.cliqueAviso(aviso);
                }
            });

            const btnAbrir = div.querySelector('.aviso-abrir');
            if (btnAbrir) {
                btnAbrir.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.cliqueAviso(aviso);
                });
            }

            const btnDesativar = div.querySelector('.aviso-desativar');
            if (btnDesativar) {
                btnDesativar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.desativarAvisoTeste(div, aviso);
                });
            }

            const btnFechar = div.querySelector('.aviso-fechar');
            if (btnFechar) {
                btnFechar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.fecharAviso(div, aviso);
                });
            }

            return div;
        }
    }

    global.DashboardAvisoRenderer = DashboardAvisoRenderer;
})(window);
