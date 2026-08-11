// App State
let expensesList = [];
let kpiData = {};
let categoryChart = null;
let projectionChart = null;

// Calendar State
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth() + 1; // 1-12
let currentViewMode = 'list';

// DOM Elements
const kpiProrated = document.getElementById('kpiProrated');
const kpiSinkingFund = document.getElementById('kpiSinkingFund');
const kpiMonthly = document.getElementById('kpiMonthly');
const kpiYearly = document.getElementById('kpiYearly');
const kpiPending = document.getElementById('kpiPending');
const kpiPendingDetail = document.getElementById('kpiPendingDetail');
const kpiStatusCard = document.getElementById('kpiStatusCard');

const alertsList = document.getElementById('alertsList');
const alertsCountBadge = document.getElementById('alertsCountBadge');
const sinkingFundsList = document.getElementById('sinkingFundsList');
const expensesTableBody = document.getElementById('expensesTableBody');

const searchInput = document.getElementById('expenseSearch');
const filterFrequency = document.getElementById('filterFrequency');
const filterStatus = document.getElementById('filterStatus');

const expenseModal = document.getElementById('expenseModal');
const expenseForm = document.getElementById('expenseForm');
const modalTitle = document.getElementById('modalTitle');
const expId = document.getElementById('expenseId');
const expName = document.getElementById('expName');
const expAmount = document.getElementById('expAmount');
const expCategory = document.getElementById('expCategory');
const expFrequency = document.getElementById('expFrequency');
const expDueDay = document.getElementById('expDueDay');
const expDueMonth = document.getElementById('expDueMonth');
const dueMonthGroup = document.getElementById('dueMonthGroup');
const expActive = document.getElementById('expActive');
const expVariable = document.getElementById('expVariable');

const btnAddExpense = document.getElementById('btnAddExpense');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnCancelModalForm = document.getElementById('btnCancelModalForm');
const btnSendEmailAlerts = document.getElementById('btnSendEmailAlerts');

// Payment Confirmation Modal Elements
const payConfirmModal = document.getElementById('payConfirmModal');
const payConfirmForm = document.getElementById('payConfirmForm');
const payConfirmExpenseId = document.getElementById('payConfirmExpenseId');
const payConfirmName = document.getElementById('payConfirmName');
const payConfirmPeriod = document.getElementById('payConfirmPeriod');
const payConfirmDefaultAmount = document.getElementById('payConfirmDefaultAmount');
const payActualAmount = document.getElementById('payActualAmount');
const payInvoiceFile = document.getElementById('payInvoiceFile');
const variableHint = document.getElementById('variableHint');
const variableHintVal = document.getElementById('variableHintVal');
const btnCancelPayModal = document.getElementById('btnCancelPayModal');
const btnCancelPayModalForm = document.getElementById('btnCancelPayModalForm');

// Price History Modal Elements
const priceHistoryModal = document.getElementById('priceHistoryModal');
const btnCancelHistoryModal = document.getElementById('btnCancelHistoryModal');

