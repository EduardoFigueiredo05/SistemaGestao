/**
 * Dashboard Financeiro com Cartões Virtuais e Gráficos
 * Implementação Vanilla JS
 */

// Chaves LocalStorage
const TX_STORAGE = 'appFinancas_transactions';
const CARD_STORAGE = 'appFinancas_cards';

// Estado
let transactions = [];
let cards = [];
let editingTxId = null;

// Instâncias do Chart.js
let cashflowChartInstance = null;
let categoryChartInstance = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadData();
    setupEventListeners();
    renderAll();
});

// Load e Save
const loadData = () => {
    transactions = JSON.parse(localStorage.getItem(TX_STORAGE)) || [];
    cards = JSON.parse(localStorage.getItem(CARD_STORAGE)) || [
        { id: '1', name: 'Cartão Principal', last4: '4321', brand: 'mastercard' } // Default mock
    ];
};

const saveData = () => {
    localStorage.setItem(TX_STORAGE, JSON.stringify(transactions));
    localStorage.setItem(CARD_STORAGE, JSON.stringify(cards));
};

// Utils Formatação
const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const parseCurrency = (str) => parseFloat(str.replace(/\./g, '').replace(',', '.'));
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Renderização Geral
const renderAll = () => {
    updateSummary();
    renderTransactions();
    renderCards();
    updateCardSelects();
    renderCharts();
};

// --- Gestão de Cartões ---
const renderCards = () => {
    const list = document.getElementById('cards-list');
    list.innerHTML = '';
    
    cards.forEach(card => {
        const li = document.createElement('li');
        li.className = 'card-item';
        li.innerHTML = `
            <div class="card-item-info">
                <i data-lucide="credit-card"></i>
                <div class="card-item-details">
                    <strong>${card.name}</strong>
                    <span>**** ${card.last4}</span>
                </div>
            </div>
            <button class="btn btn-icon" onclick="deleteCard('${card.id}')"><i data-lucide="trash-2"></i></button>
        `;
        list.appendChild(li);
    });
    
    // Atualiza o display do cartão principal no resumo
    if(cards.length > 0) {
        document.getElementById('active-card-number').textContent = `**** **** **** ${cards[0].last4}`;
    }
    
    lucide.createIcons();
};

const updateCardSelects = () => {
    const selectForm = document.getElementById('transaction-card');
    const selectFilter = document.getElementById('filter-card');
    
    const optionsHTML = cards.map(c => `<option value="${c.id}">${c.name} (****${c.last4})</option>`).join('');
    
    selectForm.innerHTML = '<option value="">Nenhum / Dinheiro</option>' + optionsHTML;
    selectFilter.innerHTML = '<option value="todos">Todos os Cartões</option>' + optionsHTML;
};

document.getElementById('card-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newCard = {
        id: generateId(),
        name: document.getElementById('card-name').value,
        last4: document.getElementById('card-last4').value,
        brand: document.getElementById('card-brand').value
    };
    cards.push(newCard);
    saveData();
    closeModals();
    renderAll();
});

const deleteCard = (id) => {
    if(confirm('Excluir este cartão?')) {
        cards = cards.filter(c => c.id !== id);
        // Remove vínculo das transações
        transactions = transactions.map(t => t.cardId === id ? {...t, cardId: ''} : t);
        saveData();
        renderAll();
    }
};

// --- Gestão de Transações ---
const renderTransactions = () => {
    const list = document.getElementById('transactions-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filtros
    const typeFilter = document.getElementById('filter-type').value;
    const cardFilter = document.getElementById('filter-card').value;
    const search = document.getElementById('global-search').value.toLowerCase();
    
    let filtered = transactions.filter(t => {
        const matchType = typeFilter === 'todos' || t.type === typeFilter;
        const matchCard = cardFilter === 'todos' || t.cardId === cardFilter;
        const matchSearch = t.description.toLowerCase().includes(search);
        return matchType && matchCard && matchSearch;
    });
    
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = '';
    if(filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.forEach(tx => {
            const cardObj = cards.find(c => c.id === tx.cardId);
            const cardName = cardObj ? cardObj.name : 'Dinheiro';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${tx.description}</strong><br>
                    <small style="color:var(--text-muted)">${tx.category}</small>
                </td>
                <td>${tx.date.split('-').reverse().join('/')}</td>
                <td><span class="badge-card">${cardName}</span></td>
                <td class="tx-amount ${tx.type}">${tx.type === 'despesa' ? '-' : ''}${formatBRL(tx.amount)}</td>
                <td class="action-btns">
                    <button onclick="editTx('${tx.id}')"><i data-lucide="edit-2"></i></button>
                    <button onclick="deleteTx('${tx.id}')"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            list.appendChild(tr);
        });
    }
    lucide.createIcons();
};

document.getElementById('transaction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const tx = {
        id: editingTxId || generateId(),
        description: document.getElementById('description').value,
        amount: parseCurrency(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        cardId: document.getElementById('transaction-card').value
    };
    
    if(editingTxId) {
        const idx = transactions.findIndex(t => t.id === editingTxId);
        transactions[idx] = tx;
    } else {
        transactions.push(tx);
    }
    
    saveData();
    closeModals();
    renderAll();
});

