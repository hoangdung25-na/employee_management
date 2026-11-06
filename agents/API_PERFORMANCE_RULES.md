# API & Database Performance Rules

**Project:** Enterprise Employee Management System (HRFlow)  
**Target:** Backend (.NET 8 Web API, MediatR/CQRS, EF Core 8) & SQL Server 2022  
**Context:** Derived from [AGENTS.md](AGENTS.md)

---

## 8 Mandatory Performance Rules

All query, command, and API implementations **must** adhere to these 8 rules:

### 1. Prevent N+1 Queries
- **Never** execute database queries inside loops (`foreach` / `for`).
- Fetch related data in a single round-trip using DTO projection (`.Select(...)`) or `.Include(...)`.

### 2. Index Optimization (SARGable Queries)
- **Index All Filter/Join Keys:** Ensure indices exist for Foreign Keys (`DepartmentId`, `PositionId`, `DirectManagerId`, `EmployeeId`), sorting columns (`EmployeeCode`, `FullName`, `HireDate`), and soft-delete filters (`WHERE IsDeleted = 0`).
- **Keep Queries SARGable:** Do not wrap indexed columns in functions (e.g., avoid `LOWER(Column) = ...`).

### 3. Enforce Pagination & DTO Projection
- **No Unbounded Queries:** Never call `.ToListAsync()` without pagination.
- **Mandatory Pagination:** Use `PagedResult<T>` (`.Skip().Take()`) with `MaxPageSize <= 100`.
- **Project Early:** Use `.Select(e => new Dto(...))` to load only required columns; avoid mapping full entities in memory.

### 4. Read-Only Tracking & Existence Checks
- **AsNoTracking:** Use `.AsNoTracking()` on **all** read-only queries.
- **Existence Checks:** Use `.AnyAsync(...)` instead of `.CountAsync() > 0` or `.FirstOrDefaultAsync() != null`.

### 5. Prevent Deadlocks & Blocking
- **Short Transactions:** Keep `BeginTransactionAsync` scopes as short as possible. Never invoke external HTTP, email, or I/O calls inside a database transaction.
- **Consistent Order:** Lock and update tables in a uniform order across all handlers to eliminate circular deadlocks.

### 6. Avoid Cartesian Explosion
- When joining multiple 1-N collections in EF Core, use `.AsSplitQuery()` to prevent exponential result-set growth.

### 7. Asynchronous Flow & Cancellation
- **Pass CancellationTokens:** Propagate `CancellationToken` through Controller ➔ MediatR ➔ EF Core (`ToListAsync(ct)`, `SaveChangesAsync(ct)`).
- **Never Block:** Never use `.Result` or `.Wait()`.
- **DbContext Thread-Safety:** Never run concurrent operations on the same `DbContext` instance.

### 8. Concurrency & Race Conditions
- Use atomic locks (`UPDLOCK, HOLDLOCK`), DB unique constraints, or `ROWVERSION` concurrency tokens when generating sequence codes (`EMP-xxxxx`) or updating shared metrics (leave balances, budgets).
- Catch and handle `DbUpdateConcurrencyException`.
