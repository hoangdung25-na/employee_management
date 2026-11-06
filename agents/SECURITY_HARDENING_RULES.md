# Security Hardening Rules

**Project:** Enterprise Employee Management System (HRFlow)  
**Target:** Backend (.NET 8 Web API), Frontend (Next.js 14+ App Router) & SQL Server  
**Context:** Derived from [AGENTS.md](AGENTS.md)

---

## 7 Mandatory Security Layers

All implementations **must** comply with these 7 defense layers:

### 1. Rate Limiting
- Enforce ASP.NET Core `UseRateLimiter` globally.
- Apply strict limits on authentication endpoints (e.g., `/api/auth/login` capped at 5–10 requests/minute per IP) to mitigate brute-force and DDoS attacks.

### 2. Strict CORS Policy
- **Never** use `AllowAnyOrigin()` in production or alongside `AllowCredentials()`.
- Explicitly whitelist trusted frontend origins (`http://localhost:3000` for local dev; verified domain for production) with constrained `WithMethods` and `WithHeaders`.

### 3. Injection Prevention (SQL / Command)
- **Parameterized Queries Only:** Use EF Core LINQ or `FromSqlInterpolated`.
- **Zero Raw String Concatenation:** Never interpolate user input into `FromSqlRaw` or `ExecuteSqlRawAsync`.
- **Dynamic Sorting Whitelist:** Validate dynamic `SortBy` / `SortOrder` values against an allowed column whitelist (or `switch` statement); never pass client input directly into SQL strings.

### 4. Network Isolation & Firewall
- Keep SQL Server port `1433` private to the internal network; never expose it to the public internet.
- Restrict Backend API to HTTPS behind a reverse proxy / Web Application Firewall (WAF).

### 5. JWT, 5-Role RBAC & IDOR Prevention
- Enforce authentication & role checks (`SUPER_ADMIN`, `HR_MANAGER`, `HR_STAFF`, `MANAGER`, `EMPLOYEE`).
- **Row-Level Ownership (Anti-IDOR):** For sensitive resources (profiles, salary, attendance, leaves, contracts, KPIs), verify that:
  - An `EMPLOYEE` can access only their own records (`jwt.employeeId == target.EmployeeId`).
  - A `MANAGER` can access only direct subordinates (`DirectManagerId == manager.EmployeeId`).

### 6. CSRF Mitigation & Safe State Mutations
- For cookie-stored tokens, set `HttpOnly = true`, `Secure = true`, and `SameSite = Strict` (or `Lax`) with anti-forgery tokens.
- Restrict state mutations (create, update, delete, approve) to proper HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) with valid bearer authorization.

### 7. XSS Prevention & Security Headers
- **Backend Headers:** Use `SecurityHeadersMiddleware` to return `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Input Validation:** Sanitize and validate all inputs with FluentValidation.
- **Frontend Safeguards:** Rely on React JSX auto-escaping; **strictly forbid** `dangerouslySetInnerHTML` with user-supplied text (`FullName`, `Notes`, `Feedback`).
