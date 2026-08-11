// App State
let expensesList = [];
let kpiData = {};
let categoryChart = null;
let projectionChart = null;
let lastChartDoughnutData = null;
let lastChartBarData = null;

// Calendar State
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth() + 1; // 1-12
let currentViewMode = 'list';

// Language State
let activeLang = localStorage.getItem('language') || 'pl';

// Theme State
let activeTheme = localStorage.getItem('theme') || 'dark';

// Translation Dictionary
const translations = {
    pl: {
        tagline: "Rozpiski kosztów utrzymania domu",
        report_pdf: "Raport PDF",
        report_csv: "Raport CSV",
        dev_mode: "Tryb Deweloperski",
        kpi_prorated_title: "Średniomiesięczny Budżet",
        kpi_prorated_subtitle: "Miesięczne + proporcjonalne rzadkie",
        kpi_sinking_fund_title: "Rezerwa Oszczędnościowa",
        kpi_sinking_fund_subtitle: "Miesięcznie na opłaty rzadkie",
        kpi_monthly_title: "Zobowiązania Miesięczne",
        kpi_monthly_subtitle: "Bezpośrednie koszty miesięczne",
        kpi_yearly_title: "Zobowiązania Roczne",
        kpi_yearly_subtitle: "Suma rocznych kosztów stałych",
        kpi_pending_title: "Wymagane Płatności",
        tab_list: "Lista i Wykresy",
        tab_calendar: "Widok Kalendarza",
        cal_title: "Kalendarz Terminów Płatności",
        cal_prev: "Poprzedni",
        cal_next: "Następny",
        alert_title: "Alerty Płatności",
        alert_send_email: "Wyślij e-mail",
        alert_send_email_loading: "Wysyłanie...",
        alert_empty: "Wszystko opłacone! Brak zaległych płatności.",
        sinking_funds_title: "Planowanie Rezerw (Sinking Funds)",
        sinking_funds_subtitle: "Odkładaj co miesiąc na poniższe opłaty rzadkie, aby uniknąć obciążenia budżetu w miesiącu płatności:",
        chart_category_title: "Udział Kategorii (Miesięczny Uśredniony)",
        chart_projection_title: "Prognoza Wydatków (Kolejne 12 Miesięcy)",
        expenses_title: "Wydatki Cykliczne i Stałe",
        btn_add_expense: "Dodaj Wydatek",
        search_placeholder: "Szukaj wydatków...",
        filter_all_frequencies: "Wszystkie cykle",
        filter_monthly: "Miesięczne",
        filter_biweekly: "Co 2 tygodnie",
        filter_quarterly: "Kwartalne",
        filter_semi_annual: "Półroczne",
        filter_yearly: "Roczne",
        filter_all_statuses: "Wszystkie statusy",
        filter_status_overdue: "Zaległe",
        filter_status_due_soon: "Zbliżające się",
        filter_status_paid: "Opłacone",
        filter_status_upcoming: "Nadchodzące",
        th_name: "Nazwa wydatku",
        th_amount: "Kwota",
        th_frequency: "Cykl",
        th_due_date: "Termin",
        th_category: "Kategoria",
        th_status: "Status",
        th_actions: "Akcje",
        history_title: "Historia Płatności",
        th_period: "Okres opłacony",
        th_date_paid: "Data wpłaty",
        th_paid_by: "Opłacił(a)",
        history_empty: "Brak historii płatności.",
        modal_add_title: "Dodaj Wydatek Cykliczny",
        modal_edit_title: "Edytuj Wydatek",
        label_name: "Nazwa wydatku",
        placeholder_name_eg: "np. Rachunek za Prąd, Ubezpieczenie Domu",
        label_amount: "Kwota (zł)",
        label_category: "Kategoria",
        placeholder_category_eg: "np. Media, Przeglądy, Podatki",
        label_frequency: "Częstotliwość",
        label_due_day: "Dzień płatności (1-31)",
        label_due_month: "Miesiąc płatności (lub miesiąc pierwszej opłaty w roku)",
        label_variable: "Rachunek zmienny (np. prąd/gaz według zużycia)",
        label_active: "Aktywny (uwzględniaj w podsumowaniach i obliczeniach)",
        btn_cancel: "Anuluj",
        btn_save: "Zapisz wydatek",
        pay_title: "Rejestracja Płatności",
        pay_label_expense: "Wydatek:",
        pay_label_period: "Okres:",
        pay_label_default_amount: "Domyślna kwota:",
        pay_label_actual_amount: "Faktycznie zapłacona kwota (zł)",
        pay_variable_hint: "Sugerowana kwota z historii:",
        pay_label_attachment: "Załącznik (Faktura PDF / Zdjęcie paragonu)",
        btn_confirm_pay: "Potwierdź opłatę",
        history_price_title: "Historia Ceny i Inflacja",
        history_label_change: "Zmiana ceny (Inflacja)",
        history_th_date: "Data wpłaty",
        history_th_period: "Okres",
        history_th_amount: "Zapłacona kwota",
        toast_save_success: "Wydatek został zapisany pomyślnie.",
        toast_save_error: "Błąd podczas zapisywania wydatku.",
        toast_delete_success: "Wydatek został usunięty z bazy.",
        toast_delete_error: "Nie udało się usunąć wydatku.",
        toast_pay_success: "Płatność została pomyślnie zarejestrowana.",
        toast_pay_error: "Nie udało się zarejestrować płatności.",
        toast_email_success: "Powiadomienia e-mail zostały wysłane pomyślnie.",
        toast_email_error: "Błąd podczas wysyłania powiadomień e-mail.",
        toast_history_error: "Nie udało się pobrać historii ceny.",
        toast_fetch_error: "Nie udało się załadować danych z bazy PocketBase.",
        month_jan: "Styczeń",
        month_feb: "Luty",
        month_mar: "Marzec",
        month_apr: "Kwiecień",
        month_may: "Maj",
        month_jun: "Czerwiec",
        month_jul: "Lipiec",
        month_aug: "Sierpień",
        month_sep: "Wrzesień",
        month_oct: "Październik",
        month_nov: "Listopad",
        month_dec: "Grudzień",
        freq_monthly: "Miesięczny",
        freq_biweekly: "Co 2 tygodnie",
        freq_quarterly: "Kwartalny (co 3 miesiące)",
        freq_semi_annual: "Półroczny (co 6 miesięcy)",
        freq_yearly: "Roczny",
        status_paid: "Opłacone",
        status_overdue: "Zaległe",
        status_due_soon: "Wkrótce termin",
        status_upcoming: "Nadchodzące",
        status_inactive: "Nieaktywne",
        confirm_delete: "Czy na pewno chcesz usunąć ten wydatek cykliczny?",
        variable_badge: "Zmienny",
        due_day_prefix: "Dzień",
        history_loading: "Ładowanie historii...",
        history_empty_state: "Brak opłaconych historii dla tego wydatku.",
        history_change_increase: "Wzrost",
        history_change_decrease: "Spadek",
        history_change_no_change: "Bez zmian",
        kpi_due_soon: "Zbliżających się",
        chart_bar_expected: "Oczekiwane rachunki",
        budget_title: "Budżety Kategorii",
        budget_spent: "Wydane",
        budget_limit: "Limit",
        budget_prompt: "Podaj nowy limit budżetu dla kategorii {cat} (PLN):",
        budget_invalid: "Podano niepoprawną kwotę!",
        budget_over: "Przekroczony budżet!"
    },
    en: {
        tagline: "Home maintenance expense tracking",
        report_pdf: "PDF Report",
        report_csv: "CSV Report",
        dev_mode: "Development Mode",
        kpi_prorated_title: "Average Monthly Budget",
        kpi_prorated_subtitle: "Monthly + pro-rated infrequent expenses",
        kpi_sinking_fund_title: "Savings Reserve",
        kpi_sinking_fund_subtitle: "Monthly set aside for infrequent expenses",
        kpi_monthly_title: "Monthly Expenses",
        kpi_monthly_subtitle: "Direct monthly recurring costs",
        kpi_yearly_title: "Yearly Expenses",
        kpi_yearly_subtitle: "Sum of fixed annual costs",
        kpi_pending_title: "Required Payments",
        tab_list: "List & Charts",
        tab_calendar: "Calendar View",
        cal_title: "Payment Terms Calendar",
        cal_prev: "Previous",
        cal_next: "Next",
        alert_title: "Payment Alerts",
        alert_send_email: "Send e-mail",
        alert_send_email_loading: "Sending...",
        alert_empty: "All paid! No pending payments.",
        sinking_funds_title: "Savings Plan (Sinking Funds)",
        sinking_funds_subtitle: "Save monthly for these infrequent expenses to avoid budget strain in the month they are due:",
        chart_category_title: "Category Breakdown (Average Monthly)",
        chart_projection_title: "Expense Projection (Next 12 Months)",
        expenses_title: "Recurring & Fixed Expenses",
        btn_add_expense: "Add Expense",
        search_placeholder: "Search expenses...",
        filter_all_frequencies: "All cycles",
        filter_monthly: "Monthly",
        filter_biweekly: "Biweekly",
        filter_quarterly: "Quarterly",
        filter_semi_annual: "Semi-annual",
        filter_yearly: "Yearly",
        filter_all_statuses: "All statuses",
        filter_status_overdue: "Overdue",
        filter_status_due_soon: "Due soon",
        filter_status_paid: "Paid",
        filter_status_upcoming: "Upcoming",
        th_name: "Expense Name",
        th_amount: "Amount",
        th_frequency: "Cycle",
        th_due_date: "Due Date",
        th_category: "Category",
        th_status: "Status",
        th_actions: "Actions",
        history_title: "Payment History",
        th_period: "Paid Period",
        th_date_paid: "Payment Date",
        th_paid_by: "Paid By",
        history_empty: "No payment history.",
        modal_add_title: "Add Recurring Expense",
        modal_edit_title: "Edit Expense",
        label_name: "Expense name",
        placeholder_name_eg: "e.g. Electricity Bill, Home Insurance",
        label_amount: "Amount (PLN)",
        label_category: "Category",
        placeholder_category_eg: "e.g. Utilities, Maintenance, Taxes",
        label_frequency: "Frequency",
        label_due_day: "Payment day (1-31)",
        label_due_month: "Payment month (or first payment month of the year)",
        label_variable: "Variable bill (e.g. electricity/gas based on usage)",
        label_active: "Active (include in totals and summaries)",
        btn_cancel: "Cancel",
        btn_save: "Save expense",
        pay_title: "Record Payment",
        pay_label_expense: "Expense:",
        pay_label_period: "Period:",
        pay_label_default_amount: "Default amount:",
        pay_label_actual_amount: "Actual amount paid (PLN)",
        pay_variable_hint: "Suggested amount from history:",
        pay_label_attachment: "Attachment (Invoice PDF / Receipt image)",
        btn_confirm_pay: "Confirm Payment",
        history_price_title: "Price History & Inflation",
        history_label_change: "Price Change (Inflation)",
        history_th_date: "Payment Date",
        history_th_period: "Period",
        history_th_amount: "Paid Amount",
        toast_save_success: "Expense saved successfully.",
        toast_save_error: "Error saving expense.",
        toast_delete_success: "Expense deleted.",
        toast_delete_error: "Error deleting expense.",
        toast_pay_success: "Payment recorded successfully.",
        toast_pay_error: "Error recording payment.",
        toast_email_success: "Email alerts sent successfully.",
        toast_email_error: "Error sending email alerts.",
        toast_history_error: "Failed to load price history.",
        toast_fetch_error: "Failed to load data from PocketBase.",
        month_jan: "January",
        month_feb: "February",
        month_mar: "March",
        month_apr: "April",
        month_may: "May",
        month_jun: "June",
        month_jul: "July",
        month_aug: "August",
        month_sep: "September",
        month_oct: "October",
        month_nov: "November",
        month_dec: "December",
        freq_monthly: "Monthly",
        freq_biweekly: "Biweekly",
        freq_quarterly: "Quarterly (every 3 months)",
        freq_semi_annual: "Semi-annual (every 6 months)",
        freq_yearly: "Yearly",
        status_paid: "Paid",
        status_overdue: "Overdue",
        status_due_soon: "Due soon",
        status_upcoming: "Upcoming",
        status_inactive: "Inactive",
        confirm_delete: "Are you sure you want to delete this recurring expense?",
        variable_badge: "Variable",
        due_day_prefix: "Day",
        history_loading: "Loading history...",
        history_empty_state: "No payment history for this expense.",
        history_change_increase: "Increase",
        history_change_decrease: "Decrease",
        history_change_no_change: "No change",
        kpi_due_soon: "Due soon",
        chart_bar_expected: "Expected bills",
        budget_title: "Category Budgets",
        budget_spent: "Spent",
        budget_limit: "Limit",
        budget_prompt: "Enter new budget limit for category {cat} (PLN):",
        budget_invalid: "Invalid amount entered!",
        budget_over: "Over budget!"
    }
};

