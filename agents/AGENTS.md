# AGENT INSTRUCTIONS & CLEAN ARCHITECTURE SKILLS
**Dự án:** Enterprise Employee Management System (HRFlow)  
**Bản chất:** Hệ thống Quản trị Nhân sự Toàn diện kết hợp Cổng Tự phục vụ Nhân viên (**Hybrid Back-Office HRM & Employee Self-Service - ESS**). Hỗ trợ 5 vai trò (`SUPER_ADMIN`, `HR_MANAGER`, `HR_STAFF`, `MANAGER`, `EMPLOYEE`) với cơ chế cô lập dữ liệu cấp dòng (Row-Level Data Ownership) bảo vệ tuyệt đối thông tin lương bổng và hồ sơ riêng tư.  
**Định danh khóa chính:** Sử dụng **`GUID` (`UNIQUEIDENTIFIER`)** làm Khóa chính (`Id`) và Khóa ngoại (`ForeignKey`) cho toàn bộ thực thể trong CSDL và ứng dụng.  
**Kiến trúc:** Clean Architecture (4 Tầng: Domain, Application, Infrastructure, API)  
**Công nghệ:** .NET 8 / C# 12, Next.js 14+ (App Router, TailwindCSS, HRFlow Design System), SQL Server  

---

## 1. NGUYÊN TẮC PHỤ THUỘC (DEPENDENCY RULE)

Trong kiến trúc Clean Architecture, **mọi sự phụ thuộc (Dependencies) chỉ được phép trỏ VÀO TRONG, tuyệt đối không được trỏ RA NGOÀI**:

```
                    ┌───────────────────────────┐
                    │       Presentation        │
                    │   EmployeeManagement.Api  │
                    └─────────────┬─────────────┘
                                  │ (Trỏ vào)
         ┌────────────────────────┼────────────────────────┐
         │                        ▼                        │
         │          ┌───────────────────────────┐          │
         │          │        Application        │          │
         │          │   (Use Cases, DTOs, Intf) │          │
         │          └─────────────┬─────────────┘          │
         ▼                        │ (Trỏ vào)              │
┌──────────────────┐              ▼                        │
│  Infrastructure  │────► ┌───────────────────────────┐    │
│ (EF Core, SQL DB)│      │          Domain           │◄───┘
└──────────────────┘      │ (Entities, Enums, Rules)  │
                          └───────────────────────────┘
```

* **Domain**: Không tham chiếu đến bất kỳ project nào khác (Zero External Dependencies).
* **Application**: Chỉ tham chiếu đến **Domain**.
* **Infrastructure**: Tham chiếu đến **Application** và **Domain**.
* **Api (Presentation)**: Tham chiếu đến **Application** và **Infrastructure** (chỉ để đăng ký Dependency Injection trong `Program.cs`).

---

## 2. NHIỆM VỤ CHI TIẾT CỦA 4 TẦNG TRONG SOLUTION

### 🟢 1. Tầng Domain (`EmployeeManagement.Domain`)
* **Trọng trách:** Chứa trái tim nghiệp vụ, logic cốt lõi của doanh nghiệp. Độc lập với CSDL, Framework, và UI.
* **Thành phần:**
  * `Entities`: `Department.cs`, `Position.cs`, `Employee.cs`, `User.cs`, `Role.cs`, `Permission.cs`.
  * `Common`: `BaseEntity.cs` (`Guid Id = Guid.NewGuid()`, `DateTime CreatedAt`, `DateTime? UpdatedAt`, `bool IsDeleted`).
  * `Enums`: `EmployeeStatus` (`Probation`, `Active`, `Suspended`, `Terminated`), `Gender`.
  * `Exceptions`: `DomainException.cs` (ví dụ: lỗi tuổi chưa đủ 18).

### 🔵 2. Tầng Application (`EmployeeManagement.Application`)
* **Trọng trách:** Điều phối các Use Case quản trị nhân sự, chứa luồng xử lý nghiệp vụ, trung chuyển giữa API và Database.
* **Thành phần:**
  * `Interfaces`: `IApplicationDbContext.cs`, `IAuthService.cs`, `IEmployeeService.cs`, `IDepartmentService.cs`, `IPasswordHasher.cs`, `IJwtTokenGenerator.cs`.
  * `DTOs`: Request DTOs (`CreateEmployeeDto`, `LoginRequestDto`) và Response DTOs (`EmployeeDetailDto`, `AuthResponseDto`) sử dụng kiểu `Guid` cho các trường Id.
  * `Common`: `ApiResponse<T>.cs`, `PagedResult<T>.cs`.
  * `Validators`: Các bộ kiểm tra dữ liệu đầu vào bằng **FluentValidation** (ví dụ: `CreateEmployeeDtoValidator`).
  * `Exceptions`: `NotFoundException.cs`, `ConflictException.cs`, `ValidationException.cs`.

