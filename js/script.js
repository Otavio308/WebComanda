document.addEventListener('DOMContentLoaded', () => {
    // Dados de produtos
    const products = [
        { id: 1, name: 'Pão Francês', price: 0.50, category: 'Salgados', image: 'https://redemix.vteximg.com.br/arquivos/ids/214544-1000-1000/6914.jpg?v=638351307421600000' },
        { id: 2, name: 'Bolo de Chocolate', price: 15.00, category: 'Doces', image: 'assets/bolo.png' },
        { id: 3, name: 'Croissant', price: 4.50, category: 'Salgados',},
        { id: 4, name: 'Torta de Frango', price: 8.00, category: 'Salgados', },
        { id: 5, name: 'Café Expresso', price: 3.00, category: 'Bebidas', },
        { id: 6, name: 'Suco de Laranja', price: 6.50, category: 'Bebidas', },
        { id: 7, name: 'Brigadeiro', price: 2.50, category: 'Doces' },
        { id: 8, name: 'Baguete', price: 5.50, category: 'Salgados' },
        { id: 9, name: 'Torta de Limão', price: 12.00, category: 'Doces' }, // Item sem imagem
        { id: 10, name: 'Refrigerante', price: 7.00, category: 'Bebidas' } // Item sem imagem
    ];

    // Mapeamento de categorias para ícones do Font Awesome
    const categoryIcons = {
        'Salgados': 'fas fa-pizza-slice',
        'Doces': 'fas fa-cookie-bite',
        'Bebidas': 'fas fa-glass-martini-alt',
        'Todos': 'fas fa-utensils'
    };
    
    // Constantes do Local Storage
    const LOCAL_STORAGE_KEY_COMANDA = 'comanda';
    const LOCAL_STORAGE_KEY_MESA = 'comandaMesa'; // NOVA CHAVE PARA O NÚMERO DA MESA

    let comandaItems = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_COMANDA)) || [];
    let modalTargetId = null;

    // Elementos do DOM
    const productGrid = document.getElementById('product-grid');
    const summaryList = document.getElementById('summary-list');
    const totalPriceElement = document.getElementById('total-price');
    const trocoButton = document.getElementById('troco-button');
    const categoryButtons = document.querySelectorAll('.category-item');
    const searchBar = document.getElementById('search-bar');
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const notesModal = document.getElementById('notes-modal');
    const modalTitle = document.getElementById('modal-title');
    const notesTextarea = document.getElementById('notes-textarea');
    const saveNotesButton = document.getElementById('save-notes-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const tableNumberInput = document.getElementById('table-number'); // NOVO ELEMENTO DA MESA

    // Funções

    // NOVO: Função para salvar o número da mesa
    const saveMesaNumber = () => {
        if (tableNumberInput) {
            const mesa = tableNumberInput.value.trim();
            if (mesa) {
                localStorage.setItem(LOCAL_STORAGE_KEY_MESA, mesa);
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY_MESA);
            }
        }
    };

    // NOVO: Função para carregar o número da mesa
    const loadMesaNumber = () => {
        if (tableNumberInput) {
            const storedMesa = localStorage.getItem(LOCAL_STORAGE_KEY_MESA);
            if (storedMesa) {
                tableNumberInput.value = storedMesa;
            }
        }
    };
    
    // MODIFICADO: Atualiza o Local Storage usando a constante
    const updateSummary = () => {
        let total = comandaItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceElement.textContent = formatPrice(total);
        if (comandaItems.length > 0) {
            trocoButton.style.display = 'block';
        } else {
            trocoButton.style.display = 'none';
        }
        localStorage.setItem(LOCAL_STORAGE_KEY_COMANDA, JSON.stringify(comandaItems));
    };


    const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`;

    const renderComanda = () => {
        summaryList.innerHTML = '';
        if (comandaItems.length === 0) {
            summaryList.innerHTML = '<p class="empty-list">A comanda está vazia.</p>';
        } else {
            comandaItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('summary-item');
                itemElement.innerHTML = `
                    <div class="item-name-notes">
                        <div class="item-name">${item.name}</div>
                        <div class="item-notes-text">${item.notes || ''}</div>
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
    };

    const renderProducts = (filteredProducts) => {
        productGrid.innerHTML = '';
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.id = product.id;

            const productImageHtml = product.image
                ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
                : `<div class="product-icon-container"><i class="${categoryIcons[product.category] || 'fas fa-utensils'} product-icon"></i></div>`;

            productCard.innerHTML = `
                ${productImageHtml}
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="product-price">${formatPrice(product.price)}</p>
                    <div class="product-actions">
                        <button class="add-product-btn" data-id="${product.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    };

    const addToComanda = (productId) => {
        const product = products.find(p => p.id == productId);
        const existingItem = comandaItems.find(item => item.id == productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            comandaItems.push({ ...product, quantity: 1, notes: '' });
        }
        renderComanda();
        updateSummary();
    };
    
    const removeFromComanda = (productId) => {
        const existingItem = comandaItems.find(item => item.id == productId);
        if (existingItem) {
            existingItem.quantity--;
            if (existingItem.quantity <= 0) {
                comandaItems = comandaItems.filter(item => item.id != productId);
            }
        }
        renderComanda();
        updateSummary();
    };

    const openNotesModal = (id) => {
        modalTargetId = id;
        const item = comandaItems.find(i => i.id == id);
        if (item) {
            notesTextarea.value = item.notes;
        }
        notesModal.classList.add('show');
    };

    const saveNotes = () => {
        if (modalTargetId) {
            const item = comandaItems.find(i => i.id == modalTargetId);
            if (item) {
                item.notes = notesTextarea.value;
            }
            renderComanda();
            updateSummary();
            closeNotesModal();
        }
    };

    const closeNotesModal = () => {
        notesModal.classList.remove('show');
        modalTargetId = null;
    };

    // Event Listeners
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            const filtered = category === 'Todos' ? products : products.filter(p => p.category === category);
            renderProducts(filtered);
        });
    });

    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(query));
        renderProducts(filtered);
    });

    productGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.add-product-btn');
        if (button) {
            const productId = button.dataset.id;
            addToComanda(productId);
        }
    });

    summaryList.addEventListener('click', (e) => {
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

    saveNotesButton.addEventListener('click', saveNotes);
    closeModalButton.addEventListener('click', closeNotesModal);
    notesModal.addEventListener('click', (e) => {
      if (e.target === notesModal) {
        closeNotesModal();
      }
    });

    // NOVO: Event Listeners para o Número da Mesa
    if (tableNumberInput) {
        tableNumberInput.addEventListener('change', saveMesaNumber);
        tableNumberInput.addEventListener('keyup', saveMesaNumber); 
    }
    
    // Iniciar a aplicação
    loadMesaNumber(); // Carrega o número da mesa antes de renderizar tudo
    renderProducts(products);
    renderComanda();
    updateSummary();
});