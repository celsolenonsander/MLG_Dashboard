(function(global) {
    'use strict';

    class DashboardCardRenderer {
        constructor(app) {
            this.app = app;
            this.utils = global.DashboardUtils;
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

            const icone = this.utils.obterIcone(card.Titulo, this.app.mapaIcones);
            const badge = this.utils.obterBadge(card.Valor, card.Titulo);

            artigo.innerHTML = `
                <div class="card-acoes">
                    <button class="card-abrir" title="Abrir card">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="card-desativar" title="Ocultar card">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="card-fechar" title="Fechar card">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="card-header">
                    <div class="card-icon"><i class="fas ${icone}"></i></div>
                    <h3 class="card-title">${this.utils.escapeHtml(card.Titulo)}</h3>
                </div>
                <div class="card-value">${this.utils.formatarNumero(card.Valor)}</div>
                <div class="card-text">${this.utils.escapeHtml(card.Texto || '')}</div>
            `;

            artigo.addEventListener('click', (e) => {
                if (!e.target.closest('.card-abrir') &&
                    !e.target.closest('.card-fechar') &&
                    !e.target.closest('.card-desativar')) {
                    this.app.cliqueCard(card);
                }
            });

            artigo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.app.cliqueCard(card);
                }
            });

            const btnAbrir = artigo.querySelector('.card-abrir');
            if (btnAbrir) {
                btnAbrir.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.cliqueCard(card);
                });
            }

            const btnDesativar = artigo.querySelector('.card-desativar');
            if (btnDesativar) {
                btnDesativar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.desativarCardTeste(artigo, card);
                });
            }

            const btnFechar = artigo.querySelector('.card-fechar');
            if (btnFechar) {
                btnFechar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.fecharCard(artigo, card);
                });
            }

            return artigo;
        }
    }

    global.DashboardCardRenderer = DashboardCardRenderer;
})(window);
