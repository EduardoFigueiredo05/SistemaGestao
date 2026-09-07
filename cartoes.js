/**
 * Lógica Dedicada à Página de Cartões
 * Implementa CRUD de cartões, personalização de cor, limite e gráficos dinâmicos.
 */

const TX_STORAGE = 'appFinancas_transactions';
const CARD_STORAGE = 'appFinancas_cards';

let transactions = [];
let cards = [];
let editingCardId = null;
let selectedCardId = null;
let cardChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadData();
    setupColorPicker();
    renderCardsList();
    
    // Seleciona automaticamente o primeiro cartão se existir
    if (cards.length > 0) {
        selectCard(cards[0].id);
    }
});

const loadData = () => {
    transactions = JSON.parse(localStorage.getItem(TX_STORAGE)) || [];
    cards = JSON.parse(localStorage.getItem(CARD_STORAGE)) || [
        { id: '1', name: 'Nubank Principal', last4: '4321', brand: 'mastercard', color: '#8a05be', limit: 5000 },
        { id: '2', name: 'Itaú Compras', last4: '9876', brand: 'visa', color: '#ff6200', limit: 2500 }
    ];
};

const saveData = () => {
    localStorage.setItem(CARD_STORAGE, JSON.stringify(cards));
    // As transações não são modificadas aqui, mas se um cartão for excluído, precisamos desvincular.
    localStorage.setItem(TX_STORAGE, JSON.stringify(transactions));
};