// Default category budget thresholds
const defaultBudgets = {
    'Media i Eksploatacja': 1000,
    'Kredyt i Ubezpieczenia': 2000,
    'Stałe Opłaty': 800,
    'Serwisy i Przeglądy': 500,
    'Podatki': 300,
    'Podatki i Ubezpieczenia': 800,
    'Bufor i Rezerwy': 500,
    'Inne': 300
};

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
const categoryBudgetsList = document.getElementById('categoryBudgetsList');

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
            .then(() => console.log('PWA Service Worker registered.'))
            .catch(err => console.error('SW registration error:', err));
    }

    // Apply active theme
    document.body.className = activeTheme === 'light' ? 'light-theme' : '';
    updateThemeIcon();

    // Apply translations on load
    updateUILanguage();
    
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
        lastChartDoughnutData = data.doughnut_chart;
        lastChartBarData = data.projection_chart;
        
        updateKPIs(data.kpis);
        renderAlerts(data.notifications);
        renderSinkingFunds(data.sinking_fund_items);
        renderTable();
        renderCalendarView();
        updateCharts(data.doughnut_chart, data.projection_chart);
        renderCategoryBudgets(data.doughnut_chart);
        
        await fetchPaymentHistory();
    } catch (err) {
        console.error('Fetch error:', err);
        showErrorToast(translations[activeLang].toast_fetch_error);
    }
}

