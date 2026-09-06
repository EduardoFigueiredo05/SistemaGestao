/**
 * Lógica Dedicada à Página de Transações
 * Implementa Filtros Avançados, Exportação CSV e Cálculos Dinâmicos
 */

const TX_STORAGE = 'appFinancas_transactions';
const CARD_STORAGE = 'appFinancas_cards';

let transactions = [];
let cards = [];
let editingTxId = null;

// Elementos de Filtro
const filters = {
    search: document.getElementById('filter-search'),
    dateStart: document.getElementById('filter-date-start'),
    dateEnd: document.getElementById('filter-date-end'),
    type: document.getElementById('filter-type'),
    category: document.getElementById('filter-category'),
    card: document.getElementById('filter-card')
};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadData();
    setupEventListeners();
    updateCardSelects();
    renderTransactions();
});

const loadData = () => {
    transactions = JSON.parse(localStorage.getItem(TX_STORAGE)) || [
        { id: generateId(), description: 'Reserva no Bráz Elettrica Pinheiros', amount: 150.75, type: 'despesa', category: 'Alimentação', date: '2025-06-14', cardId: '' },
        { id: generateId(), description: 'Pacote Jalapão', amount: 1850.00, type: 'despesa', category: 'Lazer', date: '2025-10-15', cardId: '' },
        { id: generateId(), description: 'Desenvolvimento Site Instituto', amount: 3500.00, type: 'receita', category: 'Salário', date: '2026-02-10', cardId: '' }
    ];
    cards = JSON.parse(localStorage.getItem(CARD_STORAGE)) || [];
};

const saveData = () => {
    localStorage.setItem(TX_STORAGE, JSON.stringify(transactions));
};

const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const parseCurrency = (str) => parseFloat(str.replace(/\./g, '').replace(',', '.'));
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const updateCardSelects = () => {
    const selectForm = document.getElementById('transaction-card');
    const selectFilter = document.getElementById('filter-card');
    
    const optionsHTML = cards.map(c => `<option value="${c.id}">${c.name} (****${c.last4})</option>`).join('');
    
    selectForm.innerHTML = '<option value="">Nenhum / Dinheiro</option>' + optionsHTML;
    selectFilter.innerHTML = '<option value="todos">Todos</option>' + optionsHTML;
};

// Processa os dados com base em todos os filtros ativos
const getFilteredTransactions = () => {
    const search = filters.search.value.toLowerCase();
    const dateStart = filters.dateStart.value;
    const dateEnd = filters.dateEnd.value;
    const type = filters.type.value;
    const category = filters.category.value;
    const card = filters.card.value;

    return transactions.filter(t => {
        const matchSearch = t.description.toLowerCase().includes(search) || t.amount.toString().includes(search);
        const matchType = type === 'todos' || t.type === type;
        const matchCat = category === 'todas' || t.category === category;
        const matchCard = card === 'todos' || t.cardId === card;
        
        let matchDate = true;
        if (dateStart) matchDate = matchDate && t.date >= dateStart;
        if (dateEnd) matchDate = matchDate && t.date <= dateEnd;

        return matchSearch && matchType && matchCat && matchCard && matchDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const renderTransactions = () => {
    const list = document.getElementById('transactions-list');
    const emptyState = document.getElementById('empty-state');
    
    const filtered = getFilteredTransactions();
    
    list.innerHTML = '';
    if(filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.forEach(tx => {
            const cardObj = cards.find(c => c.id === tx.cardId);
            const cardName = cardObj ? cardObj.name : 'Dinheiro';
            const statusIcon = tx.type === 'receita' ? 'arrow-up-right' : 'arrow-down-right';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="status-badge ${tx.type}">
                        <i data-lucide="${statusIcon}"></i>
                        ${tx.type === 'receita' ? 'Recebido' : 'Pago'}
                    </span>
                </td>
                <td>${tx.date.split('-').reverse().join('/')}</td>
                <td><strong>${tx.description}</strong></td>
                <td>${tx.category}</td>
                <td><span class="badge-card">${cardName}</span></td>
                <td class="tx-amount ${tx.type}">${tx.type === 'despesa' ? '-' : ''}${formatBRL(tx.amount)}</td>
                <td class="action-btns right-align">
                    <button onclick="editTx('${tx.id}')" title="Editar"><i data-lucide="edit-2"></i></button>
                    <button onclick="deleteTx('${tx.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            list.appendChild(tr);
        });
    }
    
    updateDynamicSummary(filtered);
    lucide.createIcons();
};

const updateDynamicSummary = (filteredData) => {
    const totals = filteredData.reduce((acc, curr) => {
        curr.type === 'receita' ? acc.inc += curr.amount : acc.exp += curr.amount;
        return acc;
    }, {inc: 0, exp: 0});
    
    document.getElementById('filtered-income').innerText = formatBRL(totals.inc);
    document.getElementById('filtered-expense').innerText = formatBRL(totals.exp);
    document.getElementById('filtered-balance').innerText = formatBRL(totals.inc - totals.exp);
};

// CRUD
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
    renderTransactions();
});

const deleteTx = (id) => {
    if(confirm('Excluir permanentemente esta transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
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

// Limpar Filtros
const clearFilters = () => {
    Object.values(filters).forEach(input => {
        if(input.tagName === 'SELECT') input.value = input.options[0].value;
        else input.value = '';
    });
    renderTransactions();
};

// Exportar para CSV
const exportToCSV = () => {
    const data = getFilteredTransactions();
    if(data.length === 0) {
        alert("Não há dados para exportar com os filtros atuais.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM para acentuação
    csvContent += "Data;Descrição;Categoria;Tipo;Cartão;Valor\n";

    data.forEach(t => {
        const cardObj = cards.find(c => c.id === t.cardId);
        const cardName = cardObj ? cardObj.name : 'Dinheiro';
        const dateBr = t.date.split('-').reverse().join('/');
        const amountStr = t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        
        csvContent += `${dateBr};"${t.description}";"${t.category}";"${t.type}";"${cardName}";"${amountStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_financas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const openTransactionModal = () => {
    editingTxId = null;
    document.getElementById('transaction-form').reset();
    document.getElementById('form-title').innerText = 'Nova Transação';
    document.getElementById('modal-transaction').classList.add('active');
};

const closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
};

const setupEventListeners = () => {
    // Adiciona evento de 'input' e 'change' para re-renderizar em tempo real
    Object.values(filters).forEach(input => {
        input.addEventListener('input', renderTransactions);
        input.addEventListener('change', renderTransactions);
    });

    window.addEventListener('click', (e) => {
        if(e.target.classList.contains('modal')) closeModals();
    });
};