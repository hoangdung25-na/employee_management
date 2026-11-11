using EmployeeManagement.Application.Auth.DTOs;
using EmployeeManagement.Domain.Users.Consts;
using MediatR;

namespace EmployeeManagement.Application.Auth.Queries.GetPermissionTree;

/// <summary>
/// Handler responsible for compiling and returning the full permission tree hierarchy.
/// </summary>
public class GetPermissionTreeQueryHandler : IRequestHandler<GetPermissionTreeQuery, IReadOnlyList<PermissionModuleGroupDto>>
{
    public Task<IReadOnlyList<PermissionModuleGroupDto>> Handle(
        GetPermissionTreeQuery request,
        CancellationToken cancellationToken)
    {
        var tree = new List<PermissionModuleGroupDto>
        {
            new(
                ModuleCode: "Employees",
                ModuleName: "Quản lý Hồ sơ Nhân sự",
                Description: "Quản lý toàn bộ thông tin nhân sự, hồ sơ đính kèm và hợp đồng lao động.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Employees.View, "Xem danh sách nhân viên", "Cho phép xem danh sách nhân sự toàn công ty."),
                    new(PermissionNames.Employees.ViewDetail, "Xem chi tiết hồ sơ & Lương", "Cho phép xem thông tin lương và thông tin bảo mật của nhân sự."),
                    new(PermissionNames.Employees.ViewSelf, "Tự xem hồ sơ cá nhân (ESS)", "Cho phép nhân viên tự xem hồ sơ cá nhân của mình."),
                    new(PermissionNames.Employees.Create, "Thêm mới nhân sự", "Tạo mới hồ sơ nhân sự."),
                    new(PermissionNames.Employees.Update, "Cập nhật hồ sơ nhân sự", "Chỉnh sửa thông tin hồ sơ nhân sự."),
                    new(PermissionNames.Employees.Terminate, "Cho thôi việc", "Thực hiện chấm dứt hợp đồng và thôi việc nhân sự."),
                    new(PermissionNames.Employees.DocumentManage, "Quản lý hồ sơ tài liệu", "Tải lên, tải xuống và xóa giấy tờ đính kèm.")
                }
            ),

            new(
                ModuleCode: "Departments",
                ModuleName: "Cơ cấu Phòng ban & Chức danh",
                Description: "Thiết lập sơ đồ tổ chức, quản lý phòng ban và vị trí công việc.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Departments.View, "Xem danh sách phòng ban", "Xem danh sách và sơ đồ cơ cấu tổ chức."),
                    new(PermissionNames.Departments.Create, "Tạo phòng ban", "Tạo phòng ban mới trong cơ cấu tổ chức."),
                    new(PermissionNames.Departments.Update, "Cập nhật phòng ban", "Chỉnh sửa thông tin phòng ban."),
                    new(PermissionNames.Departments.Delete, "Xóa phòng ban", "Xóa phòng ban khỏi cơ cấu tổ chức.")
                }
            ),

