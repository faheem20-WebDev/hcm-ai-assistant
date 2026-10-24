# API ENDPOINTS SPECIFICATION: HCM Lite

Complete backend API contract for HCM Lite (Saylani Hackathon).

---

## 1. General Standards

- **Base URL**: `/api` (or configured via `VITE_API_URL`)
- **Data Exchange**: JSON payloads and responses (`Content-Type: application/json`).
- **Authorization**: `Bearer <token>` in the HTTP `Authorization` header.
- **Date Format**: ISO dates (`YYYY-MM-DD` or full ISO 8601 `YYYY-MM-DDTHH:mm:ssZ`).
- **Standard Error Response**:
  ```json
  { "error": "Human readable message" }
  ```
- **Standard Paginated Response**:
  ```json
  {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 10
  }
  ```

---

## 2. Setup & Authentication

### `GET /setup/status`
Checks if the application requires initial system setup.
- **Access**: Public
- **Response `200`**:
  ```json
  { "needsSetup": true }
  ```

### `POST /setup`
Initializes company settings and registers primary Administrator account.
- **Access**: Public (Only when `needsSetup: true`)
- **Body**:
  ```json
  {
    "companyName": "Acme Corp",
    "adminName": "System Admin",
    "email": "admin@company.com",
    "password": "Password123!"
  }
  ```
- **Response `201`**:
  ```json
  { "message": "Setup completed successfully." }
  ```

### `POST /auth/login`
Authenticates a user using work email and password.
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "user@company.com",
    "password": "Password123!"
  }
  ```
- **Response `200` (Admin - No PIN required)**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "usr-admin-1",
      "name": "System Admin",
      "email": "admin@company.com",
      "role": "admin",
      "employeeId": null,
      "mustChangePassword": false
    }
  }
  ```
- **Response `200` (HR / Employee - PIN verification required)**:
  ```json
  {
    "requirePin": true,
    "hasPin": true,
    "email": "employee@company.com",
    "role": "employee",
    "name": "Ali Khan"
  }
  ```

### `POST /auth/pin/verify`
Verifies the user's 5-digit security PIN to complete authentication.
- **Access**: Public (pre-authenticated step)
- **Body**:
  ```json
  {
    "email": "employee@company.com",
    "pin": "12345"
  }
  ```
- **Response `200`**:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "usr-emp-1",
      "name": "Ali Khan",
      "email": "employee@company.com",
      "role": "employee",
      "employeeId": "EMP-001",
      "mustChangePassword": true
    }
  }
  ```

### `POST /auth/pin/setup`
Configures a new 5-digit PIN for first-time login or following an admin PIN reset.
- **Access**: Public (pre-authenticated step)
- **Body**:
  ```json
  {
    "email": "employee@company.com",
    "pin": "12345"
  }
  ```
- **Response `200`**: Same as `POST /auth/pin/verify`

### `POST /auth/change-password`
Updates the logged-in user's password. Mandatory when `mustChangePassword` is `true`.
- **Access**: Authenticated
- **Body**:
  ```json
  {
    "oldPassword": "TemporaryPassword123!",
    "newPassword": "NewPermanentPassword456!"
  }
  ```
- **Response `200`**:
  ```json
  { "message": "Password updated successfully." }
  ```

### `GET /auth/me`
Fetches current authenticated profile and permissions.
- **Access**: Authenticated
- **Response `200`**:
  ```json
  {
    "user": {
      "id": "usr-emp-1",
      "name": "Ali Khan",
      "email": "employee@company.com",
      "role": "employee",
      "employeeId": "EMP-001",
      "mustChangePassword": false,
      "phone": "+92 300 1234567",
      "address": "Karachi, Pakistan"
    }
  }
  ```

### `POST /auth/forgot-password`
Submits a self-service password reset request to administrator.
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "user@company.com",
    "reason": "Locked out of account"
  }
  ```
- **Response `201`**:
  ```json
  { "message": "Password reset request submitted successfully." }
  ```

### `GET /auth/reset-requests`
Lists all password reset requests.
- **Access**: Admin only
- **Response `200`**:
  ```json
  {
    "items": [
      {
        "id": "req-1",
        "email": "user@company.com",
        "reason": "Locked out of account",
        "status": "pending",
        "createdAt": "2026-10-24T12:00:00Z"
      }
    ],
    "total": 1
  }
  ```

