// resumoPedidos.js — exibe e atualiza o resumo do pedido selecionado

let pedido = null;
let usuarioLogado = { role: 'cozinha' };
let itemSelecionado = null;

// Normaliza a base da API (remove /auth se presente)
function getNormalizedApiBase() {
    const raw = (window.AppConfig && AppConfig.API_BASE_URL) ? AppConfig.API_BASE_URL : 'http://localhost:3001';
    return raw.replace(/\/auth(?:\/.*)?$/i, '').replace(/\/+$/, '');
}

function formatarData(dataString) {
    const d = new Date(dataString);
    return isNaN(d) ? (dataString || '') : d.toLocaleString('pt-BR');
}

function formatCurrency(n) {
    const v = Number(n || 0);
    return `R$${v.toFixed(2).replace('.', ',')}`;
}

function getToken() {
    if (window.AuthService?.getToken) return AuthService.getToken();
    // ⭐ Busca authToken também (não só auth_token)
    return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
}

function getUserRole() {
    try {
        // ⭐ BUSCA DE userData NO LOCALSTORAGE (onde está o role!)
        const userDataStr = localStorage.getItem('userData');
        
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr);
                
                if (userData.role) {
                    const role = userData.role
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase();
                    console.log('Role encontrado no userData:', role);
                    return role;
                }
            } catch (e) {
                console.error('Erro ao parsear userData:', e);
            }
        }
        
        // Tenta buscar do AuthService
        if (window.AuthService && typeof AuthService.getUserData === 'function') {
            const user = AuthService.getUserData();
            let role = user?.role || user?.perfil || user?.tipo || user?.cargo || '';
            role = role.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (role) {
                console.log('Role encontrado no AuthService:', role);
                return role;
            }
        }
    } catch (e) {
        console.error('Erro ao buscar role:', e);
    }
    
    try {
        // ⭐ Busca do token (authToken, não auth_token)
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            let role = payload.role || payload.perfil || payload.tipo || '';
            role = role.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (role) {
                console.log('Role encontrado no token:', role);
                return role;
            }
        }
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
    }
    
    console.warn('Role não encontrado, usando padrão: cozinha');
    return 'cozinha';
}

document.addEventListener('DOMContentLoaded', async () => {
    usuarioLogado.role = getUserRole();
    console.log('Role do usuário logado:', usuarioLogado.role);

    await carregarPedido();

    // ⭐ Se for cozinha/admin e o pedido está "aberto", muda para "em_preparo"
    if ((usuarioLogado.role === 'cozinha' || usuarioLogado.role === 'admin') && 
        pedido?.status === 'aberto') {
        await atualizarStatusPedidoNoBackend('em_preparo');
    }

    renderPedidoHeader();
    configurarPermissoes();
    carregarItens();

    const btnTroco = document.getElementById('btn-calcular-troco');
    const btnCancelar = document.getElementById('btn-cancelar-pedido');
    const btnVoltar = document.getElementById('backButton') || document.getElementById('btn-voltar');

    if (btnTroco) btnTroco.addEventListener('click', calcularTroco);
    if (btnCancelar) btnCancelar.addEventListener('click', cancelarPedido);
    if (btnVoltar) {
        btnVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'pedidos.html';
            }
        });
    }

    const btnModalConfirm = document.getElementById('modal-confirmar');
    const btnModalCancelar = document.getElementById('modal-cancelar');
    const btnFecharAlerta = document.getElementById('btn-fechar-alerta');
    if (btnModalConfirm) btnModalConfirm.addEventListener('click', confirmarAcao);
    if (btnModalCancelar) btnModalCancelar.addEventListener('click', fecharModal);
    if (btnFecharAlerta) btnFecharAlerta.addEventListener('click', fecharAlerta);

    // ⭐ Liga o botão "Adicionar item" para redirecionar ao cardápio em modo edição
    const btnAddItem = document.getElementById('btn-adicionar-item');
    if (btnAddItem) {
      btnAddItem.addEventListener('click', () => {
        const role = (usuarioLogado.role || '').toLowerCase();
        if (role !== 'garcom' && role !== 'admin') {
          mostrarAlerta('Você não tem permissão para adicionar itens.');
          return;
        }
        if (!pedido?.id) {
          mostrarAlerta('Pedido não encontrado.');
          return;
        }
        localStorage.setItem('editingPedidoId', String(pedido.id)); // base: id do pedido
        window.location.href = 'index.html';
      });
    }
});