// Language Switcher Logic
window.changeLanguage = function(lang) {
    if (lang === activeLang) return;
    activeLang = lang;
    localStorage.setItem('language', lang);
    updateUILanguage();
    
    // Re-render components with the new language
    updateKPIs(kpiData);
    renderTable();
    renderCalendarView();
    if (lastChartDoughnutData) {
        renderCategoryBudgets(lastChartDoughnutData);
    }
    
    // We fetch data again to reload notifications/reserves correctly parsed
    fetchData();
}

function updateUILanguage() {
    const t = translations[activeLang];
    
    // 1. Update text elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // 2. Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // 3. Update active button highlights
    const btnPl = document.getElementById('langBtnPl');
    const btnEn = document.getElementById('langBtnEn');
    
    if (btnPl && btnEn) {
        if (activeLang === 'pl') {
            btnPl.style.background = 'var(--primary-color)';
            btnPl.style.color = '#ffffff';
            btnEn.style.background = 'transparent';
            btnEn.style.color = 'var(--text-secondary)';
        } else {
            btnEn.style.background = 'var(--primary-color)';
            btnEn.style.color = '#ffffff';
            btnPl.style.background = 'transparent';
            btnPl.style.color = 'var(--text-secondary)';
        }
    }
}

// Theme Switcher Logic
window.toggleTheme = function() {
    activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', activeTheme);
    document.body.className = activeTheme === 'light' ? 'light-theme' : '';
    
    updateThemeIcon();
    
    // Rebuild charts to adapt legends and grid colors
    if (lastChartDoughnutData && lastChartBarData) {
        updateCharts(lastChartDoughnutData, lastChartBarData);
    }
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (activeTheme === 'light') {
        icon.className = 'fa-solid fa-sun';
        icon.style.color = '#ff9800';
    } else {
        icon.className = 'fa-solid fa-moon';
        icon.style.color = '#e1e2e6';
    }
}