### 🟡 3. Tầng Infrastructure (`EmployeeManagement.Infrastructure`)
* **Trọng trách:** Hiện thực hóa các Interface được định nghĩa ở tầng Application, tương tác với SQL Server, BCrypt, JWT.
* **Thành phần:**
  * `Data`: `AppDbContext.cs` triển khai `IApplicationDbContext`.
  * `Configurations`: Fluent API Configurations (`EmployeeConfiguration.cs`, `DepartmentConfiguration.cs`) cấu hình `Guid` với `NEWSEQUENTIALID()`.
  * `Migrations`: Các bản Entity Framework Core Migrations.
  * `Identity & Security`: `JwtTokenGenerator.cs`, `PasswordHasher.cs`.
  * `Services`: Hiện thực các Service giao tiếp Database.

### 🔴 4. Tầng API / Presentation (`EmployeeManagement.Api`)
* **Trọng trách:** Cổng giao tiếp ngoại vi, tiếp nhận HTTP Request từ Next.js, routing, xác thực JWT, kiểm tra quyền Admin/HR và trả về HTTP Response.
* **Thành phần:**
  * `Controllers`: Controller mỏng (`AuthController`, `DepartmentsController`, `EmployeesController`, `PositionsController`). Các route dạng `/api/employees/{id:guid}`.
  * `Middlewares`: `ExceptionMiddleware.cs` (bắt toàn bộ ngoại lệ tập trung), `SecurityHeadersMiddleware.cs`.
  * `Extensions`: Cấu hình Dependency Injection (`ServiceCollectionExtensions.cs`, `JwtAuthenticationExtensions.cs`).
  * `Program.cs`: Điểm khởi chạy ứng dụng, cấu hình Middleware pipeline, Swagger, CORS.

---

## 3. QUY TẮC CỐT LÕI BẮT BUỘC KHI VIẾT CODE (GOLDEN RULES)

1. **Chuẩn định danh Khóa chính**: Toàn bộ Entity sử dụng `Guid Id`. Ở SQL Server dùng `UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID()`.
2. **Song hành Id (Kỹ thuật) & Code (Nghiệp vụ)**:
   * `Id (Guid)`: Dùng cho database, khóa ngoại, routing backend.
   * `Code (String)`: Dùng cho nghiệp vụ con người (`EmployeeCode`, `DepartmentCode`, `PositionCode`, `RoleCode`).
3. **Bảo mật Dữ liệu Riêng tư & Cô lập Dữ liệu ESS (Row-Level Data Ownership)**:
   * Hệ thống hỗ trợ Employee Self-Service (ESS): Nhân viên (`EMPLOYEE`) chỉ được xem/thao tác trên dữ liệu có `EmployeeId` trùng khớp với `employeeId` trong JWT Claim của chính mình (chống IDOR).
   * Quản lý (`MANAGER`) chỉ được phê duyệt nghỉ phép, timesheet và chấm KPI cho nhân sự cấp dưới trực tiếp (`DirectManagerId`) hoặc thuộc phòng ban mình quản lý.
   * Dữ liệu lương toàn công ty chỉ dành cho `SUPER_ADMIN` và `HR_MANAGER`.
4. **Clean Controller**: Controller không bao giờ chứa logic `if/else` nghiệp vụ hay trực tiếp gọi `_context.Employees.Add()`. Toàn bộ phải qua Service/Handler ở Application layer.
5. **Entity Isolation**: Tuyệt đối không bao giờ trả Entity ra ngoài Controller. Luôn luôn map Entity ➔ DTO.
6. **Soft Delete & Query Filter**:
   * Mọi Entity kế thừa `BaseEntity` (có cờ `IsDeleted`).
   * Trong `AppDbContext`, cấu hình Global Query Filter: `builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted)`.