async function carregarPedido() {
    const salvo = localStorage.getItem('pedidoSelecionado');
    if (!salvo) {
        window.location.href = 'pedidos.html';
        return;
    }

    try {
        pedido = JSON.parse(salvo);
    } catch (e) {
        window.location.href = 'pedidos.html';
        return;
    }

    if (!pedido || !pedido.id) {
        window.location.href = 'pedidos.html';
        return;
    }

    if (!Array.isArray(pedido.itens) || pedido.itens.length === 0) {
        await atualizarPedidoDoServidor(pedido.id);
    }

    if (!pedido.valorTotal) {
        if (typeof pedido.valor === 'string') {
            pedido.valorTotal = pedido.valor;
        } else {
            const total = (pedido.itens || []).reduce((s, it) => s + Number(it.precoTotal || 0), 0);
            pedido.valorTotal = formatCurrency(total);
        }
    }
}

async function atualizarPedidoDoServidor(pedidoId) {
    const apiBase = getNormalizedApiBase();
    const token = getToken();
    if (!token) return;

    const urls = [
        `${apiBase}/sistema/pedidos/${pedidoId}`,
        `${apiBase}/pedidos/${pedidoId}`
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) continue;
            const data = await res.json();

            const p = data.pedido || data;
            const itens = data.itens || data.items || [];
            pedido = {
                id: p.id_pedido ?? p.id,
                data: p.data_hora ?? p.data ?? new Date().toISOString(),
                status: String(p.status || 'aberto').toLowerCase(),
                valor: formatCurrency(p.valor_total ?? p.total ?? 0),
                valorTotal: formatCurrency(p.valor_total ?? p.total ?? 0),
                itens: itens.map(it => ({
                    id: it.id_pedido_item ?? it.id ?? it.id_item,
                    nome: it.nome_item ?? it.nome ?? it.descricao ?? 'Item',
                    quantidade: it.quantidade ?? it.qtd ?? 1,
                    observacao: it.observacao || '',
                    precoUnitario: Number(it.valor ?? it.preco ?? 0),
                    precoTotal: Number(it.subtotal ?? ((Number(it.valor ?? 0)) * (it.quantidade ?? 1))),
                    status: String(it.status || 'pendente').toLowerCase()
                }))
            };

            salvarPedidoNoLocalStorage();
            break;
        } catch (e) {
            console.warn('Falha ao buscar detalhes do pedido:', e);
        }
    }
}

function renderPedidoHeader() {
    if (!pedido) return;
    
    // ⭐ Atualiza o título do header
    const headerH1 = document.querySelector('.header h1');
    if (headerH1) {
        headerH1.textContent = `#${pedido.id}`;
    }
    
    const elNum = document.getElementById('pedido-numero');
    const elData = document.getElementById('pedido-data');
    const elStatus = document.getElementById('pedido-status');
    const elTotal = document.getElementById('pedido-total');

    if (elNum) elNum.textContent = `#${pedido.id}`;
    if (elData) elData.textContent = pedido.data ? formatarData(pedido.data) : '—';
    if (elStatus) {
        elStatus.textContent = pedido.status ? (pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1).replace('_', ' ')) : '—';
        elStatus.className = `info-value status-pedido ${pedido.status.replace('_', '-')}`;
    }
    if (elTotal) elTotal.textContent = pedido.valorTotal || pedido.valor || '—';
}