const deleteTx = (id) => {
    if(confirm('Excluir transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderAll();
    }
};

const editTx = (id) => {
    const tx = transactions.find(t => t.id === id);
    if(!tx) return;
    
    editingTxId = id;
    document.getElementById('description').value = tx.description;
    document.getElementById('amount').value = tx.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    document.getElementById('date').value = tx.date;
    document.getElementById('type').value = tx.type;
    document.getElementById('category').value = tx.category;
    document.getElementById('transaction-card').value = tx.cardId || '';
    
    document.getElementById('form-title').innerText = 'Editar Transação';
    document.getElementById('modal-transaction').classList.add('active');
};

const updateSummary = () => {
    const totals = transactions.reduce((acc, curr) => {
        curr.type === 'receita' ? acc.inc += curr.amount : acc.exp += curr.amount;
        return acc;
    }, {inc: 0, exp: 0});
    
    document.getElementById('total-income').innerText = formatBRL(totals.inc);
    document.getElementById('total-expense').innerText = formatBRL(totals.exp);
    document.getElementById('total-balance').innerText = formatBRL(totals.inc - totals.exp);
};

// --- Gráficos (Chart.js) ---
const renderCharts = () => {
    // Preparar dados Fluxo de Caixa (Mensal)
    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if(!monthlyData[month]) monthlyData[month] = { inc: 0, exp: 0 };
        t.type === 'receita' ? monthlyData[month].inc += t.amount : monthlyData[month].exp += t.amount;
    });
    
    const labelsCashflow = Object.keys(monthlyData).sort();
    const dataInc = labelsCashflow.map(m => monthlyData[m].inc);
    const dataExp = labelsCashflow.map(m => monthlyData[m].exp);

    if(cashflowChartInstance) cashflowChartInstance.destroy();
    const ctxCash = document.getElementById('cashflowChart').getContext('2d');
    cashflowChartInstance = new Chart(ctxCash, {
        type: 'bar',
        data: {
            labels: labelsCashflow.map(m => m.split('-').reverse().join('/')),
            datasets: [
                { label: 'Receitas', data: dataInc, backgroundColor: '#c5f0a4', borderRadius: 4 },
                { label: 'Despesas', data: dataExp, backgroundColor: '#103b31', borderRadius: 4 }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Preparar dados Categoria (Despesas)
    const catData = {};
    transactions.filter(t => t.type === 'despesa').forEach(t => {
        catData[t.category] = (catData[t.category] || 0) + t.amount;
    });

    if(categoryChartInstance) categoryChartInstance.destroy();
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['#103b31', '#1b5e4f', '#c5f0a4', '#20c997', '#ff6b6b', '#f6f8fa'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, cutout: '70%' }
    });
};

// --- Controle de Modais e Eventos ---
const openTransactionModal = () => {
    editingTxId = null;
    document.getElementById('transaction-form').reset();
    document.getElementById('form-title').innerText = 'Nova Transação';
    document.getElementById('modal-transaction').classList.add('active');
};

const openCardModal = () => {
    document.getElementById('card-form').reset();
    document.getElementById('modal-card').classList.add('active');
};

const closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
};

const setupEventListeners = () => {
    document.getElementById('filter-type').addEventListener('change', renderTransactions);
    document.getElementById('filter-card').addEventListener('change', renderTransactions);
    document.getElementById('global-search').addEventListener('input', renderTransactions);
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal')) closeModals();
    });
};