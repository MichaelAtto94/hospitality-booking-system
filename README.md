# ZedStay Hospitality Booking & Management System

Final-year Computer Science project for Zambian hotels and lodges.

## Setup

1. Install Node.js LTS and PostgreSQL.
2. In pgAdmin, create a database named `hospitality_booking_db`.
3. Open `.env` and replace `YOUR_POSTGRES_PASSWORD`.
4. Run `npx prisma migrate dev --name init`.
5. Run `npm run dev`.
6. Open http://localhost:3000 and http://localhost:3000/dashboard.

## Main modules

- Authentication and role-based access
- Properties, room types and rooms
- Availability and booking calendar
- Guests, check-in and check-out
- Cash, card, bank and mobile-money payments
- Receipts, invoices, expenses and reports
- Housekeeping and maintenance
- Audit trail and management dashboard