function configurarPermissoes() {
    const role = (usuarioLogado.role || '').toLowerCase();
    const btnTroco = document.getElementById('btn-calcular-troco');
    const btnAddItem = document.getElementById('btn-adicionar-item');
    const btnCancelar = document.getElementById('btn-cancelar-pedido');

    if (btnTroco) {
        btnTroco.disabled = true;
        btnTroco.style.display = 'none';
    }
    if (btnAddItem) {
        btnAddItem.disabled = true;
        btnAddItem.style.display = 'none';
    }
    if (btnCancelar) {
        btnCancelar.disabled = true;
        btnCancelar.style.display = 'none';
    }

    // ⭐ Libera troco quando o pedido estiver "entregue"
    const pedidoEntregue = pedido?.status === 'entregue';

    switch (role) {
        case 'admin':
            if (btnAddItem) {
                btnAddItem.disabled = false;
                btnAddItem.style.display = 'block';
            }
            if (btnCancelar) {
                btnCancelar.disabled = false;
                btnCancelar.style.display = 'block';
            }
            if (btnTroco && pedidoEntregue) {
                btnTroco.disabled = false;
                btnTroco.style.display = 'block';
            }
            break;

        case 'garcom':
            if (btnAddItem) {
                btnAddItem.disabled = false;
                btnAddItem.style.display = 'block';
            }
            if (btnCancelar) {
                btnCancelar.disabled = false;
                btnCancelar.style.display = 'block';
            }
            break;

        case 'caixa':
            if (btnTroco && pedidoEntregue) {
                btnTroco.disabled = false;
                btnTroco.style.display = 'block';
            }
            break;
    }
}

