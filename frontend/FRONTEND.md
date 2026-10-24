# FRONTEND SPECIFICATION: HCM Lite

Front-end architecture, routing, design rules, and comprehensive API client contract for the HCM Lite web application.

---

## 1. Technical Stack & Environment

- **Core Framework**: React 18+ with Vite
- **Language**: Plain JavaScript (ES Modules, `.jsx` / `.js`)
- **Styling**: Plain CSS (CSS Modules or scoped clean stylesheets, zero CSS framework dependencies)
- **Routing**: `react-router` (v6+)
- **Networking**: `axios` instance configured with base interceptors
- **Data Visualization**: `recharts` for charts and analytics
- **Environment Configuration**:
  - `VITE_API_URL` (e.g., `http://localhost:5000/api` in dev, `/api` or serverless API URL in production)

---

## 2. Core Frontend Rules & UX Standards

1. **Zero Hardcoded Data**: All dynamic entities, lists, status values, and dashboard metrics must originate from the backend API.
2. **Tri-State View Handling**: Every single view, table, and data-bound container must explicitly implement:
   - **Loading State**: Clean spinner/skeleton placeholder while requests are in flight.
   - **Empty State**: Friendly informational notice when zero records or items are returned.
   - **Error State**: Informative error banner/card displaying `{error}` message with retry option.
3. **Responsive Design (375px Minimum)**:
   - Full mobile-first responsiveness down to 375px width.
   - Collapsible mobile navigation drawer / hamburger menu.
   - Tables horizontally scrollable or converted to card lists on mobile viewports.
4. **AI Output Distinction**:
   - Every response rendered from the AI backend (`/ai/chat`, `/ai/summary`, etc.) must display a distinct visible badge: **`AI-generated`**.
5. **Session & Security**:
   - JWT stored in secure storage (`localStorage` / memory).
   - Axios request interceptor attaches `Authorization: Bearer <token>`.
   - Axios response interceptor intercepts `401 Unauthorized` and redirects to `/login`.
   - If `mustChangePassword` is `true`, redirect immediately to `/change-password` and block navigation.

---

## 3. Roles and View Routing

### Roles: `admin`, `hr`, `employee`

### Route Map:
- `/setup` - First-time company and admin initialization (renders if `/setup/status` returns `{needsSetup: true}`).
- `/login` - User authentication.
- `/change-password` - Mandatory on first login if `mustChangePassword: true`, or user-initiated.
- `/dashboard` - Scoped dashboard dynamically loaded based on user role (`/dashboard/admin`, `/dashboard/hr`, or `/dashboard/me`).
- `/attendance` - Employee check-in/out, personal history; for HR/Admin: Attendance board & corrections management.
- `/leave` - Employee leave balances & application; for HR/Admin: Leave approval queue.
- `/payroll` - Employee payslip view/download; for HR/Admin: Payroll runs, draft generation, and finalization.
- `/employees` - HR/Admin employee directory, registration, and profile management.
- `/settings` - Admin company setup, departments, designations, leave types, holidays, and HR user management.
- `/audit` - Admin-only audit log viewer.
- `/announcements` - Company-wide announcements list & publisher (HR/Admin).

---

## 4. API Client Contract

All requests accept and return JSON. Base endpoint prefix: `/api`.
- **Authorization**: `Bearer <token>` in `Authorization` header.
- **Dates**: Strict `YYYY-MM-DD` format.
- **Standard Error Format**: `{ "error": "Human readable error message" }`
- **Standard Pagination Format**: `{ "items": [...], "total": 120, "page": 1, "limit": 10 }`

### 4.1 Setup & Authentication
- `GET /setup/status` -> `{ "needsSetup": boolean }`
- `POST /setup`
  - Body: `{ "companyName": string, "adminName": string, "email": string, "password": string }`
  - Returns: `{ "message": string }`
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
  - Returns: `{ "token": string, "user": { "id": string, "name": string, "email": string, "role": "admin"|"hr"|"employee", "employeeId": string|null, "mustChangePassword": boolean } }`
- `POST /auth/change-password`
  - Body: `{ "oldPassword": string, "newPassword": string }`
  - Returns: `{ "message": string }`
- `GET /auth/me`
  - Returns: Current user profile and permission details.

### 4.2 System Settings & Master Data (Admin write / HR read)
- `GET /settings`, `PUT /settings`
  - Body/Response: Company settings, office location (`lat`, `lng`, `radius`), work hours.
