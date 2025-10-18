// auth.js - Frontend JavaScript para autenticação

const API_BASE_URL = AppConfig.API_BASE_URL;

class AuthService {
    /**
     * Realiza o login do usuário
     * @param {string} email - E-mail do usuário
     * @param {string} senha - Senha do usuário
     * @returns {Promise<Object>} - Resposta da API
     */
    static async login(email, senha) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AppConfig.REQUEST_TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                // Se a resposta não é OK, lança erro com a mensagem do servidor
                throw new Error(data.error || 'Erro no login');
            }

            // Salva o token e dados do usuário no localStorage
            if (data.token) {
                localStorage.setItem(AppConfig.AUTH.TOKEN_KEY, data.token);
                localStorage.setItem(AppConfig.AUTH.USER_DATA_KEY, JSON.stringify(data.user));
                localStorage.setItem(AppConfig.AUTH.LOGIN_TIME_KEY, new Date().toISOString());
            }

            return data;

        } catch (error) {
            console.error('Erro no login:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Tempo limite excedido. Tente novamente.');
            }
            
            throw error;
        }
    }

    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean}
     */
    static isAuthenticated() {
        const token = localStorage.getItem(AppConfig.AUTH.TOKEN_KEY);
        if (!token) return false;

        // Verifica se o token expirou (validação básica no frontend)
        try {
            const loginTime = localStorage.getItem(AppConfig.AUTH.LOGIN_TIME_KEY);
            if (loginTime) {
                const loginDate = new Date(loginTime);
                const now = new Date();
                const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
                
                // Se passou mais do que o tempo máximo, considera expirado
                if (hoursDiff > AppConfig.MAX_SESSION_HOURS) {
                    this.logout();
                    return false;
                }
            }
        } catch (e) {
            console.warn('Erro ao verificar tempo de login:', e);
        }

        return !!token;
    }

    /**
     * Faz logout do usuário
     */
    static logout() {
        // Remove todos os dados de autenticação
        localStorage.removeItem(AppConfig.AUTH.TOKEN_KEY);
        localStorage.removeItem(AppConfig.AUTH.USER_DATA_KEY);
        localStorage.removeItem(AppConfig.AUTH.LOGIN_TIME_KEY);
        
        // Redireciona para a página de login
        window.location.href = '/login.html';
    }

    /**
     * Obtém o token de autenticação
     * @returns {string|null}
     */
    static getToken() {
        return localStorage.getItem(AppConfig.AUTH.TOKEN_KEY);
    }

    /**
     * Obtém dados do usuário logado
     * @returns {Object|null}
     */
    static getUserData() {
        const userData = localStorage.getItem(AppConfig.AUTH.USER_DATA_KEY);
        try {
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Erro ao parsear userData:', e);
            return null;
        }
    }

    /**
     * Verifica se o usuário tem uma role específica
     * @param {string} role - Role para verificar
     * @returns {boolean}
     */
    static hasRole(role) {
        const userData = this.getUserData();
        return userData && userData.role === role;
    }

    /**
     * Verifica se o usuário tem uma das roles especificadas
     * @param {string[]} roles - Array de roles permitidas
     * @returns {boolean}
     */
    static hasAnyRole(roles) {
        const userData = this.getUserData();
        return userData && roles.includes(userData.role);
    }

    /**
     * Obtém o header de autorização para requisições autenticadas
     * @returns {Object}
     */
    static getAuthHeader() {
        const token = this.getToken();
        return token ? { 
            [AppConfig.AUTH.TOKEN_HEADER]: `${AppConfig.AUTH.TOKEN_PREFIX} ${token}` 
        } : {};
    }

    /**
     * Faz uma requisição autenticada com tratamento específico para os middlewares
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções do fetch
     * @returns {Promise<Response>}
     */
    static async authenticatedFetch(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuário não autenticado');
        }

        const authHeader = this.getAuthHeader();
        const mergedOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeader,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);

        // Tratamento específico para os middlewares
        if (response.status === 401) {
            // Token não fornecido ou inválido (authMiddleware)
            this.logout();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (response.status === 403) {
            // Acesso negado (roleMiddleware)
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Acesso negado. Você não tem permissão para esta ação.');
        }

        return response;
    }

    /**
     * Verifica se o usuário tem permissão para acessar uma rota específica
     * @param {string[]} allowedRoles - Array de roles permitidas
     * @returns {boolean}
     */
    static checkRoutePermission(allowedRoles) {
        const userData = this.getUserData();
        if (!userData) return false;
        
        return allowedRoles.includes(userData.role);
    }

    /**
     * Redireciona para página de não autorizado se não tiver permissão
     * @param {string[]} allowedRoles - Roles permitidas
     * @returns {boolean} - true se tem permissão, false se redirecionou
     */
    static enforceRoutePermission(allowedRoles) {
        if (!this.checkRoutePermission(allowedRoles)) {
            window.location.href = '/nao-autorizado.html';
            return false;
        }
        return true;
    }

    /**
     * Atualiza os dados do usuário no localStorage
     * @param {Object} userData - Novos dados do usuário
     */
    static updateUserData(userData) {
        if (userData && typeof userData === 'object') {
            const currentData = this.getUserData() || {};
            const mergedData = { ...currentData, ...userData };
            localStorage.setItem(AppConfig.AUTH.USER_DATA_KEY, JSON.stringify(mergedData));
        }
    }

    /**
     * Verifica se a sessão está prestes a expirar
     * @param {number} warningMinutes - Minutos para avisar antes de expirar
     * @returns {boolean}
     */
    static isSessionAboutToExpire(warningMinutes = 5) {
        const loginTime = localStorage.getItem(AppConfig.AUTH.LOGIN_TIME_KEY);
        if (!loginTime) return false;

        const loginDate = new Date(loginTime);
        const now = new Date();
        const minutesDiff = (now - loginDate) / (1000 * 60);
        const totalSessionMinutes = AppConfig.MAX_SESSION_HOURS * 60;

        return minutesDiff > (totalSessionMinutes - warningMinutes);
    }

    /**
     * Renova a sessão (atualiza o tempo de login)
     */
    static renewSession() {
        if (this.isAuthenticated()) {
            localStorage.setItem(AppConfig.AUTH.LOGIN_TIME_KEY, new Date().toISOString());
        }
    }

    /**
     * Verifica se o token está prestes a expirar (baseado no tempo de login)
     * @returns {boolean}
     */
    static isTokenAboutToExpire() {
        return this.isSessionAboutToExpire(30); // Avisa 30 minutos antes
    }

    /**
     * Mostra aviso se a sessão está prestes a expirar
     */
    static showSessionExpiryWarning() {
        if (this.isTokenAboutToExpire() && this.isAuthenticated()) {
            console.warn('Sua sessão irá expirar em breve. Faça login novamente para continuar.');
            // Você pode adicionar um modal ou notificação aqui
        }
    }
}

// Torna disponível globalmente
window.AuthService = AuthService;

// Verifica a sessão periodicamente
setInterval(() => {
    AuthService.showSessionExpiryWarning();
}, 60000); // Verifica a cada minuto

// Log para debug (pode remover em produção)
console.log('AuthService carregado');