### `POST /auth/reset-requests/:id/approve`
Approves a reset request, generating a temporary password.
- **Access**: Admin only
- **Response `200`**:
  ```json
  {
    "message": "Request approved.",
    "tempPassword": "Reset123456!",
    "email": "user@company.com"
  }
  ```

### `POST /auth/reset-requests/:id/reject`
Rejects a password reset request.
- **Access**: Admin only
- **Response `200`**:
  ```json
  { "message": "Request rejected." }
  ```

---

## 3. Organization & Master Data

### `GET /settings` | `PUT /settings`
Company configuration, geolocation coordinates, working hours, and grace period.
- **Access**: Admin (write), HR (read)
- **Payload / Response**:
  ```json
  {
    "companyName": "Acme HCM",
    "workStartTime": "09:00",
    "graceMinutes": 15,
    "minWorkHoursHalfDay": 5,
    "weekendDays": ["Saturday", "Sunday"],
    "officeLat": 24.8607,
    "officeLng": 67.0011,
    "officeRadiusMeters": 150
  }
  ```

### Departments
- `GET /departments` -> List departments
- `POST /departments` -> Create (`{ "name": string, "code": string }`)
- `PUT /departments/:id` -> Update
- `DELETE /departments/:id` -> Remove

### Designations
- `GET /designations` -> List designations
- `POST /designations` -> Create (`{ "title": string, "departmentId": string }`)
- `PUT /designations/:id` -> Update
- `DELETE /designations/:id` -> Remove

### Leave Types
- `GET /leave-types` -> List leave policies
- `POST /leave-types` -> Create (`{ "name": string, "quota": number, "paid": boolean }`)
- `PUT /leave-types/:id` -> Update
- `DELETE /leave-types/:id` -> Remove

### Holidays
- `GET /holidays` -> List official holidays
- `POST /holidays` -> Create (`{ "name": string, "date": "YYYY-MM-DD" }`)
- `PUT /holidays/:id` -> Update
- `DELETE /holidays/:id` -> Remove

---

## 4. User Administration & Security

### `GET /users/hr`
Lists all HR officer accounts.
- **Access**: Admin only

### `POST /users/hr`
Provisions a new HR officer account with temporary credentials.
- **Access**: Admin only
- **Body**: `{ "name": string, "email": string }`
- **Response `201`**: Returns created HR user and `{ "tempPassword": string }`.

### `PATCH /users/:id/deactivate`
Deactivates user account access.
- **Access**: Admin only

### `POST /users/:id/reset-password`
Issues a new temporary password for HR officer or Employee.
- **Access**: Admin only
- **Response `200`**: `{ "tempPassword": string }`

### `POST /users/:id/reset-pin`
Clears a user's 5-digit PIN so they can configure a new PIN on next login.
- **Access**: Admin only
- **Response `200`**: `{ "message": "User PIN has been reset." }`

---

## 5. Employees Management

### `GET /employees`
Search and filter employee directory.
- **Access**: HR, Admin
- **Query Params**: `?search=&departmentId=&status=&page=&limit=`
- **Response `200`**: Paginated list of employee records.

