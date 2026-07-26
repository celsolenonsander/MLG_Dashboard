/* js/bridge.js */
/**
 * Bridge de Comunicação Delphi - Via Console
 * @version 9.0.0 - Console (FUNCIONAL)
 */
(function() {
    'use strict';
    
    console.log('🌉 Bridge Delphi v9.0 - Console');
    
    window.delphiBridge = {
        executar: function(idForm, idRegistro, acao) {
            var payload = JSON.stringify({
                idForm: parseInt(idForm),
                idRegistro: parseInt(idRegistro),
                acao: acao,
                timestamp: new Date().toISOString()
            });
            
            // Envia como console.log com prefixo especial
            // O Delphi captura automaticamente via OnConsoleMessage
            console.log('DELPHI_EVENT:' + payload);
        },
        
        verificarConexao: function() {
            console.log('DELPHI_EVENT:{"idForm":0,"idRegistro":0,"acao":"ping","timestamp":"' + new Date().toISOString() + '"}');
            return true;
        }
    };
    
    // Teste de conexão
    setTimeout(function() {
        window.delphiBridge.verificarConexao();
    }, 300);
    
})();