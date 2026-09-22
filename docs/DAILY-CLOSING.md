# End-of-Day Financial Closing

## Purpose

The daily closing module reconciles completed receipts, refunds, expenses and physical cash for one Zambian business day. It creates an immutable financial snapshot that management can approve, export and audit.

## Access

| Role | View figures | Submit | Approve | Reopen | Export PDF |
|---|---:|---:|---:|---:|---:|
| Super Administrator | Yes | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No | Yes |
| Accountant | Yes | Yes | No | No | Yes |
| Receptionist | No | No | No | No | No |
| Housekeeper | No | No | No | No | No |

The user must confirm their own account password before figures are revealed. The financial unlock expires after five minutes. Submission, approval, reopening and PDF export require the password again.

## Calculations

- Gross receipts: cash + card + bank transfer + MTN + Airtel + Zamtel payments received during the selected business day.
- Refunds: payments whose refund time falls within the selected business day.
- Refunds are sourced from approved `Refund` records, so partial refunds and their actual approval dates are reported correctly.
- Net collection: gross receipts - refunds - expenses.
- Expected cash: cash receipts - cash refunds - cash-paid expenses.
- Cash variance: physical cash counted - expected cash.

Business-day boundaries use the Africa/Lusaka UTC+02:00 timezone.

## Workflow

1. Record all payments and expenses, including the method used for each expense.
2. Open **Finance → Daily closing**.
3. Confirm the signed-in user's password.
4. Select the business date and review each channel.
5. Enter the physical cash counted and any handover notes.
6. Submit the figures for approval.
7. A manager or super administrator confirms their password and approves the report.
8. Export the password-protected report action to PDF.
9. If correction is essential, only the super administrator can reopen an approved day. The reopening is retained in the audit trail.

## Audit events

- `SUBMIT_DAILY_CLOSE`
- `APPROVE_DAILY_CLOSE`
- `REOPEN_DAILY_CLOSE`
- `EXPORT_DAILY_CLOSE_PDF`

## Deployment

The migration `20260811160000_add_daily_financial_close` is applied automatically by the application container during startup using `prisma migrate deploy`.
