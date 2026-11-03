# QUY TẮC THIẾT KẾ API & TỐI ƯU HIỆU NĂNG DATABASE (API & DB PERFORMANCE RULES)
**Dự án:** Enterprise Employee Management System (HRFlow)  
**Áp dụng cho:** Backend (.NET 8 Web API, MediatR/CQRS, EF Core 8) & SQL Server 2022  
**Tài liệu gốc:** Tách từ [AGENTS.md](file:///d:/employee%20management/agents/AGENTS.md)  

---

## 8 NGUYÊN TẮC TỐI ƯU HIỆU NĂNG BẮT BUỘC

AI Agent và Developer khi viết hoặc sửa bất kỳ Query / Command / API nào **BẮT BUỘC** phải kiểm tra và phòng chống 8 lỗi hiệu năng chí mạng sau:

1. **Chống N+1 Query (Quá nhiều lần gọi DB):**
   * Tuyệt đối **KHÔNG** truy vấn DB bên trong vòng lặp `foreach` / `for`.
   * Luôn dùng `.Select(...)` (Projection sang DTO) hoặc `.Include(...)` hợp lý trong một câu truy vấn duy nhất để EF Core dịch sang `JOIN` tại SQL Server.
2. **Phòng chống Missing Index (Truy vấn tìm kiếm chậm):**
   * Mọi cột dùng trong mệnh đề `WHERE`, `JOIN` (Foreign Keys: `DepartmentId`, `PositionId`, `DirectManagerId`, `EmployeeId`), `ORDER BY` (`EmployeeCode`, `FullName`, `HireDate`, `BaseSalary`, `AttendanceDate`) và Filtered Unique Index (`WHERE IsDeleted = 0`) bắt buộc phải được đánh Index trong Fluent API Configuration và SQL Script.
   * Tránh dùng hàm biến đổi cột ngay bên trái phép so sánh (ví dụ: tránh `LOWER(Column) = ...` làm mất tác dụng Index — Non-SARGable query).
3. **Chống Over-fetching & Bắt buộc Pagination (Lấy quá nhiều dữ liệu):**
   * Tuyệt đối **KHÔNG** gọi `.ToListAsync()` trên toàn bộ bảng mà không giới hạn bản ghi.
   * Mọi API danh sách bắt buộc phải phân trang qua `PagedResult<T>` (`.Skip((pageNumber - 1) * pageSize).Take(pageSize)`) và giới hạn `MaxPageSize <= 100`.
   * Không lấy các cột thừa: Dùng `.Select(e => new EmployeeSummaryDto(...))` thay vì tải toàn bộ Entity rồi mới map trên RAM.
4. **Tối ưu SQL & Execution Plan (Tránh SQL chạy tốn tài nguyên):**
   * Bắt buộc gắn `.AsNoTracking()` cho **100% truy vấn chỉ đọc (Read-only Queries)** để bỏ qua chi phí Change Tracker của EF Core.
   * Khi kiểm tra tồn tại, bắt buộc dùng `.AnyAsync(...)` thay vì `.CountAsync() > 0` hoặc `.FirstOrDefaultAsync() != null`.
5. **Phòng chống Blocking & Deadlock (Request phải chờ nhau):**
   * Giữ phạm vi Transaction (`BeginTransactionAsync`) ngắn nhất có thể; tuyệt đối không gọi HTTP/Email/IO bên ngoài khi đang giữ DB Transaction.
   * Truy cập và cập nhật các bảng theo một thứ tự cố định thống nhất trong toàn bộ codebase để triệt tiêu nguy cơ Deadlock vòng tròn.
6. **Chống Cartesian Explosion (JOIN nhiều quan hệ `1-N` làm dữ liệu phình to):**
   * Khi buộc phải `.Include()` nhiều bảng quan hệ `1-N` cùng lúc, bắt buộc sử dụng `.AsSplitQuery()` của EF Core để tách thành các câu truy vấn nhỏ thay vì tạo tích Đề-các (Cartesian Product) làm nổ bộ nhớ.
7. **Tuân thủ Async/Await chuẩn & Tránh gọi tuần tự bất hợp lý:**
   * Bắt buộc truyền và sử dụng `CancellationToken` xuyên suốt từ Controller ➔ MediatR Handler ➔ EF Core (`ToListAsync(cancellationToken)`, `SaveChangesAsync(cancellationToken)`).
   * Tuyệt đối không dùng `.Result` hoặc `.Wait()` gây khóa luồng (Thread Pool Starvation).
   * Với các tác vụ độc lập không dùng chung `DbContext` (như gọi các dịch vụ ngoài), ưu tiên `Task.WhenAll(...)`; lưu ý với cùng một instance `DbContext` của EF Core thì không chạy song song nhiều query trên cùng một context.
8. **Chống Race Condition (Xử lý đồng thời không an toàn):**
   * Khi sinh mã tuần tự (`EMP-xxxxx`, `LR-xxxxx`, `HDLD-xxxxx` qua bảng `CodeSequences`) hoặc cập nhật số liệu nhạy cảm (quỹ phép `LeaveBalances`, quỹ lương, trưởng phòng), bắt buộc sử dụng cơ chế khóa dòng nguyên tử (`UPDLOCK, HOLDLOCK` hoặc `ROWVERSION` kết hợp Unique Constraint tại DB) và xử lý `DbUpdateConcurrencyException`.