function carregarItens() {
    const container = document.getElementById('itens-container');
    if (!container) return;

    container.innerHTML = '';
    if (!pedido || !Array.isArray(pedido.itens)) return;

    const role = (usuarioLogado.role || '').toLowerCase();
    const podeAlterarStatus = (role === 'cozinha' || role === 'admin');
    const mostrarIconeStatus = (role === 'cozinha' || role === 'admin'); // ⭐ só cozinha e admin veem os ícones

    pedido.itens.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        itemElement.dataset.itemId = item.id;

        const isPronto = item.status === 'pronto';
        const statusIcon = isPronto ? '✓' : '⏰';
        const statusClass = isPronto ? 'status-pronto-icon' : 'status-pendente-icon';

        const precoUnit = Number(item.precoUnitario ?? 0);
        const precoTotal = Number(item.precoTotal ?? (precoUnit * (item.quantidade ?? 1)));

        // ⭐ Monta o HTML do ícone de status apenas se permitido
        const statusHTML = mostrarIconeStatus ? `
            <div class="item-status ${statusClass}" data-item-id="${item.id}"
                 title="${isPronto ? 'Pronto' : 'Pendente'}"
                 style="cursor: ${podeAlterarStatus && !isPronto ? 'pointer' : 'default'};">
                ${statusIcon}
            </div>
        ` : '';

        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-nome">${item.nome}</div>
                <div class="item-detalhes">${item.quantidade} x ${formatCurrency(precoUnit)} = ${formatCurrency(precoTotal)}</div>
                ${item.observacao ? `<div class="item-observacao">Obs: ${item.observacao}</div>` : ''}
            </div>
            <div class="item-valor">${formatCurrency(precoTotal)}</div>
            ${statusHTML}
        `;

        // ⭐ Adiciona listener apenas se mostrar ícone e puder alterar
        if (mostrarIconeStatus) {
            const statusEl = itemElement.querySelector('.item-status');
            if (statusEl && podeAlterarStatus && !isPronto) {
                statusEl.addEventListener('click', () => selecionarItem(item.id));
            }
        }

        container.appendChild(itemElement);
    });
}

function selecionarItem(itemId) {
    const role = (usuarioLogado.role || '').toLowerCase();
    if (role !== 'cozinha' && role !== 'admin') return;

    itemSelecionado = pedido.itens.find(it => String(it.id) === String(itemId));
    if (!itemSelecionado || itemSelecionado.status === 'pronto') return; // ⭐ mudou

    const modal = document.getElementById('modal-confirmacao');
    const t = document.getElementById('modal-titulo');
    const m = document.getElementById('modal-mensagem');
    const i = document.getElementById('modal-item-info');

    if (t) t.textContent = 'Confirmar';
    if (m) m.textContent = 'Deseja marcar este item como pronto?';
    if (i) i.textContent = `${itemSelecionado.quantidade}x ${itemSelecionado.nome} — ${formatCurrency(itemSelecionado.precoTotal)}`;

    if (modal) modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modal-confirmacao');
    if (modal) modal.style.display = 'none';
    itemSelecionado = null;
}

// ⭐ ATUALIZA STATUS DO ITEM NO FRONTEND E STATUS DO PEDIDO NO BACKEND
async function confirmarAcao() {
    if (!itemSelecionado) return;

    const idx = pedido.itens.findIndex(it => String(it.id) === String(itemSelecionado.id));
    if (idx !== -1) {
        pedido.itens[idx].status = 'pronto'; // ⭐ mudou
    }

    const todosProntos = (pedido.itens || []).every(it => it.status === 'pronto');
    if (todosProntos) {
        await atualizarStatusPedidoNoBackend('entregue'); // ⭐ envia "entregue" ao backend
    }

    salvarPedidoNoLocalStorage();
    fecharModal();
    carregarItens();
    configurarPermissoes();
}

// ⭐ ATUALIZA STATUS DO PEDIDO NO BACKEND
async function atualizarStatusPedidoNoBackend(novoStatus) {
    const apiBase = getNormalizedApiBase();
    const token = getToken();
    if (!token || !pedido?.id) return false;

    const urls = [
        `${apiBase}/sistema/pedidos/${pedido.id}/status`,
        `${apiBase}/pedidos/${pedido.id}/status`
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: novoStatus })
            });
            if (res.ok) {
                pedido.status = novoStatus;
                const elStatus = document.getElementById('pedido-status');
                if (elStatus) {
                    const displayText = novoStatus === 'em_preparo' ? 'Em Preparo' :
                                       novoStatus === 'entregue' ? 'Entregue' :
                                       novoStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                    elStatus.textContent = displayText;
                    elStatus.className = `info-value status-pedido ${novoStatus.replace('_', '-')}`;
                }
                salvarPedidoNoLocalStorage();
                return true;
            }
        } catch (_) {}
    }
    return false;
}

// ========== AÇÕES DOS BOTÕES ==========

function calcularTroco() {
    const role = (usuarioLogado.role || '').toLowerCase();
    
    if (role !== 'caixa' && role !== 'admin') {
        mostrarAlerta('Você não tem permissão para calcular o troco.');
        return;
    }
    
    // ⭐ Só libera troco quando pedido estiver "entregue"
    if (pedido?.status !== 'entregue') {
        mostrarAlerta('Aguarde o pedido ser entregue antes de calcular o troco.');
        return;
    }
    
    salvarPedidoNoLocalStorage();
    window.location.href = 'troco.html';
}

function adicionarItem() {
    const role = (usuarioLogado.role || '').toLowerCase();
    
    if (role !== 'garcom' && role !== 'admin') {
        mostrarAlerta('Você não tem permissão para adicionar itens.');
        return;
    }
    
    window.location.href = 'index.html';
}

async function cancelarPedido() {
    const role = (usuarioLogado.role || '').toLowerCase();
    
    if (role !== 'garcom' && role !== 'admin') {
        mostrarAlerta('Você não tem permissão para cancelar pedidos.');
        return;
    }
    
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
        return;
    }
    
    await atualizarStatusPedidoNoBackend('cancelado');
    alert('Pedido cancelado com sucesso.');
    window.location.href = 'pedidos.html';
}

// ========== MODALS E ALERTAS ==========

function mostrarAlerta(mensagem) {
    const modal = document.getElementById('modal-alerta');
    const msg = document.getElementById('alerta-mensagem');
    
    if (msg) msg.textContent = mensagem;
    if (modal) modal.style.display = 'flex';
}

function fecharAlerta() {
    const modal = document.getElementById('modal-alerta');
    if (modal) modal.style.display = 'none';
}

// ========== PERSISTÊNCIA ==========

function salvarPedidoNoLocalStorage() {
    try {
        localStorage.setItem('pedidoSelecionado', JSON.stringify(pedido));
    } catch (e) {
        console.warn('Erro ao salvar pedido no localStorage:', e);
    }
}