# COBOL Account Management System Test Plan

This test plan captures the current business logic behavior of the COBOL application so business stakeholders can validate functional parity during the ongoing Node.js transformation.

## Scope

The plan covers:
- Main menu navigation and control flow
- Balance inquiry
- Credit processing
- Debit processing
- Insufficient funds handling
- Exit behavior
- Invalid menu option handling
- Data persistence behavior inside the current running session

## Test Cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Display main menu options on startup | Application is launched | 1. Start the program. | Menu is shown with exactly 4 options: 1 View Balance, 2 Credit Account, 3 Debit Account, 4 Exit, and prompt to enter choice 1-4. | TBD | TBD | Baseline UI/interaction check for parity. |
| TC-002 | Handle invalid menu choice below range | Program is running at menu prompt | 1. Enter `0` at menu prompt. | Message `Invalid choice, please select 1-4.` is displayed and menu is shown again. | TBD | TBD | Validates lower bound input handling. |
| TC-003 | Handle invalid menu choice above range | Program is running at menu prompt | 1. Enter `5` at menu prompt. | Message `Invalid choice, please select 1-4.` is displayed and menu is shown again. | TBD | TBD | Validates upper bound input handling. |
| TC-004 | View default balance before any transactions | Fresh program run with no credit/debit yet in current run | 1. Enter `1` for View Balance. | Current balance is displayed as `1000.00`. | TBD | TBD | Confirms initial in-memory account value. |
| TC-005 | Credit account with a valid amount | Program is running; balance known (for example 1000.00) | 1. Enter `2` for Credit Account. 2. Enter credit amount `250.00`. 3. Enter `1` to View Balance. | Credit confirmation is displayed and new balance is `1250.00`; subsequent balance inquiry also shows `1250.00`. | TBD | TBD | Verifies READ + ADD + WRITE flow. |
| TC-006 | Debit account with amount less than balance | Program is running; starting balance in session is `1000.00` | 1. Enter `3` for Debit Account. 2. Enter debit amount `200.00`. 3. Enter `1` to View Balance. | Debit confirmation is displayed and new balance is `800.00`; subsequent balance inquiry shows `800.00`. | TBD | TBD | Verifies READ + SUBTRACT + WRITE flow. |
| TC-007 | Debit account with amount equal to balance | Program is running; set balance to `300.00` first (for example by debiting from default or controlled setup) | 1. Enter `3` for Debit Account. 2. Enter debit amount `300.00`. 3. Enter `1` to View Balance. | Debit is allowed when amount equals balance; new balance becomes `0.00`; balance inquiry shows `0.00`. | TBD | TBD | Validates `>=` comparison rule. |
| TC-008 | Prevent debit when amount exceeds balance | Program is running; balance is `1000.00` | 1. Enter `3` for Debit Account. 2. Enter debit amount `1000.01`. 3. Enter `1` to View Balance. | Message `Insufficient funds for this debit.` is shown; balance remains unchanged at `1000.00`. | TBD | TBD | Confirms no WRITE on insufficient funds path. |
| TC-009 | Verify multiple credits accumulate correctly | Program is running; balance starts at `1000.00` | 1. Enter `2`, credit `100.00`. 2. Enter `2`, credit `50.50`. 3. Enter `1` to View Balance. | Final balance is `1150.50`. | TBD | TBD | Validates repeated credit updates in same run. |
| TC-010 | Verify mixed credit and debit sequence | Program is running; balance starts at `1000.00` | 1. Enter `2`, credit `200.00`. 2. Enter `3`, debit `75.25`. 3. Enter `1` to View Balance. | Final balance is `1124.75`. | TBD | TBD | Validates transaction sequencing logic. |
| TC-011 | Verify balance read does not modify stored value | Program is running; perform one update first (for example credit `10.00`) | 1. Enter `1` to View Balance. 2. Enter `1` again to View Balance. | Both readings show identical value; no unexpected balance change after read-only operation. | TBD | TBD | Ensures READ operation is non-mutating. |
| TC-012 | Verify menu loop continues after each non-exit action | Program is running | 1. Execute option `1`. 2. Execute option `2` with amount `1.00`. 3. Execute option `3` with amount `1.00`. | After each action, control returns to menu until user chooses Exit. | TBD | TBD | Validates loop control via continue flag. |
| TC-013 | Exit application from menu | Program is running at menu prompt | 1. Enter `4` for Exit. | Program exits loop and displays `Exiting the program. Goodbye!` then terminates. | TBD | TBD | Confirms graceful termination path. |
| TC-014 | Verify no cross-run persistence (current implementation behavior) | Run 1 has modified balance; then program is restarted for Run 2 | 1. In Run 1, credit `100.00` (balance becomes `1100.00`). 2. Exit program. 3. Start program again. 4. View Balance. | On new run, balance starts again at `1000.00` (in-memory storage resets on restart). | TBD | TBD | Important baseline behavior to align with business expectations in Node.js design. |
| TC-015 | Debit full remaining amount after prior transactions | Program is running; set balance to known non-default amount (for example `450.00`) | 1. Enter `3` for Debit Account. 2. Enter debit amount equal to current balance (`450.00`). 3. View Balance. | Debit succeeds and resulting balance is `0.00`. | TBD | TBD | Re-validates boundary condition after transaction history. |

## Notes For Node.js Modernization Validation

- Use these test cases as business acceptance checks first, then map each case to automated unit/integration tests.
- Keep expected messages and numeric precision aligned with current COBOL behavior unless stakeholders intentionally approve a behavior change.
- Re-run TC-014 with stakeholders to decide whether restart persistence should remain the same or change in the Node.js implementation.