7. **No Cascade Delete**: Trong `OnModelCreating`, toàn bộ khóa ngoại dùng `OnDelete(DeleteBehavior.Restrict)` hoặc `DeleteBehavior.NoAction`.
8. **Exact Age Calculation**: Bắt buộc dùng `DateOfBirth.AddYears(18) <= HireDate` khi kiểm tra tuổi lao động.
9. **Unified API Contract**: Mọi endpoint bắt buộc trả về `ApiResponse<T>` hoặc `PagedResult<T>` theo chuẩn trong [REST_API_SPECIFICATION.md](file:///d:/employee%20management/docs/REST_API_SPECIFICATION.md).

---

## 4. MA TRẬN PHÂN QUYỀN THỰC TẾ (5-ROLE RBAC & ESS CHEAT-SHEET)
* **SUPER_ADMIN**: Toàn quyền cấu hình hệ thống, quản lý tài khoản, xem toàn bộ dữ liệu kể cả lương của các Trưởng phòng và báo cáo Analytics.
* **HR_MANAGER**: Toàn quyền phân hệ Phòng ban, Chức vụ, Hồ sơ nhân viên, Hợp đồng, Mức lương, Ca làm, Bảng công, Phép, Đào tạo, Kỳ đánh giá KPI, duyệt thủ tục thôi việc.
* **HR_STAFF**: Tiếp nhận nhân viên mới, quản lý tài liệu hồ sơ, theo dõi checklist Onboarding/Offboarding, tra cứu danh sách; không có quyền xóa phòng ban hay sửa lương.
* **MANAGER**: Phê duyệt đơn nghỉ phép (`Leave.Approve`), duyệt `Timesheet.Approve`, và đánh giá hiệu suất (`Performance.Evaluate`) cho nhân viên cấp dưới trực tiếp; xem thống kê phòng ban mình.
* **EMPLOYEE (Self-Service)**: Tự Check-in/Check-out chấm công (`Attendance.CheckInSelf`), gửi đơn xin nghỉ phép (`Leave.RequestSelf`), kê khai `Timesheet.SubmitSelf`, tự đánh giá KPI (`Performance.SelfReview`), tham gia khóa đào tạo (`Training.ViewSelf`) và xem hồ sơ cá nhân (`Employee.ViewSelf`).

---

## 5. BẢN ĐỒ TÀI LIỆU TRUY XUẤT NHANH
* 📘 Nghiệp vụ chi tiết: [BUSINESS_ANALYSIS.md](file:///d:/employee%20management/docs/BUSINESS_ANALYSIS.md)
* 🗄️ Thiết kế CSDL Master (24 Bảng + 3 Views): [DATABASE_DESIGN_SUMMARY.md](file:///d:/employee%20management/docs/DATABASE_DESIGN_SUMMARY.md)
* 🔐 Phân quyền & Bảo mật (5 Vai trò RBAC/ESS): [AUTH_SECURITY_MATRIX.md](file:///d:/employee%20management/docs/AUTH_SECURITY_MATRIX.md)
* 🗺️ Lộ trình triển khai 8 Giai đoạn: [IMPLEMENTATION_ROADMAP.md](file:///d:/employee%20management/docs/IMPLEMENTATION_ROADMAP.md)
* 🌐 Chuẩn RESTful API: [REST_API_SPECIFICATION.md](file:///d:/employee%20management/docs/REST_API_SPECIFICATION.md)
* ⚡ Quy tắc Thiết kế API & Tối ưu Hiệu năng DB: [API_PERFORMANCE_RULES.md](file:///d:/employee%20management/agents/API_PERFORMANCE_RULES.md)
* 🛡️ Quy tắc Bảo mật Hệ thống (Security Hardening): [SECURITY_HARDENING_RULES.md](file:///d:/employee%20management/agents/SECURITY_HARDENING_RULES.md)
* 🎨 Thiết kế Giao diện HRFlow: [hrflow-DESIGN.md](file:///d:/employee%20management/agents/hrflow-DESIGN.md)
* 📜 Script SQL khởi tạo Core HR: [master_database_setup.sql](file:///d:/employee%20management/database/master_database_setup.sql)
* 🚀 Script SQL mở rộng HRM & ESS: [hrm_expansion_migration.sql](file:///d:/employee%20management/database/hrm_expansion_migration.sql)