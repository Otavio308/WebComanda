// Dados estáticos dos pedidos (futuramente virão do PostgreSQL)
const pedidos = [
    {
        id: "Pedido#293",
        data: "2025-10-12 18:36",
        valor: "R$40,50",
        status: "pendente",
        itens: [
            { nome: "Coca-cola", quantidade: 1, status: "pendente" },
            { nome: "X-burger", quantidade: 2, status: "pendente" }
        ]
    },
    {
        id: "Pedido#356",
        data: "2025-10-12 18:42",
        valor: "R$17,50",
        status: "pendente",
        itens: [
            { nome: "Suco Natural", quantidade: 1, status: "pronto" },
            { nome: "Batata Frita", quantidade: 1, status: "pendente" }
        ]
    },
    {
        id: "Pedido#695",
        data: "2025-10-12 18:59",
        valor: "R$22,95",
        status: "pronto",
        itens: [
            { nome: "Pizza Margherita", quantidade: 1, status: "pronto" },
            { nome: "Refrigerante", quantidade: 2, status: "pronto" }
        ]
    },
    {
        id: "Pedido#701",
        data: "2025-10-12 19:15",
        valor: "R$35,00",
        status: "pronto",
        itens: [
            { nome: "Hambúrguer", quantidade: 1, status: "pronto" },
            { nome: "Milkshake", quantidade: 1, status: "pronto" }
        ]
    }
];

// Função para mapear status para classes CSS
function getStatusClass(status) {
    const statusMap = {
        'pendente': 'status-pendente',
        'pronto': 'status-pronto'
    };
    return statusMap[status] || 'status-pendente';
}

// Função para formatar a data
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

// Função para criar o HTML dos itens do pedido
function criarHTMLItens(itens) {
    if (!itens || itens.length === 0) return '';

    const itensHTML = itens.map(item => `
        <div class="item-tag">
            <span class="item-quantidade">${item.quantidade}x</span>
            ${item.nome}
            <span class="item-status ${item.status === 'pronto' ? 'item-pronto' : 'item-pendente'}">
                ${item.status === 'pronto' ? '✓' : '⏰'}
            </span>
        </div>
    `).join('');

    return `
        <div class="pedido-itens">
            <div class="itens-lista">
                ${itensHTML}
            </div>
        </div>
    `;
}

// Função para criar o card do pedido
function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.setAttribute('data-pedido-id', pedido.id);
    
    card.innerHTML = `
        <div class="pedido-header">
            <span class="pedido-id">${pedido.id}</span>
            <span class="pedido-data">${formatarData(pedido.data)}</span>
        </div>
        <div class="pedido-info">
            <span class="pedido-valor">${pedido.valor}</span>
            <span class="pedido-status ${getStatusClass(pedido.status)}">
                ${pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
            </span>
        </div>
        ${criarHTMLItens(pedido.itens)}
    `;
    
    return card;
}

// Função para carregar os pedidos na página
function carregarPedidos() {
    const container = document.querySelector('.pedidos-container');
    
    // Limpa o container
    container.innerHTML = '';
    
    // Adiciona cada pedido ao container
    pedidos.forEach(pedido => {
        const card = criarCardPedido(pedido);
        container.appendChild(card);
    });
    
    // Adiciona event listeners para os cards
    adicionarEventListeners();
}

// Função para adicionar event listeners aos cards
function adicionarEventListeners() {
    const cards = document.querySelectorAll('.pedido-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const pedidoId = this.getAttribute('data-pedido-id');
            abrirResumoPedido(pedidoId);
        });
    });
}

// Função para abrir o resumo do pedido
function abrirResumoPedido(pedidoId) {
    console.log(`Abrindo resumo do pedido: ${pedidoId}`);
    
    // Encontra o pedido selecionado
    const pedidoSelecionado = pedidos.find(p => p.id === pedidoId);
    
    if (pedidoSelecionado) {
        // Prepara os dados completos do pedido para a tela de resumo
        const pedidoCompleto = {
            ...pedidoSelecionado,
            // Adiciona dados mais detalhados que serão usados no resumo
            itens: pedidoSelecionado.itens.map((item, index) => ({
                id: index + 1,
                nome: item.nome,
                quantidade: item.quantidade,
                precoUnitario: calcularPrecoUnitario(item.nome),
                precoTotal: calcularPrecoTotal(item),
                status: item.status
            }))
        };

        // Salva no localStorage para a tela de resumo
        localStorage.setItem('pedidoSelecionado', JSON.stringify(pedidoCompleto));
        
        // Redireciona para a tela de resumo
        window.location.href = 'resumoPedidos.html';
    }
}

// Funções auxiliares para calcular preços (exemplo)
function calcularPrecoUnitario(nomeItem) {
    const precos = {
        "Coca-cola": 8.99,
        "X-burger": 15.75,
        "Suco Natural": 6.50,
        "Batata Frita": 12.00,
        "Pizza Margherita": 18.95,
        "Refrigerante": 7.00,
        "Hambúrguer": 16.00,
        "Milkshake": 14.00
    };
    return precos[nomeItem] || 10.00;
}

function calcularPrecoTotal(item) {
    const precoUnitario = calcularPrecoUnitario(item.nome);
    return precoUnitario * item.quantidade;
}

// Inicializa a página quando carregada
document.addEventListener('DOMContentLoaded', function() {
    carregarPedidos();
});

// Função para adicionar um novo pedido (para testes)
function adicionarPedido(novoPedido) {
    pedidos.unshift(novoPedido);
    carregarPedidos();
}

// Função para atualizar o status de um pedido
function atualizarStatusPedido(pedidoId, novoStatus) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
        pedido.status = novoStatus;
        carregarPedidos();
    }
}

// Função para adicionar item a um pedido existente
function adicionarItemAoPedido(pedidoId, novoItem) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
        pedido.itens.push(novoItem);
        
        // Se o pedido estava pronto e adicionou um item pendente, volta para pendente
        if (pedido.status === 'pronto' && novoItem.status === 'pendente') {
            pedido.status = 'pendente';
        }
        
        // Recalcula o valor total (simplificado)
        const valorTotal = pedido.itens.reduce((total, item) => {
            return total + calcularPrecoTotal(item);
        }, 0);
        
        pedido.valor = `R$${valorTotal.toFixed(2)}`;
        carregarPedidos();
    }
}