// Calendar View Elements
const mainDashboardLayout = document.getElementById('mainDashboardLayout');
const calendarViewContainer = document.getElementById('calendarViewContainer');
const calMonthTitle = document.getElementById('calMonthTitle');
const calendarGrid = document.getElementById('calendarGrid');
const calPrevMonth = document.getElementById('calPrevMonth');
const calNextMonth = document.getElementById('calNextMonth');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js')
            .then(() => console.log('PWA Service Worker zarejestrowany.'))
            .catch(err => console.error('Błąd rejestracji SW:', err));
    }

    fetchData();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Modal controls
    btnAddExpense.addEventListener('click', () => openModal());
    btnCancelModal.addEventListener('click', closeModal);
    btnCancelModalForm.addEventListener('click', closeModal);
    
    if (btnCancelHistoryModal) {
        btnCancelHistoryModal.addEventListener('click', () => priceHistoryModal.classList.remove('open'));
    }

    if (btnSendEmailAlerts) {
        btnSendEmailAlerts.addEventListener('click', handleSendEmailAlerts);
    }
    
    // Toggle due month field based on frequency
    expFrequency.addEventListener('change', (e) => {
        if (['yearly', 'quarterly', 'semi_annual'].includes(e.target.value)) {
            dueMonthGroup.style.display = 'block';
            expDueMonth.setAttribute('required', 'true');
        } else {
            dueMonthGroup.style.display = 'none';
            expDueMonth.removeAttribute('required');
        }
    });

    // Form submit
    expenseForm.addEventListener('submit', handleFormSubmit);

    // Search and Filters
    searchInput.addEventListener('input', renderTable);
    filterFrequency.addEventListener('change', renderTable);
    filterStatus.addEventListener('change', renderTable);

    // Payment confirmation modal controls
    btnCancelPayModal.addEventListener('click', closePayModal);
    btnCancelPayModalForm.addEventListener('click', closePayModal);
    payConfirmForm.addEventListener('submit', handlePayConfirmSubmit);

    // Calendar month navigation
    if (calPrevMonth) calPrevMonth.addEventListener('click', () => changeCalMonth(-1));
    if (calNextMonth) calNextMonth.addEventListener('click', () => changeCalMonth(1));
}

// Fetch stats and expense list
async function fetchData() {
    try {
        const response = await fetch('/api/expenses');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        
        expensesList = data.expenses;
        kpiData = data.kpis;
        
        updateKPIs(data.kpis);
        renderAlerts(data.notifications);
        renderSinkingFunds(data.sinking_fund_items);
        renderTable();
        renderCalendarView();
        updateCharts(data.doughnut_chart, data.projection_chart);
        
        await fetchPaymentHistory();
    } catch (err) {
        console.error('Fetch error:', err);
        showErrorToast('Nie udało się załadować danych z bazy PocketBase.');
    }
}

// Switch between List and Calendar views
function switchDashboardView(mode) {
    currentViewMode = mode;
    const tabList = document.getElementById('tabListView');
    const tabCal = document.getElementById('tabCalendarView');

    if (mode === 'calendar') {
        mainDashboardLayout.style.display = 'none';
        calendarViewContainer.style.display = 'block';
        tabCal.className = 'btn btn-primary';
        tabList.className = 'btn btn-secondary';
        renderCalendarView();
    } else {
        mainDashboardLayout.style.display = 'grid';
        calendarViewContainer.style.display = 'none';
        tabList.className = 'btn btn-primary';
        tabCal.className = 'btn btn-secondary';
    }
}

// Render Calendar View Grid
function renderCalendarView() {
    if (!calendarGrid) return;

    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    calMonthTitle.textContent = `${monthNames[calCurrentMonth - 1]} ${calCurrentYear}`;

    // Calculate days in month & starting day of week (Monday=0)
    const firstDay = new Date(calCurrentYear, calCurrentMonth - 1, 1);
    let startDayOfWeek = firstDay.getDay() - 1; // 0=Mon, 6=Sun
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

    const daysInMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

    let gridHtml = '';

    // Empty offset slots
    for (let i = 0; i < startDayOfWeek; i++) {
        gridHtml += `<div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); min-height: 85px; border-radius: 6px;"></div>`;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (new Date().getFullYear() === calCurrentYear && new Date().getMonth() + 1 === calCurrentMonth && new Date().getDate() === day);
        const dayClass = isToday ? 'border: 1px solid #6366f1; background: rgba(99, 102, 241, 0.08);' : 'border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);';

        // Find active expenses due on this day in this month
        const dayExpenses = expensesList.filter(exp => {
            if (!exp.active) return false;
            if (exp.due_day !== day) return false;
            
            // Frequency match for current month
            if (exp.frequency === 'monthly' || exp.frequency === 'biweekly') return true;
            if (exp.frequency === 'yearly' && exp.due_month === calCurrentMonth) return true;
            if (exp.frequency === 'quarterly') {
                const sm = exp.due_month || 1;
                return (calCurrentMonth - sm) % 3 === 0;
            }
            if (exp.frequency === 'semi_annual') {
                const sm = exp.due_month || 1;
                return (calCurrentMonth - sm) % 6 === 0;
            }
            return false;
        });

        let eventsHtml = dayExpenses.map(exp => `
            <div onclick="payExpense('${exp.id}')" title="${exp.name} - ${formatCurrency(exp.amount)}" style="cursor: pointer; margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${getCalendarBadgeStyle(exp.status)}">
                ${exp.name}: ${formatCurrency(exp.amount)}
            </div>
        `).join('');

        gridHtml += `
            <div style="${dayClass} min-height: 85px; padding: 6px; border-radius: 6px; display: flex; flex-direction: column;">
                <span style="font-weight: 700; font-size: 0.85rem; color: ${isToday ? '#6366f1' : 'var(--text-secondary)'};">${day}</span>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                    ${eventsHtml}
                </div>
            </div>
        `;
    }

    calendarGrid.innerHTML = gridHtml;
}