### `POST /employees`
Onboards an employee, initializes employment record, and creates employee user credentials.
- **Access**: HR, Admin
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "departmentId": "dept-1",
    "designationId": "des-1",
    "basicSalary": 150000,
    "phone": "+92 300 0000000",
    "address": "Karachi",
    "joinedDate": "2026-10-24"
  }
  ```
- **Response `201`**: Created employee record and `{ "tempPassword": string }`.

### `GET /employees/:id` | `PUT /employees/:id`
Retrieves or updates an employee's employment record.
- **Access**: HR, Admin

### `PATCH /me/profile`
Allows employee to update their personal contact info.
- **Access**: Employee
- **Body**: `{ "phone": string, "address": string }`

---

## 6. Attendance & Geolocation

### `POST /attendance/check-in`
Employee check-in with GPS coordinates verification against office geofence.
- **Access**: Employee
- **Body**: `{ "latitude": number, "longitude": number }`
- **Response `200`**: Attendance record with calculated status (`present` or `late`).
- **Response `409`**: Already checked in.

### `POST /attendance/check-out`
Employee check-out with work duration calculation.
- **Access**: Employee
- **Body**: `{ "latitude": number, "longitude": number }`

### `GET /attendance/me?month=YYYY-MM`
Monthly attendance history for current employee.
- **Access**: Employee

### `GET /attendance/board?date=YYYY-MM-DD`
Real-time company-wide attendance board.
- **Access**: HR, Admin

### Attendance Corrections
- `POST /attendance/corrections` -> Employee submits correction request (`{ "date", "requestedCheckIn", "requestedCheckOut", "reason" }`)
- `GET /attendance/corrections` -> List correction requests
- `PATCH /attendance/corrections/:id` -> HR/Admin approval (`{ "decision": "approved"|"rejected", "comment": string }`)

---

## 7. Leaves

### `GET /leave/balance/me`
Current employee remaining leave quotas.
- **Access**: Employee
- **Response `200`**: `{ "annual": 14, "sick": 8, "casual": 10, "unpaid": 0 }`

### `POST /leave`
Applies for leave.
- **Access**: Employee
- **Body**: `{ "type": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "reason": string }`
- **Response `422`**: Balance deficit or overlapping dates.

### `GET /leave/me`
Employee personal leave history.

### `PATCH /leave/:id/cancel`
Employee cancels a pending leave request.

### `GET /leave`
Company leave approvals queue for HR/Admin.

### `PATCH /leave/:id/decision`
Approves or rejects a leave application.
- **Access**: HR, Admin
- **Body**: `{ "decision": "approved"|"rejected", "comment": string }`

---

## 8. Payroll & Payslips

### `POST /payroll/runs`
Generates or recalculates draft payroll for a month.
- **Access**: HR
- **Body**: `{ "month": "YYYY-MM" }`

### `GET /payroll/runs?month=YYYY-MM`
Fetches payroll run summary and breakdown.
- **Access**: HR, Admin

### `PATCH /payroll/runs/:id/finalize`
Finalizes and locks the payroll run, generating employee payslips.
- **Access**: Admin only

### `GET /payslips/me`
Employee view of finalized payslips.
- **Access**: Employee

### `GET /payslips/:id/pdf`
Downloads binary PDF payslip document.
- **Access**: Employee

---

## 9. Announcements & Notifications

### `GET /announcements`
Company bulletin board posts.
- **Access**: All roles

### `POST /announcements`
Publishes an announcement.
- **Access**: HR, Admin
- **Body**: `{ "title": string, "content": string, "priority": "normal"|"high" }`

### `GET /notifications/me` | `PATCH /notifications/:id/read`
User notifications stream.

---

## 10. Dashboards & System Audit

### `GET /dashboard/admin?from=&to=&departmentId=`
KPIs, Recharts department headcount & payroll liability, system audit preview.

### `GET /dashboard/hr?from=&to=&departmentId=`
KPIs, Recharts 7-day attendance trend, late-comers list, pending leaves queue.

### `GET /dashboard/me?from=&to=`
Employee personal dashboard: today's check-in status, work hours, leave balances, recent payslips.

### `GET /audit?page=&limit=`
Paginated immutable audit trail with actor, action, timestamp, and diff metadata.
- **Access**: Admin only

---

## 11. AI Assistant

### `POST /ai/chat`
Conversational AI assistant.
- **Body**: `{ "message": string }`
- **Response `200`**:
  ```json
  {
    "reply": "Assistant response text...",
    "label": "AI-generated"
  }
  ```
- **Guardrail**: Refuses employee inquiries regarding colleague compensation.

### `POST /ai/summary`
Generates concise executive bullet points from dashboard metrics.
- **Body**: `{ "dashboard": object }`
- **Response `200`**:
  ```json
  {
    "bullets": ["Bullet 1", "Bullet 2"],
    "label": "AI-generated"
  }
  ```

### `POST /ai/smart-leave`
Parses unstructured natural language text into structured leave request parameters.
- **Body**: `{ "text": "Need next Monday and Tuesday off for family travel" }`
- **Response `200`**:
  ```json
  {
    "type": "Annual",
    "start": "2026-11-02",
    "end": "2026-11-03",
    "reason": "Family travel",
    "label": "AI-generated"
  }
  ```
