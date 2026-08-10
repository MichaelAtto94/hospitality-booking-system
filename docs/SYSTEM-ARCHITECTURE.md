# System architecture

## Architectural style

The application uses a three-layer web architecture:

1. Presentation layer: responsive Next.js pages and dashboard components.
2. Application layer: authenticated API routes, validation and business rules.
3. Data layer: Prisma ORM and PostgreSQL.

## Main modules

| Module | Responsibility |
| --- | --- |
| Authentication | Login, sessions, password security and account controls |
| Access control | Restricts features by staff role and property |
| Guests | Stores contact and identification information |
| Rooms | Manages room types, prices, capacity and operational status |
| Bookings | Availability checks, reservations, approval and status changes |
| Front desk | Arrivals, departures, check-in and check-out |
| Payments | Receipts, payment methods, balances and transaction references |
| Housekeeping | Cleaning workflow and room readiness |
| Finance | Expenses, revenue summaries and operational reports |
| Audit | Records important staff actions for accountability |

## Security controls

- Passwords are stored as secure hashes, never plain text.
- Server-side authorization is required for protected pages and APIs.
- Property filtering prevents one property's staff from accessing another's data.
- Zod validates untrusted request data.
- Prisma uses parameterized database operations.
- Audit logs record important changes.
- Environment files keep secrets outside source control.
- Production headers, rate controls and health checks support deployment safety.

## Core booking rule

A room has a conflict when an active booking starts before the proposed
check-out and ends after the proposed check-in. Cancelled, checked-out and
no-show records do not block future availability.

## Deployment topology

The Docker deployment contains an application container and a PostgreSQL
container. PostgreSQL data is stored in a named volume. The application waits
for the database health check, applies migrations and then starts Next.js.
