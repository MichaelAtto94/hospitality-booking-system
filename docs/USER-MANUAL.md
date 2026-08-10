# User manual

## First-time setup

1. Start the system with Docker Compose.
2. Open `http://localhost:3000/setup`.
3. Create the first property and administrator.
4. Sign in and configure property details.
5. Create room types, rooms and staff accounts.

## Daily workflow

### Create a booking

1. Open **Guests** and create or select a guest.
2. Open **Bookings** and choose dates and an available room.
3. Confirm guest numbers, source and notes.
4. Save or approve the reservation according to staff permissions.

### Check in a guest

1. Open **Front Desk** and select today's arrival.
2. Verify guest identity, dates and payment position.
3. Select **Check in**. The room becomes occupied.

### Record a payment

1. Open the booking or **Payments**.
2. Enter the amount, method and transaction reference where applicable.
3. Save and issue the generated receipt.

### Check out a guest

1. Confirm the booking balance and departure details.
2. Select **Check out**.
3. The room enters the cleaning workflow.
4. Housekeeping marks it available after cleaning is completed.

## Staff roles

| Role | Typical responsibility |
| --- | --- |
| Super Administrator | Full configuration and oversight |
| Manager | Operations, staff supervision and reporting |
| Receptionist | Guests, bookings, arrivals and departures |
| Accountant | Payments, expenses, receipts and reports |
| Housekeeper | Cleaning status and room readiness |

## Operational rules

- Each staff member must use their own account.
- Never share passwords or Docker environment files.
- Verify the guest and booking before accepting payment.
- Do not delete financial evidence to correct a mistake; use the supported status or refund workflow.
- Create regular backups and keep an off-computer copy.
