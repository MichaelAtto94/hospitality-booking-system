# Payment Refund Workflow

Refunds never overwrite or delete an original payment. A separate refund record preserves the complete accounting history.

## Permissions

- Receptionist and Accountant: submit a refund request after confirming their own password.
- Manager and Super Administrator: approve or reject a pending request after confirming their own password.
- Housekeeper: no payment or refund access.

## Process

1. Open **Payments & refunds**.
2. Locate the original receipt and select **Refund**.
3. Enter a full or partial amount, refund method, reason, transaction reference and notes.
4. Confirm the signed-in user's password and submit.
5. Management reviews the request and confirms approval or rejection with their password.
6. Approved refunds appear in the end-of-day report on the approval date.
7. When approved refunds equal the original receipt value, the payment becomes fully refunded.

Pending requests reserve their amount, preventing another request from exceeding the original payment. Every request, approval and rejection is recorded in the audit trail.
