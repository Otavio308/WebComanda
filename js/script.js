// script.js
document.addEventListener('DOMContentLoaded', async () => {
    // Produtos serão carregados do backend
    let products = [];

    // ⭐ Declara editingPedidoId
    let editingPedidoId = localStorage.getItem('editingPedidoId');

    // Função para carregar cardápio do backend
    async function loadCardapioFromServer() {
        try {
            // Deriva base API a partir do AppConfig (config.js) — remove /auth se presente
            const apiBase = (window.AppConfig && AppConfig.API_BASE_URL)
                ? AppConfig.API_BASE_URL.replace(/\/auth\/?$/i, '')
                : 'http://localhost:3001';

            const controller = new AbortController();
            const timeout = (window.AppConfig && AppConfig.REQUEST_TIMEOUT) ? AppConfig.REQUEST_TIMEOUT : 10000;
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const res = await fetch(`${apiBase}/sistema/cardapio`, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' }
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Erro ao buscar cardápio: ${res.status} ${res.statusText}`);
            }

            const rows = await res.json();

            // Mapeia formato do backend para uso no frontend
            products = rows.map(r => ({
                id: r.id_item,
                name: r.nome_item,
                price: typeof r.valor === 'string' ? parseFloat(r.valor) : (r.valor || 0),
                category: r.nome_categoria || (r.categoria || 'Outros'),
                description: r.descricao || '',
                image: r.imagem || null // caso queira salvar URL/imagem no DB
            }));
        } catch (err) {
            console.error('Não foi possível carregar cardápio do servidor:', err);
            // opcional: manter lista vazia ou fallback para listagem mockada
            products = [];
        }
    }

    // Estrutura de sub-categorias — mantemos dois dropdowns: Pratos e Bebidas
    const MENU_STRUCTURE = {
        'Pratos': [
            { name: 'Todos os Pratos', category: 'Todos', icon: 'fas fa-utensils' },
            { name: 'Entradas', category: 'Entradas', icon: 'fas fa-bread-slice' },
            { name: 'Principal', category: 'Principal', icon: 'fas fa-pizza-slice' },
            { name: 'Sobremesas', category: 'Sobremesas', icon: 'fas fa-ice-cream' }
        ],
        'Bebidas': [
            { name: 'Todas as Bebidas', category: 'Todos', icon: 'fas fa-glass-martini-alt' },
            // troquei o ícone de "caixa" para um ícone de copo (mais adequado para refrigerantes)
            { name: 'Refrigerantes', category: 'Refrigerantes', icon: 'fas fa-glass-whiskey' },
            { name: 'Sucos', category: 'Sucos', icon: 'fas fa-lemon' }
        ]
    };

    // Constantes do Local Storage
    const LOCAL_STORAGE_KEY_COMANDA = 'comanda';
    const LOCAL_STORAGE_KEY_MESA = 'comandaMesa'; 

    // Variáveis de estado
    let comandaItems = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_COMANDA)) || [];
    let modalTargetId = null; // ID do item para anotações
    let selectedType = null; // 'Pratos' ou 'Bebidas' — representa qual dropdown está ativo
    let selectedCategory = 'Todos'; 
    
    // Elementos do DOM
    const menuBar = document.querySelector('.category-menu-bar');
    const togglePratos = document.getElementById('toggle-pratos');
    const toggleBebidas = document.getElementById('toggle-bebidas');
    const dropdownOverlay = document.getElementById('dropdown-overlay');
    const dropdownContent = document.getElementById('dropdown-content');
    const productGrid = document.getElementById('product-grid');
    const searchBar = document.getElementById('search-bar');
    
    // Elementos do Menu Lateral (Off-Canvas)
    const menuButton = document.getElementById('menu-button');
    const offCanvasMenu = document.getElementById('off-canvas-menu'); 
    const overlay = document.getElementById('overlay');
    const btnLogout = document.getElementById('btn-logout');
    const mesaDisplayMenu = document.getElementById('mesa-display-menu');
    
    // Elementos do Sumário
    const summaryList = document.getElementById('summary-list');
    const totalPriceElement = document.getElementById('total-price');
    const fazerPedidoButton = document.getElementById('fazer-pedido-button');
    const mesaSummaryDisplayHeader = document.getElementById('mesa-summary-display-header'); 
    const changeMesaBtnSummary = document.getElementById('change-mesa-btn-summary');

    // Elementos do Modal de Mesa
    const mesaModal = document.getElementById('mesa-modal');
    const saveMesaButton = document.getElementById('save-mesa-button');
    const mesaNumberInput = document.getElementById('mesa-number-input');
    const btnMesaMenu = document.getElementById('btn-mesa-menu');
    
    // Elementos do Modal de Anotações
    const notesModal = document.getElementById('notes-modal');
    const notesTextarea = document.getElementById('notes-textarea');
    const saveNotesButton = document.getElementById('save-notes-button');
    const closeNotesModalButton = document.getElementById('close-notes-modal-button');
    const notesItemName = document.getElementById('notes-item-name');
    
    // Funções Utilitárias
    const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`;

    // Helper: dado uma categoria, determina se pertence a Pratos ou Bebidas
    const getSectionForCategory = (category) => {
        if (!category || category === 'Todos') return null;
        const pratosCats = MENU_STRUCTURE['Pratos'].map(c => c.category);
        if (pratosCats.includes(category)) return 'Pratos';
        const bebidasCats = MENU_STRUCTURE['Bebidas'].map(c => c.category);
        if (bebidasCats.includes(category)) return 'Bebidas';
        return null;
    };

    // -------------------- LÓGICA MESA --------------------
    const updateMesaDisplay = (mesa) => {
        const displayText = `Mesa: ${mesa || '#'}`;
        const headerText = mesa || '#';

        mesaDisplayMenu.textContent = displayText; 
        mesaSummaryDisplayHeader.textContent = headerText; 
    };

    const loadMesaNumber = () => {
        const storedMesa = localStorage.getItem(LOCAL_STORAGE_KEY_MESA);
        if (storedMesa) {
            updateMesaDisplay(storedMesa);
        } else {
            openMesaModal();
        }
    };
    
    const saveMesaNumber = () => {
        const mesa = mesaNumberInput.value.trim();
        if (mesa && parseInt(mesa) > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEY_MESA, mesa);
            updateMesaDisplay(mesa);
            closeMesaModal();
        } else {
            alert('Por favor, insira um número de mesa válido.');
        }
    };
    
    const openMesaModal = () => {
        mesaModal.classList.add('show');
        const currentMesa = localStorage.getItem(LOCAL_STORAGE_KEY_MESA) || '';
        mesaNumberInput.value = currentMesa;
        mesaNumberInput.focus();
    };
    
    const closeMesaModal = () => {
        mesaModal.classList.remove('show');
    };

    // -------------------- LÓGICA COMANDA --------------------
    
    const updateSummary = () => {
        let total = comandaItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceElement.textContent = formatPrice(total);
        
        if (comandaItems.length > 0) {
            fazerPedidoButton.style.display = 'block';
        } else {
            fazerPedidoButton.style.display = 'none';
        }

        localStorage.setItem(LOCAL_STORAGE_KEY_COMANDA, JSON.stringify(comandaItems));
    };

    const renderComanda = () => {
        summaryList.innerHTML = '';
        if (comandaItems.length === 0) {
            summaryList.innerHTML = '<p class="empty-list" style="color: var(--light-text-color); font-size: 14px; text-align: center; padding: 20px 0;">A comanda está vazia. Adicione itens.</p>';
        } else {
            comandaItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('summary-item');
                // Adiciona o ID do produto para manipulação nos botões
                itemElement.innerHTML = `
                    <div class="item-name-notes">
                        <div class="item-name">${item.name}</div>
                        <div class="item-notes-text">${item.notes ? `(${item.notes})` : ''}</div>
                    </div>
                    <div class="item-actions">
                        <button class="remove-item-btn" data-id="${item.id}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="add-item-btn" data-id="${item.id}">+</button>
                        <button class="notes-btn" data-id="${item.id}">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                `;
                summaryList.appendChild(itemElement);
            });
        }
        updateSummary();
    };
    
    const addToComanda = (productId) => {
        const product = products.find(p => p.id == productId);
        const existingItem = comandaItems.find(item => item.id == productId && !item.notes);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            comandaItems.push({ 
                ...product, 
                quantity: 1, 
                notes: '',
                description: undefined
            });
        }
        renderComanda();
    };
    
    const removeFromComanda = (productId) => {
        const existingItemIndex = comandaItems.findIndex(item => item.id == productId);
        
        if (existingItemIndex !== -1) {
            const existingItem = comandaItems[existingItemIndex];
            existingItem.quantity--;
            if (existingItem.quantity <= 0) {
                comandaItems.splice(existingItemIndex, 1);
            }
        }
        renderComanda();
    };
    
    // Lógica do Modal de Anotações
    const openNotesModal = (id) => {
        modalTargetId = id;
        const item = comandaItems.find(i => i.id == id);
        if (item) {
            notesItemName.textContent = `Item: ${item.name}`;
            notesTextarea.value = item.notes;
        }
        notesModal.classList.add('show');
    };

    const closeNotesModal = () => {
        notesModal.classList.remove('show');
        modalTargetId = null;
    };
    
    const saveNotes = () => {
        if (modalTargetId) {
            const item = comandaItems.find(i => i.id == modalTargetId);
            if (item) {
                item.notes = notesTextarea.value;
            }
            renderComanda();
            closeNotesModal();
        }
    };
    
    // -------------------- LÓGICA NAVEGAÇÃO E FILTRO --------------------
    
    const renderProducts = (filteredProducts) => {
        productGrid.innerHTML = '';
        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p class="empty-list" style="grid-column: 1 / -1; text-align: center; color: var(--light-text-color); margin-top: 30px;">Nenhum item encontrado nesta categoria ou busca.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.dataset.id = product.id; 

            // AÇÃO PRINCIPAL: ADICIONAR À COMANDA
            card.addEventListener('click', () => addToComanda(product.id)); 

            let mediaHtml;
            if (product.image) {
                mediaHtml = `<img src="${product.image}" alt="${product.name}" class="product-image">`;
            } else {
                // determina seção (Pratos/Bebidas) a partir da category do produto
                const section = getSectionForCategory(product.category) || 'Pratos';
                const typeStructure = MENU_STRUCTURE[section] || [];
                const defaultIcon = typeStructure.find(c => c.category === product.category)?.icon || 'fas fa-utensils';
                mediaHtml = `<div class="product-icon-container" style="background-color: #f8f8f8; display: flex; justify-content: center; align-items: center; height: 110px;"><i class="${defaultIcon} product-icon" style="font-size: 40px; color: var(--light-text-color);"></i></div>`;
            }

            card.innerHTML = `
                ${mediaHtml}
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price)}</p>
                </div>
            `;
            productGrid.appendChild(card);
        });
    };

    const filterProducts = () => {
        let filteredProducts = products.slice();
        
        // Primeiro filtro: pelo menu (Pratos / Bebidas) se selecionado
        if (selectedType === 'Pratos') {
            const pratosCats = MENU_STRUCTURE['Pratos'].map(c => c.category).filter(c => c !== 'Todos');
            filteredProducts = filteredProducts.filter(p => pratosCats.includes(p.category));
        } else if (selectedType === 'Bebidas') {
            const bebidasCats = MENU_STRUCTURE['Bebidas'].map(c => c.category).filter(c => c !== 'Todos');
            filteredProducts = filteredProducts.filter(p => bebidasCats.includes(p.category));
        }

        // Segundo filtro: categoria específica dentro do menu (Entradas / Principal / Sobremesas / Sucos / Refrigerantes)
        if (selectedCategory && selectedCategory !== 'Todos') {
            filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
        }
        
        const query = (searchBar?.value || '').toLowerCase(); 
        if (query) {
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
        }
        
        renderProducts(filteredProducts);
    };

    const closeDropdown = () => {
        dropdownOverlay.classList.remove('show');
        togglePratos.classList.remove('active');
        toggleBebidas.classList.remove('active');
        document.removeEventListener('click', handleOutsideClick);
    };

    const handleOutsideClick = (event) => {
        const isClickedOnToggle = event.target.closest('.menu-dropdown-toggle');
        const isClickedInsideDropdown = event.target.closest('#dropdown-content');
        
        if (!isClickedOnToggle && !isClickedInsideDropdown) {
            closeDropdown();
        }
    };
    
    const renderDropdownContent = (type) => {
        dropdownContent.innerHTML = '';
        const categories = MENU_STRUCTURE[type] || [];
        
        categories.forEach(cat => {
            const button = document.createElement('button');
            button.classList.add('category-item-dropdown');
            if (cat.category === selectedCategory && type === selectedType) {
                button.classList.add('active');
            }
            button.dataset.category = cat.category;
            button.dataset.type = type; 
            button.innerHTML = `<i class="${cat.icon} category-icon"></i><span class="category-text">${cat.name}</span>`;
            
            button.addEventListener('click', () => {
                selectedCategory = cat.category;
                selectedType = type; 
                filterProducts();
                closeDropdown(); 
                updateToggleButtons();
            });

            dropdownContent.appendChild(button);
        });
    };

    const updateToggleButtons = () => {
        [togglePratos, toggleBebidas].forEach(btn => btn.classList.remove('active'));
        
        if (selectedType === 'Pratos') {
            togglePratos.classList.add('active');
        } else if (selectedType === 'Bebidas') {
            toggleBebidas.classList.add('active');
        }
    };
    
    // -------------------- EVENT LISTENERS GERAIS --------------------

    // Menu Lateral (Off-Canvas)
    menuButton.addEventListener('click', () => {
        offCanvasMenu.classList.add('open');
        overlay.classList.add('show');
    });
    overlay.addEventListener('click', () => {
        offCanvasMenu.classList.remove('open');
        overlay.classList.remove('show');
    });
    // Toggle da Mesa (Menu Lateral e Sumário)
    btnMesaMenu.addEventListener('click', () => {
        offCanvasMenu.classList.remove('open');
        overlay.classList.remove('show');
        openMesaModal();
    }); 
    changeMesaBtnSummary.addEventListener('click', openMesaModal); // Botão do Sumário
    
    saveMesaButton.addEventListener('click', saveMesaNumber);
    mesaNumberInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveMesaNumber();
        }
    });

    // Barra de Categorias
    menuBar.addEventListener('click', (e) => {
        const button = e.target.closest('.menu-dropdown-toggle');
        if (!button) return;

        const newType = button.dataset.type;
        const isOpen = dropdownOverlay.classList.contains('show');
        const sameTypeOpen = isOpen && selectedType === newType;

        if (sameTypeOpen) {
            // Se clicar novamente no mesmo toggle, remove o filtro (volta a mostrar todos)
            selectedType = null;
            selectedCategory = 'Todos';
            closeDropdown();
            filterProducts();
            updateToggleButtons();
            return;
        }

        // Abrir novo dropdown / aplicar filtro de tipo
        closeDropdown();
        selectedType = newType;

        [togglePratos, toggleBebidas].forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        renderDropdownContent(newType);
        dropdownOverlay.classList.add('show');
        document.addEventListener('click', handleOutsideClick);

        // Posicionamento do Dropdown (para desktop)
        const rect = button.getBoundingClientRect();
        if (window.innerWidth > 600) {
            dropdownContent.style.top = `0px`; 
            dropdownContent.style.left = `100%`;
            dropdownContent.style.transform = `translateX(20px)`; 
        } else {
            let leftPosition = rect.left - (menuBar.getBoundingClientRect().left);
            dropdownContent.style.transform = `translateX(${leftPosition}px)`;
            dropdownContent.style.left = '0';
        }
    });

    // Busca
    searchBar.addEventListener('input', () => {
        closeDropdown(); 
        filterProducts();
    });

    // Ações do Sumário (botões + / - / lápis)
    document.getElementById('comanda-summary').addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-item-btn');
        const addButton = e.target.closest('.add-item-btn');
        const notesButton = e.target.closest('.notes-btn');

        if (removeButton) {
            const productId = removeButton.dataset.id;
            removeFromComanda(productId);
        } else if (addButton) {
            const productId = addButton.dataset.id;
            addToComanda(productId);
        } else if (notesButton) {
            const productId = notesButton.dataset.id;
            openNotesModal(productId);
        }
    });

    // Modal de Anotações
    saveNotesButton.addEventListener('click', saveNotes);
    closeNotesModalButton.addEventListener('click', closeNotesModal);
    notesModal.addEventListener('click', (e) => {
      if (e.target === notesModal) {
        closeNotesModal();
      }
    });

    // Detecta modo edição e informa na UI
    if (editingPedidoId) {
        console.log(`Editando itens do pedido #${editingPedidoId}`);
        const btn = document.querySelector('#btn-fazer-pedido, #fazer-pedido, #fazer-pedido-button, [data-action="fazer-pedido"]') || fazerPedidoButton;
        if (btn) btn.textContent = 'Adicionar ao pedido';
    }

    // Botão Fazer Pedido (criar OU atualizar)
    fazerPedidoButton.addEventListener('click', async () => {
        // ⭐ Recarrega editingPedidoId do localStorage no momento do clique
        editingPedidoId = localStorage.getItem('editingPedidoId');
        
        const token = getToken();
        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/ComandaWeb/Login.html';
            return;
        }

        if (comandaItems.length === 0) {
            alert("Adicione itens à comanda.");
            return;
        }

        const novos_itens = comandaItems.map(i => ({
            id_item: i.id,
            quantidade: i.quantity,
            observacao: i.notes || ''
        }));

        const apiBase = getNormalizedApiBase();
        fazerPedidoButton.disabled = true;

        try {
            if (editingPedidoId) {
                // ⭐ Busca o pedido atual para verificar o status
                const pedidoAtualStr = localStorage.getItem('pedidoSelecionado');
                let pedidoAtual = null;
                try {
                    pedidoAtual = JSON.parse(pedidoAtualStr);
                } catch {}

                const urls = [
                    `${apiBase}/sistema/pedidos/${editingPedidoId}/itens`,
                    `${apiBase}/pedidos/${editingPedidoId}/itens`
                ];
                let ok = false, lastErr = '';

                for (const url of urls) {
                    try {
                        const res = await fetch(url, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ novos_itens })
                        });
                        if (res.ok) {
                            const data = await res.json().catch(() => ({}));
                            
                            // ⭐ Se o pedido estava "entregue", volta para "em_preparo"
                            if (pedidoAtual?.status === 'entregue') {
                                const statusUrls = [
                                    `${apiBase}/sistema/pedidos/${editingPedidoId}/status`,
                                    `${apiBase}/pedidos/${editingPedidoId}/status`
                                ];
                                
                                for (const statusUrl of statusUrls) {
                                    try {
                                        const statusRes = await fetch(statusUrl, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ status: 'em_preparo' })
                                        });
                                        if (statusRes.ok) {
                                            console.log('Status alterado de entregue para em_preparo');
                                            break;
                                        }
                                    } catch (e) {
                                        console.warn('Erro ao alterar status:', e);
                                    }
                                }
                            }
                            
                            alert(data.message || 'Itens adicionados ao pedido.');
                            localStorage.removeItem('editingPedidoId');
                            localStorage.setItem('pedidoSelecionado', JSON.stringify({ id: Number(editingPedidoId), itens: [] }));
                            comandaItems = [];
                            localStorage.setItem('comanda', JSON.stringify([]));
                            window.location.href = 'resumoPedidos.html';
                            ok = true;
                            break;
                        } else {
                            lastErr = await res.text().catch(() => `HTTP ${res.status}`);
                            if (res.status === 404) continue;
                            break;
                        }
                    } catch (e) {
                        lastErr = e.message;
                    }
                }

                if (!ok) alert(`Falha ao atualizar itens do pedido: ${lastErr || 'Erro desconhecido'}`);
                return;
            }

            // Fluxo de criação do pedido (sem edição)
            const mesa = localStorage.getItem('comandaMesa');
            if (!mesa) {
                alert("Por favor, selecione o número da mesa antes de fazer o pedido.");
                openMesaModal();
                return;
            }

            const itensPayload = novos_itens;
            const createUrls = [
                `${apiBase}/sistema/pedidos`,
                `${apiBase}/pedidos`
            ];

            let created = false, lastErr = '';
            for (const url of createUrls) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ id_mesa: parseInt(mesa, 10), itens: itensPayload })
                    });
                    if (res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data.message || `Pedido da Mesa ${mesa} enviado com sucesso!`);
                        comandaItems = [];
                        localStorage.setItem('comanda', JSON.stringify([]));
                        renderComanda();
                        created = true;
                        break;
                    } else {
                        lastErr = await res.text().catch(() => `HTTP ${res.status}`);
                        if (res.status === 404) continue;
                        break;
                    }
                } catch (e) {
                    lastErr = e.message;
                }
            }
            if (!created) alert(`Falha ao enviar pedido: ${lastErr || 'Erro desconhecido'}`);
        } finally {
            fazerPedidoButton.disabled = false;
        }
    });

    // Antes de inicializar filtros/visualização, carregue o cardápio do servidor
    await loadCardapioFromServer();

    // Inicialização
    loadMesaNumber();
    updateToggleButtons(); 
    filterProducts();
    renderComanda(); 

    window.addEventListener('resize', () => {
        renderComanda();
    });
});

// Adicione helper no topo do DOMContentLoaded (antes de usar apiBase)
function getNormalizedApiBase() {
    const raw = (window.AppConfig && AppConfig.API_BASE_URL) ? AppConfig.API_BASE_URL : 'http://localhost:3001';
    // remove possível sufixo '/auth' e barras finais
    return raw.replace(/\/auth(?:\/.*)?$/i, '').replace(/\/+$/,'');
}

function getToken() {
    if (window.AuthService?.getToken) return AuthService.getToken();
    return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
}

// REMOVA o bloco duplicado abaixo se existir no arquivo:
// - const apiBase = getNormalizedApiBase();
// - const editingPedidoId = localStorage.getItem('editingPedidoId');
// - novo const fazerPedidoButton + addEventListener