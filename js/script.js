// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Dados de produtos (estrutura mantida do arquivo do usuário)
    const products = [
        // PRATOS - ENTRADAS
        { id: 1, name: 'Pão Francês', price: 0.50, type: 'Pratos', category: 'Entradas', image: 'https://redemix.vteximg.com.br/arquivos/ids/214544-1000-1000/6914.jpg?v=638351307421600000', description: 'Um pão crocante e macio, perfeito para qualquer hora do dia.' },
        { id: 3, name: 'Croissant', price: 4.50, type: 'Pratos', category: 'Entradas', description: 'Clássico croissant amanteigado, crocante por fora e macio por dentro.' },
        // PRATOS - PRINCIPAL
        { id: 4, name: 'Torta de Frango', price: 8.00, type: 'Pratos', category: 'Principal', description: 'Torta caseira com recheio cremoso de frango e massa super leve.' },
        { id: 8, name: 'XTudo', price: 18.00, type: 'Pratos', category: 'Principal', description: 'Sanduíche completo com hambúrguer, ovo, bacon, queijo, presunto e salada.' },
        { id: 9, name: 'Macarronada', price: 25.00, type: 'Pratos', category: 'Principal', description: 'Massa italiana com molho de tomate e carne moída.' },
        // PRATOS - SOBREMESAS
        { id: 2, name: 'Bolo de Chocolate', price: 15.00, type: 'Pratos', category: 'Sobremesas', image: 'assets/bolo.png', description: 'Delicioso bolo de chocolate com cobertura de ganache.' },
        { id: 7, name: 'Brigadeiro', price: 2.50, type: 'Pratos', category: 'Sobremesas', description: 'O clássico brigadeiro brasileiro, feito com chocolate de alta qualidade.' },
        // BEBIDAS - REFRIGERANTES
        { id: 10, name: 'Coca-Cola', price: 7.00, type: 'Bebidas', category: 'Refrigerantes', description: 'Refrigerante Coca-Cola gelado.' },
        { id: 5, name: 'Guaraná Antarctica', price: 6.00, type: 'Bebidas', category: 'Refrigerantes', description: 'Refrigerante Guaraná Antarctica gelado.' },
        // BEBIDAS - SUCOS
        { id: 6, name: 'Suco de Laranja', price: 6.50, type: 'Bebidas', category: 'Sucos', description: 'Suco de laranja natural, espremido na hora.' },
    ];
    
    // Estrutura de sub-categorias (mantida)
    const MENU_STRUCTURE = {
        'Pratos': [
            { name: 'Todos os Pratos', category: 'Todos', icon: 'fas fa-utensils' },
            { name: 'Entradas', category: 'Entradas', icon: 'fas fa-bread-slice' },
            { name: 'Principal', category: 'Principal', icon: 'fas fa-pizza-slice' },
            { name: 'Sobremesas', category: 'Sobremesas', icon: 'fas fa-ice-cream' }
        ],
        'Bebidas': [
            { name: 'Todas as Bebidas', category: 'Todos', icon: 'fas fa-glass-martini-alt' },
            { name: 'Refrigerantes', category: 'Refrigerantes', icon: 'fas fa-box' },
            { name: 'Sucos', category: 'Sucos', icon: 'fas fa-lemon' }
        ]
    };

    // Constantes do Local Storage
    const LOCAL_STORAGE_KEY_COMANDA = 'comanda';
    const LOCAL_STORAGE_KEY_MESA = 'comandaMesa'; 

    // Variáveis de estado
    let comandaItems = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_COMANDA)) || [];
    let modalTargetId = null; // ID do item para anotações
    let selectedType = null; // null = sem filtro por tipo (mostra todos)
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
        // Sempre adiciona como um novo item se não tiver anotações e for o primeiro
        const existingItem = comandaItems.find(item => item.id == productId && !item.notes);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            // Se o item tem anotações, ou é a primeira vez, é tratado como um novo item na lista (para anotações futuras)
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
        // Encontra o item (sem considerar anotações aqui, mas remove uma unidade do primeiro encontrado)
        const existingItemIndex = comandaItems.findIndex(item => item.id == productId);
        
        if (existingItemIndex !== -1) {
            const existingItem = comandaItems[existingItemIndex];
            existingItem.quantity--;
            if (existingItem.quantity <= 0) {
                comandaItems.splice(existingItemIndex, 1); // Remove do array se a quantidade for 0
            }
        }
        renderComanda();
    };
    
    // Lógica do Modal de Anotações
    const openNotesModal = (id) => {
        // Usa o ID do produto para encontrar o item na comanda. Se houver duplicatas, abre o modal do primeiro encontrado.
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
                const typeStructure = MENU_STRUCTURE[product.type] || [];
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
        let filteredProducts = selectedType ? products.filter(p => p.type === selectedType) : products.slice();
        
        if (selectedCategory !== 'Todos') {
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
            // No desktop, a sidebar é fixa, então a posição é absoluta em relação ao dropdown-container.
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

    // Botão Fazer Pedido (Simulação)
    fazerPedidoButton.addEventListener('click', () => {
        const mesa = localStorage.getItem(LOCAL_STORAGE_KEY_MESA);

        if (!mesa) {
            alert("Por favor, selecione o número da mesa antes de fazer o pedido.");
            openMesaModal();
            return;
        }
        if (comandaItems.length === 0) {
            alert("Adicione itens à comanda.");
            return;
        }
        
        const pedido = { mesa: mesa, itens: comandaItems, total: totalPriceElement.textContent };

        console.log("PEDIDO ENVIADO:", pedido);
        alert(`Pedido da Mesa ${mesa} enviado com sucesso! (Simulação)`);

        comandaItems = [];
        renderComanda();
    });

    // Inicialização
    loadMesaNumber();
    updateToggleButtons(); 
    filterProducts();
    renderComanda(); 

    window.addEventListener('resize', () => {
        // Renderiza a comanda novamente para recalcular alturas em caso de desktop/mobile
        renderComanda();
    });
});