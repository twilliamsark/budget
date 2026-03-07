# How to Use the Budget Application

A practical guide for using this application to record, analyze, and reconcile personal or small-business spending—written for both **accountants** (day-to-day use) and **auditors** (verification and controls).

---

## Table of contents

1. [Overview](#1-overview)
2. [Data model (for reconciliation & audit)](#2-data-model-for-reconciliation--audit)
3. [Navigation and main areas](#3-navigation-and-main-areas)
4. [Getting started](#4-getting-started)
5. [Expenses](#5-expenses)
6. [Transfers](#6-transfers)
7. [Ledger](#7-ledger)
8. [Summary reports](#8-summary-reports)
9. [Export and backup](#9-export-and-backup)
10. [Reconciliation and audit practices](#10-reconciliation-and-audit-practices)
11. [CSV format reference](#11-csv-format-reference)

---

## 1. Overview

The application uses **double-entry bookkeeping**: every transaction is stored as a **journal entry** (one or more debits and credits that balance). What you see as “expenses” on the Expenses page is a **view** derived from those entries, not a separate list. This design gives you:

- **Traceability**: Each expense ties to a transaction and two journal lines (debit category, credit payment account).
- **Consistency**: Transfers and expenses share the same ledger; account balances are always consistent.
- **Audit trail**: The Ledger shows every debit and credit by account so you can verify balances and spot errors.

**Main capabilities:**

| Area | Purpose |
|------|--------|
| **Expenses** | Import or enter spending; filter, edit, delete; export CSV. |
| **Transfers** | Record and view transfers between accounts (e.g. checking → savings). |
| **Ledger** | View any account’s journal (debits, credits, running balance). |
| **Summary** | See spending by category and by account over a date range. |

---

## 2. Data model (for reconciliation & audit)

### What is stored

- **Accounts**  
  Each account has an `id` (e.g. `CC-5792`, `Chk-3100`, `Food`) and a **type**: `asset`, `liability`, `expense`, or `income`.  
  - **Expense** accounts = spending categories (e.g. Food, Medical).  
  - **Asset/liability** accounts = payment sources (e.g. checking, credit card).

- **Transactions**  
  Each transaction has: `id`, `date`, `type` (`expense` or `transfer`), and optional `to`, `from`, `description`, `possibleDuplicate`.  
  - **Expense** transactions represent a single expense (payee, category, amount, payment account).  
  - **Transfer** transactions represent a movement of money between two accounts (from, to, amount, optional memo).

- **Journal lines**  
  Each line belongs to one transaction and one account, with non-negative `debit` and `credit` amounts.  
  - Every **expense** creates two lines: debit the category (expense account), credit the payment account.  
  - Every **transfer** creates two lines: debit the “from” account, credit the “to” account.  
  - For every transaction, total debits = total credits.

### Balance rules

- **Asset** and **expense** accounts: balance = debits − credits (debits increase the balance).  
- **Liability** and **income** accounts: balance = credits − debits (credits increase the balance).

This is how the Ledger computes “current balance” and running balance for each account.

### Where data lives

- Data is stored in the browser’s **localStorage** (keys: `budget_accounts`, `budget_transactions`, `budget_journal_lines`).  
- There is no server; **exporting CSV and keeping backups** is your way to preserve records and move data.

---

## 3. Navigation and main areas

Use the top navigation:

- **Expenses** — List and manage expense transactions; import/export CSV; set date range for the list.
- **Summary** — Reports by category and by account for a chosen date range.
- **Ledger** — Pick an account and see all its debits, credits, and running balance.
- **Transfers** — List of all transfers; add or delete transfers.

---

## 4. Getting started

### Option A: Import from CSV

1. Go to **Expenses**.
2. Click **Import CSV** and select a file.
3. Expected columns: **Date**, **To**, **Category**, **Amount**, **Account**. Optional: **From** (defaults to “Todd W” if missing).  
   See [§11 CSV format reference](#11-csv-format-reference).
4. The app merges with existing data: exact matches (same date, to, from, category, amount, account) are skipped; same date/to/from but different category or amount are added and marked **Possible duplicate** for you to review.

**Auditor note:** After import, use **Export CSV** to get a snapshot of the expense view and keep it as a record of what was imported.

### Option B: Enter data manually

1. Go to **Expenses** and click **Add expense**.  
   Enter date, payee (To), From, category, amount (negative, e.g. -50.00), and payment account.
2. For transfers between accounts, go to **Transfers** and click **Add transfer**.  
   Enter from account, to account, amount, date, and optional memo.

Categories and payment accounts are created automatically when first used (e.g. first expense in “Food” creates the “Food” expense account).

---

## 5. Expenses

### List and filters

- The list is restricted by the **date range** at the top (From / To). Change the range to focus on a period.
- Use **Search** to filter by payee, category, or account.
- Use **From**, **Category**, and **Account** filters to narrow by payer, category, or payment account.
- Use **Clear filters** to reset.

### Actions on a row

- **Edit** — Change date, payee, from, category, amount, or account. Saving replaces the underlying transaction and its two journal lines (and clears “Possible duplicate” if it was set).
- **Delete** — Removes the transaction and its journal lines. Confirm in the dialog.
- **Not a duplicate** — For rows marked “Possible duplicate” (same date, payee, and “from” but different category or amount after import). Click to clear the flag; the underlying transaction is updated.

### Export

- **Export CSV** exports the **currently filtered** expense list (after date range and any filters).  
- Use this for period-specific backups and for feeding other tools or audits.  
- File columns: Date, To, From, Category, Amount, Account (amounts as currency, e.g. -$50.00).

**Accountant tip:** Export at least monthly (or after each import) and keep exports in a folder by period for quick reconciliation and audit.

---

## 6. Transfers

- **View** — The Transfers page lists all transfer transactions: Date, From account, To account, Amount, Memo.
- **Add transfer** — Opens a dialog: choose From account, To account, enter Amount (positive), Date, and optional Memo. From and To must be different.
- **Delete** — Use the delete action on a row; confirm. This removes the transaction and its two journal lines.

Transfers do **not** appear on the Expenses list (they are not expenses). They do appear in the **Ledger** for each account involved (as a debit on the “from” account and a credit on the “to” account).

---

## 7. Ledger

The Ledger is the **account-level journal**: every debit and credit that touches an account.

1. Open **Ledger** and choose an **Account** from the dropdown (all accounts that exist in the system).
2. The app shows:
   - **Current balance** for that account (using the balance rule for the account type).
   - A table: **Date**, **Description**, **Debit**, **Credit**, **Balance** (running balance after each line).
3. Description comes from the transaction (for expenses: payee; for transfers: memo or blank).
4. Rows are sorted by date.

**Accountant use:** Reconcile an account (e.g. checking or a credit card) by comparing the Ledger’s current balance and lines to your bank or card statement.  
**Auditor use:** Use the Ledger to verify that every transaction is properly double-entered and that balances are consistent with the underlying journal lines.

---

## 8. Summary reports

- Open **Summary** and set the **From** and **To** dates. The report includes only expenses whose date falls in that range (transfers are excluded from Summary).
- **Grand total** is the sum of expense amounts (negative) in the range.
- **By category** — Table and pie chart: category, count, total, % of total. Sort by column as needed.
- **By account** — Table and pie chart: payment account, count, total, % of total.

Use Summary to analyze spending by category or by payment account over a period (e.g. month or quarter).

---

## 9. Export and backup

- **Expenses** → **Export CSV**: Exports the **filtered** expense list (respecting date range and filters).  
  Use “From”/“To” to define the period, then export. Keep these files as period backups.
- **Clear all** (Expenses page) removes all accounts, transactions, and journal lines from the app. There is no undo.  
  **Best practice:** Export CSV (and optionally a second copy with a wider date range) before using Clear all or before any bulk change.

Data lives only in the browser; if you clear site data or use another device, you need these CSV (or other) backups to restore or reconstruct records.

---

## 10. Reconciliation and audit practices

### Reconciliation

1. **By account**  
   - Open **Ledger** and select the account (e.g. checking or a card).  
   - Compare **Current balance** and the list of debits/credits to the bank or card statement.  
   - Investigate any missing or extra lines (e.g. missing expense, duplicate import, wrong account).

2. **By period**  
   - Set **Summary** to the statement period.  
   - Export **Expenses** for that period (same From/To) and compare totals and line count to the Summary and to external statements.

3. **Transfers**  
   - On **Transfers**, verify that each transfer appears once and that From/To and amount are correct.  
   - In **Ledger**, confirm that the same transfer appears as a debit on the “from” account and a credit on the “to” account for the same amount and date.

### Audit and controls

- **Double-entry**: Every expense and transfer is stored as a transaction with balanced debits and credits. The Ledger exposes this so an auditor can verify completeness and consistency.
- **Traceability**: Each expense row ties to one transaction and two journal lines (category + payment account). Editing or deleting an expense updates or removes that transaction and its lines.
- **Duplicate handling**: Imports that match same date/to/from but different category or amount are added and flagged “Possible duplicate.” Review and use “Not a duplicate” or Edit/Delete so the books reflect intent.
- **Backup and retention**: Rely on **Export CSV** and date-range exports for backups and retention. Store exports in a secure location and align retention with your policy.

### Migration from older data

If the app finds **legacy** expense/category/account data (from an older version) and there are no existing transactions, it runs a **one-time migration**: it creates accounts (with types), one expense transaction per legacy expense, and two journal lines each, then removes the legacy keys. After that, only accounts, transactions, and journal lines are used.  
**Auditor note:** Post-migration, export a full expense CSV and spot-check a sample against the Ledger to confirm migration integrity.

---

## 11. CSV format reference

### Import (Expenses)

- **Required columns:** `Date`, `To`, `Category`, `Amount`, `Account`
- **Optional:** `From` (defaults to “Todd W” if missing)
- **Date:** Flexible (e.g. `1/21/26`, `01/21/26`, or other common formats); stored as M/D/YY or MM/DD/YY
- **Amount:** Numeric; can include `$` and `,` (e.g. `-$50.00`, `-50`). Negative = expense.
- **Header row:** First row must be the column headers. Empty or invalid amount rows are skipped.

Example:

```csv
Date,To,From,Category,Amount,Account
1/21/26,PROGRESSIVE *INSURANCE,Todd W,Car Insurance,-$907.22,CC-5792
1/2/26,ZALES JEWELERS,Todd W,Jewelry,-$403.60,CC-5792
```

### Export (Expenses)

- **Columns:** Date, To, From, Category, Amount, Account  
- **Amount:** Formatted as USD (e.g. -$50.00).  
- **Scope:** Only expenses in the **current filtered list** (date range + any filters).  
- **Transfers:** Not included in expense export; use the Ledger or Transfers view to document transfers.

---

*This guide reflects the application’s double-entry model, Expenses, Transfers, Ledger, Summary, and CSV import/export. Use it to run the books and to support reconciliation and audit.*
