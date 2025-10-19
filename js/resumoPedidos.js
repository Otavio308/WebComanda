
// Configuração do usuário logado (role)
const usuarioLogado = {
    role: "cozinha" // "caixa", "garcom", "cozinha"
};

// Elementos do DOM
let itemSelecionado = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    carregarPedido();
    configurarPermissoes();
    carregarItens();
});

// Carrega os dados do pedido
function carregarPedido() {
    // Tenta carregar do localStorage primeiro (quando vier da tela anterior)
    const pedidoSalvo = localStorage.getItem('pedidoSelecionado');
    if (pedidoSalvo) {
        try {
            pedido = JSON.parse(pedidoSalvo);
        } catch (err) {
            console.warn('Erro ao parsear pedidoSelecionado do localStorage:', err);
        }
    } else {
        // Se não houver no localStorage, tenta obter id pela query string ?id=Pedido#293
        const params = new URLSearchParams(window.location.search);
        const pedidoId = params.get('id');
        if (pedidoId && window.pedidos && Array.isArray(window.pedidos)) {
            const encontrado = window.pedidos.find(p => p.id === pedidoId);
            if (encontrado) {
                // Reconstroi itens com preços para contexto completo
                pedido = {
                    ...encontrado,
                    itens: encontrado.itens.map((it, idx) => {
                        const precoUnitario = calcularPrecoUnitario(it.nome);
                        const precoTotal = (typeof it.precoTotal === 'number') ? it.precoTotal : precoUnitario * (it.quantidade || 1);
                        return {
                            id: it.id || (idx + 1),
                            nome: it.nome,
                            quantidade: it.quantidade || 1,
                            precoUnitario,
                            precoTotal,
                            status: it.status || 'pendente'
                        };
                    })
                };
            }
        }
    }

    // Compatibilidade: alguns lugares usam "valor" e outros "valorTotal"
    const valor = pedido && (pedido.valorTotal || pedido.valor || calcularValorTotalFromItems(pedido.itens));
    if (pedido) pedido.valorTotal = valor;

    if (!pedido) {
        console.warn('Nenhum pedido disponível para exibir.');
        return;
    }

    document.getElementById('pedido-numero').textContent = pedido.id || '—';
    document.getElementById('pedido-data').textContent = pedido.data ? formatarData(pedido.data) : '—';
    document.getElementById('pedido-status').textContent = pedido.status ? (pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)) : '—';
    document.getElementById('pedido-status').className = `info-value status-pedido ${pedido.status || ''}`;
    document.getElementById('pedido-total').textContent = pedido.valorTotal;
}

// Configura as permissões baseadas no role
function configurarPermissoes() {
    // normaliza role para evitar problemas de case
    usuarioLogado.role = (usuarioLogado.role || '').toLowerCase();

    const btnTroco = document.getElementById('btn-calcular-troco');
    const btnAddItem = document.getElementById('btn-adicionar-item');
    const btnCancelar = document.getElementById('btn-cancelar-pedido');

    // Reset todos os botões
    if (btnTroco) btnTroco.disabled = true;
    if (btnAddItem) btnAddItem.disabled = true;
    if (btnCancelar) btnCancelar.disabled = true;

    // Configura permissões por role
    switch(usuarioLogado.role) {
        case 'caixa':
            if (btnTroco) btnTroco.disabled = false;
            if (btnCancelar) btnCancelar.disabled = false;
            break;
        case 'garcom':
            if (btnAddItem) btnAddItem.disabled = false;
            if (btnCancelar) btnCancelar.disabled = false;
            break;
        case 'cozinha':
            // Cozinha não tem acesso a nenhum botão
            break;
    }

    // Verifica se pode habilitar calcular troco (apenas se pedido estiver pronto)
    if (usuarioLogado.role === 'caixa' && pedido.status === 'pronto' && btnTroco) {
        btnTroco.disabled = false;
    }
}

