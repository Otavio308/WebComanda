// Dados estáticos dos pedidos (futuramente virão do PostgreSQL)
const pedidos = [
    {
        id: "Pedido#293",
        data: "2025-10-12 18:36",
        valor: "R$40,50",
        status: "pendente"
    },
    {
        id: "Pedido#356",
        data: "2025-10-12 18:42",
        valor: "R$17,50",
        status: "pendente"
    },
    {
        id: "Pedido#695",
        data: "2025-10-12 18:59",
        valor: "R$22,95",
        status: "pronto"
    },
    {
        id: "Pedido#701",
        data: "2025-10-12 19:15",
        valor: "R$35,00",
        status: "pronto"
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
    
    // Por enquanto, vamos apenas mostrar um alerta
    alert(`Abrindo resumo do pedido: ${pedidoId}\n\nEsta funcionalidade será implementada na próxima tela!`);
    
    // Envia o contexto do pedido para a próxima tela
    const pedidoSelecionado = pedidos.find(p => p.id === pedidoId);
    if (pedidoSelecionado) {
        localStorage.setItem('pedidoSelecionado', JSON.stringify(pedidoSelecionado));
    }
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

