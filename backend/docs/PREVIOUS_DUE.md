# Previous year due behavior

This document explains how `due2023` is treated in the system.

- The system previously used `due2023` to represent a prior-year balance, but we now store that initial amount in a year-scoped field named `due2023` (as an initial due for the member).
- Payments that have a `date` falling in 2023 will be applied to reduce `due2023` automatically when recorded.
- If a payment dated in 2023 is deleted, the corresponding amount is added back to `due2023`.
- The member info API exposes two explicit values:
  - `previousYearDue`: derived from `due2023` (or falls back to `due2023` for compatibility).
  - `totalDueExcludingPrevious`: the current total (`totalDue`) minus `previousYearDue`, so the UI can show previous-year due separately.

Notes for admins:
- If you need to adjust previous-year balances manually, update `member.due2023` via the admin interface or directly in the DB with caution.
- This behavior is implemented in `backend/controllers/accountController.js` and `backend/controllers/memberController.js`.
