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

// Helpers de API/Autenticação
function getNormalizedApiBase() {
    const raw = (window.AppConfig && AppConfig.API_BASE_URL) ? AppConfig.API_BASE_URL : 'http://localhost:3001';
    return raw.replace(/\/auth(?:\/.*)?$/i, '').replace(/\/+$/, '');
}

function getToken() {
    if (window.AuthService?.getToken) return AuthService.getToken();
    return localStorage.getItem('auth_token');
}

function getUserRole() {
    try {
        const u = window.AuthService?.getUserData?.() || {};
        return (u.role || u.perfil || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    } catch { return ''; }
}

// Conclui o pedido (faz pagamento no backend)
async function concluirPedido() {
    if (!pedido) return;

    const valorRecebido = parseFloat(valorRecebidoInput.value) || 0;
    const valorTotal = Number(pedido.valorTotal || 0);
    const troco = valorRecebido - valorTotal;

    // Apenas Caixa pode pagar
    const role = getUserRole();
    if (role !== 'caixa') {
        alert('Apenas o Caixa pode concluir o pagamento.');
        return;
    }

    // Método de pagamento (se existir select na página; senão usa "dinheiro")
    const metodoSel = document.getElementById('metodo-pagamento');
    const metodo = (metodoSel && metodoSel.value) ? metodoSel.value : 'dinheiro';

    // Validações básicas
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

    // Chama backend: POST /sistema/pagamentos (fallback /pagamentos)
    const apiBase = getNormalizedApiBase();
    const token = getToken();
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
    }

    const payload = {
        id_pedido: pedido.id,
        valor_pago: valorRecebido,
        metodo
        // troco é calculado no backend; não é obrigatório enviar
    };

    const urls = [
        `${apiBase}/sistema/pagamentos`,
        `${apiBase}/pagamentos`
    ];

    // Desabilita botão concluir se existir
    const btnConcluir = document.getElementById('btn-concluir');
    if (btnConcluir) {
        btnConcluir.disabled = true;
        btnConcluir.textContent = 'Processando...';
    }

    let sucesso = false;
    let respostaBackend = null;

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                try {
                    respostaBackend = await res.json();
                } catch {
                    respostaBackend = { message: 'Pagamento realizado.' };
                }
                sucesso = true;
                break;
            } else {
                // Tenta ler mensagem de erro
                let msg = 'Erro ao processar pagamento.';
                try {
                    const data = await res.json();
                    msg = data?.message || data?.erro || JSON.stringify(data);
                } catch {
                    msg = await res.text();
                }
                console.warn('Falha no pagamento:', msg);
                alert(msg.substring(0, 300));
                break; // para se recebeu erro compreensível do backend
            }
        } catch (e) {
            console.warn('Erro na requisição de pagamento:', e);
            // tenta próxima URL
        }
    }

    // Reabilita botão
    if (btnConcluir) {
        btnConcluir.disabled = false;
        btnConcluir.textContent = 'Concluir';
    }

    if (!sucesso) {
        return; // já exibiu alerta acima
    }

    // Sucesso: mostra confirmação com troco calculado
    const trocoFinal = typeof respostaBackend?.pagamento?.troco === 'number'
        ? respostaBackend.pagamento.troco
        : troco;

    alert(`Pagamento concluído!\nPedido: ${pedido.id}\nTroco: R$${Number(trocoFinal).toFixed(2)}`);

    // Limpa seleção e volta para listagem
    localStorage.removeItem('pedidoSelecionado');
    window.location.href = 'pedidos.html'; // ou 'index.html' se preferir
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