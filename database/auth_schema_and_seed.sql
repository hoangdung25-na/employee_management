-- ============================================================================
-- DỰ ÁN: ENTERPRISE EMPLOYEE MANAGEMENT SYSTEM
-- PHÂN HỆ: IDENTITY & ROLE-BASED ACCESS CONTROL (RBAC)
-- CHUẨN ĐỊNH DANH: GUID (UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID())
-- NGÀY TẠO: 2026-10-28
-- ============================================================================

USE EmployeeManagementDb;
GO

-- 1. BẢNG ROLES
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

-- 2. BẢNG USERS
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

-- 3. BẢNG USER_ROLES (QUAN HỆ N-N)
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

-- 4. BẢNG PERMISSIONS
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

-- 5. BẢNG ROLE_PERMISSIONS
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

-- 6. SEED DATA IDENTITY CHO 3 VAI TRÒ QUẢN TRỊ
DECLARE @Role_SuperAdmin UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444441';
DECLARE @Role_HrManager UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444442';
DECLARE @Role_HrStaff UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444443';

DECLARE @User_Admin UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555551';
DECLARE @User_Binh UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555552';
DECLARE @Emp_Binh UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333332';

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Id = @Role_SuperAdmin)
BEGIN
    INSERT INTO dbo.Roles (Id, RoleCode, RoleName, Description) VALUES
    (@Role_SuperAdmin, 'SUPER_ADMIN', N'Quản trị viên tối cao', N'Toàn quyền quản trị hệ thống và người dùng'),
    (@Role_HrManager, 'HR_MANAGER', N'Trưởng phòng Nhân sự', N'Quản lý tổ chức, hồ sơ nhân sự, tiền lương và thủ tục thôi việc'),
    (@Role_HrStaff, 'HR_STAFF', N'Chuyên viên Nhân sự', N'Thực hiện các thao tác tiếp nhận hồ sơ và tra cứu nhân sự');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions)
BEGIN
    INSERT INTO dbo.Permissions (PermissionCode, PermissionName, Module) VALUES
    ('Department.View', N'Xem danh sách và chi tiết phòng ban', 'Department'),
    ('Department.Create', N'Tạo mới phòng ban', 'Department'),
    ('Department.Update', N'Cập nhật phòng ban', 'Department'),
    ('Department.Delete', N'Xóa mềm phòng ban', 'Department'),
    ('Employee.View', N'Xem danh sách nhân viên', 'Employee'),
    ('Employee.ViewDetail', N'Xem chi tiết hồ sơ nhân sự và lương', 'Employee'),
    ('Employee.Create', N'Tiếp nhận nhân viên mới', 'Employee'),
    ('Employee.Update', N'Sửa hồ sơ và mức lương', 'Employee'),
    ('Employee.Terminate', N'Thực hiện thủ tục thôi việc', 'Employee'),
    ('User.View', N'Xem danh sách tài khoản quản trị', 'User'),
    ('User.Create', N'Cấp tài khoản quản trị', 'User'),
    ('Auth.ChangePassword', N'Đổi mật khẩu tài khoản', 'Auth');
END

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @Role_SuperAdmin)
BEGIN
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_SuperAdmin, Id FROM dbo.Permissions;

    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_HrManager, Id FROM dbo.Permissions;

    INSERT INTO dbo.RolePermissions (RoleId, PermissionId) 
    SELECT @Role_HrStaff, Id FROM dbo.Permissions 
    WHERE PermissionCode IN ('Department.View', 'Employee.View', 'Employee.Create', 'Auth.ChangePassword');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
BEGIN
    INSERT INTO dbo.Users (Id, Username, Email, PasswordHash, EmployeeId, IsActive, MustChangePassword) 
    VALUES (
        @User_Admin, 'admin', 'admin@company.com', 
        'AQAAAAIAAYagAAAAEG8jW9LqH5jN2GzF1mQ4r7xYvK8pE2sW6uI1tO9kP3mA4bC5dE6fG7hI8jK9lM0n==', 
        NULL, 1, 1
    );
    INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@User_Admin, @Role_SuperAdmin);

    INSERT INTO dbo.Users (Id, Username, Email, PasswordHash, EmployeeId, IsActive, MustChangePassword) 
    VALUES (
        @User_Binh, 'binh.tran', 'binh.tran@company.com', 
        'AQAAAAIAAYagAAAAEG8jW9LqH5jN2GzF1mQ4r7xYvK8pE2sW6uI1tO9kP3mA4bC5dE6fG7hI8jK9lM0n==', 
        @Emp_Binh, 1, 0
    );
    INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@User_Binh, @Role_HrManager);
END
GO
