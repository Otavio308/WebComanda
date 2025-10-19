// Dados do pedido (vindos do localStorage)
let pedido = null;

// Elementos do DOM
let valorRecebidoInput = null;
let trocoValorElement = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa elementos
    valorRecebidoInput = document.getElementById('valor-recebido');
    trocoValorElement = document.getElementById('troco-valor');
    
    // Carrega os dados do pedido
    carregarPedido();
    
    // Configura event listeners
    configurarEventListeners();
});

// Carrega os dados do pedido do localStorage
function carregarPedido() {
    const pedidoSalvo = localStorage.getItem('pedidoSelecionado');
    
    if (pedidoSalvo) {
        pedido = JSON.parse(pedidoSalvo);
        exibirResumoPedido();
    } else {
        // Se não há pedido, volta para a tela anterior
        alert('Nenhum pedido selecionado!');
        voltar();
    }
}

// Exibe o resumo do pedido na tela
function exibirResumoPedido() {
    if (!pedido) return;
    
    const itensLista = document.getElementById('itens-lista');
    const totalItensElement = document.getElementById('total-itens');
    const valorTotalElement = document.getElementById('valor-total');
    
    // Limpa a lista de itens
    itensLista.innerHTML = '';
    
    // Calcula totais (garante propriedades numéricas)
    const totalItens = pedido.itens.reduce((total, item) => total + (item.quantidade || 0), 0);
    const valorTotal = pedido.itens.reduce((total, item) => total + (item.precoTotal || 0), 0);
    
    // Exibe os itens
    pedido.itens.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-resumo';
        
        const precoUnit = (typeof item.precoUnitario === 'number') ? item.precoUnitario : 0;
        const precoTotal = (typeof item.precoTotal === 'number') ? item.precoTotal : (item.quantidade || 0) * precoUnit;
        
        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-detalhes">
                    ${item.quantidade} x R$ ${precoUnit.toFixed(2)} = R$ ${precoTotal.toFixed(2)}
                </div>
            </div>
            <div class="item-total">R$ ${precoTotal.toFixed(2)}</div>
        `;
        
        itensLista.appendChild(itemElement);
    });
    
    // Exibe totais
    totalItensElement.textContent = totalItens;
    valorTotalElement.textContent = `R$${valorTotal.toFixed(2)}`;
    
    // Salva o valor total no pedido para cálculos
    pedido.valorTotal = valorTotal;

    // Se houver 3 ou mais itens, tornamos a área de itens rolável e limitamos sua altura
    const itensCount = pedido.itens.length || 0;
    if (itensCount >= 3) {
        // atualiza --item-height com a altura do primeiro item renderizado (para precisão)
        const firstItem = itensLista.querySelector('.item-resumo');
        if (firstItem) {
            const height = firstItem.offsetHeight;
            // define a variável global para ser usada no CSS
            document.documentElement.style.setProperty('--item-height', `${height}px`);
        }
        itensLista.classList.add('scrollable');
    } else {
        itensLista.classList.remove('scrollable');
        // opcional: restaura o item-height para o padrão se quiser
        // document.documentElement.style.removeProperty('--item-height');
    }
}

// Configura os event listeners
function configurarEventListeners() {
    // Listener para o input de valor recebido
    valorRecebidoInput.addEventListener('input', calcularTroco);
    
    // Listener para tecla Enter no input
    valorRecebidoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            concluirPedido();
        }
    });
    
    // Foca no input automaticamente
    valorRecebidoInput.focus();
}

// Calcula o troco
function calcularTroco() {
    if (!pedido) return;
    
    const valorRecebido = parseFloat(valorRecebidoInput.value) || 0;
    const valorTotal = pedido.valorTotal;
    const troco = valorRecebido - valorTotal;
    
    // Atualiza o display do troco
    trocoValorElement.textContent = `R$${troco.toFixed(2)}`;
    
    // Altera a cor baseada no valor do troco
    const trocoResultado = document.querySelector('.troco-resultado');
    
    if (troco < 0) {
        // Valor insuficiente
        trocoResultado.classList.add('valor-insuficiente');
        trocoValorElement.style.color = '#dc3545';
    } else {
        // Valor suficiente
        trocoResultado.classList.remove('valor-insuficiente');
        trocoValorElement.style.color = '#28a745';
    }
}

// Conclui o pedido
function concluirPedido() {
    if (!pedido) return;
    
    const valorRecebido = parseFloat(valorRecebidoInput.value) || 0;
    const valorTotal = pedido.valorTotal;
    const troco = valorRecebido - valorTotal;
    
    // Validações
    if (valorRecebido <= 0) {
        alert('Por favor, informe o valor recebido!');
        valorRecebidoInput.focus();
        return;
    }
    
    if (troco < 0) {
        const confirmar = confirm(`Valor recebido é insuficiente! Faltam R$${Math.abs(troco).toFixed(2)}\nDeseja continuar mesmo assim?`);
        if (!confirmar) {
            valorRecebidoInput.focus();
            return;
        }
    }
    
    // Prepara dados para conclusão
    const dadosConclusao = {
        pedidoId: pedido.id,
        valorTotal: valorTotal,
        valorRecebido: valorRecebido,
        troco: troco,
        dataConclusao: new Date().toISOString(),
        itens: pedido.itens
    };
    
    // Simula conclusão do pedido
    console.log('Concluindo pedido:', dadosConclusao);
    
    // Aqui você faria a requisição para o backend
    // para atualizar o status do pedido para "concluído"
    
    // Mostra confirmação
    alert(`Pedido ${pedido.id} concluído com sucesso!\nTroco: R$${troco.toFixed(2)}`);
    
    // Limpa o localStorage
    localStorage.removeItem('pedidoSelecionado');
    
    // Redireciona para a tela de pedidos
    window.location.href = 'index.html';
}

// Volta para a tela anterior
function voltar() {
    window.history.back();
}

// Função para formatar valor em Real
function formatarReal(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Teclado numérico virtual (opcional - para touch devices)
function inserirNumero(numero) {
    const input = valorRecebidoInput;
    const valorAtual = input.value.replace(',', '');
    const novoValor = valorAtual + numero;
    
    if (novoValor.length <= 8) { // Limite de 999999,99
        const valorFormatado = (parseInt(novoValor) / 100).toFixed(2);
        input.value = valorFormatado;
        calcularTroco();
    }
}

function limparValor() {
    valorRecebidoInput.value = '';
    calcularTroco();
    valorRecebidoInput.focus();
}

function apagarUltimo() {
    const input = valorRecebidoInput;
    let valor = input.value.replace(',', '');
    
    if (valor.length > 0) {
        valor = valor.slice(0, -1);
        const valorFormatado = valor ? (parseInt(valor) / 100).toFixed(2) : '';
        input.value = valorFormatado;
        calcularTroco();
    }
}