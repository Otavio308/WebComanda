// Tela de pedidos — carrega do backend em vez de usar mocks

// Helper: normaliza AppConfig.API_BASE_URL removendo sufixos indesejados (ex: /auth)
function getNormalizedApiBase() {
    const raw = (window.AppConfig && AppConfig.API_BASE_URL) ? AppConfig.API_BASE_URL : 'http://localhost:3001';
    return raw.replace(/\/auth(?:\/.*)?$/i, '').replace(/\/+$/, '');
}

function getStatusClass(status) {
    const statusMap = {
        'pendente': 'status-pendente',
        'pronto': 'status-pronto'
    };
    return statusMap[status] || 'status-pendente';
}

function formatarData(dataString) {
    const data = new Date(dataString);
    if (isNaN(data)) return dataString || '';
    return data.toLocaleString('pt-BR');
}

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

function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.setAttribute('data-pedido-id', pedido.id);
    
    card.innerHTML = `
        <div class="pedido-header">
            <span class="pedido-id">#${pedido.id}</span>
            <span class="pedido-data">${formatarData(pedido.data)}</span>
        </div>
        <div class="pedido-info">
            <span class="pedido-valor">${pedido.valor}</span>
            <span class="pedido-status ${getStatusClass(pedido.status)}">
                ${pedido.status ? (pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)) : ''}
            </span>
        </div>
        ${criarHTMLItens(pedido.itens)}
    `;
    
    return card;
}

function adicionarEventListeners() {
    const cards = document.querySelectorAll('.pedido-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const pedidoId = this.getAttribute('data-pedido-id');
            abrirResumoPedido(pedidoId);
        });
    });
}

function abrirResumoPedido(pedidoId) {
    // Recupera lista atual exibida e encontra o pedido
    const container = document.querySelector('.pedidos-container');
    const card = container.querySelector(`.pedido-card[data-pedido-id="${pedidoId}"]`);
    if (!card) return;

    // Monta objeto para resumo a partir do DOM (evita re-fetch); caso precise, pode buscar endpoint /pedidos/:id
    const pedido = {
        id: pedidoId,
        data: card.querySelector('.pedido-data')?.textContent || '',
        valor: card.querySelector('.pedido-valor')?.textContent || '',
        status: card.querySelector('.pedido-status')?.textContent.toLowerCase() || '',
        itens: []
    };

    const itensEls = card.querySelectorAll('.item-tag');
    itensEls.forEach(el => {
        const quantidade = el.querySelector('.item-quantidade')?.textContent.replace('x','')?.trim() || '1';
        const nome = el.childNodes && el.childNodes.length > 1 ? el.childNodes[1].textContent.trim() : el.textContent.trim();
        const status = el.querySelector('.item-status')?.classList.contains('item-pronto') ? 'pronto' : 'pendente';
        pedido.itens.push({
            nome: nome,
            quantidade: parseInt(quantidade, 10) || 1,
            status
        });
    });

    localStorage.setItem('pedidoSelecionado', JSON.stringify(pedido));
    window.location.href = 'resumoPedidos.html';
}

// Mapeia status do front -> valor aceito no DB (sem alterar backend)
function mapFrontStatusToDb(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'em_preparo') return 'em preparo';
  if (s === 'pronto')      return 'finalizado';
  return s; // aberto, cancelado, etc.
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

async function patchPedidoStatus(pedidoId, frontStatus) {
  const apiBase = getNormalizedApiBase();
  const token = getToken();
  if (!token) return false;

  const statusDb = mapFrontStatusToDb(frontStatus);
  const urls = [
    `${apiBase}/sistema/pedidos/${pedidoId}/status`,
    `${apiBase}/pedidos/${pedidoId}/status`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusDb })
      });
      if (res.ok) return true;
    } catch (_) {}
  }
  return false;
}

