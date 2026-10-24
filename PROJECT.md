# PROJECT SPECIFICATION: HCM Lite

HCM Lite is a lightweight, role-based Human Capital Management (HR) web application designed for streamlined attendance, leave management, payroll processing, and AI-assisted employee/HR self-service.

---

## 1. Architecture & Technology Stack

- **Directory Structure**:
  - `/backend`: Node 20, Express, Mongoose, CommonJS (`require`), Plain JavaScript.
  - `/frontend`: React, Vite, React Router, Axios, Recharts, Plain CSS, Plain JavaScript.
- **Deployment**: Separate Vercel projects for frontend (SPA) and backend (Express serverless / api function).
- **Database**: MongoDB Atlas.
- **Timezone**: `Asia/Karachi` for all date/time calculations, timestamps, and reports (using `dayjs` with `utc` and `timezone` plugins).
- **Authentication**: JWT authentication with `bcrypt` password hashing.
- **Access Control & Scoping**:
  - Every API endpoint enforces role-based authorization (`admin`, `hr`, `employee`).
  - Strict data scoping: Employees are restricted exclusively to data matching their own `employeeId`.
- **Code Layering**:
  - `routes` -> `controllers` -> `services`
  - All validation and business logic rules reside strictly within the `services` layer.

---

## 2. Environment Configuration

### Backend (`/backend/.env.example`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hcm_lite?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
AI_API_KEY=your_gemini_api_key_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=InitialAdminPassword123!
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`/frontend/.env.example`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Roles and Permissions Matrix

| Feature / Action | Admin | HR | Employee |
| :--- | :---: | :---: | :---: |
| Company Setup & Global Settings (Geofence, Work Hours) | Yes | No | No |
| Master Data (Departments, Designations, Holidays, Leave Types) | Yes | No | No |
| Create / Deactivate / Reset HR & Employee Logins | Yes | No | No |
| Register Employees (generates temp password, forced reset) | Yes | Yes | No |
| Edit Employee Details (Profile, Contact) | Yes | Yes | Own Phone/Address Only |
| Salary Structure Assignment | Yes | Yes | No |
| Attendance Board / Live Check-In Monitoring | Yes | Yes | No |
| Attendance Check-In / Check-Out (GPS Geofence) | No | No | Own Record Only |
| Attendance Correction Requests | View All | Approve / Reject | Request Own Only |
| Leave Applications | View All | Approve / Reject + Comment | Apply / Cancel Own Only |
| Leave Balances & Quotas | View All | View All | View Own Only |
| Payroll Draft Generation & Review | Yes | Yes | No |
| Finalize Payroll & Lock Run | Yes | No | No |
| Payslips Access | View All | View All | View Own Only |
| Audit Logs | View All | No | No |
| Announcements | Create / View | Create / View | View Only |
| AI Assistant Interface | Yes (Full Scope) | Yes (HR Scope) | Yes (Employee Scope) |

---

## 4. Core Business Rules & Domain Logic

### 4.1 Attendance
- **Office Hours**: Starts at 09:00.
- **Grace Period**: 15 minutes. Arrivals up to 09:15 are marked `present`. Arrivals after 09:15 are marked `late`.
- **Half Day**: If total worked duration between check-in and check-out is under 5 hours, attendance status is converted to `half_day`.
- **Weekends**: Saturday and Sunday are default non-working weekend days.
- **Geofencing**: Office coordinates (`latitude`, `longitude`) with a default radius of `150m` stored in DB settings. Check-in/out requests validate client coordinates against this boundary.
- **Daily Constraint**: Exactly one attendance record per employee per day. A second check-in attempt on the same day returns HTTP `409 Conflict`.
- **Statuses**: `present`, `late`, `half_day`, `absent`, `on_leave`, `missing_checkout`.

### 4.2 Leave Management
- **Quotas**: Annual: 14 days, Sick: 8 days, Casual: 10 days, Unpaid: Unlimited.
- **Working Days Calculation**: Leave deduction counts working days only, skipping weekend days (Saturday/Sunday) and declared company holidays.
- **Validation**: Any overlapping leave request or request exceeding the available balance returns HTTP `422 Unprocessable Entity`.

### 4.3 Payroll & Taxation
- **Salary Formula**:
  - $\text{Gross Salary} = 1.5 \times \text{Basic Salary}$
  - Component breakdown: Basic = $1.0$, House Rent Allowance (HRA) = $0.4 \times \text{Basic}$ ($40\%$), Medical Allowance = $0.1 \times \text{Basic}$ ($10\%$).
- **Daily Rate**: $\text{Per Day Rate} = \frac{\text{Gross Salary}}{\text{Working Days in Month}}$.
- **Proration**: New joiners and exiting employees are prorated based on active calendar/working days within the cycle.
- **Deductions**:
  $$\text{Deduction} = (\text{Absent Days} + \text{Unpaid Leave Days} + 0.5 \times \text{Half Days}) \times \text{Per Day Rate}$$
- **Annual Tax Calculation (Progressive on $\text{Gross} \times 12$)**:
  - Up to PKR 600,000: $0\%$
  - PKR 600,001 to 1,200,000: $5\%$ of the excess over 600,000
  - PKR 1,200,001 to 2,400,000: PKR 30,000 $+ 15\%$ of the excess over 1,200,000
  - PKR 2,400,001 to 3,600,000: PKR 210,000 $+ 25\%$ of the excess over 2,400,000
  - Exceeding PKR 3,600,000: PKR 510,000 $+ 35\%$ of the excess over 3,600,000
  - Monthly tax withholding = $\frac{\text{Annual Tax}}{12}$.
- **Lifecycle & Immutability**: Admin finalizes payroll runs. Once finalized, the payroll record and associated payslips are immutable and locked.

---

## 5. AI Assistant Integration

- **Engine**: Google Gemini API utilizing Function Calling / Tool Execution.
- **Execution Boundary**: Backend-only. The frontend communicates solely with the backend AI endpoint.
- **Security & Data Scope**: Tools execute through the existing service layer using the authenticated user's session and security scope (an employee can only query their own leave or payslip).
- **Read-Only / No Direct Persistence**: AI functions never mutate database state directly.
- **Operational Guardrails**:
  - Request timeout: 15 seconds.
  - Rate limiting: 20 requests per user per hour.
  - Comprehensive logging of every prompt, tool execution, and token usage into the `ai_logs` collection.
  - Every AI response is explicitly labeled with `"AI-generated"`.

---

## 6. Initialization & First Run

- **Zero Seed Data**: No fake or dummy records are automatically populated.
- **First-Run Setup**: On system startup, if no administrator account exists in the database:
  - If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are defined in the environment, initialize the root admin account automatically.
  - Otherwise, expose a setup screen on the frontend allowing the user to configure the company name and create the initial admin account.