// Carrega os itens do pedido
function carregarItens() {
    const container = document.getElementById('itens-container');
    container.innerHTML = '';

    if (!pedido || !Array.isArray(pedido.itens)) return;

    pedido.itens.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        itemElement.dataset.itemId = item.id;

        const statusIcon = item.status === 'pronto' ? '✓' : '⏰';
        const statusClass = item.status === 'pronto' ? 'status-pronto-icon' : 'status-pendente-icon';

        // Exibe valores com formatação
        const precoUnit = (typeof item.precoUnitario === 'number') ? item.precoUnitario.toFixed(2) : calcularPrecoUnitario(item.nome).toFixed(2);
        const precoTotal = (typeof item.precoTotal === 'number') ? item.precoTotal.toFixed(2) : (item.quantidade * parseFloat(precoUnit)).toFixed(2);

        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-detalhes">${item.quantidade} x R$${precoUnit} = R$${precoTotal}</div>
            </div>
            <div class="item-valor">R$${precoTotal}</div>
            <div class="item-status ${statusClass}" data-item-id="${item.id}"
                 style="cursor: ${usuarioLogado.role === 'cozinha' ? 'pointer' : 'default'};">
                ${statusIcon}
            </div>
        `;

        // delegate click on status only (keeps card click possible if needed)
        const statusEl = itemElement.querySelector('.item-status');
        if (statusEl && usuarioLogado.role === 'cozinha') {
            statusEl.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.itemId;
                selecionarItem(parseInt(id, 10));
            });
        }

        container.appendChild(itemElement);
    });
}

// Seleciona item para mudança de status (apenas cozinha)
function selecionarItem(itemId) {
    if (usuarioLogado.role !== 'cozinha') return;

    itemSelecionado = pedido.itens.find(item => Number(item.id) === Number(itemId));
    
    if (itemSelecionado && itemSelecionado.status === 'pendente') {
        document.getElementById('modal-titulo').textContent = 'Confirmar';
        document.getElementById('modal-mensagem').textContent = 'Deseja marcar como pronto?';
        document.getElementById('modal-item-info').textContent = 
            `${itemSelecionado.quantidade}x ${itemSelecionado.nome}: R$${(itemSelecionado.precoTotal).toFixed(2)}`;
        
        document.getElementById('modal-confirmacao').style.display = 'flex';
    }
}

// Confirma a ação no modal
function confirmarAcao() {
    if (itemSelecionado) {
        itemSelecionado.status = 'pronto';
        // salva mudanças no localStorage para manter contexto entre telas
        salvarPedidoNoLocalStorage();
        fecharModal();
        carregarItens();
        verificarStatusPedido();

        // Se houver lista global de pedidos, atualiza também para consistência
        if (window.pedidos && Array.isArray(window.pedidos)) {
            const idx = window.pedidos.findIndex(p => p.id === pedido.id);
            if (idx !== -1) {
                // Atualiza itens e status resumido
                window.pedidos[idx].itens = pedido.itens.map(it => ({ nome: it.nome, quantidade: it.quantidade, status: it.status }));
                window.pedidos[idx].status = pedido.status;
            }
        }
    }
}

// Salva pedido atualizado no localStorage
function salvarPedidoNoLocalStorage() {
    try {
        localStorage.setItem('pedidoSelecionado', JSON.stringify(pedido));
    } catch (err) {
        console.warn('Erro ao salvar pedido no localStorage:', err);
    }
}

// Fecha o modal de confirmação
function fecharModal() {
    document.getElementById('modal-confirmacao').style.display = 'none';
    itemSelecionado = null;
}

// Verifica se todos os itens estão prontos e atualiza status do pedido
function verificarStatusPedido() {
    const todosProntos = pedido.itens.every(item => item.status === 'pronto');
    
    if (todosProntos && pedido.status === 'pendente') {
        pedido.status = 'pronto';
        document.getElementById('pedido-status').textContent = 'Pronto';
        document.getElementById('pedido-status').className = 'info-value status-pedido pronto';
        configurarPermissoes(); // Reconfigura permissões pois o status mudou
    } else if (!todosProntos && pedido.status === 'pronto') {
        pedido.status = 'pendente';
        document.getElementById('pedido-status').textContent = 'Pendente';
        document.getElementById('pedido-status').className = 'info-value status-pedido pendente';
        configurarPermissoes(); // Reconfigura permissões pois o status mudou
    }
}

// Funções dos botões de ação
function calcularTroco() {
    if (usuarioLogado.role !== 'caixa') {
        mostrarAlerta('Você não tem permissão para essa funcionalidade.');
        return;
    }

    if (pedido.status !== 'pronto') {
        mostrarAlerta('Você não pode calcular o troco. Há itens pendentes não finalizados.');
        return;
    }

    // Redireciona para a tela de troco
    window.location.href = 'troco.html';
}

function adicionarItem() {
    if (usuarioLogado.role !== 'garcom') {
        mostrarAlerta('Você não tem permissão para essa funcionalidade.');
        return;
    }

    // Redireciona para o index (cardápio)
    window.location.href = 'index.html';
}

function cancelarPedido() {
    if (usuarioLogado.role !== 'caixa' && usuarioLogado.role !== 'garcom') {
        mostrarAlerta('Você não tem permissão para essa funcionalidade.');
        return;
    }

    // Lógica para cancelar pedido
    console.log('Cancelando pedido:', pedido.id);
    // Implementar lógica de cancelamento
}

// Mostra alerta de permissão
function mostrarAlerta(mensagem) {
    document.getElementById('alerta-mensagem').textContent = mensagem;
    document.getElementById('modal-alerta').style.display = 'flex';
}

function fecharAlerta() {
    document.getElementById('modal-alerta').style.display = 'none';
}

// Função utilitária para formatar data
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

// Voltar para tela anterior
function voltar() {
    window.history.back();
}

// Função para simular mudança de role (para testes)
function mudarRole(novoRole) {
    usuarioLogado.role = novoRole;
    configurarPermissoes();
    carregarItens();
}

// utilitária para garantir cálculo de total se propriedade faltante
function calcularValorTotalFromItems(itens) {
    if (!Array.isArray(itens) || itens.length === 0) return 'R$0,00';
    const total = itens.reduce((sum, it) => {
        // pode vir precoTotal ou calcular a partir de precoUnitario * quantidade
        const itemTotal = (typeof it.precoTotal === 'number') ? it.precoTotal
            : ((typeof it.precoUnitario === 'number' && typeof it.quantidade === 'number') ? it.precoUnitario * it.quantidade : 0);
        return sum + itemTotal;
    }, 0);
    return `R$${total.toFixed(2)}`.replace('.', ',');
}