function changeCalMonth(delta) {
    calCurrentMonth += delta;
    if (calCurrentMonth > 12) {
        calCurrentMonth = 1;
        calCurrentYear += 1;
    } else if (calCurrentMonth < 1) {
        calCurrentMonth = 12;
        calCurrentYear -= 1;
    }
    renderCalendarView();
}

function getCalendarBadgeStyle(status) {
    switch (status) {
        case 'overdue': return 'background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);';
        case 'due_soon': return 'background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);';
        case 'paid': return 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';
        default: return 'background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3);';
    }
}

// Update KPI Header Cards
function updateKPIs(kpis) {
    kpiProrated.textContent = formatCurrency(kpis.pro_rated_monthly);
    if (kpiSinkingFund) kpiSinkingFund.textContent = formatCurrency(kpis.sinking_fund_total || 0);
    kpiMonthly.textContent = formatCurrency(kpis.monthly_total);
    kpiYearly.textContent = formatCurrency(kpis.yearly_total);
    
    const pendingCount = kpis.overdue_count + kpis.due_soon_count;
    kpiPending.textContent = pendingCount;
    kpiPendingDetail.textContent = `${kpis.overdue_count} Po terminie | ${kpis.due_soon_count} Wkrótce`;
    
    kpiStatusCard.className = 'kpi-card status-kpi';
    if (kpis.overdue_count > 0) {
        kpiStatusCard.classList.add('urgent');
    } else if (kpis.due_soon_count > 0) {
        kpiStatusCard.classList.add('warning-alert');
    }
}

