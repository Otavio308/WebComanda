document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const totalDaContaEl = document.getElementById('total-da-conta');
    const valorPagoInput = document.getElementById('valor-pago');
    const calcularButton = document.getElementById('calcular-button');
    const resultadoTrocoEl = document.getElementById('resultado-troco');
    const limparButton = document.getElementById('limpar-button');

    // Recupera o total da comanda do localStorage
    const comanda = JSON.parse(localStorage.getItem('comanda')) || [];
    const totalDaConta = comanda.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Exibe o total da conta formatado
    totalDaContaEl.textContent = `R$ ${totalDaConta.toFixed(2).replace('.', ',')}`;

    // Função para calcular o troco
    const calcularTroco = () => {
        const valorPago = parseFloat(valorPagoInput.value.replace(',', '.')) || 0;
        const troco = valorPago - totalDaConta;

        if (troco >= 0) {
            resultadoTrocoEl.textContent = `R$ ${troco.toFixed(2).replace('.', ',')}`;
            resultadoTrocoEl.style.color = '#3498db'; // Cor do accent
        } else {
            resultadoTrocoEl.textContent = `Faltam R$ ${Math.abs(troco).toFixed(2).replace('.', ',')}`;
            resultadoTrocoEl.style.color = '#e74c3c'; // Cor de erro
        }
    };

    // Função para limpar os campos
    const limparCampos = () => {
        valorPagoInput.value = '';
        resultadoTrocoEl.textContent = '';
        resultadoTrocoEl.style.color = 'inherit';
        valorPagoInput.focus();
    };

    // Adiciona os event listeners
    calcularButton.addEventListener('click', calcularTroco);
    limparButton.addEventListener('click', limparCampos);
    valorPagoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            calcularTroco();
        }
    });

    // Foca no campo de input ao carregar a página
    valorPagoInput.focus();
});