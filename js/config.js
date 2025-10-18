// config.js - Configurações globais do frontend

const AppConfig = {
    // URL base da API - ajuste conforme seu ambiente
    API_BASE_URL: 'http://localhost:3000/api',
    
    // Configurações de autenticação
    AUTH: {
        TOKEN_KEY: 'authToken',
        USER_DATA_KEY: 'userData', 
        LOGIN_TIME_KEY: 'loginTime',
        TOKEN_HEADER: 'Authorization',
        TOKEN_PREFIX: 'Bearer'
    },
    
    // Roles do sistema (baseado no seu banco de dados)
    ROLES: {
        GARCOM: 'Garçom',
        ADMIN: 'Admin',
        COZINHA: 'Cozinha',
        Caixa: 'Caixa',
    },
    
    // Redirecionamentos por role
    REDIRECT_PATHS: {
        'Garçom': '/index.html',
        'Admin': '/index.html', 
        'Cozinha': '/pedidos.html',
        'Caixa': '/pedidos.html'
    },
    
    // Tempo máximo de sessão em horas (24 horas)
    MAX_SESSION_HOURS: 24,
    
    // Configurações de timeout das requisições (em milissegundos)
    REQUEST_TIMEOUT: 10000,
    
    // Configurações de notificação
    NOTIFICATION: {
        DURATION: 5000,
        POSITION: {
            top: '20px',
            right: '20px'
        }
    },
    
    // Configurações de paginação
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZES: [10, 25, 50, 100]
    },
    
    // Formatos de data/hora
    DATE_FORMAT: 'dd/MM/yyyy',
    TIME_FORMAT: 'HH:mm:ss',
    DATETIME_FORMAT: 'dd/MM/yyyy HH:mm:ss'
};

// Torna disponível globalmente
window.AppConfig = AppConfig;

// Log para debug (pode remover em produção)
console.log('AppConfig carregado:', AppConfig.API_BASE_URL);