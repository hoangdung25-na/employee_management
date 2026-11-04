-- ============================================================================
-- DỰ ÁN: ENTERPRISE EMPLOYEE MANAGEMENT SYSTEM
-- MASTER DATABASE INITIALIZATION SCRIPT (FULL SCHEMA + SEED DATA)
-- CHUẨN ĐỊNH DANH: GUID (UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID())
-- MÔ HÌNH: HỆ THỐNG QUẢN TRỊ NỘI BỘ (BACK-OFFICE HRM)
-- NGÀY TẠO: 2026-10-28
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'EmployeeManagementDb')
BEGIN
    CREATE DATABASE EmployeeManagementDb;
END
GO

-- Bật READ_COMMITTED_SNAPSHOT (RCSI) chống Deadlock & Blocking:
-- Đảm bảo câu lệnh SELECT đọc dữ liệu không bao giờ bị khóa bởi câu lệnh UPDATE/INSERT
IF (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = 'EmployeeManagementDb') = 0
BEGIN
    ALTER DATABASE EmployeeManagementDb SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
END
GO

USE EmployeeManagementDb;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- 1. BẢNG DEPARTMENTS (PHÒNG BAN)
-- ============================================================================
IF OBJECT_ID('dbo.Departments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Departments (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Departments_Id DEFAULT (NEWSEQUENTIALID()),
        DepartmentCode VARCHAR(20) NOT NULL,
        DepartmentName NVARCHAR(150) NOT NULL,
        ParentDepartmentId UNIQUEIDENTIFIER NULL,
        ManagerId UNIQUEIDENTIFIER NULL, 
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Departments_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_Departments_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Departments_CreatedAt DEFAULT (GETDATE()),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT PK_Departments PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Departments_Parent FOREIGN KEY (ParentDepartmentId) 
            REFERENCES dbo.Departments(Id) ON DELETE NO ACTION
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Departments_DepartmentCode 
    ON dbo.Departments(DepartmentCode) WHERE IsDeleted = 0;
END
GO

-- ============================================================================
-- 2. BẢNG POSITIONS (CHỨC VỤ)
-- ============================================================================
IF OBJECT_ID('dbo.Positions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Positions (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Positions_Id DEFAULT (NEWSEQUENTIALID()),
        PositionCode VARCHAR(20) NOT NULL,
        PositionName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(250) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Positions_IsActive DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_Positions_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Positions_CreatedAt DEFAULT (GETDATE()),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT PK_Positions PRIMARY KEY CLUSTERED (Id)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Positions_PositionCode 
    ON dbo.Positions(PositionCode) WHERE IsDeleted = 0;
END
GO

-- ============================================================================
-- 3. BẢNG EMPLOYEES (HỒ SƠ NHÂN SỰ)
-- ============================================================================
IF OBJECT_ID('dbo.Employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employees (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Employees_Id DEFAULT (NEWSEQUENTIALID()),
        EmployeeCode VARCHAR(20) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        DateOfBirth DATE NOT NULL,
        Gender NVARCHAR(10) NOT NULL,
        CitizenId VARCHAR(20) NOT NULL,
        PhoneNumber VARCHAR(15) NULL,
        WorkEmail VARCHAR(150) NOT NULL,
        PersonalEmail VARCHAR(150) NULL,
        Address NVARCHAR(250) NULL,
        HireDate DATE NOT NULL,
        DepartmentId UNIQUEIDENTIFIER NOT NULL,
        PositionId UNIQUEIDENTIFIER NOT NULL,
        DirectManagerId UNIQUEIDENTIFIER NULL,
        BaseSalary DECIMAL(18,2) NOT NULL CONSTRAINT DF_Employees_BaseSalary DEFAULT (0),
        AvatarUrl VARCHAR(500) NULL,
        Status VARCHAR(20) NOT NULL CONSTRAINT DF_Employees_Status DEFAULT ('Probation'),
        TerminationDate DATE NULL,
        TerminationReason NVARCHAR(500) NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_Employees_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Employees_CreatedAt DEFAULT (GETDATE()),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT PK_Employees PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Employees_Departments FOREIGN KEY (DepartmentId) 
            REFERENCES dbo.Departments(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Employees_Positions FOREIGN KEY (PositionId) 
            REFERENCES dbo.Positions(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Employees_DirectManager FOREIGN KEY (DirectManagerId) 
            REFERENCES dbo.Employees(Id) ON DELETE NO ACTION,

        -- Ràng buộc tuổi lao động: Đủ 18 tuổi tính đến ngày bắt đầu làm việc
        CONSTRAINT CK_Employees_Age CHECK (DATEADD(YEAR, 18, DateOfBirth) <= HireDate),
        CONSTRAINT CK_Employees_BaseSalary CHECK (BaseSalary >= 0),
        CONSTRAINT CK_Employees_Gender CHECK (Gender IN (N'Nam', N'Nữ', N'Khác')),
        CONSTRAINT CK_Employees_Status CHECK (Status IN ('Probation', 'Active', 'Suspended', 'Terminated')),
        CONSTRAINT CK_Employees_TerminationDate CHECK (TerminationDate >= HireDate OR TerminationDate IS NULL)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Employees_EmployeeCode 
    ON dbo.Employees(EmployeeCode) WHERE IsDeleted = 0;

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Employees_WorkEmail 
    ON dbo.Employees(WorkEmail) WHERE IsDeleted = 0;

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Employees_CitizenId 
    ON dbo.Employees(CitizenId) WHERE IsDeleted = 0;

    -- PERFORMANCE INDEXES (Tối ưu hóa tốc độ Lọc theo phòng ban, Trạng thái, Sắp xếp ngày vào làm và Tìm kiếm tên)
    CREATE NONCLUSTERED INDEX IX_Employees_DepartmentId 
    ON dbo.Employees(DepartmentId) WHERE IsDeleted = 0;

    CREATE NONCLUSTERED INDEX IX_Employees_Status 
    ON dbo.Employees(Status) WHERE IsDeleted = 0;

    CREATE NONCLUSTERED INDEX IX_Employees_HireDate 
    ON dbo.Employees(HireDate DESC) WHERE IsDeleted = 0;

    CREATE NONCLUSTERED INDEX IX_Employees_FullName 
    ON dbo.Employees(FullName) WHERE IsDeleted = 0;
END
GO

-- ============================================================================
-- 4. BỔ SUNG KHÓA NGOẠI TRƯỞNG PHÒNG CHO DEPARTMENTS
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Departments_Manager')
BEGIN
    ALTER TABLE dbo.Departments
    ADD CONSTRAINT FK_Departments_Manager FOREIGN KEY (ManagerId) 
        REFERENCES dbo.Employees(Id) ON DELETE NO ACTION;
END
GO

-- ============================================================================
-- 5. BẢNG ROLES (VAI TRÒ QUẢN TRỊ)
-- ============================================================================
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Roles_Id DEFAULT (NEWSEQUENTIALID()),
        RoleCode VARCHAR(30) NOT NULL,
        RoleName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(250) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Roles_IsActive DEFAULT (1),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT (GETDATE()),

        CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Roles_RoleCode UNIQUE (RoleCode)
    );
END
GO

-- ============================================================================
-- 6. BẢNG USERS (TÀI KHOẢN QUẢN TRỊ ADMIN/HR)
-- ============================================================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_Id DEFAULT (NEWSEQUENTIALID()),
        Username VARCHAR(50) NOT NULL,
        Email VARCHAR(150) NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        SecurityStamp VARCHAR(100) NOT NULL CONSTRAINT DF_Users_SecurityStamp DEFAULT (NEWID()),
        EmployeeId UNIQUEIDENTIFIER NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        IsLocked BIT NOT NULL CONSTRAINT DF_Users_IsLocked DEFAULT (0),
        LockedUntil DATETIME2 NULL,
        FailedLoginAttempts INT NOT NULL CONSTRAINT DF_Users_FailedAttempts DEFAULT (0),
        RefreshToken VARCHAR(255) NULL,
        RefreshTokenExpiryTime DATETIME2 NULL,
        MustChangePassword BIT NOT NULL CONSTRAINT DF_Users_MustChangePwd DEFAULT (0),
        IsDeleted BIT NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (GETDATE()),
        UpdatedAt DATETIME2 NULL,

        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Users_Username UNIQUE (Username),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT FK_Users_Employees FOREIGN KEY (EmployeeId) 
            REFERENCES dbo.Employees(Id) ON DELETE SET NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_EmployeeId 
    ON dbo.Users(EmployeeId) 
    WHERE [EmployeeId] IS NOT NULL AND [IsDeleted] = 0;
END
GO

-- ============================================================================
-- 7. BẢNG USER_ROLES (QUAN HỆ N-N)
-- ============================================================================
IF OBJECT_ID('dbo.UserRoles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRoles (
        UserId UNIQUEIDENTIFIER NOT NULL,
        RoleId UNIQUEIDENTIFIER NOT NULL,
        AssignedAt DATETIME2 NOT NULL CONSTRAINT DF_UserRoles_AssignedAt DEFAULT (GETDATE()),

        CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (UserId, RoleId),
        CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id) ON DELETE CASCADE
    );
END
GO

-- ============================================================================
-- 8. BẢNG PERMISSIONS (DANH MỤC QUYỀN NGUYÊN TỬ)
-- ============================================================================
IF OBJECT_ID('dbo.Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permissions (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Permissions_Id DEFAULT (NEWSEQUENTIALID()),
        PermissionCode VARCHAR(50) NOT NULL,
        PermissionName NVARCHAR(150) NOT NULL,
        Module VARCHAR(50) NOT NULL,

        CONSTRAINT PK_Permissions PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Permissions_Code UNIQUE (PermissionCode)
    );
END
GO

-- ============================================================================
-- 9. BẢNG ROLE_PERMISSIONS (MA TRẬN QUYỀN - N-N)
-- ============================================================================
IF OBJECT_ID('dbo.RolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions (
        RoleId UNIQUEIDENTIFIER NOT NULL,
        PermissionId UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (RoleId, PermissionId),
        CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id) ON DELETE CASCADE,
        CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES dbo.Permissions(Id) ON DELETE CASCADE
    );
END
GO

-- ============================================================================
-- 10. BẢNG CODE_SEQUENCES (MÁY SINH MÃ TUẦN TỰ AN TOÀN - ROWVERSION CONCURRENCY)
-- ============================================================================
IF OBJECT_ID('dbo.CodeSequences', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CodeSequences (
        Id VARCHAR(50) NOT NULL,
        LastIndex INT NOT NULL CONSTRAINT DF_CodeSequences_LastIndex DEFAULT (0),
        RowVersion ROWVERSION NOT NULL,

        CONSTRAINT PK_CodeSequences PRIMARY KEY CLUSTERED (Id)
    );
END
GO

-- ============================================================================
-- 11. CHÈN SEED DATA MẪU (SỬ DỤNG GUID XÁC ĐỊNH ĐẢM BẢO QUAN HỆ TOÀN VẸN)
-- ============================================================================

-- Khai báo GUID tự sinh ngẫu nhiên chuẩn NEWID()
DECLARE @Pos_Dir UNIQUEIDENTIFIER = NEWID();
DECLARE @Pos_TechLead UNIQUEIDENTIFIER = NEWID();
DECLARE @Pos_HrMgr UNIQUEIDENTIFIER = NEWID();
DECLARE @Pos_SrDev UNIQUEIDENTIFIER = NEWID();
DECLARE @Pos_HrStaff UNIQUEIDENTIFIER = NEWID();

DECLARE @Dept_BOD UNIQUEIDENTIFIER = NEWID();
DECLARE @Dept_TECH UNIQUEIDENTIFIER = NEWID();
DECLARE @Dept_HR UNIQUEIDENTIFIER = NEWID();
DECLARE @Dept_DEV UNIQUEIDENTIFIER = NEWID();

DECLARE @Emp_An UNIQUEIDENTIFIER = NEWID();
DECLARE @Emp_Binh UNIQUEIDENTIFIER = NEWID();
DECLARE @Emp_Cuong UNIQUEIDENTIFIER = NEWID();

DECLARE @Role_SuperAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @Role_HrManager UNIQUEIDENTIFIER = NEWID();
DECLARE @Role_HrStaff UNIQUEIDENTIFIER = NEWID();

DECLARE @User_Admin UNIQUEIDENTIFIER = NEWID();
DECLARE @User_Binh UNIQUEIDENTIFIER = NEWID();

-- 10.1. Positions
IF NOT EXISTS (SELECT 1 FROM dbo.Positions)
BEGIN
    INSERT INTO dbo.Positions (Id, PositionCode, PositionName, Description) VALUES
    (@Pos_Dir, 'DIR', N'Giám đốc điều hành', N'Lãnh đạo cao nhất'),
    (@Pos_TechLead, 'TECH_LEAD', N'Trưởng phòng Kỹ thuật', N'Quản lý kỹ thuật và lập trình'),
    (@Pos_HrMgr, 'HR_MGR', N'Trưởng phòng Nhân sự', N'Quản lý chính sách nhân sự và tiền lương'),
    (@Pos_SrDev, 'SENIOR_DEV', N'Lập trình viên Senior', N'Kiến trúc phần mềm'),
    (@Pos_HrStaff, 'HR_STAFF', N'Chuyên viên Nhân sự', N'Tiếp nhận hồ sơ nhân viên');
END

-- 10.2. Departments
IF NOT EXISTS (SELECT 1 FROM dbo.Departments)
BEGIN
    INSERT INTO dbo.Departments (Id, DepartmentCode, DepartmentName, ParentDepartmentId, Description) VALUES
    (@Dept_BOD, 'BOD', N'Ban Giám Đốc', NULL, N'Cấp lãnh đạo'),
    (@Dept_TECH, 'TECH', N'Khối Công Nghệ', @Dept_BOD, N'Khối kỹ thuật'),
    (@Dept_HR, 'HR', N'Phòng Nhân Sự', @Dept_BOD, N'Phòng nhân sự'),
    (@Dept_DEV, 'DEV', N'Phòng Phát Triển Phần Mềm', @Dept_TECH, N'Bộ phận lập trình');
END

-- 10.3. Employees
IF NOT EXISTS (SELECT 1 FROM dbo.Employees)
BEGIN
    INSERT INTO dbo.Employees (
        Id, EmployeeCode, FullName, DateOfBirth, Gender, CitizenId, PhoneNumber, 
        WorkEmail, HireDate, DepartmentId, PositionId, DirectManagerId, BaseSalary, 
        AvatarUrl, Status
    ) VALUES 
    (@Emp_An, 'EMP-00001', N'Nguyễn Văn An', '1985-05-15', N'Nam', '001085000001', '0901234567', 
     'an.nguyen@company.com', '2020-01-01', @Dept_BOD, @Pos_Dir, NULL, 50000000.00, 
     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'Active'),

    (@Emp_Binh, 'EMP-00002', N'Trần Thị Bình', '1990-08-20', N'Nữ', '001090000002', '0912345678', 
     'binh.tran@company.com', '2021-03-01', @Dept_HR, @Pos_HrMgr, @Emp_An, 35000000.00, 
     'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Active'),

    (@Emp_Cuong, 'EMP-00003', N'Lê Hoàng Cường', '1995-11-10', N'Nam', '001095000003', '0987654321', 
     'cuong.le@company.com', '2022-06-15', @Dept_DEV, @Pos_SrDev, @Emp_An, 25000000.00, 
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'Active');

    UPDATE dbo.Departments SET ManagerId = @Emp_An WHERE Id = @Dept_BOD;
    UPDATE dbo.Departments SET ManagerId = @Emp_Cuong WHERE Id = @Dept_TECH;
    UPDATE dbo.Departments SET ManagerId = @Emp_Binh WHERE Id = @Dept_HR;
END

-- 10.4. Roles
IF NOT EXISTS (SELECT 1 FROM dbo.Roles)
BEGIN
    INSERT INTO dbo.Roles (Id, RoleCode, RoleName, Description) VALUES
    (@Role_SuperAdmin, 'SUPER_ADMIN', N'Quản trị viên tối cao', N'Toàn quyền hệ thống'),
    (@Role_HrManager, 'HR_MANAGER', N'Trưởng phòng Nhân sự', N'Quản lý tổ chức, nhân sự, tiền lương'),
    (@Role_HrStaff, 'HR_STAFF', N'Chuyên viên Nhân sự', N'Tiếp nhận hồ sơ và tra cứu');
END

-- 10.5. Permissions
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions)
BEGIN
    INSERT INTO dbo.Permissions (PermissionCode, PermissionName, Module) VALUES
    ('Department.View', N'Xem phòng ban', 'Department'),
    ('Department.Create', N'Tạo phòng ban', 'Department'),
    ('Department.Update', N'Cập nhật phòng ban', 'Department'),
    ('Department.Delete', N'Xóa phòng ban', 'Department'),
    ('Employee.View', N'Xem nhân viên', 'Employee'),
    ('Employee.ViewDetail', N'Xem chi tiết nhân viên và lương', 'Employee'),
    ('Employee.Create', N'Tiếp nhận nhân viên', 'Employee'),
    ('Employee.Update', N'Cập nhật thông tin và lương', 'Employee'),
    ('Employee.Terminate', N'Thủ tục thôi việc', 'Employee'),
    ('User.View', N'Xem tài khoản quản trị', 'User'),
    ('User.Create', N'Cấp tài khoản quản trị', 'User'),
    ('Auth.ChangePassword', N'Đổi mật khẩu', 'Auth');
END

-- 10.6. RolePermissions
IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @Role_SuperAdmin)
BEGIN
    -- Super Admin: Toàn quyền
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_SuperAdmin, Id FROM dbo.Permissions;

    -- HR Manager: Toàn quyền phòng ban, nhân sự, auth
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_HrManager, Id FROM dbo.Permissions;

    -- HR Staff: Xem phòng ban, xem/thêm nhân viên, đổi pass
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_HrStaff, Id FROM dbo.Permissions 
    WHERE PermissionCode IN ('Department.View', 'Employee.View', 'Employee.Create', 'Auth.ChangePassword');
END

-- 10.7. Users (Tài khoản quản trị ban đầu, Password: Admin@123 - BCrypt WorkFactor 11)
IF NOT EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    -- 1. Super Admin (IT / Ban Giám Đốc)
    INSERT INTO dbo.Users (Id, Username, Email, PasswordHash, EmployeeId, IsActive, MustChangePassword) 
    VALUES (
        @User_Admin, 'admin', 'admin@company.com', 
        '$2a$11$DwoA.3ebkKaZxkfQNk/JPexx8K4.GLkD9i4IZ2IWPShoInntKagiy', 
        NULL, 1, 1
    );
    INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@User_Admin, @Role_SuperAdmin);

    -- 2. HR Manager (Trần Thị Bình)
    INSERT INTO dbo.Users (Id, Username, Email, PasswordHash, EmployeeId, IsActive, MustChangePassword) 
    VALUES (
        @User_Binh, 'binh.tran', 'binh.tran@company.com', 
        '$2a$11$DwoA.3ebkKaZxkfQNk/JPexx8K4.GLkD9i4IZ2IWPShoInntKagiy', 
        @Emp_Binh, 1, 0
    );
    INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@User_Binh, @Role_HrManager);
END
GO

-- 11.8. CodeSequences (Khởi tạo LastIndex = 3 cho Employee vì đã có EMP-00001, EMP-00002, EMP-00003)
IF NOT EXISTS (SELECT 1 FROM dbo.CodeSequences WHERE Id = 'Employee')
BEGIN
    INSERT INTO dbo.CodeSequences (Id, LastIndex) VALUES ('Employee', 3);
END
GO

