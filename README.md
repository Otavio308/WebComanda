# 🍽️ Sistema de Gestão de Pedidos - Frontend

## 📁 Estrutura do Projeto

**IMPORTANTE:** Mantenha frontend e backend em pastas separadas, mas no mesmo diretório raiz:

```
projeto_gestao_pedidos/
├── frontend/          # Pasta do frontend (esta pasta)
│   ├── css/
│   ├── js/
│   ├── Login.html
│   └── ...
└── backend/           # Pasta do backend (separada)
    ├── src/
    ├── package.json
    └── ...
```

## ⚙️ Configuração Crucial da Porta

### Opção 1: Usar porta 3001 (Recomendado)
No arquivo `.env` do backend, configure:
```env
PORT=3001
```

### Opção 2: Usar porta 3000 (Se preferir)
Se optar pela porta 3000, edite os seguintes arquivos na pasta `js/`:

**1. `js/config.js` e `js/configP.js`:**
```javascript
// Linha 4 - Alterar para:
const API_URL = "http://localhost:3000";
```

**2. `js/pedidos.js`:**
```javascript
// Linha 3 - Alterar para:
const API_URL = 'http://localhost:3000';
```

**3. `js/resumoPedidos.js`:**
```javascript
// Linha 9 - Alterar para:
const API_URL = "http://localhost:3000";
```

**4. `js/script.js`:**
```javascript
// Linha 15 - Alterar para:
const API_URL = "http://localhost:3000";

// Linha 658 - Alterar para:
const API_URL = "http://localhost:3000";
```

**5. `js/troco.js`:**
```javascript
// Linha 160 - Alterar para:
const API_URL = "http://localhost:3000";
```

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado
- Backend configurado e rodando

### Passos para Iniciar:

1. **Inicie o Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   O backend estará rodando em `http://localhost:3001` (ou 3000)

2. **Inicie o Frontend:**
   - Abra o arquivo `Login.html` em um navegador web
   - Ou use um servidor local:
   ```bash
   cd frontend
   # Se tiver Python:
   python -m http.server 8000
   # Ou com Node.js:
   npx http-server
   ```

3. **Acesse o Sistema:**
   - Abra: `http://localhost:8000/Login.html` (ou a porta do servidor local)

## 🔐 Fluxo de Login e Redirecionamento

1. **Página Inicial:** `Login.html`
2. **Credenciais de Teste:**
   - **Garçom:** usuário/senha específicos → Redireciona para interface de pedidos
   - **Cozinha:** usuário/senha específicos → Redireciona para visão da cozinha
   - **Caixa:** usuário/senha específicos → Redireciona para interface do caixa

3. **Redirecionamento Automático:** Baseado na role do usuário após login bem-sucedido

## 🛠️ Solução de Problemas

**Erro de Conexão:**
- Verifique se o backend está rodando
- Confirme a porta no `.env` e nos arquivos JavaScript
- Verifique o console do navegador para erros de CORS

**Problemas de Login:**
- Confirme se o backend tem os usuários de teste cadastrados
- Verifique o console para mensagens de erro específicas

## 📞 Suporte

Em caso de problemas:
1. Verifique se ambas as pastas (frontend/backend) estão no mesmo nível
2. Confirme a configuração da porta em todos os arquivos mencionados
3. Certifique-se de que o backend está respondendo na porta correta

---

**⚠️ Lembre-se:** Sempre inicie pelo `Login.html` e mantenha frontend e backend em pastas separadas!