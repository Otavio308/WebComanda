// routeGuard.js - Proteção de rotas no frontend

class RouteGuard {
    /**
     * Protege uma página baseado na role do usuário
     * @param {string[]} allowedRoles - Roles permitidas para a página
     */
    static protectPage(allowedRoles) {
        document.addEventListener('DOMContentLoaded', function() {
            // Verifica se está autenticado
            if (!AuthService.isAuthenticated()) {
                window.location.href = '/login.html';
                return;
            }

            // Verifica se tem a role necessária
            const userData = AuthService.getUserData();
            if (!userData || !allowedRoles.includes(userData.role)) {
                window.location.href = '/nao-autorizado.html';
                return;
            }

            // Se passou nas verificações, a página carrega normalmente
            console.log('Acesso permitido para:', userData.role);
        });
    }

    /**
     * Protege múltiplas páginas com configurações diferentes
     * @param {Object} pageConfig - Configuração { [page]: [roles] }
     */
    static protectMultiplePages(pageConfig) {
        document.addEventListener('DOMContentLoaded', function() {
            const currentPage = window.location.pathname.split('/').pop();
            
            if (pageConfig[currentPage]) {
                RouteGuard.protectPage(pageConfig[currentPage]);
            }
        });
    }

    /**
     * Obtém as rotas permitidas para o usuário atual
     * @returns {Object} - { [page]: boolean }
     */
    static getUserAllowedRoutes() {
        const userData = AuthService.getUserData();
        if (!userData) return {};

        const allRoutes = {
            '/pedidos.html': ['Caixa', 'Admin'],
            '/index.html': ['Garçom', 'Admin'],
            '/dashboard-cozinha.html': ['Cozinha', 'Admin'],
        };

        const allowedRoutes = {};
        for (const [route, roles] of Object.entries(allRoutes)) {
            allowedRoutes[route] = roles.includes(userData.role);
        }

        return allowedRoutes;
    }
}

// Torna disponível globalmente
window.RouteGuard = RouteGuard;