// Ao abrir um pedido pela Cozinha/Admin, coloca em preparo no backend antes de redirecionar
document.addEventListener('click', async (e) => {
  const card = e.target.closest('[data-pedido-id]');
  if (!card) return;

  const role = getUserRole();
  const pedidoId = card.getAttribute('data-pedido-id');

  if (role === 'cozinha' || role === 'admin') {
    await patchPedidoStatus(pedidoId, 'em_preparo'); // envia "em preparo" ao backend
  }

  // Recupera lista atual exibida e encontra o pedido
  const container = document.querySelector('.pedidos-container');
  const cardPedido = container.querySelector(`.pedido-card[data-pedido-id="${pedidoId}"]`);
  if (!cardPedido) return;

  // Monta objeto para resumo a partir do DOM (evita re-fetch); caso precise, pode buscar endpoint /pedidos/:id
  const pedido = {
      id: pedidoId,
      data: cardPedido.querySelector('.pedido-data')?.textContent || '',
      valor: cardPedido.querySelector('.pedido-valor')?.textContent || '',
      status: cardPedido.querySelector('.pedido-status')?.textContent.toLowerCase() || '',
      itens: []
  };

  const itensEls = cardPedido.querySelectorAll('.item-tag');
  itensEls.forEach(el => {
      const quantidade = el.querySelector('.item-quantidade')?.textContent.replace('x','')?.trim() || '1';
      const nome = el.childNodes && el.childNodes.length > 1 ? el.childNodes[1].textContent.trim() : el.textContent.trim();
      const status = el.querySelector('.item-status')?.classList.contains('item-pronto') ? 'pronto' : 'pendente';
      pedido.itens.push({
          nome: nome,
          quantidade: parseInt(quantidade, 10) || 1,
          status
      });
  });

  // Salve o objeto pedidoSelecionado no localStorage aqui, se já não faz
  // localStorage.setItem('pedidoSelecionado', JSON.stringify(pedidoSelecionado));
  window.location.href = 'resumoPedidos.html';
});

async function carregarPedidosDoServidor() {
    const container = document.querySelector('.pedidos-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding:20px;">Carregando pedidos...</p>';

    const apiBase = getNormalizedApiBase();
    const candidateUrls = [
        `${apiBase}/sistema/pedidos`,
        `${apiBase}/pedidos`
    ];

    // token
    const token = (window.AuthService && typeof AuthService.getToken === 'function')
        ? AuthService.getToken()
        : localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = 'Login.html';
        return;
    }

    // helper: extrai itens do objeto pedido suportando várias chaves possíveis
    const extractItems = (p) => {
        const keys = ['itens', 'items', 'itens_pedido', 'itensPedido', 'pedido_itens', 'pedidoItens', 'itens_pedidos', 'rows'];
        let arr = null;
        for (const k of keys) {
            if (Array.isArray(p[k]) && p[k].length > 0) {
                arr = p[k];
                break;
            }
            // algumas APIs retornam objetos com propriedade rows contendo itens
            if (k === 'rows' && Array.isArray(p.rows) && p.rows.length > 0) {
                arr = p.rows;
                break;
            }
        }
        if (!arr) return [];

        return arr.map(it => {
            const nome = it.nome_item ?? it.nome ?? it.name ?? it.descricao ?? it.descricao_item ?? it.item_nome ?? '';
            const quantidade = parseInt(it.quantidade ?? it.qtd ?? it.quant ?? it.qty ?? it.qtd_item ?? 1, 10) || 1;
            const status = (it.status_item ?? it.status ?? it.estado ?? it.estado_item ?? 'pendente').toString().toLowerCase();
            return { nome, quantidade, status };
        });
    };

    let pedidos = null;
    for (const url of candidateUrls) {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                console.warn(`GET ${url} -> ${res.status}`);
                continue;
            }
            const data = await res.json();
            console.log('Resposta bruta de', url, data);

            // espera array; adapta se backend retornar objeto com chave
            let rawPedidos = Array.isArray(data) ? data : (Array.isArray(data.rows) ? data.rows : (Array.isArray(data.pedidos) ? data.pedidos : []));
            // mapeia para formato frontend com extração robusta de itens
            pedidos = rawPedidos.map(p => ({
                id: p.id_pedido ?? p.id ?? p.idPedido ?? String(p.id ?? ''),
                data: p.data_hora ?? p.data ?? p.created_at ?? p.createdAt ?? '',
                valor: (typeof p.valor_total !== 'undefined') ? `R$${Number(p.valor_total).toFixed(2)}` : (p.valor || p.total || ''),
                status: p.status ? p.status.toString().toLowerCase() : (p.estado ?? ''),
                itens: extractItems(p)
            }));

            console.log('Pedidos normalizados:', pedidos);
            break;
        } catch (err) {
            console.error('Erro ao buscar pedidos de', url, err);
        }
    }

    if (!pedidos) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Não foi possível carregar pedidos. Tente novamente mais tarde.</p>';
        return;
    }

    // Limpa e renderiza
    container.innerHTML = '';
    if (pedidos.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum pedido encontrado.</p>';
        return;
    }

    pedidos.forEach(pedido => {
        const card = criarCardPedido(pedido);
        container.appendChild(card);
    });

    adicionarEventListeners();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidosDoServidor();
});