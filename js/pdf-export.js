(function () {
    class PdfExportManager {
        constructor() {
            this.storageKey = 'mlg_dashboard_pdf_storage';
            this.maxEntries = 8;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            this.initialized = true;

            const button = document.getElementById('btnSavePdfStorage');
            if (button) {
                button.addEventListener('click', () => this.gerarPdfESalvar());
            }

            console.log('📦 PdfExportManager inicializado');
        }

        async gerarPdfESalvar() {
            const loading = document.getElementById('pdfLoading');
            if (loading) loading.style.display = 'flex';

            const feedback = window.dashboardApp?.mostrarFeedback;
            if (feedback) {
                feedback.call(window.dashboardApp, '📦 Gerando PDF e salvando no storage...');
            }

            try {
                const nomeArquivo = this.obterNomeArquivoPdf();
                const blob = await this.gerarBlobPdf(nomeArquivo);
                const dataUrl = await this.blobToDataUrl(blob);
                this.salvarNoStorage(nomeArquivo, dataUrl);
                this.abrirPdfEmNovaAba(blob);

                if (feedback) {
                    feedback.call(window.dashboardApp, '✅ PDF salvo no storage e aberto em uma nova aba');
                }
            } catch (erro) {
                console.error('❌ Erro ao gerar PDF e salvar no storage:', erro);
                if (feedback) {
                    feedback.call(window.dashboardApp, '❌ Falha ao gerar o PDF');
                }
            } finally {
                if (loading) loading.style.display = 'none';
            }
        }

        
        async salvarPdfNoDisco(silencioso = false) {
            const loading = document.getElementById('pdfLoading');
            if (!silencioso && loading) loading.style.display = 'flex';

            try {
                const nomeArquivo = this.obterNomeArquivoPdf();
                const blob = await this.gerarBlobPdf();
                const dataUrl = await this.blobToDataUrl(blob);
                const base64 = dataUrl.split(',')[1];

                const dadosDashboard = window.DADOS_DASHBOARD || {};
                const empresa = dadosDashboard.empresa || 'Empresa';
                const usuario = dadosDashboard.usuario || 'Usuário';

                const payload = {
                    acao: 'salvarPDF',
                    dados: {
                        nomeArquivo,
                        base64,
                        empresa,
                        usuario,
                        dataHora: new Date().toLocaleString('pt-BR')
                    }
                };

                console.log('DELPHI_EVENT:' + JSON.stringify(payload));
                this.salvarNoStorage(nomeArquivo, dataUrl);

                if (!silencioso && window.dashboardApp) {
                    window.dashboardApp.mostrarFeedback('📄 Enviando PDF para o Delphi...');
                    setTimeout(() => {
                        window.dashboardApp.mostrarFeedback('✅ PDF enviado para salvamento!');
                    }, 1500);
                } else if (silencioso) {
                    console.log('📄 PDF gerado em modo silencioso (sem feedback visual)');
                }

            } catch (erro) {
                console.error('❌ Erro ao salvar PDF no disco:', erro);
                if (!silencioso && window.dashboardApp) {
                    window.dashboardApp.mostrarFeedback('❌ Erro ao salvar PDF');
                }
            } finally {
                if (!silencioso && loading) loading.style.display = 'none';
            }
        }


    async gerarBlobPdf() {
        const cards = Array.from(document.querySelectorAll('.dash-card'));
        const avisos = Array.from(document.querySelectorAll('.aviso-item'));
        const dataHora = new Date().toLocaleString('pt-BR');
        const dadosDashboard = window.DADOS_DASHBOARD || {};
        const usuario = dadosDashboard.usuario || 'Usuário não informado';
        const empresa = dadosDashboard.empresa || window.__DASHBOARD_ID || 'Dashboard';
        const sistema = dadosDashboard.sistema || '';

        if (window.jspdf?.jsPDF) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const corPrimaria = '#6a6aff';
            const corTexto = '#111827';
            const corSecundaria = '#6b7280';
            const corUrgente = '#ef4444';

            doc.setTextColor(corTexto);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('Manager Plus Dashboard', 14, 14);

            let y = 22; // posição após o título

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            if (sistema) {
                doc.text(`Sistema: ${sistema}`, 14, y);
                y += 6;
            }
            doc.text(`Empresa: ${empresa}`, 14, y);
            y += 6;
            doc.text(`Usuário: ${usuario}`, 14, y);
            y += 6;
            doc.text(`Data/Hora: ${dataHora}`, 14, y);
            y += 8; // espaço antes dos cards

            // ---------- Indicadores ----------
            doc.setFillColor(245, 247, 255);
            doc.roundedRect(12, y - 4, 186, 10, 2, 2, 'F');
            doc.setTextColor(corPrimaria);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Indicadores', 16, y + 2);
            y += 10;

            if (cards.length) {
                const larguraPagina = 210;
                const margem = 12;
                const larguraCard = larguraPagina - (margem * 2);
                const alturaCard = 28;

                cards.forEach((card) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }

                    const titulo = this.obterTexto(card, '.card-title');
                    const valor = this.obterTexto(card, '.card-value');
                    const texto = this.obterTexto(card, '.card-text');
                    const cor = this.getComputedColor(card, '--card-color', corPrimaria);
                    const corCard = this.hexToRgb(cor);

                    const x = margem;
                    const yCard = y;

                    doc.setDrawColor(229, 231, 235);
                    doc.setFillColor(249, 250, 251);
                    doc.roundedRect(x, yCard, larguraCard, alturaCard - 4, 2, 2, 'FD');
                    doc.setDrawColor(corCard.r, corCard.g, corCard.b);
                    doc.setLineWidth(1);
                    doc.line(x, yCard, x, yCard + alturaCard - 4);

                    doc.setTextColor(corTexto);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.text(titulo || 'Indicador', x + 4, yCard + 5);

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.text(valor || '0', x + 4, yCard + 12);

                    if (texto) {
                        const linhas = doc.splitTextToSize(texto, larguraCard - 8);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(7.5);
                        doc.setTextColor(corSecundaria);
                        doc.text(linhas, x + 4, yCard + 18);
                    }

                    y += alturaCard + 2;
                });

                y += 6;
            } else {
                doc.setFillColor(249, 250, 251);
                doc.roundedRect(12, y, 186, 12, 2, 2, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(corSecundaria);
                doc.text('Nenhum indicador disponível.', 16, y + 8);
                y += 16;
            }

            // ---------- Alertas & Avisos ----------
            y += 6;
            doc.setFillColor(245, 247, 255);
            doc.roundedRect(12, y - 4, 186, 10, 2, 2, 'F');
            doc.setTextColor(corPrimaria);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Alertas & Avisos', 16, y + 2);
            y += 10;

            if (avisos.length) {
                avisos.forEach((aviso) => {
                    if (y > 255) {
                        doc.addPage();
                        y = 20;
                    }

                    const mensagem = this.obterTexto(aviso, '.aviso-mensagem');
                    const descricao = this.obterTexto(aviso, '.aviso-descricao-texto');
                    const qtd = this.obterTexto(aviso, '.aviso-qtd-destaque');
                    const urgente = aviso.classList.contains('urgente');
                    const cor = urgente ? corUrgente : this.getComputedColor(aviso, '--aviso-color', corPrimaria);
                    const corAviso = this.hexToRgb(cor);

                    doc.setFillColor(249, 250, 251);
                    doc.roundedRect(12, y, 186, 16, 2, 2, 'F');
                    doc.setDrawColor(corAviso.r, corAviso.g, corAviso.b);
                    doc.setLineWidth(1);
                    doc.line(12, y, 12, y + 16);

                    const mensagemCurta = this.truncarTexto(mensagem || 'Aviso', 80);
                    const descricaoCurta = this.truncarTexto(descricao || '', 100);

                    doc.setTextColor(corTexto);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(mensagemCurta, 18, y + 6);

                    if (qtd) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10.5);
                        doc.setTextColor(corTexto);
                        doc.text(qtd, 18, y + 12.5);
                    }

                    if (descricaoCurta) {
                        const linhas = doc.splitTextToSize(descricaoCurta, 140);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8.5);
                        doc.setTextColor(corSecundaria);
                        doc.text(linhas, 30, y + 11.5);
                    }

                    y += 18;
                });
            } else {
                doc.setFillColor(249, 250, 251);
                doc.roundedRect(12, y, 186, 12, 2, 2, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(corSecundaria);
                doc.text('Nenhum aviso disponível.', 16, y + 8);
            }

            const pdfBuffer = doc.output('arraybuffer');
            return new Blob([pdfBuffer], { type: 'application/pdf' });
        }

        // Fallback: html2pdf
        if (typeof window.html2pdf === 'undefined') {
            throw new Error('html2pdf e jsPDF não estão disponíveis');
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-export-shell';
        wrapper.innerHTML = this.buildExportHtml();
        document.body.appendChild(wrapper);

        try {
            return await window.html2pdf()
                .set({
                    margin: [8, 8, 8, 8],
                    filename: this.obterNomeArquivoPdf(),
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait',
                        compress: true
                    }
                })
                .from(wrapper)
                .outputPdf('blob');
        } finally {
            wrapper.remove();
        }
    }

        buildExportHtml() {
            const cards = Array.from(document.querySelectorAll('.dash-card'));
            const avisos = Array.from(document.querySelectorAll('.aviso-item'));
            const dataHora = new Date().toLocaleString('pt-BR');
            const dadosDashboard = window.DADOS_DASHBOARD || {};
            const usuario = dadosDashboard.usuario || 'Usuário não informado';
            const empresa = dadosDashboard.empresa || window.__DASHBOARD_ID || 'Dashboard';
            const sistema = dadosDashboard.sistema || '';

            const cardsHtml = cards.length
                ? `
                    <div class="pdf-export-grid">
                        ${cards.map((card) => this.renderCard(card)).join('')}
                    </div>
                `
                : '<div class="pdf-export-empty">Nenhum indicador disponível.</div>';

            const avisosHtml = avisos.length
                ? avisos.map((aviso) => this.renderAviso(aviso)).join('')
                : '<div class="pdf-export-empty">Nenhum aviso disponível.</div>';

            return `
                <div class="pdf-export-header">
                    <div>
                        <h1 class="pdf-export-title">Manager Plus Dashboard</h1>
                        ${sistema ? `<div class="pdf-export-system">Sistema: ${this.escapeHtml(sistema)}</div>` : ''}
                    </div>
                    <div class="pdf-export-metadata">
                        <div><strong>Empresa:</strong> ${this.escapeHtml(empresa)}</div>
                        <div><strong>Usuário:</strong> ${this.escapeHtml(usuario)}</div>
                        <div><strong>Gerado em:</strong> ${this.escapeHtml(dataHora)}</div>
                    </div>
                </div>

                <section class="pdf-export-section">
                    <h2>Indicadores</h2>
                    ${cardsHtml}
                </section>

                <section class="pdf-export-section">
                    <h2>Alertas & Avisos</h2>
                    ${avisosHtml}
                </section>

                <div class="pdf-export-footer">
                    <span>Arquivo salvo no storage do navegador</span>
                    <span>${this.escapeHtml(empresa)}</span>
                </div>
            `;
        }

        renderCard(card) {
            const titulo = this.escapeHtml(card.querySelector('.card-title')?.textContent?.trim() || '');
            const valor = this.escapeHtml(card.querySelector('.card-value')?.textContent?.trim() || '0');
            const texto = this.escapeHtml(card.querySelector('.card-text')?.textContent?.trim() || '');
            const iconEl = card.querySelector('.card-icon i');
            const iconClass = iconEl?.className || 'fas fa-chart-bar';
            const color = this.getComputedColor(card, '--card-color', '#6a6aff');

            return `
                <div class="pdf-export-card" style="border-top-color:${color};">
                    <div class="pdf-export-card-header">
                        <div class="pdf-export-card-icon" style="background:${color};">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="pdf-export-card-title">${titulo}</div>
                    </div>
                    <div class="pdf-export-card-value">${valor}</div>
                    ${texto ? `<div class="pdf-export-card-text">${texto}</div>` : ''}
                </div>
            `;
        }

        renderAviso(aviso) {
            const mensagem = this.escapeHtml(aviso.querySelector('.aviso-mensagem')?.textContent?.trim() || '');
            const descricao = this.escapeHtml(aviso.querySelector('.aviso-descricao-texto')?.textContent?.trim() || '');
            const qtd = this.escapeHtml(aviso.querySelector('.aviso-qtd-destaque')?.textContent?.trim() || '0');
            const iconEl = aviso.querySelector('.aviso-icon i');
            const iconClass = iconEl?.className || 'fas fa-info-circle';
            const urgente = aviso.classList.contains('urgente');
            const color = urgente ? '#ef4444' : this.getComputedColor(aviso, '--aviso-color', '#6a6aff');

            return `
                <div class="pdf-export-aviso ${urgente ? 'urgente' : ''}">
                    <div class="pdf-export-aviso-icon" style="background:${color};">
                        <i class="${iconClass}"></i>
                    </div>
                    <div style="flex:1;">
                        <div class="pdf-export-aviso-quantidade">${qtd}</div>
                        <div class="pdf-export-aviso-text">${mensagem}</div>
                        ${descricao ? `<div class="pdf-export-aviso-desc">${descricao}</div>` : ''}
                    </div>
                </div>
            `;
        }

        getComputedColor(element, prop, fallback) {
            return window.getComputedStyle(element).getPropertyValue(prop).trim() || fallback;
        }

        obterTexto(element, seletor) {
            return element?.querySelector(seletor)?.textContent?.trim() || '';
        }

        hexToRgb(hex) {
            const clean = hex.replace('#', '');
            const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
            const num = parseInt(full, 16);
            return {
                r: (num >> 16) & 255,
                g: (num >> 8) & 255,
                b: num & 255
            };
        }

        truncarTexto(texto, limite) {
            if (!texto) return '';
            return texto.length > limite ? `${texto.substring(0, limite - 3).trimEnd()}...` : texto;
        }

        blobToDataUrl(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        abrirPdfEmNovaAba(blob) {
            try {
                const objetoUrl = URL.createObjectURL(blob);
                const novaAba = window.open(objetoUrl, '_blank');

                if (!novaAba) {
                    console.warn('⚠️ A abertura da nova aba foi bloqueada pelo navegador.');
                    return;
                }

                setTimeout(() => URL.revokeObjectURL(objetoUrl), 3000);
            } catch (erro) {
                console.error('❌ Falha ao abrir o PDF em nova aba:', erro);
            }
        }

        salvarNoStorage(nomeArquivo, dataUrl) {
            try {
                const lista = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
                lista.unshift({
                    id: Date.now(),
                    nome: nomeArquivo,
                    criadoEm: new Date().toISOString(),
                    dataUrl: dataUrl,
                    tipo: 'application/pdf' 
                });

                if (lista.length > this.maxEntries) {
                    lista.length = this.maxEntries;
                }

                localStorage.setItem(this.storageKey, JSON.stringify(lista));
                console.log(`💾 PDF salvo no storage: ${nomeArquivo}`);
            } catch (erro) {
                console.error('❌ Falha ao salvar PDF no storage:', erro);
                throw erro;
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

            return `Manager Plus Dashboard ${empresa}_${usuario}_${dataHora}.pdf`;
        }

        escapeHtml(value) {
            return window.DashboardUtils?.escapeHtml(value) || String(value || '').replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));
        }
    }

    window.PdfExportManager = PdfExportManager;

    document.addEventListener('DOMContentLoaded', () => {
        const manager = new PdfExportManager();
        manager.init();
        window.pdfExportManager = manager;
    });
})();