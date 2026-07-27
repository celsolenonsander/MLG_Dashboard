/**
 * effect-selector.js
 * Gerencia a troca de efeitos visuais dos cards (shadow, lift, none)
 * com persistência no localStorage.
 */
(function(global) {
    'use strict';

    // Chave para salvar no localStorage
    const STORAGE_KEY = 'dashboard_card_effect';
    // Efeitos disponíveis
    const EFFECTS = ['shadow', 'lift', 'none', 'glow', 'border'];
    // Efeito padrão
    const DEFAULT_EFFECT = 'shadow';

    // Referências DOM
    let container = null;      // elemento que receberá as classes (ex: .cards-section)
    let buttons = [];

    /**
     * Aplica o efeito ao container e atualiza os botões.
     * @param {string} effect - 'shadow' | 'lift' | 'none'
     */
    function aplicarEfeito(effect) {
        if (!container) return;

        // Remove todas as classes de efeito
        EFFECTS.forEach(e => container.classList.remove(`effect-${e}`));
        // Adiciona a classe escolhida
        container.classList.add(`effect-${effect}`);

        // Atualiza estado dos botões
        buttons.forEach(btn => {
            const isActive = btn.dataset.effect === effect;
            btn.classList.toggle('active', isActive);
        });

        // Salva no localStorage
        try {
            localStorage.setItem(STORAGE_KEY, effect);
        } catch (e) {
            // Em ambientes sem localStorage (ex: file://), ignora
        }
    }

    /**
     * Carrega a preferência salva ou usa o padrão.
     */
    function carregarPreferencia() {
        let effect = DEFAULT_EFFECT;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && EFFECTS.includes(saved)) {
                effect = saved;
            }
        } catch (e) { /* ignora */ }
        aplicarEfeito(effect);
    }

    /**
     * Configura os eventos dos botões.
     */
    function configurarBotoes() {
        buttons = document.querySelectorAll('.effect-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                const effect = this.dataset.effect;
                if (effect && EFFECTS.includes(effect)) {
                    aplicarEfeito(effect);
                }
            });
        });
    }

    /**
     * Inicializa o módulo.
     */
    function init() {
        // Define o container como a seção de cards (ou o grid, conforme sua estrutura)
        container = document.getElementById('cardsSection') || document.querySelector('.cards-section');
        if (!container) {
            console.warn('EffectSelector: container .cards-section não encontrado.');
            return;
        }

        configurarBotoes();
        carregarPreferencia();
    }

    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expõe a API para uso externo (opcional)
    global.EffectSelector = {
        aplicarEfeito,
        carregarPreferencia,
        EFFECTS,
        DEFAULT_EFFECT
    };

})(window);