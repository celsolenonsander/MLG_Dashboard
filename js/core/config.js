(function(global) {
    'use strict';

    const LIMITE_URGENCIA = 10000000;

    const CORES_AVISOS = [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#22c55e',
        '#3b82f6',
        '#8b5cf6',
        '#a855f7',
        '#ec4899',
        '#06b6d4',
        '#10b981'
    ];

    const MAPA_ICONES = {
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

    global.DashboardConfig = {
        LIMITE_URGENCIA,
        CORES_AVISOS,
        MAPA_ICONES
    };
})(window);