// Render Notifications / Alerts Panel
function renderAlerts(notifications) {
    alertsCountBadge.textContent = `${notifications.length} ${getAlertNoun(notifications.length)}`;
    
    if (notifications.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-alerts">
                <i class="fa-solid fa-circle-check"></i>
                <p>Wszystko opłacone! Brak zaległych płatności.</p>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = notifications.map((alert, index) => `
        <div class="alert-item alert-${alert.status} fade-in-alert" style="animation-delay: ${index * 0.05}s">
            <div class="alert-info">
                <span class="alert-title">${alert.name}</span>
                <span class="alert-desc">${alert.message} (Termin: ${formatDateStr(alert.due_date_str)})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="alert-amt">${formatCurrency(alert.amount)}</span>
                <button class="btn-sm-action pay-btn" onclick="payExpense('${alert.id}')" title="Oznacz jako opłacone">
                    <i class="fa-solid fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Render Sinking Funds breakdown
function renderSinkingFunds(sinkingItems) {
    if (!sinkingFundsList) return;
    if (!sinkingItems || sinkingItems.length === 0) {
        sinkingFundsList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">Brak opłat rzadkich (kwartalnych/rocznych) do planowania rezerwy.</p>`;
        return;
    }

    sinkingFundsList.innerHTML = sinkingItems.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; font-size: 0.88rem;">
            <div>
                <span style="font-weight: 600; color: var(--text-primary);">${item.name}</span>
                <span style="font-size: 0.78rem; color: var(--text-secondary); margin-left: 6px;">(${getFrequencyTranslation(item.frequency)})</span>
            </div>
            <div style="text-align: right;">
                <span style="font-weight: 700; color: #8b5cf6;">${formatCurrency(item.monthly_reserve)} / mc</span>
            </div>
        </div>
    `).join('');
}

// Filter and Render Table Rows
function renderTable() {
    const searchVal = searchInput.value.toLowerCase();
    const freqVal = filterFrequency.value;
    const statusVal = filterStatus.value;
    
    const filtered = expensesList.filter(exp => {
        const matchesSearch = exp.name.toLowerCase().includes(searchVal) || exp.category.toLowerCase().includes(searchVal);
        const matchesFreq = freqVal === 'all' || exp.frequency === freqVal;
        const matchesStatus = statusVal === 'all' || exp.status === statusVal;
        return matchesSearch && matchesFreq && matchesStatus;
    });
    
    if (filtered.length === 0) {
        expensesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    Brak wydatków spełniających wybrane kryteria.
                </td>
            </tr>
        `;
        return;
    }
    
    expensesTableBody.innerHTML = filtered.map(exp => {
        const rowClass = exp.active ? '' : 'row-inactive';
        const statusText = getStatusTranslation(exp.status);
        const cycleText = (exp.frequency === 'monthly' || exp.frequency === 'biweekly')
            ? `Dzień ${exp.due_day}` 
            : `${exp.due_day} ${getMonthName(exp.due_month)}`;
            
        return `
            <tr class="${rowClass}">
                <td>
                    <div class="exp-cell-name">
                        ${exp.name}
                        ${exp.is_variable ? '<span class="status-tag" style="background: rgba(139,92,246,0.15); color: #8b5cf6; margin-left: 6px; font-size: 0.7rem;">Zmienny</span>' : ''}
                    </div>
                </td>
                <td>
                    <span class="exp-cell-amount">${formatCurrency(exp.amount)}</span>
                </td>
                <td>
                    <span>${getFrequencyTranslation(exp.frequency)}</span>
                </td>
                <td>
                    <span class="exp-cell-cycle">${cycleText}</span>
                </td>
                <td>
                    <span class="exp-cell-category">${exp.category}</span>
                </td>
                <td>
                    <span class="status-badge status-${exp.status}">
                        <i class="${getStatusIcon(exp.status)}"></i> ${statusText}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        ${exp.active && exp.status !== 'paid' ? `
                            <button class="btn-sm-action pay-btn" onclick="payExpense('${exp.id}')" title="Oznacz jako opłacone">
                                <i class="fa-solid fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-sm-action" onclick="viewPriceHistory('${exp.id}')" title="Historia cen i inflacja" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">
                            <i class="fa-solid fa-chart-line"></i>
                        </button>
                        <button class="btn-sm-action edit-btn" onclick="editExpense('${exp.id}')" title="Edytuj wydatek">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-sm-action delete-btn" onclick="deleteExpense('${exp.id}')" title="Usuń wydatek">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Price History Modal view
async function viewPriceHistory(id) {
    const expense = expensesList.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('historyExpenseName').textContent = expense.name;
    const historyTableBody = document.getElementById('historyTableBody');
    const historyPriceChange = document.getElementById('historyPriceChange');

    historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-muted);">Ładowanie historii...</td></tr>`;
    priceHistoryModal.classList.add('open');

    try {
        const response = await fetch(`/api/expenses/${id}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();

        const changePct = data.price_change_pct;
        if (changePct > 0) {
            historyPriceChange.textContent = `+${changePct}% (Wzrost)`;
            historyPriceChange.style.color = '#ef4444';
        } else if (changePct < 0) {
            historyPriceChange.textContent = `${changePct}% (Spadek)`;
            historyPriceChange.style.color = '#10b981';
        } else {
            historyPriceChange.textContent = `0.0% (Bez zmian)`;
            historyPriceChange.style.color = '#94a3b8';
        }

        if (data.history.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-muted);">Brak opłaconych historii dla tego wydatku.</td></tr>`;
            return;
        }

        historyTableBody.innerHTML = data.history.map(row => `
            <tr>
                <td>${formatDateStr(row.date_paid)}</td>
                <td><span style="font-weight: 500;">${formatPeriod(row.period)}</span></td>
                <td><span style="font-weight: 700; color: #10B981;">${formatCurrency(row.amount_paid)}</span></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('History fetch error:', err);
        showErrorToast('Nie udało się pobrać historii ceny.');
    }
}

// Chart.js Visualizations
function updateCharts(doughnutData, barData) {
    const ctxDoughnut = document.getElementById('categoryDoughnutChart').getContext('2d');
    const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];
    
    if (categoryChart) {
        categoryChart.data.labels = doughnutData.labels;
        categoryChart.data.datasets[0].data = doughnutData.values;
        categoryChart.update();
    } else {
        categoryChart = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: doughnutData.labels,
                datasets: [{
                    data: doughnutData.values,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#F3F4F6', font: { family: 'Plus Jakarta Sans', size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return ` ${context.label}: ${context.raw.toLocaleString('pl-PL')} zł/mc`; }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    const ctxBar = document.getElementById('projectionBarChart').getContext('2d');
    const barLabels = barData.map(d => d.label);
    const barValues = barData.map(d => d.amount);
    
    if (projectionChart) {
        projectionChart.data.labels = barLabels;
        projectionChart.data.datasets[0].data = barValues;
        projectionChart.update();
    } else {
        projectionChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Suma wydatków (zł)',
                    data: barValues,
                    backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    borderColor: '#6366F1',
                    borderWidth: 2,
                    borderRadius: 6,
                    hoverBackgroundColor: '#8B5CF6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return ` Oczekiwane rachunki: ${context.raw.toLocaleString('pl-PL')} zł`; }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { family: 'Plus Jakarta Sans', size: 10 } } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#9CA3AF', font: { family: 'Plus Jakarta Sans', size: 10 } } }
                }
            }
        });
    }
}

// Handlers
async function handleSendEmailAlerts() {
    btnSendEmailAlerts.disabled = true;
    btnSendEmailAlerts.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Wysyłanie...`;
    try {
        const response = await fetch('/api/notifications/send-email', { method: 'POST' });
        const res = await response.json();
        if (res.success) {
            showSuccessToast(res.message);
        } else {
            showErrorToast(res.message);
        }
    } catch (err) {
        console.error('Email alert error:', err);
        showErrorToast('Nie udało się wysłać powiadomienia e-mail (sprawdź SMTP).');
    } finally {
        btnSendEmailAlerts.disabled = false;
        btnSendEmailAlerts.innerHTML = `<i class="fa-solid fa-envelope"></i> Wyślij e-mail`;
    }
}

async function payExpense(id) {
    const expense = expensesList.find(e => e.id === id);
    if (!expense) return;
    
    payConfirmExpenseId.value = id;
    payConfirmName.textContent = expense.name;
    payConfirmDefaultAmount.textContent = formatCurrency(expense.amount);
    payActualAmount.value = expense.amount.toFixed(2);
    if (payInvoiceFile) payInvoiceFile.value = '';
    
    // Check if expense is variable
    if (expense.is_variable && variableHint && variableHintVal) {
        variableHint.style.display = 'block';
        try {
            const hRes = await fetch(`/api/expenses/${id}/history`);
            if (hRes.ok) {
                const hData = await hRes.json();
                if (hData.history.length > 0) {
                    const avg = hData.history.reduce((acc, curr) => acc + curr.amount_paid, 0) / hData.history.length;
                    variableHintVal.textContent = formatCurrency(avg);
                } else {
                    variableHintVal.textContent = formatCurrency(expense.amount);
                }
            }
        } catch (e) {
            variableHintVal.textContent = formatCurrency(expense.amount);
        }
    } else if (variableHint) {
        variableHint.style.display = 'none';
    }

    const nextPeriod = calculateNextPeriod(expense);
    payConfirmPeriod.textContent = formatPeriod(nextPeriod);
    
    payConfirmModal.classList.add('open');
}

async function deleteExpense(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten wydatek cykliczny?')) return;
    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete request failed');
        
        fetchData();
        showSuccessToast('Wydatek został usunięty z bazy.');
    } catch (err) {
        console.error('Delete error:', err);
        showErrorToast('Nie udało się usunąć wydatku.');
    }
}

function editExpense(id) {
    const expense = expensesList.find(e => e.id === id);
    if (!expense) return;
    openModal(expense);
}

// Modal Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = expId.value;
    const freq = expFrequency.value;
    const payload = {
        name: expName.value,
        amount: parseFloat(expAmount.value),
        category: expCategory.value,
        frequency: freq,
        due_day: parseInt(expDueDay.value),
        due_month: ['yearly', 'quarterly', 'semi_annual'].includes(freq) ? parseInt(expDueMonth.value) : null,
        active: expActive.checked,
        is_variable: expVariable.checked
    };
    
    const url = id ? `/api/expenses/${id}` : '/api/expenses';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Form submission failed');
        
        closeModal();
        fetchData();
        showSuccessToast(id ? 'Wydatek został zaktualizowany.' : 'Wydatek został utworzony.');
    } catch (err) {
        console.error('Submit error:', err);
        showErrorToast('Nie udało się zapisać wydatku.');
    }
}

// Modal Helpers
function openModal(expense = null) {
    expenseForm.reset();
    
    if (expense) {
        modalTitle.textContent = 'Edytuj Wydatek Cykliczny';
        expId.value = expense.id;
        expName.value = expense.name;
        expAmount.value = expense.amount;
        expCategory.value = expense.category;
        expFrequency.value = expense.frequency;
        expDueDay.value = expense.due_day;
        expActive.checked = expense.active;
        expVariable.checked = !!expense.is_variable;
        
        if (['yearly', 'quarterly', 'semi_annual'].includes(expense.frequency)) {
            dueMonthGroup.style.display = 'block';
            expDueMonth.value = expense.due_month || '1';
            expDueMonth.setAttribute('required', 'true');
        } else {
            dueMonthGroup.style.display = 'none';
            expDueMonth.removeAttribute('required');
        }
    } else {
        modalTitle.textContent = 'Dodaj Wydatek Cykliczny';
        expId.value = '';
        dueMonthGroup.style.display = 'none';
        expDueMonth.removeAttribute('required');
        expActive.checked = true;
        expVariable.checked = false;
    }
    
    expenseModal.classList.add('open');
}

function closeModal() {
    expenseModal.classList.remove('open');
}

// Formatting Helpers
function formatCurrency(val) {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);
}