// Category Budget Logic
function renderCategoryBudgets(doughnutData) {
    if (!categoryBudgetsList) return;
    const t = translations[activeLang];
    
    // Load custom budgets from localStorage
    let budgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
    
    // Merge default limits
    for (const cat in defaultBudgets) {
        if (budgets[cat] === undefined) {
            budgets[cat] = defaultBudgets[cat];
        }
    }

    if (!doughnutData || !doughnutData.labels || doughnutData.labels.length === 0) {
        categoryBudgetsList.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-muted); text-align: center;">Brak danych do wyświetlenia limitów.</p>`;
        return;
    }

    categoryBudgetsList.innerHTML = doughnutData.labels.map((cat, idx) => {
        const spent = doughnutData.values[idx];
        const limit = budgets[cat] || 1000;
        const pct = Math.min((spent / limit) * 100, 200).toFixed(0);
        const isOver = spent > limit;
        
        const barColor = isOver ? '#f44336' : '#03a9f4';
        const badgeClass = isOver ? 'budget-status-over' : 'budget-status-ok';
        const badgeText = isOver ? t.budget_over : 'OK';
        const editTitle = activeLang === 'pl' ? 'Zmień limit budżetu' : 'Change budget limit';

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-name-group">
                        <span>${translateCategory(cat, activeLang)}</span>
                        <button class="budget-edit-btn" onclick="editCategoryBudget('${cat}')" title="${editTitle}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                    <span class="budget-status-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                    <div class="budget-vals">
                        ${t.budget_spent}: <span class="highlight">${formatCurrency(spent)}</span> / ${t.budget_limit}: <span>${formatCurrency(limit)}</span>
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 700; color: ${isOver ? '#f44336' : 'var(--text-secondary)'}">${pct}%</div>
                </div>
                <div class="budget-bar-container">
                    <div class="budget-bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${barColor};"></div>
                </div>
            </div>
        `;
    }).join('');
}

window.editCategoryBudget = function(cat) {
    const t = translations[activeLang];
    let budgets = JSON.parse(localStorage.getItem('categoryBudgets') || '{}');
    
    // Retrieve current limit
    const currentLimit = budgets[cat] !== undefined ? budgets[cat] : (defaultBudgets[cat] || 1000);
    
    const promptMsg = t.budget_prompt.replace('{cat}', translateCategory(cat, activeLang));
    const newLimitStr = prompt(promptMsg, currentLimit);
    
    if (newLimitStr === null) return; // User cancelled
    
    const newLimit = parseFloat(newLimitStr);
    if (isNaN(newLimit) || newLimit <= 0) {
        alert(t.budget_invalid);
        return;
    }
    
    budgets[cat] = newLimit;
    localStorage.setItem('categoryBudgets', JSON.stringify(budgets));
    
    if (lastChartDoughnutData) {
        renderCategoryBudgets(lastChartDoughnutData);
    }
}

function translateCategory(cat, lang) {
    if (lang === 'pl') return cat;
    const mapping = {
        'Serwisy i Przeglądy': 'Maintenance & Inspections',
        'Bufor i Rezerwy': 'Buffer & Reserves',
        'Media i Eksploatacja': 'Utilities & Operations',
        'Podatki': 'Taxes',
        'Kredyt i Ubezpieczenia': 'Loans & Insurance',
        'Inne': 'Other',
        'Stałe Opłaty': 'Fixed Fees',
        'Podatki i Ubezpieczenia': 'Taxes & Insurance'
    };
    return mapping[cat] || cat;
}

function translateMonthLabel(label, lang) {
    if (lang === 'pl') return label;
    const plMonths = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let translated = label;
    plMonths.forEach((pl, idx) => {
        translated = translated.replace(pl, enMonths[idx]);
    });
    return translated;
}

function translateNotificationMessage(notif, lang) {
    if (lang === 'pl') return notif.message;
    const days = Math.abs(notif.days_left);
    if (notif.status === 'overdue') {
        return days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`;
    } else if (notif.status === 'due_soon') {
        return days === 1 ? 'Due in 1 day' : `Due in ${days} days`;
    }
    return notif.message;
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
    const t = translations[activeLang];

    const monthNamesPl = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNames = activeLang === 'pl' ? monthNamesPl : monthNamesEn;
    
    calMonthTitle.textContent = `${monthNames[calCurrentMonth - 1]} ${calCurrentYear}`;

    // Update weekdays header
    const weekdaysHeader = document.getElementById('calendarWeekdaysHeader');
    if (weekdaysHeader) {
        const days = activeLang === 'pl' 
            ? ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'] 
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekdaysHeader.innerHTML = days.map(d => `<div>${d}</div>`).join('');
    }

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
    const t = translations[activeLang];
    kpiProrated.textContent = formatCurrency(kpis.pro_rated_monthly);
    if (kpiSinkingFund) kpiSinkingFund.textContent = formatCurrency(kpis.sinking_fund_total || 0);
    kpiMonthly.textContent = formatCurrency(kpis.monthly_total);
    kpiYearly.textContent = formatCurrency(kpis.yearly_total);
    
    const pendingCount = kpis.overdue_count + kpis.due_soon_count;
    kpiPending.textContent = pendingCount;
    
    if (activeLang === 'pl') {
        kpiPendingDetail.textContent = `${kpis.overdue_count} Zaległych | ${kpis.due_soon_count} Zbliżających się`;
    } else {
        kpiPendingDetail.textContent = `${kpis.overdue_count} Overdue | ${kpis.due_soon_count} Due Soon`;
    }
    
    kpiStatusCard.className = 'kpi-card status-kpi';
    if (kpis.overdue_count > 0) {
        kpiStatusCard.classList.add('urgent');
    } else if (kpis.due_soon_count > 0) {
        kpiStatusCard.classList.add('warning-alert');
    }
}

