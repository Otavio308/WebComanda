// login.js - Lógica da página de login

document.addEventListener('DOMContentLoaded', function() {
    // Encontra os elementos do formulário
    const emailInput = document.querySelector('input[type="text"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const loginButton = document.querySelector('.login-button');
    
    // Cria elemento para mensagens de erro
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    
    // Estiliza a mensagem de erro
    errorMessage.style.cssText = `
        color: #e74c3c;
        text-align: center;
        margin-bottom: 15px;
        font-size: 14px;
        display: none;
        padding: 10px;
        background-color: #fdf2f2;
        border: 1px solid #fbd5d5;
        border-radius: 8px;
    `;

    // Insere a mensagem de erro antes do botão
    if (loginButton) {
        loginButton.parentNode.insertBefore(errorMessage, loginButton);
    }

    // Verifica se já está logado (redireciona se estiver)
    if (AuthService.isAuthenticated()) {
        redirectAfterLogin();
    }

    // Manipula o envio do formulário
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // Também permite login com Enter
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    }

    async function handleLogin(e) {
        if (e) e.preventDefault();
        
        const email = emailInput ? emailInput.value.trim() : '';
        const senha = passwordInput ? passwordInput.value : '';

        // Validações básicas
        if (!email || !senha) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        // Validação básica de email
        if (!isValidEmail(email)) {
            showError('Por favor, insira um email válido');
            return;
        }

        // Mostra loading no botão
        setButtonLoading(true);

        try {
            const result = await AuthService.login(email, senha);
            
            // Login bem-sucedido
            showError('', false);
            console.log('Login realizado com sucesso:', result);
            
            // Mostra notificação de sucesso
            showNotification('Login realizado com sucesso!', 'success');
            
            // Redireciona para a página principal após breve delay
            setTimeout(() => {
                redirectAfterLogin();
            }, 1000);
            
        } catch (error) {
            // Mostra mensagem de erro específica da API
            showError(error.message || 'Erro ao fazer login. Tente novamente.');
            
            // Limpa a senha em caso de erro
            if (passwordInput) passwordInput.value = '';
        } finally {
            setButtonLoading(false);
        }
    }

    /**
     * Redireciona após login baseado na role do usuário
     */
    function redirectAfterLogin() {
        const userData = AuthService.getUserData();
        
        // Define redirecionamentos baseados na role
        const redirectPaths = {
            'Garçom': '/ComandaWeb/index.html',
            'Admin': '/ComandaWeb/index.html',
            'Cozinha': '/ComandaWeb/pedidos.html',
            'Caixa': '/ComandaWeb/pedidos.html',
        };

        const defaultPath = '/dashboard.html';
        const redirectTo = userData && redirectPaths[userData.role] ? 
                          redirectPaths[userData.role] : defaultPath;
        
        window.location.href = redirectTo;
    }

    /**
     * Valida formato de email
     * @param {string} email - Email para validar
     * @returns {boolean}
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Mostra ou esconde mensagem de erro
     * @param {string} message - Mensagem de erro
     * @param {boolean} show - Se deve mostrar ou esconder
     */
    function showError(message, show = true) {
        errorMessage.textContent = message;
        errorMessage.style.display = show ? 'block' : 'none';
        
        // Adiciona animação de shake para erro
        if (show) {
            errorMessage.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                errorMessage.style.animation = '';
            }, 500);
        }
    }

    /**
     * Mostra notificação para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        // Remove notificação anterior se existir
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `custom-notification notification-${type}`;
        
        const typeIcons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${typeIcons[type] || 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Estilização da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        document.body.appendChild(notification);

        // Remove após 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    /**
     * Obtém cor da notificação baseada no tipo
     * @param {string} type - Tipo da notificação
     * @returns {string}
     */
    function getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    /**
     * Altera o estado do botão para loading/normal
     * @param {boolean} loading - Se está carregando
     */
    function setButtonLoading(loading) {
        if (!loginButton) return;
        
        if (loading) {
            loginButton.innerHTML = '<div class="loading-spinner"></div> Entrando...';
            loginButton.disabled = true;
            loginButton.style.opacity = '0.7';
            loginButton.style.cursor = 'not-allowed';
        } else {
            loginButton.innerHTML = 'Login';
            loginButton.disabled = false;
            loginButton.style.opacity = '1';
            loginButton.style.cursor = 'pointer';
        }
    }

    // Adiciona CSS para animações
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .error-message {
            transition: all 0.3s ease;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-icon {
            font-size: 16px;
        }
        
        .notification-message {
            flex: 1;
        }
    `;
    document.head.appendChild(style);
});