- `GET /departments`, `POST /departments`, `PUT /departments/:id`, `DELETE /departments/:id`
- `GET /designations`, `POST /designations`, `PUT /designations/:id`, `DELETE /designations/:id`
- `GET /leave-types`, `POST /leave-types`, `PUT /leave-types/:id`, `DELETE /leave-types/:id`
- `GET /holidays`, `POST /holidays`, `PUT /holidays/:id`, `DELETE /holidays/:id`
- `POST /users/hr`
  - Body: `{ "name": string, "email": string, "password": string }`
- `PATCH /users/:id/deactivate`
- `POST /users/:id/reset-password`
  - Returns: `{ "tempPassword": string }`

### 4.3 Employees
- `GET /employees?search=&departmentId=&status=&page=&limit=`
  - Returns: `{ "items": [...], "total": number, "page": number, "limit": number }`
- `POST /employees`
  - Body: Employee record payload (personal, designation, department, basic salary).
  - Returns: Created employee record + `{ "tempPassword": string }` (displayed once).
- `GET /employees/:id`, `PUT /employees/:id`
- `PATCH /me/profile`
  - Allowed for logged-in employee.
  - Body: `{ "phone": string, "address": string }`

### 4.4 Attendance
- `POST /attendance/check-in`
  - Body: `{ "latitude": number, "longitude": number }`
  - Returns: Attendance record or `409 Conflict` if already checked in.
- `POST /attendance/check-out`
  - Body: `{ "latitude": number, "longitude": number }`
- `GET /attendance/me?month=YYYY-MM`
  - Returns monthly log of current employee's records.
- `GET /attendance/board?date=YYYY-MM-DD`
  - Returns company-wide status overview (HR/Admin).
- `POST /attendance/corrections`
  - Body: `{ "date": "YYYY-MM-DD", "requestedCheckIn": string, "requestedCheckOut": string, "reason": string }`
- `GET /attendance/corrections?status=`
- `PATCH /attendance/corrections/:id`
  - Body: `{ "decision": "approved"|"rejected", "comment": string }`

### 4.5 Leaves
- `POST /leave`
  - Body: `{ "type": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "reason": string }`
  - Returns: Created leave request or `422 Unprocessable Entity` on overlap or balance deficit.
- `GET /leave/me` -> Current employee leave history.
- `GET /leave/balance/me` -> `{ "annual": number, "sick": number, "casual": number, "unpaid": number }`
- `PATCH /leave/:id/cancel` -> Employee cancels pending leave.
- `GET /leave?status=&page=` -> HR/Admin approval queue.
- `PATCH /leave/:id/decision`
  - Body: `{ "decision": "approved"|"rejected", "comment": string }`

### 4.6 Notifications & Announcements
- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `GET /announcements`
- `POST /announcements`
  - Body: `{ "title": string, "content": string, "priority": "normal"|"high" }`

### 4.7 Payroll & Payslips
- `POST /payroll/runs`
  - Body: `{ "month": "YYYY-MM" }` -> Generates draft run.
- `GET /payroll/runs?month=YYYY-MM`
- `GET /payroll/runs/:id` -> Detailed run breakdown with individual payslip rows.
- `PATCH /payroll/runs/:id/finalize` -> Finalizes and locks run (Admin only).
- `GET /payslips/me` -> List of finalized payslips for current employee.
- `GET /payslips/:id/pdf` -> Downloadable PDF payslip stream/file.

### 4.8 Dashboards & Audit
- `GET /dashboard/admin?from=YYYY-MM-DD&to=YYYY-MM-DD&departmentId=`
- `GET /dashboard/hr?from=YYYY-MM-DD&to=YYYY-MM-DD&departmentId=`
- `GET /dashboard/me?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /audit?page=` -> Paginated system audit logs.

### 4.9 AI Assistant
- `POST /ai/chat`
  - Body: `{ "message": string }`
  - Returns: `{ "reply": string, "label": "AI-generated" }`
- `POST /ai/summary`
  - Body: `{ "dashboard": object }`
  - Returns: `{ "bullets": string[], "label": "AI-generated" }`
- `POST /ai/smart-leave`
  - Body: `{ "text": string }`
  - Returns: `{ "type": string, "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "reason": string, "label": "AI-generated" }` or `{ "error": string }`