// Utils Formatação
const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const parseCurrency = (str) => parseFloat(str.replace(/\./g, '').replace(',', '.'));
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// --- Renderização Visual dos Cartões ---
const renderCardsList = () => {
    const container = document.getElementById('visual-cards-container');
    container.innerHTML = '';

    cards.forEach(card => {
        const div = document.createElement('div');
        // Define a cor de fundo com base na escolha do usuário
        div.className = `credit-card-ui ${selectedCardId === card.id ? 'selected' : ''}`;
        
        // CORREÇÃO: Recupera a cor do cartão ou usa o verde padrão se não existir
        const cardColor = card.color || '#103b31';
        div.style.background = `linear-gradient(135deg, ${cardColor}, ${adjustColorBrightness(cardColor, -20)})`;
        
        div.onclick = () => selectCard(card.id);

        div.innerHTML = `
            <div class="cc-header">
                <span class="cc-brand">${card.brand}</span>
                <div class="cc-actions">
                    <button onclick="event.stopPropagation(); editCard('${card.id}')" title="Editar"><i data-lucide="edit-2" style="width: 14px;"></i></button>
                    <button onclick="event.stopPropagation(); deleteCard('${card.id}')" title="Excluir"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                </div>
            </div>
            <div class="cc-number">**** **** **** ${card.last4}</div>
            <div class="cc-footer">
                <span>${card.name}</span>
                <span>Limite: ${formatBRL(card.limit || 0)}</span>
            </div>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
};

// Escurece a cor para gerar um degradê automático no cartão
const adjustColorBrightness = (hex, percent) => {
    // CORREÇÃO: Adicionada linha de segurança para evitar erro de 'substring'
    if (!hex) return '#000000';

    let R = parseInt(hex.substring(1,3),16);
    let G = parseInt(hex.substring(3,5),16);
    let B = parseInt(hex.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
};

// --- Painel Analítico do Cartão ---
const selectCard = (id) => {
    selectedCardId = id;
    renderCardsList(); // Atualiza a borda de seleção
    renderAnalytics();
};

const renderAnalytics = () => {
    const emptyState = document.getElementById('analytics-empty');
    const content = document.getElementById('analytics-content');
    const title = document.getElementById('analytics-title');

    if (!selectedCardId) {
        emptyState.classList.remove('hidden');
        content.classList.add('hidden');
        title.innerText = 'Análise do Cartão';
        return;
    }

    const card = cards.find(c => c.id === selectedCardId);
    if(!card) return;

    emptyState.classList.add('hidden');
    content.classList.remove('hidden');
    title.innerText = `Análise: ${card.name}`;

    // Calcula gastos do cartão (apenas despesas vinculadas a ele)
    const cardExpenses = transactions.filter(t => t.cardId === card.id && t.type === 'despesa');
    const totalSpent = cardExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const limit = card.limit || 0;
    const available = Math.max(limit - totalSpent, 0);
    const usagePercent = limit > 0 ? (totalSpent / limit) * 100 : 0;

    // Atualiza Textos
    document.getElementById('limit-available').innerText = formatBRL(available);
    document.getElementById('limit-spent').innerText = formatBRL(totalSpent);
    document.getElementById('limit-total').innerText = formatBRL(limit);

    // Atualiza Barra de Progresso
    const bar = document.getElementById('limit-bar');
    bar.style.width = `${Math.min(usagePercent, 100)}%`;
    bar.className = 'limit-progress-fill'; // reset
    if (usagePercent > 85) bar.classList.add('danger');
    else if (usagePercent > 60) bar.classList.add('warning');

    // Atualiza Gráfico de Categorias
    renderCardChart(cardExpenses);
};

const renderCardChart = (expenses) => {
    const catData = {};
    expenses.forEach(t => {
        catData[t.category] = (catData[t.category] || 0) + t.amount;
    });

    const ctx = document.getElementById('cardExpenseChart').getContext('2d');
    if (cardChartInstance) cardChartInstance.destroy();

    if (Object.keys(catData).length === 0) {
        // Gráfico vazio caso não haja gastos
        cardChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Sem gastos'], datasets: [{ data: [1], backgroundColor: ['#e0e0e0'] }] },
            options: { responsive: true, cutout: '75%', plugins: { tooltip: { enabled: false } } }
        });
        return;
    }

    cardChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['#103b31', '#1b5e4f', '#c5f0a4', '#20c997', '#ff6b6b', '#f6f8fa'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, 
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
};

// --- CRUD de Cartões ---
document.getElementById('card-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const cardData = {
        id: editingCardId || generateId(),
        name: document.getElementById('card-name').value,
        last4: document.getElementById('card-last4').value,
        brand: document.getElementById('card-brand').value,
        limit: parseCurrency(document.getElementById('card-limit').value),
        color: document.getElementById('card-color').value
    };
    
    if(editingCardId) {
        const idx = cards.findIndex(c => c.id === editingCardId);
        cards[idx] = cardData;
    } else {
        cards.push(cardData);
    }
    
    saveData();
    closeModals();
    renderCardsList();
    if(selectedCardId === cardData.id || !editingCardId) {
        selectCard(cardData.id);
    }
});

const editCard = (id) => {
    const card = cards.find(c => c.id === id);
    if(!card) return;
    
    editingCardId = id;
    document.getElementById('card-name').value = card.name;
    document.getElementById('card-last4').value = card.last4;
    document.getElementById('card-brand').value = card.brand;
    document.getElementById('card-limit').value = card.limit ? card.limit.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '';
    document.getElementById('card-color').value = card.color || '#103b31';
    document.getElementById('color-hex-display').innerText = card.color || '#103b31';
    
    document.getElementById('card-modal-title').innerText = 'Editar Cartão Virtual';
    document.getElementById('modal-card').classList.add('active');
};

const deleteCard = (id) => {
    if(confirm('Tem certeza que deseja excluir este cartão? As transações vinculadas a ele ficarão sem cartão.')) {
        cards = cards.filter(c => c.id !== id);
        // Desvincula as transações
        transactions = transactions.map(t => t.cardId === id ? {...t, cardId: ''} : t);
        saveData();
        
        if (selectedCardId === id) {
            selectedCardId = cards.length > 0 ? cards[0].id : null;
        }
        
        renderCardsList();
        renderAnalytics();
    }
};

// --- Utilitários da Interface ---
const setupColorPicker = () => {
    const colorInput = document.getElementById('card-color');
    const hexDisplay = document.getElementById('color-hex-display');
    
    colorInput.addEventListener('input', (e) => {
        hexDisplay.innerText = e.target.value;
    });
};

const openCardModal = () => {
    editingCardId = null;
    document.getElementById('card-form').reset();
    document.getElementById('card-color').value = '#103b31';
    document.getElementById('color-hex-display').innerText = '#103b31';
    document.getElementById('card-modal-title').innerText = 'Novo Cartão Virtual';
    document.getElementById('modal-card').classList.add('active');
};

const closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
};

window.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal')) closeModals();
});