            new(
                ModuleCode: "Decisions",
                ModuleName: "Quyết định Nhân sự",
                Description: "Quản lý các quyết định bổ nhiệm, khen thưởng, kỷ luật và tăng lương.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Decisions.View, "Xem danh sách quyết định", "Xem các quyết định nhân sự."),
                    new(PermissionNames.Decisions.Manage, "Quản lý quyết định", "Tạo và ban hành quyết định nhân sự.")
                }
            ),

            new(
                ModuleCode: "Onboarding",
                ModuleName: "Tiếp nhận & Nghỉ việc",
                Description: "Quy trình thử việc, chuẩn bị trang thiết bị và thủ tục bàn giao nghỉ việc.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Onboarding.Manage, "Quản lý Onboarding/Offboarding", "Tạo mẫu và theo dõi tiến độ nhiệm vụ tiếp nhận/nghỉ việc.")
                }
            ),

            new(
                ModuleCode: "Attendance",
                ModuleName: "Chấm công & Ca làm việc",
                Description: "Quản lý chấm công GPS, phân ca làm việc và dữ liệu vào ra.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Attendance.CheckInSelf, "Tự chấm công (ESS)", "Cho phép nhân viên tự thực hiện check-in/check-out."),
                    new(PermissionNames.Attendance.Manage, "Quản lý bảng công & Ca làm", "Xem bảng công toàn công ty và phân ca làm việc.")
                }
            ),

            new(
                ModuleCode: "Timesheets",
                ModuleName: "Kê khai & Duyệt giờ làm",
                Description: "Kê khai giờ làm thêm (OT) và xác nhận giờ công.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Timesheets.SubmitSelf, "Tự kê khai giờ làm (ESS)", "Tự lập và gửi bảng kê khai giờ làm việc cá nhân."),
                    new(PermissionNames.Timesheets.Approve, "Duyệt kê khai giờ làm", "Quản lý phê duyệt bảng kê khai giờ làm của nhân viên.")
                }
            ),

            new(
                ModuleCode: "Leaves",
                ModuleName: "Quản lý Nghỉ phép",
                Description: "Đơn xin nghỉ phép, quỹ phép năm và phê duyệt nghỉ phép.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Leaves.RequestSelf, "Tự tạo đơn nghỉ phép (ESS)", "Tự tạo yêu cầu nghỉ phép cá nhân."),
                    new(PermissionNames.Leaves.Approve, "Duyệt đơn nghỉ phép", "Trưởng phòng/HR phê duyệt hoặc từ chối đơn nghỉ phép.")
                }
            ),

            new(
                ModuleCode: "Performance",
                ModuleName: "Đánh giá KPI & Hiệu suất",
                Description: "Kỳ đánh giá hiệu suất, tự đánh giá và quản lý chấm điểm.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Performance.SelfReview, "Tự đánh giá KPI (ESS)", "Nhân viên tự đánh giá kết quả công việc cá nhân."),
                    new(PermissionNames.Performance.Evaluate, "Đánh giá & Xếp loại KPI", "Quản lý thực hiện chấm điểm và xếp loại nhân sự.")
                }
            ),

            new(
                ModuleCode: "Training",
                ModuleName: "Đào tạo Nội bộ (LMS)",
                Description: "Các khóa đào tạo nâng cao kỹ năng nội bộ công ty.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Training.ViewSelf, "Xem khóa đào tạo (ESS)", "Xem danh sách và tham gia các khóa đào tạo nội bộ."),
                    new(PermissionNames.Training.Manage, "Quản lý đào tạo", "Tạo khóa học, phân công nhân viên và điểm danh.")
                }
            ),

            new(
                ModuleCode: "Analytics",
                ModuleName: "Báo cáo & Phân tích",
                Description: "Số liệu thống kê nhân sự, biến động nhân lực và báo cáo quản trị.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Analytics.View, "Xem báo cáo số liệu", "Xem biểu đồ phân tích và dashboard thống kê nhân sự.")
                }
            ),

            new(
                ModuleCode: "Users",
                ModuleName: "Quản trị Tài khoản & Phân quyền",
                Description: "Quản lý tài khoản đăng nhập, cấp quyền và bảo mật hệ thống.",
                Permissions: new List<PermissionNodeDto>
                {
                    new(PermissionNames.Users.View, "Xem danh sách tài khoản", "Xem danh sách tài khoản đăng nhập hệ thống."),
                    new(PermissionNames.Users.Create, "Tạo & Cấp quyền tài khoản", "Tạo tài khoản đăng nhập mới và gán vai trò/quyền hạn."),
                    new(PermissionNames.Users.ChangePassword, "Đổi mật khẩu", "Quyền thực hiện đổi mật khẩu cá nhân.")
                }
            )
        };

        return Task.FromResult<IReadOnlyList<PermissionModuleGroupDto>>(tree);
    }
}

