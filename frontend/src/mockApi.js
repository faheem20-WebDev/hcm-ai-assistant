// Mock Axios adapter for development/demo mode
// Active strictly when import.meta.env.VITE_USE_MOCK === 'true'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let needsSetup = true;

let users = [];

let settings = {
  companyName: 'Acme HCM Tech',
  workStartTime: '09:00',
  graceMinutes: 15,
  minWorkHoursHalfDay: 5,
  weekendDays: ['Saturday', 'Sunday'],
  officeLat: 24.8607,
  officeLng: 67.0011,
  officeRadiusMeters: 150
};

let departments = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR' },
  { id: 'dept-3', name: 'Finance & Accounts', code: 'FIN' }
];

let designations = [
  { id: 'des-1', title: 'Senior Software Engineer', departmentId: 'dept-1' },
  { id: 'des-2', title: 'HR Generalist', departmentId: 'dept-2' },
  { id: 'des-3', title: 'Financial Analyst', departmentId: 'dept-3' }
];

let leaveTypes = [
  { id: 'lt-1', name: 'Annual', quota: 14, paid: true },
  { id: 'lt-2', name: 'Sick', quota: 8, paid: true },
  { id: 'lt-3', name: 'Casual', quota: 10, paid: true },
  { id: 'lt-4', name: 'Unpaid', quota: 0, paid: false }
];

let holidays = [
  { id: 'hol-1', name: 'Pakistan Day', date: '2026-03-23' },
  { id: 'hol-2', name: 'Labor Day', date: '2026-05-01' },
  { id: 'hol-3', name: 'Independence Day', date: '2026-08-14' }
];

let employees = [
  {
    id: 'EMP-001',
    name: 'Sarah HR',
    email: 'hr@company.com',
    departmentId: 'dept-2',
    designationId: 'des-2',
    status: 'active',
    basicSalary: 120000,
    grossSalary: 180000,
    phone: '+92 321 7654321',
    address: 'Gulshan-e-Iqbal, Karachi',
    joinedDate: '2025-01-15'
  },
  {
    id: 'EMP-002',
    name: 'Ali Khan',
    email: 'emp@company.com',
    departmentId: 'dept-1',
    designationId: 'des-1',
    status: 'active',
    basicSalary: 160000,
    grossSalary: 240000,
    phone: '+92 300 1234567',
    address: 'Clifton, Karachi',
    joinedDate: '2025-02-01'
  }
];

let attendance = [
  {
    id: 'att-1',
    employeeId: 'EMP-002',
    date: '2026-10-23',
    checkIn: '09:05:00',
    checkOut: '17:35:00',
    status: 'present',
    workHours: 8.5
  }
];

let corrections = [];

let leaves = [
  {
    id: 'lev-1',
    employeeId: 'EMP-002',
    type: 'Annual',
    startDate: '2026-11-02',
    endDate: '2026-11-04',
    days: 3,
    reason: 'Family event',
    status: 'approved',
    comment: 'Approved by HR'
  }
];

