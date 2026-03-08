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
7. [Income](#7-income)
8. [Accounts](#8-accounts)
9. [Journal](#9-journal)
10. [Ledger](#10-ledger)
11. [Summary reports](#11-summary-reports)
12. [Export and backup](#12-export-and-backup)
13. [Reconciliation and audit practices](#13-reconciliation-and-audit-practices)
14. [CSV format reference](#14-csv-format-reference)

---

## 1. Overview

The application uses **double-entry bookkeeping**: every transaction is stored as a **journal entry** (one or more debits and credits that balance). What you see as “expenses” on the Expenses page is a **view** derived from those entries, not a separate list. This design gives you:

- **Traceability**: Each expense ties to a transaction and two journal lines (debit category, credit payment account).
- **Consistency**: Transfers and expenses share the same ledger; account balances are always consistent.
- **Audit trail**: The Ledger shows every debit and credit by account so you can verify balances and spot errors.

**Main capabilities:**

| Area | Purpose |
|------|--------|
| **Expenses** | Import or enter spending; filter, edit, delete; export CSV; expand rows to see transaction and journal lines. |
| **Transfers** | Record and view transfers between accounts (e.g. checking → savings); import/export CSV; expandable rows. |
| **Income** | Record income (e.g. interest, dividends) into an account; import/export CSV; expandable rows. |
| **Accounts** | List all accounts with type; add, edit, delete (delete only when account has no lines). |
| **Journal** | General journal entries (two or more lines, debits = credits); list, add, delete; import/export CSV; expandable rows. |
| **Ledger** | View any account's journal (debits, credits, running balance). |
| **Summary** | See spending by category and by account over a date range. |

---

## 2. Data model (for reconciliation & audit)

### What is stored

- **Accounts**  
  Each account has an `id` (e.g. `CC-5792`, `Chk-3100`, `Food`) and a **type**: `asset`, `liability`, `expense`, or `income`.  
  - **Expense** accounts = spending categories (e.g. Food, Medical).  
  - **Asset/liability** accounts = payment sources (e.g. checking, credit card).

- **Transactions**  
  Each transaction has: `id`, `date`, `type` (`expense`, `transfer`, `income`, or `journal`), and optional `to`, `from`, `description`, `possibleDuplicate`.  
  - **Expense** transactions represent a single expense (payee, category, amount, payment account).  
  - **Transfer** transactions represent a movement of money between two accounts (from, to, amount, optional memo).  
  - **Income** transactions represent income (e.g. interest, dividends) into an account (debit asset, credit income account).  
  - **Journal** transactions are general entries with two or more lines (arbitrary debits and credits that balance).

- **Journal lines**  
  Each line belongs to one transaction and one account, with non-negative `debit` and `credit` amounts.  
  - Every **expense** creates two lines: debit the category (expense account), credit the payment account.  
  - Every **transfer** creates two lines: **credit** the "from" account (source decreases), **debit** the "to" account (destination increases).  
  - Every **income** creates two lines: debit the receiving (asset) account, credit the income account.  
  - Every **journal** entry has two or more lines; total debits = total credits.  
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

- **Expenses** — List and manage expense transactions; import/export CSV; set date range; expand rows to see transaction and journal lines.
- **Summary** — Reports by category and by account for a chosen date range.
- **Ledger** — Pick an account and see all its debits, credits, and running balance.
- **Transfers** — List of all transfers; add or delete; import/export CSV; expandable rows.
- **Accounts** — List all accounts with type; add, edit, delete accounts.
- **Income** — List income entries; add or delete; import/export CSV; expandable rows.
- **Journal** — List general journal entries; add or delete; import/export CSV; expandable rows.

---

## 4. Getting started

### Option A: Import from CSV

1. Go to **Expenses**.
2. Click **Import CSV** and select a file.
3. Expected columns: **Date**, **To**, **Category**, **Amount**, **Account**. Optional: **From** (defaults to “Todd W” if missing).  
   See [§14 CSV format reference](#14-csv-format-reference).
4. The app merges with existing data: exact matches (same date, to, from, category, amount, account) are skipped; same date/to/from but different category or amount are added and marked **Possible duplicate** for you to review.

**Auditor note:** After import, use **Export CSV** to get a snapshot of the expense view and keep it as a record of what was imported.

### Option B: Enter data manually

1. Go to **Expenses** and click **Add expense**.  
   Enter date, payee (To), From, category, amount (negative, e.g. -50.00), and payment account.
2. For transfers between accounts, go to **Transfers** and click **Add transfer**.  
   Enter from account, to account, amount, date, and optional memo.
3. For income (e.g. interest, dividends), go to **Income** and click **Add income**.  
   Enter to account (where money is received), income account (e.g. Interest, Dividends), amount, date, optional memo. Create income-type accounts on **Accounts** if needed.
4. For general journal entries (adjustments, corrections), go to **Journal** and click **Add journal entry**.  
   Enter date, optional description, and two or more lines (account, debit, credit) that balance.

Categories and payment accounts are created automatically when first used. Use **Accounts** to create or manage accounts (including income-type accounts like Interest, Dividends) before or after entering data.

---

## 5. Expenses

### List and filters

- The list is restricted by the **date range** at the top (From / To). Change the range to focus on a period.
- Use **Search** to filter by payee, category, or account.
- Use **From**, **Category**, and **Account** filters to narrow by payer, category, or payment account.
- Use **Clear filters** to reset.

### Actions on a row

- **Expand** — Click the expand icon to show the underlying transaction (id, type, date, to, from) and journal lines (account, debit, credit).
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

- **View** — The Transfers page lists all transfer transactions: Date, From account, To account, Amount, Memo. Expand a row to see the transaction and its two journal lines.
- **Add transfer** — Opens a dialog: choose From account, To account, enter Amount (positive), Date, and optional Memo. From and To must be different.
- **Import CSV** / **Export CSV** — Import from or export to a file with columns Date, From account, To account, Amount, Memo. Exact duplicates are skipped on import.
- **Delete** — Use the delete action on a row; confirm. This removes the transaction and its two journal lines.

Transfers do **not** appear on the Expenses list (they are not expenses). They appear in the **Ledger** for each account involved: the **from** account is **credited** (balance decreases), the **to** account is **debited** (balance increases).

---

## 7. Income

- **View** — The Income page lists all income transactions: Date, To account, Income account, Amount, Memo. Expand a row to see the transaction and journal lines.
- **Add income** — Opens a dialog: choose To account (where money is received, e.g. Checking), Income account (e.g. Interest, Dividends), Amount, Date, optional Memo. Create income-type accounts on **Accounts** if they don't exist.
- **Import CSV** / **Export CSV** — Columns: Date, To account, Income account, Amount, Memo. Exact duplicates are skipped on import.
- **Delete** — Removes the income transaction and its two journal lines (debit to account, credit income account).

Income does not appear on Expenses or Summary; it does appear in the Ledger for the to account and the income account.

---

## 8. Accounts

- **View** — The Accounts page lists all accounts with their type (asset, liability, expense, income).
- **Add account** — Enter Account ID and Type. Use this to create income accounts (e.g. Interest, Dividends) or cash/external accounts before recording income or journal entries.
- **Edit** — Change account ID or type. If you change the ID, all journal lines referencing that account are updated.
- **Delete** — Only allowed when the account has no journal lines (not used in any transaction). If in use, the app will not delete and will show a message.

---

## 9. Journal

- **View** — The Journal page lists general journal entries (type: journal): Date, Description, number of lines, total amount. Expand a row to see the transaction and all journal lines.
- **Add journal entry** — Opens a dialog: enter Date, optional Description, and two or more **lines** (Account, Debit, Credit). Total debits must equal total credits; the Add button is enabled only when balanced. Use “Add line” / “Remove line” for multi-line entries.
- **Import CSV** / **Export CSV** — Export produces one row per line with columns EntryId, Date, Description, Account, Debit, Credit (same EntryId for all lines of one entry). Import groups rows by EntryId and creates one journal entry per group; only balanced entries (at least two lines, debits = credits) are imported.
- **Delete** — Removes the journal entry and all its lines.

Use journal entries for adjustments, corrections, or any entry that doesn't fit the expense, transfer, or income flows.

---

## 10. Ledger

The Ledger is the **account-level journal**: every debit and credit that touches an account.

1. Open **Ledger** and choose an **Account** from the dropdown (all accounts that exist in the system).
2. The app shows:
   - **Current balance** for that account (using the balance rule for the account type).
   - A table: **Date**, **Description**, **Debit**, **Credit**, **Balance** (running balance after each line).
3. Description comes from the transaction (for expenses: payee; for transfers/income/journal: memo or description, or blank).
4. Rows are sorted by date.

**Accountant use:** Reconcile an account (e.g. checking or a credit card) by comparing the Ledger’s current balance and lines to your bank or card statement.  
**Auditor use:** Use the Ledger to verify that every transaction is properly double-entered and that balances are consistent with the underlying journal lines.

---

## 11. Summary reports

- Open **Summary** and set the **From** and **To** dates. The report includes only expenses whose date falls in that range (transfers are excluded from Summary).
- **Grand total** is the sum of expense amounts (negative) in the range.
- **By category** — Table and pie chart: category, count, total, % of total. Sort by column as needed.
- **By account** — Table and pie chart: payment account, count, total, % of total.

Use Summary to analyze spending by category or by payment account over a period (e.g. month or quarter).

---

## 12. Export and backup

- **Expenses** → **Export CSV**: Exports the **filtered** expense list (respecting date range and filters).  
  Use “From”/“To” to define the period, then export.
- **Transfers** → **Export CSV**: Exports all transfer entries (Date, From account, To account, Amount, Memo).
- **Income** → **Export CSV**: Exports all income entries (Date, To account, Income account, Amount, Memo).
- **Journal** → **Export CSV**: Exports all journal entry lines (EntryId, Date, Description, Account, Debit, Credit).
- **Clear all** (Expenses page) removes all accounts, transactions, and journal lines from the app. There is no undo.  
  **Best practice:** Export CSV for each area (and optionally a full set) before using Clear all or before any bulk change.

Data lives only in the browser; if you clear site data or use another device, you need these CSV (or other) backups to restore or reconstruct records.

---

## 13. Reconciliation and audit practices

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
   - In **Ledger**, confirm that the same transfer appears as a **credit** on the “from” account and a **debit** on the “to” account for the same amount and date (source decreases, destination increases).

### Audit and controls

- **Double-entry**: Every expense, transfer, income, and journal entry is stored as a transaction with balanced debits and credits. The Ledger exposes this so an auditor can verify completeness and consistency.
- **Traceability**: Each expense row ties to one transaction and two journal lines (category + payment account). Editing or deleting an expense updates or removes that transaction and its lines.
- **Duplicate handling**: Imports that match same date/to/from but different category or amount are added and flagged “Possible duplicate.” Review and use “Not a duplicate” or Edit/Delete so the books reflect intent.
- **Backup and retention**: Rely on **Export CSV** and date-range exports for backups and retention. Store exports in a secure location and align retention with your policy.

### Migration from older data

If the app finds **legacy** expense/category/account data (from an older version) and there are no existing transactions, it runs a **one-time migration**: it creates accounts (with types), one expense transaction per legacy expense, and two journal lines each, then removes the legacy keys. After that, only accounts, transactions, and journal lines are used.  
**Auditor note:** Post-migration, export a full expense CSV and spot-check a sample against the Ledger to confirm migration integrity.

---

## 14. CSV format reference

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
- **Transfers / Income / Journal:** Not included in expense export; use the respective pages to export those.

### Import / Export (Transfers)

- **Columns:** Date, From account, To account, Amount, Memo  
- **Amount:** Positive number (e.g. 100.00 or $100.00).  
- **Import:** Exact duplicates (same date, from, to, amount) are skipped.

### Import / Export (Income)

- **Columns:** Date, To account, Income account, Amount, Memo  
- **Amount:** Positive number.  
- **Import:** Exact duplicates are skipped. Create income-type accounts on Accounts first if needed.

### Import / Export (Journal)

- **Export columns:** EntryId, Date, Description, Account, Debit, Credit (one row per journal line; same EntryId for all lines of one entry).  
- **Import:** Same columns. Rows with the same EntryId are grouped into one journal entry. Only entries with at least two lines and total debits = total credits are imported.


---

*This guide reflects the application’s double-entry model: Expenses, Transfers, Income, Accounts, Journal, Ledger, Summary, and CSV import/export for each area. Use it to run the books and to support reconciliation and audit.*
