# Application Features & Interface 📊

HomeBudget offers a clean, secure, and highly interactive dashboard that allows you to manage recurring household expenses, track spending against budget targets, and generate detailed reports.

---

## 1. Slate Themes (Dark & Light) 🌗

The interface defaults to a modern, low-fatigue **Slate Dark** theme designed to harmonize with Home Assistant dashboards. However, you can instantly toggle to a high-contrast **Slate Light** theme for daylight environments.

*   **Dynamic Theme Switcher:** Located in the top header. Toggles the UI state and persists the preference in the browser's `localStorage`.
*   **Adaptive Charts:** Chart.js components (doughnut charts, line plots, grids, and legend text colors) dynamically reload and update their style parameters on the fly to remain highly readable under both themes.

---

## 2. Dual-Language Localization (PL / EN) 🇵🇱 🇬🇧

HomeBudget includes a complete translation layer that adapts both client-side elements and server-side document exports.

*   **Header Switcher:** Quick-action **PL / EN** buttons in the header reload translations instantly.
*   **Data Formatting:** Automatically localizes currencies (e.g. `120,00 zł` in Polish vs `120.00 PLN` in English), calendar months, frequency tags (e.g., `Miesięczny` / `Monthly`), and dates.
*   **Export Localization:** The PDF and CSV download routes receive the active language query parameter, translating titles, tables, column headers, and canvassed page markers.

---

## 3. Interactive Category Budgets 📈

To keep spending under control, the dashboard displays active categories side-by-side with budget limits.

*   **Spent Indicators:** Displays a list of spending categories (e.g., *Utilities, Taxes, Reserves*) with progress bars showing actual monthly costs.
*   **Custom Thresholds:** Click the **pencil icon** next to any category to set or edit the monthly budget threshold. Limits are saved locally in the browser.
*   **Status Alert Colors:** Bars are highlighted in **emerald green** when under budget, and switch to an **animated pulsing red** if the monthly spending exceeds the defined limit.

---

## 4. Visual Financial Analytics 📉

The dashboard renders real-time financial charts based on active expense records:

*   **Category Breakdown (Doughnut Chart):** Illustrates the proportional allocation of resources across categories.
*   **Cumulative Projection Timeline (Line Chart):** Maps out commitments month-by-month over the next year to identify peak cost months (e.g., when annual insurance or tax bills are due).
*   **Summary Cards (KPIs):**
    *   *Average Monthly Budget:* Weighted average cost including prorated annual/quarterly bills.
    *   *Savings Reserve (Sinking Fund):* Monthly allocation required to cover upcoming quarterly/annual bills.
    *   *Monthly Expenses:* Active flat monthly commitments.
    *   *Yearly Expenses:* Sum of all annual flat-rate bills.

---

## 5. Expense Lists & Recent Payments 📑

*   **Cyclic Expense Registry:** Displays active recurring expenses, color-coded by their payment status (*Paid, Due Soon, Overdue, Upcoming*).
*   **Payment Logs:** A history of the last 25 registered payments, showing the exact date paid, the target bill period, amount, and user identity.

---

## 6. Localized Report Exports 💾

Download buttons in the header compile current budget records:

*   **PDF Financial Summary:** A formatted document suitable for offline saving or printing.
*   **CSV Data Export:** Raw transaction and billing logs separated by semicolons (UTF-8 BOM encoded) for direct import into Excel or Google Sheets.
