# Testing and acceptance checklist

Record the tester, date, result and evidence for every test.

| ID | Test | Expected result | Status |
| --- | --- | --- | --- |
| T01 | Log in with valid account | Dashboard opens | Pending |
| T02 | Log in with wrong password | Access is denied safely | Pending |
| T03 | Open protected URL when logged out | User is redirected or receives 401 | Pending |
| T04 | Create guest with valid information | Guest appears in guest list | Pending |
| T05 | Create room and room type | Room becomes available | Pending |
| T06 | Create valid booking | Unique booking number is issued | Pending |
| T07 | Book the same room for overlapping dates | Request is rejected | Pending |
| T08 | Exceed room capacity | Request is rejected | Pending |
| T09 | Check in confirmed booking | Booking and room statuses update | Pending |
| T10 | Record cash payment | Payment and receipt are stored | Pending |
| T11 | Record mobile-money payment | Method and reference are stored | Pending |
| T12 | Check out occupied booking | Room moves to cleaning | Pending |
| T13 | Complete housekeeping task | Room becomes available | Pending |
| T14 | Receptionist opens restricted admin feature | Access is denied | Pending |
| T15 | Generate management report | Correct property totals are shown | Pending |
| T16 | Create database backup | Valid `.dump` file is produced | Pending |
| T17 | Run production build | Build completes without errors | Pending |
| T18 | Restart Docker services | Application data remains available | Pending |

## Final acceptance criteria

- No critical or high-severity unresolved defects.
- All role restrictions verified.
- Booking conflict and financial calculations tested.
- Backup successfully created and restoration demonstrated on test data.
- Production build and GitHub Actions workflow pass.
- Supervisor demonstration data contains no real sensitive guest information.
