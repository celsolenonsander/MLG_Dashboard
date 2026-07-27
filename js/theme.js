/**
 * Módulo de Controle de Tema
 * Gerencia temas claro/escuro com persistência em localStorage
 */

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = 'light';
        
        this.init();
    }
    
    /**
     * Inicializa o gerenciador de temas
     */
    init() {
        // Carrega tema salvo ou usa preferência do sistema
        this.currentTheme = this.loadTheme();
        
        // Aplica tema inicial
        this.applyTheme(this.currentTheme);
        
        // Configura evento de clique
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Verifica preferência do sistema em tempo real
        this.watchSystemPreference();
        
        console.log(`🎨 Tema inicializado: ${this.currentTheme}`);
    }
    
    /**
     * Carrega tema do localStorage ou detecta preferência do sistema
     * @returns {string} Tema atual
     */
    loadTheme() {
        // Verifica localStorage primeiro
        const savedTheme = localStorage.getItem('dashboardTheme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            return savedTheme;
        }
        
        // Detecta preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }
    
    /**
     * Alterna entre temas claro e escuro
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.saveTheme(this.currentTheme);
        
        // Feedback visual
        this.animateToggle();
        
        console.log(`🔄 Tema alterado para: ${this.currentTheme}`);
    }
    
    /**
     * Aplica o tema ao documento
     * @param {string} theme - Nome do tema
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Atualiza meta tag para cor do tema no mobile
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1a1a35' : '#ffffff';
        }
    }
    
    /**
     * Salva tema no localStorage
     * @param {string} theme - Tema a ser salvo
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('dashboardTheme', theme);
        } catch (error) {
            console.warn('⚠️ Não foi possível salvar tema no localStorage:', error);
        }
    }
    
    /**
     * Anima o ícone de troca de tema
     */
    animateToggle() {
        const icon = this.themeToggle.querySelector('i');
        icon.style.transform = 'rotate(360deg)';
        icon.style.transition = 'transform 0.6s ease';
        
        setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
        }, 600);
    }
    
    /**
     * Monitora mudanças na preferência do sistema
     */
    watchSystemPreference() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Só altera se não houver preferência salva
                if (!localStorage.getItem('dashboardTheme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.currentTheme = newTheme;
                    this.applyTheme(newTheme);
                    console.log(`🌓 Preferência do sistema alterada para: ${newTheme}`);
                }
            });
        }
    }
}

// Inicializa o gerenciador de temas
const themeManager = new ThemeManager();