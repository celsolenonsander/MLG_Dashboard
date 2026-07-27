(function(global) {
    'use strict';

    const config = global.DashboardConfig || { MAPA_ICONES: {} };

    function formatarNumero(valor) {
        if (valor == null) return '0';
        return valor >= 1000 ? valor.toLocaleString('pt-BR') : String(valor);
    }

    function formatarQuantidade(valor) {
        if (valor == null || valor === undefined) return '0';

        if (valor >= 1000) {
            return valor.toLocaleString('pt-BR');
        }

        return String(valor);
    }

    function formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';
        if (valor < 1) return String(valor);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    function formatarData() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        const seg = String(agora.getSeconds()).padStart(2, '0');

        return `${ano}${mes}${dia}_${hora}${min}${seg}`;
    }

    function escapeHtml(texto) {
        if (!texto) return '';
        const d = document.createElement('div');
        d.textContent = texto;
        return d.innerHTML;
    }

    function obterIcone(titulo, mapaIcones = config.MAPA_ICONES) {
        if (!titulo) return mapaIcones.default || 'fa-chart-bar';
        for (const [k, v] of Object.entries(mapaIcones)) {
            if (titulo.toLowerCase().includes(k.toLowerCase())) return v;
        }
        return mapaIcones.default || 'fa-chart-bar';
    }

    function obterBadge(valor, titulo) {
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

    function obterIconeAviso(mensagem) {
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

    global.DashboardUtils = {
        formatarNumero,
        formatarQuantidade,
        formatarMoeda,
        formatarData,
        escapeHtml,
        obterIcone,
        obterBadge,
        obterIconeAviso
    };
})(window);