let notifications = [
  {
    id: 'notif-1',
    title: 'Payroll Draft Generated',
    message: 'October 2026 payroll draft is ready for review.',
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

let announcements = [
  {
    id: 'ann-1',
    title: 'Welcome to HCM Lite',
    content: 'Welcome to the newly deployed Human Capital Management portal.',
    priority: 'high',
    createdAt: new Date().toISOString()
  }
];

let payrollRuns = [
  {
    id: 'pr-2026-09',
    month: '2026-09',
    totalGross: 420000,
    totalDeductions: 15000,
    totalNet: 405000,
    isFinalized: true,
    finalizedAt: '2026-09-30T18:00:00Z',
    items: [
      {
        employeeId: 'EMP-001',
        name: 'Sarah HR',
        basic: 120000,
        gross: 180000,
        tax: 6000,
        deductions: 0,
        net: 174000
      },
      {
        employeeId: 'EMP-002',
        name: 'Ali Khan',
        basic: 160000,
        gross: 240000,
        tax: 9000,
        deductions: 0,
        net: 231000
      }
    ]
  }
];

let auditLogs = [
  {
    id: 'aud-1',
    timestamp: '2026-10-24T18:00:00Z',
    actor: 'admin@company.com',
    action: 'UPDATE_SETTINGS',
    entity: 'OrganizationSettings',
    details: 'Updated office geofence radius to 150m',
    before: { officeRadiusMeters: 100, graceMinutes: 10 },
    after: { officeRadiusMeters: 150, graceMinutes: 15 }
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-24T17:30:00Z',
    actor: 'admin@company.com',
    action: 'CREATE_USER',
    entity: 'User',
    details: 'Created HR officer Sarah HR',
    before: null,
    after: { email: 'hr@company.com', role: 'hr', isActive: true }
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-24T16:15:00Z',
    actor: 'hr@company.com',
    action: 'APPROVE_LEAVE',
    entity: 'LeaveRequest',
    details: 'Approved 3-day annual leave for EMP-002',
    before: { status: 'pending' },
    after: { status: 'approved', approvedBy: 'hr@company.com' }
  }
];

const parseBody = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
};

const getAuthUser = (headers = {}) => {
  const auth = headers.Authorization || headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  return users.find((u) => u.id === token || `mock-token-${u.id}` === token) || null;
};

export default async function mockAdapter(config) {
  await delay(300);

  const urlObj = new URL(config.url, 'http://mock.internal');
  let pathname = urlObj.pathname;
  if (pathname.startsWith('/api')) {
    pathname = pathname.slice(4);
  }
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  const method = (config.method || 'get').toUpperCase();
  const params = urlObj.searchParams;
  const body = parseBody(config.data);
  const currentUser = getAuthUser(config.headers);

  const respond = (data, status = 200) => {
    if (status >= 400) {
      const err = new Error(data?.error || 'Mock Request Failed');
      err.config = config;
      err.response = {
        data,
        status,
        statusText: status === 409 ? 'Conflict' : status === 422 ? 'Unprocessable Entity' : 'Error',
        headers: {},
        config
      };
      return Promise.reject(err);
    }
    return Promise.resolve({
      data,
      status,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config
    });
  };

  // 1. Setup & Auth
  if (pathname === '/setup/status' && method === 'GET') {
    return respond({ needsSetup });
  }

  if (pathname === '/setup' && method === 'POST') {
    const { companyName, adminName, email, password } = body;
    settings.companyName = companyName || settings.companyName;
    const adminUser = {
      id: `usr-admin-${Date.now()}`,
      name: adminName,
      email,
      password: password || 'password123',
      role: 'admin',
      employeeId: null,
      mustChangePassword: false,
      isActive: true
    };
    users.push(adminUser);
    needsSetup = false;
    return respond({ message: 'Setup completed successfully.' }, 201);
  }

  if (pathname === '/auth/login' && method === 'POST') {
    const { email, password } = body;
    const found = users.find((u) => u.email === email && u.password === password && u.isActive);
    if (!found) {
      return respond({ error: 'Invalid email or password.' }, 401);
    }
    const token = `mock-token-${found.id}`;
    return respond({
      token,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        employeeId: found.employeeId,
        mustChangePassword: found.mustChangePassword
      }
    });
  }

  if (pathname === '/auth/change-password' && method === 'POST') {
    if (currentUser) {
      currentUser.password = body.newPassword;
      currentUser.mustChangePassword = false;
    }
    return respond({ message: 'Password updated successfully.' });
  }

  if (pathname === '/auth/me' && method === 'GET') {
    if (!currentUser) return respond({ error: 'Unauthorized' }, 401);
    return respond({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        employeeId: currentUser.employeeId,
        mustChangePassword: currentUser.mustChangePassword,
        phone: currentUser.phone,
        address: currentUser.address
      }
    });
  }

  // 2. Settings & Master Data
  if (pathname === '/settings') {
    if (method === 'GET') return respond(settings);
    if (method === 'PUT') {
      settings = { ...settings, ...body };
      return respond(settings);
    }
  }

  if (pathname === '/departments') {
    if (method === 'GET') return respond({ items: departments, total: departments.length, page: 1, limit: 50 });
    if (method === 'POST') {
      const item = { id: `dept-${Date.now()}`, ...body };
      departments.push(item);
      return respond(item, 201);
    }
  }
  if (pathname.startsWith('/departments/')) {
    const id = pathname.replace('/departments/', '');
    if (method === 'PUT') {
      departments = departments.map((d) => (d.id === id ? { ...d, ...body } : d));
      return respond({ id, ...body });
    }
    if (method === 'DELETE') {
      departments = departments.filter((d) => d.id !== id);
      return respond({ message: 'Deleted' });
    }
  }

  if (pathname === '/designations') {
    if (method === 'GET') return respond({ items: designations, total: designations.length, page: 1, limit: 50 });
    if (method === 'POST') {
      const item = { id: `des-${Date.now()}`, ...body };
      designations.push(item);
      return respond(item, 201);
    }
  }
  if (pathname.startsWith('/designations/')) {
    const id = pathname.replace('/designations/', '');
    if (method === 'PUT') {
      designations = designations.map((d) => (d.id === id ? { ...d, ...body } : d));
      return respond({ id, ...body });
    }
    if (method === 'DELETE') {
      designations = designations.filter((d) => d.id !== id);
      return respond({ message: 'Deleted' });
    }
  }

  if (pathname === '/leave-types') {
    if (method === 'GET') return respond({ items: leaveTypes, total: leaveTypes.length, page: 1, limit: 50 });
    if (method === 'POST') {
      const item = { id: `lt-${Date.now()}`, ...body };
      leaveTypes.push(item);
      return respond(item, 201);
    }
  }
  if (pathname.startsWith('/leave-types/')) {
    const id = pathname.replace('/leave-types/', '');
    if (method === 'PUT') {
      leaveTypes = leaveTypes.map((l) => (l.id === id ? { ...l, ...body } : l));
      return respond({ id, ...body });
    }
    if (method === 'DELETE') {
      leaveTypes = leaveTypes.filter((l) => l.id !== id);
      return respond({ message: 'Deleted' });
    }
  }

  if (pathname === '/holidays') {
    if (method === 'GET') return respond({ items: holidays, total: holidays.length, page: 1, limit: 50 });
    if (method === 'POST') {
      const item = { id: `hol-${Date.now()}`, ...body };
      holidays.push(item);
      return respond(item, 201);
    }
  }
  if (pathname.startsWith('/holidays/')) {
    const id = pathname.replace('/holidays/', '');
    if (method === 'PUT') {
      holidays = holidays.map((h) => (h.id === id ? { ...h, ...body } : h));
      return respond({ id, ...body });
    }
    if (method === 'DELETE') {
      holidays = holidays.filter((h) => h.id !== id);
      return respond({ message: 'Deleted' });
    }
  }

  if (pathname === '/users/hr') {
    if (method === 'GET') {
      const hrList = users.filter((u) => u.role === 'hr');
      return respond({ items: hrList, total: hrList.length, page: 1, limit: 50 });
    }
    if (method === 'POST') {
      const { name, email, password } = body;
      const hrUser = {
        id: `usr-hr-${Date.now()}`,
        name,
        email,
        password: password || 'TempHr123!',
        role: 'hr',
        employeeId: null,
        mustChangePassword: true,
        isActive: true
      };
      users.push(hrUser);
      return respond(hrUser, 201);
    }
  }

  if (pathname.startsWith('/users/') && pathname.endsWith('/deactivate') && method === 'PATCH') {
    const id = pathname.split('/')[2];
    const u = users.find((x) => x.id === id);
    if (u) u.isActive = false;
    return respond({ message: 'User deactivated.' });
  }

  if (pathname.startsWith('/users/') && pathname.endsWith('/reset-password') && method === 'POST') {
    const id = pathname.split('/')[2];
    const u = users.find((x) => x.id === id);
    const tempPassword = `Reset${Math.floor(100000 + Math.random() * 900000)}!`;
    if (u) {
      u.password = tempPassword;
      u.mustChangePassword = true;
    }
    return respond({ tempPassword });
  }

  // 3. Employees
  if (pathname === '/employees') {
    if (method === 'GET') {
      const search = params.get('search')?.toLowerCase() || '';
      const filtered = employees.filter((e) =>
        e.name.toLowerCase().includes(search) || e.email.toLowerCase().includes(search)
      );
      return respond({ items: filtered, total: filtered.length, page: 1, limit: 50 });
    }
    if (method === 'POST') {
      const empId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const tempPassword = `Temp${Math.floor(100000 + Math.random() * 900000)}!`;
      const basic = Number(body.basicSalary) || 100000;
      const newEmp = {
        id: empId,
        ...body,
        status: 'active',
        basicSalary: basic,
        grossSalary: basic * 1.5,
        joinedDate: body.joinedDate || new Date().toISOString().slice(0, 10)
      };
      employees.push(newEmp);

      users.push({
        id: `usr-${empId.toLowerCase()}`,
        name: newEmp.name,
        email: newEmp.email,
        password: tempPassword,
        role: 'employee',
        employeeId: empId,
        mustChangePassword: true,
        isActive: true
      });

      return respond({ ...newEmp, tempPassword }, 201);
    }
  }

  if (pathname.startsWith('/employees/') && !pathname.endsWith('/profile')) {
    const id = pathname.replace('/employees/', '');
    const emp = employees.find((e) => e.id === id);
    if (method === 'GET') {
      return emp ? respond(emp) : respond({ error: 'Employee not found' }, 404);
    }
    if (method === 'PUT') {
      if (!emp) return respond({ error: 'Employee not found' }, 404);
      Object.assign(emp, body);
      return respond(emp);
    }
  }

  if (pathname === '/me/profile' && method === 'PATCH') {
    if (!currentUser) return respond({ error: 'Unauthorized' }, 401);
    currentUser.phone = body.phone || currentUser.phone;
    currentUser.address = body.address || currentUser.address;
    const emp = employees.find((e) => e.id === currentUser.employeeId);
    if (emp) {
      emp.phone = currentUser.phone;
      emp.address = currentUser.address;
    }
    return respond({ message: 'Profile updated', phone: currentUser.phone, address: currentUser.address });
  }

  // 4. Attendance
  const todayStr = new Date().toISOString().slice(0, 10);

  if (pathname === '/attendance/check-in' && method === 'POST') {
    const empId = currentUser?.employeeId || 'EMP-002';
    const existing = attendance.find((a) => a.employeeId === empId && a.date === todayStr);
    if (existing) {
      return respond({ error: 'Already checked in for today.' }, 409);
    }
    const record = {
      id: `att-${Date.now()}`,
      employeeId: empId,
      date: todayStr,
      checkIn: new Date().toLocaleTimeString('en-US', { hour12: false }),
      checkOut: null,
      status: 'present',
      workHours: 0
    };
    attendance.push(record);
    return respond(record, 201);
  }

  if (pathname === '/attendance/check-out' && method === 'POST') {
    const empId = currentUser?.employeeId || 'EMP-002';
    let record = attendance.find((a) => a.employeeId === empId && a.date === todayStr);
    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        employeeId: empId,
        date: todayStr,
        checkIn: '09:00:00',
        status: 'present',
        workHours: 0
      };
      attendance.push(record);
    }
    record.checkOut = new Date().toLocaleTimeString('en-US', { hour12: false });
    record.workHours = 8.0;
    return respond(record);
  }

  if (pathname === '/attendance/me' && method === 'GET') {
    const empId = currentUser?.employeeId || 'EMP-002';
    const list = attendance.filter((a) => a.employeeId === empId);
    return respond({ items: list, total: list.length, page: 1, limit: 31 });
  }

  if (pathname === '/attendance/board' && method === 'GET') {
    const date = params.get('date') || todayStr;
    const list = employees.map((emp) => {
      const att = attendance.find((a) => a.employeeId === emp.id && a.date === date);
      return {
        employeeId: emp.id,
        name: emp.name,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        status: att?.status || 'absent'
      };
    });
    return respond({ date, records: list });
  }

  if (pathname === '/attendance/corrections') {
    if (method === 'POST') {
      const item = {
        id: `cor-${Date.now()}`,
        employeeId: currentUser?.employeeId || 'EMP-002',
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      corrections.push(item);
      return respond(item, 201);
    }
    if (method === 'GET') {
      return respond({ items: corrections, total: corrections.length, page: 1, limit: 50 });
    }
  }

  if (pathname.startsWith('/attendance/corrections/') && method === 'PATCH') {
    const id = pathname.replace('/attendance/corrections/', '');
    const cor = corrections.find((c) => c.id === id);
    if (cor) {
      cor.status = body.decision;
      cor.comment = body.comment;
    }
    return respond({ message: 'Correction processed', correction: cor });
  }

  // 5. Leave
  if (pathname === '/leave') {
    if (method === 'POST') {
      const { type, startDate, endDate, reason } = body;
      const empId = currentUser?.employeeId || 'EMP-002';
      const overlap = leaves.some(
        (l) => l.employeeId === empId && l.status !== 'cancelled' && l.startDate === startDate
      );
      if (overlap) {
        return respond({ error: 'Leave request overlaps with an existing leave application.' }, 422);
      }
      const item = {
        id: `lev-${Date.now()}`,
        employeeId: empId,
        type: type || 'Annual',
        startDate,
        endDate,
        reason,
        days: 1,
        status: 'pending'
      };
      leaves.push(item);
      return respond(item, 201);
    }
    if (method === 'GET') {
      const statusFilter = params.get('status');
      const filtered = statusFilter ? leaves.filter((l) => l.status === statusFilter) : leaves;
      return respond({ items: filtered, total: filtered.length, page: 1, limit: 50 });
    }
  }

  if (pathname === '/leave/me' && method === 'GET') {
    const empId = currentUser?.employeeId || 'EMP-002';
    const list = leaves.filter((l) => l.employeeId === empId);
    return respond({ items: list, total: list.length, page: 1, limit: 50 });
  }

  if (pathname === '/leave/balance/me' && method === 'GET') {
    return respond({
      annual: 11,
      sick: 8,
      casual: 9,
      unpaid: 0
    });
  }

  if (pathname.startsWith('/leave/') && pathname.endsWith('/cancel') && method === 'PATCH') {
    const id = pathname.split('/')[2];
    const lev = leaves.find((l) => l.id === id);
    if (lev) lev.status = 'cancelled';
    return respond({ message: 'Leave cancelled successfully.' });
  }

  if (pathname.startsWith('/leave/') && pathname.endsWith('/decision') && method === 'PATCH') {
    const id = pathname.split('/')[2];
    const lev = leaves.find((l) => l.id === id);
    if (lev) {
      lev.status = body.decision;
      lev.comment = body.comment;
    }
    return respond({ message: 'Leave decision recorded.', leave: lev });
  }

  // 6. Notifications & Announcements
  if (pathname === '/notifications/me' && method === 'GET') {
    return respond({ items: notifications, total: notifications.length, page: 1, limit: 50 });
  }

  if (pathname.startsWith('/notifications/') && pathname.endsWith('/read') && method === 'PATCH') {
    const id = pathname.split('/')[2];
    const notif = notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    return respond({ message: 'Notification marked as read.' });
  }

  if (pathname === '/announcements') {
    if (method === 'GET') return respond({ items: announcements, total: announcements.length, page: 1, limit: 50 });
    if (method === 'POST') {
      const ann = {
        id: `ann-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      };
      announcements.unshift(ann);
      return respond(ann, 201);
    }
  }

  // 7. Payroll & Payslips
  if (pathname === '/payroll/runs') {
    if (method === 'POST') {
      const month = body.month || '2026-10';
      const existing = payrollRuns.find((p) => p.month === month);
      if (existing && existing.isFinalized) {
        return respond({ error: `Payroll run for ${month} is already finalized and locked.` }, 422);
      }

      const items = employees.map((e) => {
        const basic = e.basicSalary || 100000;
        const gross = e.grossSalary || basic * 1.5;
        const deductions = 0;
        const annualGross = gross * 12;
        let annualTax = 0;
        if (annualGross > 3600000) {
          annualTax = 510000 + (annualGross - 3600000) * 0.35;
        } else if (annualGross > 2400000) {
          annualTax = 210000 + (annualGross - 2400000) * 0.25;
        } else if (annualGross > 1200000) {
          annualTax = 30000 + (annualGross - 1200000) * 0.15;
        } else if (annualGross > 600000) {
          annualTax = (annualGross - 600000) * 0.05;
        }
        const tax = Math.round(annualTax / 12);
        const net = Math.round(gross - deductions - tax);

        return {
          employeeId: e.id,
          name: e.name,
          basic,
          gross,
          deductions,
          tax,
          net
        };
      });

      const totalGross = items.reduce((acc, i) => acc + i.gross, 0);
      const totalDeductions = items.reduce((acc, i) => acc + i.deductions + i.tax, 0);
      const totalNet = items.reduce((acc, i) => acc + i.net, 0);

      if (existing) {
        existing.items = items;
        existing.totalGross = totalGross;
        existing.totalDeductions = totalDeductions;
        existing.totalNet = totalNet;
        return respond(existing, 200);
      }

      const run = {
        id: `pr-${month}`,
        month,
        totalGross,
        totalDeductions,
        totalNet,
        isFinalized: false,
        finalizedAt: null,
        items
      };
      payrollRuns.unshift(run);
      return respond(run, 201);
    }
    if (method === 'GET') {
      const month = params.get('month');
      const filtered = month ? payrollRuns.filter((p) => p.month === month) : payrollRuns;
      return respond({ items: filtered, total: filtered.length, page: 1, limit: 50 });
    }
  }

  if (pathname.startsWith('/payroll/runs/') && !pathname.endsWith('/finalize') && method === 'GET') {
    const id = pathname.replace('/payroll/runs/', '');
    const run = payrollRuns.find((p) => p.id === id) || payrollRuns[0];
    return respond(run);
  }

  if (pathname.startsWith('/payroll/runs/') && pathname.endsWith('/finalize') && method === 'PATCH') {
    if (currentUser && currentUser.role !== 'admin') {
      return respond({ error: 'Permission denied: Only administrators can finalize payroll runs.' }, 403);
    }
    const id = pathname.split('/')[3];
    const run = payrollRuns.find((p) => p.id === id);
    if (!run) {
      return respond({ error: 'Payroll run not found.' }, 404);
    }
    if (run.isFinalized) {
      return respond({ error: 'This payroll run is already locked and finalized.' }, 422);
    }
    run.isFinalized = true;
    run.finalizedAt = new Date().toISOString();
    return respond({ message: 'Payroll run finalized and locked.', run });
  }

  if (pathname === '/payslips/me' && method === 'GET') {
    const empId = currentUser?.employeeId || 'EMP-002';
    const slips = payrollRuns
      .filter((r) => r.isFinalized)
      .map((r) => {
        const item = r.items?.find((i) => i.employeeId === empId);
        return {
          id: `ps-${r.month}-${empId}`,
          month: r.month,
          ...item
        };
      })
      .filter(Boolean);
    return respond({ items: slips, total: slips.length, page: 1, limit: 50 });
  }

  if (pathname.startsWith('/payslips/') && pathname.endsWith('/pdf') && method === 'GET') {
    const blob = new Blob(
      [`%PDF-1.4\n1 0 obj\n<< /Title (Employee Payslip) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`],
      { type: 'application/pdf' }
    );
    return Promise.resolve({
      data: blob,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="payslip.pdf"'
      },
      config
    });
  }

  // 8. Dashboards & Audit
  if (pathname === '/dashboard/hr') {
    const from = params.get('from') || '';
    const to = params.get('to') || '';
    const deptId = params.get('departmentId') || '';

    return respond({
      headcount: employees.length || 24,
      presentToday: 21,
      onLeaveToday: 2,
      lateToday: 1,
      pendingApprovals: corrections.filter((c) => c.status === 'pending').length + leaves.filter((l) => l.status === 'pending').length || 3,
      attendanceTrend: [
        { day: 'Mon', present: 22, late: 2 },
        { day: 'Tue', present: 23, late: 1 },
        { day: 'Wed', present: 21, late: 3 },
        { day: 'Thu', present: 24, late: 0 },
        { day: 'Fri', present: 21, late: 1 }
      ],
      absenteeismByDept: [
        { dept: 'Engineering', rate: 3.8 },
        { dept: 'HR', rate: 1.2 },
        { dept: 'Finance', rate: 2.5 }
      ],
      leaveByType: [
        { name: 'Annual', count: 12 },
        { name: 'Sick', count: 6 },
        { name: 'Casual', count: 5 },
        { name: 'Unpaid', count: 1 }
      ],
      topLateComers: [
        { id: 'EMP-005', name: 'Zainab Ahmed', dept: 'Engineering', count: 4 },
        { id: 'EMP-003', name: 'Bilal Tariq', dept: 'Finance', count: 3 },
        { id: 'EMP-008', name: 'Usman Farooq', dept: 'Engineering', count: 2 },
        { id: 'EMP-002', name: 'Ali Khan', dept: 'Engineering', count: 1 },
        { id: 'EMP-006', name: 'Hina Malik', dept: 'HR', count: 1 }
      ],
      departments
    });
  }

  if (pathname === '/dashboard/admin') {
    const from = params.get('from') || '';
    const to = params.get('to') || '';
    const deptId = params.get('departmentId') || '';

    const count = employees.length || 24;
    const totalPayroll = 3840000;
    const avgSalary = Math.round(totalPayroll / count);

    return respond({
      headcount: count,
      attritionYtd: '4.2%',
      payrollCost: totalPayroll,
      avgSalary: avgSalary,
      headcountByDept: [
        { dept: 'Engineering', count: 13 },
        { dept: 'Finance', count: 6 },
        { dept: 'HR', count: 5 }
      ],
      payrollByDept: [
        { dept: 'Engineering', cost: 2150000 },
        { dept: 'Finance', cost: 960000 },
        { dept: 'HR', cost: 730000 }
      ],
      recentAudits: auditLogs.slice(0, 5),
      departments
    });
  }

  if (pathname === '/dashboard/me') {
    const empId = currentUser?.employeeId || 'EMP-002';
    const todayRecord = attendance.find((a) => a.employeeId === empId && a.date === todayStr) || null;
    return respond({
      employeeId: empId,
      name: currentUser?.name || 'Ali Khan',
      todayAttendance: todayRecord,
      hoursThisWeek: 34.5,
      targetHours: 40,
      lateCountMonth: 1,
      leaveBalance: { annual: 11, sick: 8, casual: 9, unpaid: 0 },
      lastPayslip: { month: '2026-09', net: 231000 },
      announcements: announcements.slice(0, 3)
    });
  }

  if (pathname === '/audit' && method === 'GET') {
    return respond({ items: auditLogs, total: auditLogs.length, page: 1, limit: 50 });
  }

  // 9. AI Assistant
  if (pathname === '/ai/chat' && method === 'POST') {
    const q = (body.message || '').toLowerCase();
    let reply = `Based on company policy and your role (${currentUser?.role || 'user'}), standard working hours are 09:00 with a 15-minute grace period. Your remaining leave quota is healthy.`;

    if (q.includes('colleague') || q.includes("ali's salary") || (currentUser?.role === 'employee' && (q.includes('salary of') || q.includes('someone else') || q.includes('other employee')))) {
      reply = 'Access Denied: Data scope restriction enforced. As an employee, you are strictly authorized to view your own salary and payslip records. Accessing colleague compensation data is prohibited by company policy and role permissions.';
    } else if (q.includes('sick leave') || q.includes('sick leaves')) {
      reply = 'You currently have 8 sick leaves remaining for the current calendar year. Sick leave is fully paid and does not require advance approval for emergencies under 2 consecutive days.';
    } else if (q.includes('monday and tuesday') || q.includes('smart leave')) {
      reply = 'I have identified your request for Monday and Tuesday off (Annual Leave). You can navigate to the Leave tab where the Smart Leave Assistant has parsed your dates, or ask me to draft it for you.';
    } else if (q.includes('attendance summary') || q.includes('attendance trend')) {
      reply = 'Weekly attendance compliance is at 94.8% with an average check-in time of 09:08 AM. 1 late arrival recorded today.';
    } else if (q.includes('late today') || q.includes('who was late')) {
      reply = 'Today, 1 employee checked in after the 09:15 grace threshold: Ali Khan (checked in at 09:22 AM).';
    } else if (q.includes('payroll') || q.includes('total monthly payroll')) {
      reply = 'Total monthly payroll liability for the current cycle is PKR 3,840,000 across 24 active employees with an average salary of PKR 160,000.';
    } else if (q.includes('leave') || q.includes('vacation')) {
      reply = 'Annual leave quota is 14 days per calendar year. You currently have 11 annual leave days remaining. Weekends and gazetted holidays are excluded from deduction.';
    }

    return respond({ reply, label: 'AI-generated' });
  }

  if (pathname === '/ai/summary' && method === 'POST') {
    return respond({
      bullets: [
        'Attendance compliance is at 96% this week with negligible tardiness.',
        'All leave requests for the upcoming week have been reviewed.',
        'September payroll run finalized with zero discrepancies.'
      ],
      label: 'AI-generated'
    });
  }

  if (pathname === '/ai/smart-leave' && method === 'POST') {
    const text = (body.text || '').trim();
    if (!text) {
      return respond({ error: 'No leave prompt provided.' }, 400);
    }
    const lower = text.toLowerCase();
    let type = 'Annual';
    if (lower.includes('sick') || lower.includes('doctor') || lower.includes('fever') || lower.includes('ill') || lower.includes('hospital')) {
      type = 'Sick';
    } else if (lower.includes('casual') || lower.includes('urgent') || lower.includes('personal') || lower.includes('family')) {
      type = 'Casual';
    } else if (lower.includes('unpaid')) {
      type = 'Unpaid';
    }

    let start = '2026-10-26';
    let end = '2026-10-27';

    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      start = d.toISOString().slice(0, 10);
      end = start;
    } else if (lower.includes('monday and tuesday') || lower.includes('mon and tue')) {
      start = '2026-10-26';
      end = '2026-10-27';
    } else if (lower.includes('friday')) {
      start = '2026-10-30';
      end = '2026-10-30';
    } else if (lower.includes('next week')) {
      start = '2026-10-26';
      end = '2026-10-30';
    }

    const reason = text.replace(/^(i need|please grant me|apply for|take)\s+/i, '');

    return respond({
      type,
      start,
      end,
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
      label: 'AI-generated'
    });
  }

  return respond({ error: `Mock endpoint not found: ${method} ${pathname}` }, 404);
}
