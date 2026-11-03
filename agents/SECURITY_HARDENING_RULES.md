# QUY TẮC BẢO MẬT HỆ THỐNG BẮT BUỘC (SECURITY HARDENING RULES)
**Dự án:** Enterprise Employee Management System (HRFlow)  
**Áp dụng cho:** Backend (.NET 8 Web API), Frontend (Next.js 14+ App Router) & Hạ tầng SQL Server  
**Tài liệu gốc:** Tách từ [AGENTS.md](file:///d:/employee%20management/agents/AGENTS.md)  

---

## 7 LỚP PHÒNG THỦ BẢO MẬT BẮT BUỘC

AI Agent và Developer khi triển khai Backend (.NET 8) và Frontend (Next.js) **BẮT BUỘC** phải tuân thủ 7 lớp phòng thủ bảo mật sau:

1. **Rate Limiting (Giới hạn tần suất gọi API):**
   * Áp dụng ASP.NET Core Rate Limiter (`UseRateLimiter`) cho toàn bộ API.
   * Thiết lập ngưỡng nghiêm ngặt đặc biệt cho nhóm `/api/auth/login` (ví dụ: tối đa 5–10 requests/phút theo IP) để chống tấn công Brute-force và DDoS.
2. **CORS (Cross-Origin Resource Sharing chặt chẽ):**
   * Tuyệt đối **KHÔNG** dùng `AllowAnyOrigin()` trên môi trường Production hoặc khi có `AllowCredentials()`.
   * Chỉ Whitelist chính xác domain của Frontend Next.js (ví dụ: `http://localhost:3000` ở Development và domain nội bộ chính thức ở Production), giới hạn rõ `WithMethods` và `WithHeaders`.
3. **Chống SQL Injection & NoSQL Injection:**
   * Bắt buộc dùng 100% **Parameterized Queries** thông qua LINQ của EF Core hoặc `FromSqlInterpolated`.
   * Tuyệt đối **CẤM** nối chuỗi trực tiếp (`string.Format`, `$"SELECT ... {input}"`) vào `FromSqlRaw` hoặc `ExecuteSqlRawAsync`.
   * Với tham số sắp xếp động (`SortBy`, `SortOrder`), bắt buộc đối chiếu qua `switch` / Whitelist các cột hợp lệ, không bao giờ truyền thẳng chuỗi từ client vào câu lệnh SQL.
4. **Firewall & Network Segmentation (Tường lửa & Cô lập mạng):**
   * SQL Server chỉ mở cổng nội bộ cho tầng Backend API, tuyệt đối không public cổng `1433` ra Internet.
   * Backend API chỉ lắng nghe trên cổng HTTPS được cấu hình và đặt sau Reverse Proxy / Application Firewall (WAF).
5. **Xác thực JWT, 5-Role RBAC & Chống IDOR (Row-Level Data Ownership):**
   * Hệ thống kết hợp **Back-Office HRM** và **Employee Self-Service (ESS)** qua xác thực JWT + RBAC 5 vai trò (`SUPER_ADMIN`, `HR_MANAGER`, `HR_STAFF`, `MANAGER`, `EMPLOYEE`).
   * Mọi API liên quan đến dữ liệu cá nhân (hồ sơ, lương, hợp đồng, chấm công, nghỉ phép, KPI) bắt buộc kiểm tra quyền sở hữu cấp dòng (`jwt.employeeId == target.EmployeeId`) đối với `EMPLOYEE` hoặc quan hệ cấp dưới trực tiếp (`DirectManagerId`) đối với `MANAGER` để triệt tiêu lỗ hổng IDOR.
6. **Phòng chống CSRF (Cross-Site Request Forgery):**
   * Nếu lưu Token trong Cookie, bắt buộc cấu hình `HttpOnly = true`, `Secure = true`, `SameSite = Strict` (hoặc `Lax`) kết hợp Anti-Forgery Token.
   * Các thao tác làm thay đổi dữ liệu (Create, Update, Terminate, Approve) bắt buộc dùng đúng HTTP Verb (`POST`, `PUT`, `PATCH`, `DELETE`) và kiểm tra header `Authorization: Bearer <token>` hợp lệ.
7. **Phòng chống XSS (Cross-Site Scripting):**
   * **Backend:** Cấu hình `SecurityHeadersMiddleware` trả về đầy đủ các header bảo mật: `Content-Security-Policy (CSP)`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. Validate và làm sạch dữ liệu đầu vào bằng FluentValidation.
   * **Frontend (Next.js):** Tận dụng cơ chế tự động escape của React JSX; tuyệt đối **CẤM** sử dụng `dangerouslySetInnerHTML` với dữ liệu do người dùng nhập vào (`FullName`, `Notes`, `TerminationReason`, `Feedback`).