function formatDateStr(str) {
    if (!str) return '';
    const date = new Date(str + 'T00:00:00');
    return date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthName(m) {
    if (!m) return '';
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    return months[m - 1] || '';
}

function getFrequencyTranslation(freq) {
    switch (freq) {
        case 'monthly': return 'Miesięczny';
        case 'biweekly': return 'Co 2 tygodnie';
        case 'quarterly': return 'Kwartalny';
        case 'semi_annual': return 'Półroczny';
        case 'yearly': return 'Roczny';
        default: return freq;
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'paid': return 'fa-solid fa-circle-check';
        case 'overdue': return 'fa-solid fa-circle-exclamation';
        case 'due_soon': return 'fa-solid fa-clock';
        case 'upcoming': return 'fa-solid fa-calendar';
        default: return 'fa-solid fa-circle-question';
    }
}

function getStatusTranslation(status) {
    switch (status) {
        case 'paid': return 'Opłacone';
        case 'overdue': return 'Zaległe';
        case 'due_soon': return 'Wkrótce termin';
        case 'upcoming': return 'Nadchodzące';
        case 'inactive': return 'Nieaktywne';
        default: return status;
    }
}

function getAlertNoun(count) {
    if (count === 1) return 'alert';
    if (count >= 2 && count <= 4) return 'alerty';
    return 'alertów';
}

function showSuccessToast(message) { showToast(message, 'success'); }
function showErrorToast(message) { showToast(message, 'danger'); }

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '2000';
    toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.fontSize = '0.9rem';
    
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #059669, #10B981)';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    } else {
        toast.style.background = 'linear-gradient(135deg, #DC2626, #EF4444)';
        toast.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
    }
    
    document.body.appendChild(toast);
    
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Payment History Log Helpers
async function fetchPaymentHistory() {
    try {
        const response = await fetch('/api/payments');
        if (!response.ok) throw new Error('Failed to fetch payments');
        const payments = await response.json();
        renderPaymentsTable(payments);
    } catch (err) {
        console.error('Fetch payments error:', err);
    }
}