// Render Notifications / Alerts Panel
function renderAlerts(notifications) {
    const t = translations[activeLang];
    let badgeText = '';
    if (activeLang === 'pl') {
        badgeText = `${notifications.length} ${getAlertNoun(notifications.length)}`;
    } else {
        badgeText = `${notifications.length} ${notifications.length === 1 ? 'alert' : 'alerts'}`;
    }
    alertsCountBadge.textContent = badgeText;
    
    if (notifications.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-alerts">
                <i class="fa-solid fa-circle-check"></i>
                <p>${t.alert_empty}</p>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = notifications.map((alert, index) => {
        const alertMsg = translateNotificationMessage(alert, activeLang);
        const dueText = activeLang === 'pl' ? 'Termin' : 'Due';
        const checkTitle = activeLang === 'pl' ? 'Oznacz jako opłacone' : 'Mark as paid';
        return `
            <div class="alert-item alert-${alert.status} fade-in-alert" style="animation-delay: ${index * 0.05}s">
                <div class="alert-info">
                    <span class="alert-title">${alert.name}</span>
                    <span class="alert-desc">${alertMsg} (${dueText}: ${formatDateStr(alert.due_date_str)})</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="alert-amt">${formatCurrency(alert.amount)}</span>
                    <button class="btn-sm-action pay-btn" onclick="payExpense('${alert.id}')" title="${checkTitle}">
                        <i class="fa-solid fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getAlertNoun(count) {
    if (count === 1) return 'alert';
    if (count >= 2 && count <= 4) return 'alerty';
    return 'alertów';
}

// Render Sinking Funds breakdown
function renderSinkingFunds(sinkingItems) {
    if (!sinkingFundsList) return;
    const t = translations[activeLang];
    if (!sinkingItems || sinkingItems.length === 0) {
        const msg = activeLang === 'pl' 
            ? 'Brak opłat rzadkich (kwartalnych/rocznych) do planowania rezerwy.' 
            : 'No infrequent (quarterly/yearly) expenses to plan reserves.';
        sinkingFundsList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">${msg}</p>`;
        return;
    }

    sinkingFundsList.innerHTML = sinkingItems.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; font-size: 0.88rem;">
            <div>
                <span style="font-weight: 600; color: var(--text-primary);">${item.name}</span>
                <span style="font-size: 0.78rem; color: var(--text-secondary); margin-left: 6px;">(${getFrequencyTranslation(item.frequency)})</span>
            </div>
            <div style="text-align: right;">
                <span style="font-weight: 700; color: #8b5cf6;">${formatCurrency(item.monthly_reserve)} ${activeLang === 'pl' ? '/ mc' : '/ mo'}</span>
            </div>
        </div>
    `).join('');
}

// Filter and Render Table Rows
function renderTable() {
    const searchVal = searchInput.value.toLowerCase();
    const freqVal = filterFrequency.value;
    const statusVal = filterStatus.value;
    const t = translations[activeLang];
    
    const filtered = expensesList.filter(exp => {
        const matchesSearch = exp.name.toLowerCase().includes(searchVal) || exp.category.toLowerCase().includes(searchVal);
        const matchesFreq = freqVal === 'all' || exp.frequency === freqVal;
        const matchesStatus = statusVal === 'all' || exp.status === statusVal;
        return matchesSearch && matchesFreq && matchesStatus;
    });
    
    if (filtered.length === 0) {
        const msg = activeLang === 'pl' 
            ? 'Brak wydatków spełniających wybrane kryteria.' 
            : 'No expenses found matching the selected filters.';
        expensesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    ${msg}
                </td>
            </tr>
        `;
        return;
    }
    
    expensesTableBody.innerHTML = filtered.map(exp => {
        const rowClass = exp.active ? '' : 'row-inactive';
        const statusText = getStatusTranslation(exp.status);
        const cycleWord = activeLang === 'pl' ? 'Dzień' : 'Day';
        const cycleText = (exp.frequency === 'monthly' || exp.frequency === 'biweekly')
            ? `${cycleWord} ${exp.due_day}` 
            : `${exp.due_day} ${getMonthName(exp.due_month)}`;
            
        const payTitle = activeLang === 'pl' ? 'Oznacz jako opłacone' : 'Mark as paid';
        const histTitle = activeLang === 'pl' ? 'Historia cen i inflacja' : 'Price history & inflation';
        const editTitle = activeLang === 'pl' ? 'Edytuj wydatek' : 'Edit expense';
        const delTitle = activeLang === 'pl' ? 'Usuń wydatek' : 'Delete expense';
        const varBadgeText = t.variable_badge;

        return `
            <tr class="${rowClass}">
                <td>
                    <div class="exp-cell-name">
                        ${exp.name}
                        ${exp.is_variable ? `<span class="status-tag" style="background: rgba(139,92,246,0.15); color: #8b5cf6; margin-left: 6px; font-size: 0.7rem;">${varBadgeText}</span>` : ''}
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
                    <span class="exp-cell-category">${translateCategory(exp.category, activeLang)}</span>
                </td>
                <td>
                    <span class="status-badge status-${exp.status}">
                        <i class="${getStatusIcon(exp.status)}"></i> ${statusText}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        ${exp.active && exp.status !== 'paid' ? `
                            <button class="btn-sm-action pay-btn" onclick="payExpense('${exp.id}')" title="${payTitle}">
                                <i class="fa-solid fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-sm-action" onclick="viewPriceHistory('${exp.id}')" title="${histTitle}" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">
                            <i class="fa-solid fa-chart-line"></i>
                        </button>
                        <button class="btn-sm-action edit-btn" onclick="editExpense('${exp.id}')" title="${editTitle}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-sm-action delete-btn" onclick="deleteExpense('${exp.id}')" title="${delTitle}">
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
    const t = translations[activeLang];

    document.getElementById('historyExpenseName').textContent = expense.name;
    const historyTableBody = document.getElementById('historyTableBody');
    const historyPriceChange = document.getElementById('historyPriceChange');

    historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-muted);">${t.history_loading}</td></tr>`;
    priceHistoryModal.classList.add('open');

    try {
        const response = await fetch(`/api/expenses/${id}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();

        const changePct = data.price_change_pct;
        if (changePct > 0) {
            historyPriceChange.textContent = `+${changePct}% (${t.history_change_increase})`;
            historyPriceChange.style.color = '#ef4444';
        } else if (changePct < 0) {
            historyPriceChange.textContent = `${changePct}% (${t.history_change_decrease})`;
            historyPriceChange.style.color = '#10b981';
        } else {
            historyPriceChange.textContent = `0.0% (${t.history_change_no_change})`;
            historyPriceChange.style.color = '#94a3b8';
        }

        if (data.history.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-muted);">${t.history_empty_state}</td></tr>`;
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
        showErrorToast(t.toast_history_error);
    }
}

// Chart.js Visualizations
function updateCharts(doughnutData, barData) {
    const t = translations[activeLang];
    
    // Destroy previous instances to force clean repaint with updated theme configurations
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    if (projectionChart) {
        projectionChart.destroy();
        projectionChart = null;
    }

    const ctxDoughnut = document.getElementById('categoryDoughnutChart').getContext('2d');
    const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];
    
    // Theme-driven options
    const isLight = activeTheme === 'light';
    const textColor = isLight ? '#1E293B' : '#F3F4F6';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    const tickColor = isLight ? '#4B5563' : '#9CA3AF';

    // Translate labels
    const translatedDoughnutLabels = doughnutData.labels.map(l => translateCategory(l, activeLang));
    const translatedBarLabels = barData.map(d => translateMonthLabel(d.label, activeLang));
    const barValues = barData.map(d => d.amount);

    categoryChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: translatedDoughnutLabels,
            datasets: [{
                data: doughnutData.values,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) { 
                            const valText = context.raw.toLocaleString(activeLang === 'pl' ? 'pl-PL' : 'en-US');
                            const suffix = activeLang === 'pl' ? 'zł/mc' : 'PLN/mo';
                            return ` ${context.label}: ${valText} ${suffix}`; 
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    const ctxBar = document.getElementById('projectionBarChart').getContext('2d');
    
    projectionChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: translatedBarLabels,
            datasets: [{
                label: t.chart_bar_dataset_label,
                data: barValues,
                backgroundColor: isLight ? 'rgba(2, 136, 209, 0.4)' : 'rgba(99, 102, 241, 0.4)',
                borderColor: isLight ? '#0288d1' : '#6366F1',
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
                        label: function(context) { 
                            const valText = context.raw.toLocaleString(activeLang === 'pl' ? 'pl-PL' : 'en-US');
                            const prefix = t.chart_bar_expected;
                            const currency = activeLang === 'pl' ? 'zł' : 'PLN';
                            return ` ${prefix}: ${valText} ${currency}`; 
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: tickColor, font: { family: 'Plus Jakarta Sans', size: 10 } } },
                y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Plus Jakarta Sans', size: 10 } } }
            }
        }
    });
}

// Handlers
async function handleSendEmailAlerts() {
    const t = translations[activeLang];
    btnSendEmailAlerts.disabled = true;
    btnSendEmailAlerts.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.alert_send_email_loading}`;
    try {
        const response = await fetch('/api/notifications/send-email', { method: 'POST' });
        const res = await response.json();
        
        // Translate message if backend returned success
        if (res.success) {
            showSuccessToast(t.toast_email_success);
        } else {
            showErrorToast(t.toast_email_error);
        }
    } catch (err) {
        console.error('Email alert error:', err);
        showErrorToast(t.toast_email_error);
    } finally {
        btnSendEmailAlerts.disabled = false;
        btnSendEmailAlerts.innerHTML = `<i class="fa-solid fa-envelope"></i> ${t.alert_send_email}`;
    }
}

async function payExpense(id) {
    const expense = expensesList.find(e => e.id === id);
    if (!expense) return;
    const t = translations[activeLang];
    
    payConfirmExpenseId.value = id;
    payConfirmName.textContent = expense.name;
    payConfirmDefaultAmount.textContent = formatCurrency(expense.amount);
    payActualAmount.value = expense.amount.toFixed(2);
    if (payInvoiceFile) payInvoiceFile.value = '';
    
    // Check if expense is variable
    if (expense.is_variable && variableHint && variableHintVal) {
        variableHint.style.display = 'block';
        document.getElementById('variableHintText').textContent = t.pay_variable_hint;
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
    const t = translations[activeLang];
    if (!confirm(t.confirm_delete)) return;
    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete request failed');
        
        fetchData();
        showSuccessToast(t.toast_delete_success);
    } catch (err) {
        console.error('Delete error:', err);
        showErrorToast(t.toast_delete_error);
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
    const t = translations[activeLang];
    
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
        showSuccessToast(t.toast_save_success);
    } catch (err) {
        console.error('Submit error:', err);
        showErrorToast(t.toast_save_error);
    }
}

// Modal Helpers
function openModal(expense = null) {
    const t = translations[activeLang];
    expenseForm.reset();
    
    if (expense) {
        modalTitle.textContent = t.modal_edit_title;
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
        modalTitle.textContent = t.modal_add_title;
        expId.value = '';
        dueMonthGroup.style.display = 'none';
        expDueMonth.removeAttribute('required');
        expActive.checked = true;
        expVariable.checked = false;
    }
    
    expenseModal.classList.add('open');
}

// Force close open modal
function closeModal() {
    expenseModal.classList.remove('open');
}

// Formatting Helpers
function formatCurrency(val) {
    const locale = activeLang === 'pl' ? 'pl-PL' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' }).format(val);
}

function formatDateStr(str) {
    if (!str) return '';
    const date = new Date(str + 'T00:00:00');
    const locale = activeLang === 'pl' ? 'pl-PL' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthName(m) {
    if (!m) return '';
    const monthsPl = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = activeLang === 'pl' ? monthsPl : monthsEn;
    return months[m - 1] || '';
}

function getFrequencyTranslation(freq) {
    const t = translations[activeLang];
    switch (freq) {
        case 'monthly': return t.freq_monthly;
        case 'biweekly': return t.freq_biweekly;
        case 'quarterly': return t.freq_quarterly;
        case 'semi_annual': return t.freq_semi_annual;
        case 'yearly': return t.freq_yearly;
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
    const t = translations[activeLang];
    switch (status) {
        case 'paid': return t.status_paid;
        case 'overdue': return t.status_overdue;
        case 'due_soon': return t.status_due_soon;
        case 'upcoming': return t.status_upcoming;
        case 'inactive': return t.status_inactive;
        default: return status;
    }
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
    const t = translations[activeLang];
    
    if (payments.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                    ${t.history_empty}
                </td>
            </tr>
        `;
        return;
    }
    
    body.innerHTML = payments.map(item => `
        <tr>
            <td><strong>${item.expense_name}</strong></td>
            <td><span class="exp-cell-category">${translateCategory(item.category, activeLang)}</span></td>
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
    const t = translations[activeLang];
    
    try {
        const response = await fetch(`/api/expenses/${id}/pay`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Payment request failed');
        
        closePayModal();
        fetchData();
        showSuccessToast(t.toast_pay_success);
    } catch (err) {
        console.error('Payment error:', err);
        showErrorToast(t.toast_pay_error);
    }
}

function closePayModal() {
    payConfirmModal.classList.remove('open');
}