function renderPaymentsTable(payments) {
    const body = document.getElementById('paymentsTableBody');
    if (!body) return;
    
    if (payments.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                    Brak historii płatności.
                </td>
            </tr>
        `;
        return;
    }
    
    body.innerHTML = payments.map(item => `
        <tr>
            <td><strong>${item.expense_name}</strong></td>
            <td><span class="exp-cell-category">${item.category}</span></td>
            <td><span style="font-weight: 500;">${formatPeriod(item.period)}</span></td>
            <td><span class="exp-cell-amount" style="color: #10B981;">${formatCurrency(item.amount_paid)}</span></td>
            <td><span>${formatDateStr(item.date_paid)}</span></td>
            <td><span style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-solid fa-user" style="font-size: 0.8rem; margin-right: 4px;"></i>${item.paid_by || 'system'}</span></td>
        </tr>
    `).join('');
}

function formatPeriod(p) {
    if (!p) return '';
    if (p.includes('-')) {
        const [year, month] = p.split('-');
        return `${getMonthName(parseInt(month))} ${year}`;
    }
    return p;
}

function calculateNextPeriod(expense) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const lastPaid = expense.last_paid_period || "";
    
    if (expense.frequency === 'monthly') {
        const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        if (!lastPaid || lastPaid < currentPeriod) {
            return currentPeriod;
        } else {
            const [lpYear, lpMonth] = lastPaid.split('-').map(Number);
            let targetMonth = lpMonth + 1;
            let targetYear = lpYear;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear += 1;
            }
            return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        }
    } else {
        const currentPeriod = String(currentYear);
        if (!lastPaid || lastPaid < currentPeriod) {
            return currentPeriod;
        } else {
            return String(Number(lastPaid) + 1);
        }
    }
}

async function handlePayConfirmSubmit(e) {
    e.preventDefault();
    const id = payConfirmExpenseId.value;
    const formData = new FormData(payConfirmForm);
    
    try {
        const response = await fetch(`/api/expenses/${id}/pay`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Payment request failed');
        
        closePayModal();
        fetchData();
        showSuccessToast('Płatność została pomyślnie zarejestrowana.');
    } catch (err) {
        console.error('Payment error:', err);
        showErrorToast('Nie udało się zarejestrować płatności.');
    }
}

function closePayModal() {
    payConfirmModal.classList.remove('open');
}
