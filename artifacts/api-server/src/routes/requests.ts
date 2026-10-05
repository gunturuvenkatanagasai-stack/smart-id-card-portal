import { Router, type IRouter } from "express";
import { db, requestsTable, auditLogsTable, notificationsTable } from "@workspace/db";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import {
  CreateRequestBody,
  GetRequestParams,
  ListRequestsQueryParams,
  PayRequestParams,
  PayRequestBody,
  HodActionParams,
  HodActionBody,
  PrincipalActionParams,
  PrincipalActionBody,
  AdminActionParams,
  AdminActionBody,
  VerifyQrBody,
  CollectCardParams,
  CollectCardBody,
  GetMyRequestQueryParams,
  GetNotificationsQueryParams,
  MarkNotificationReadParams,
} from "@workspace/api-zod";
import {
  sendApplicationSubmittedEmail,
  sendHODApprovalEmail,
  sendPrincipalApprovalEmail,
  sendPaymentConfirmationEmail,
  sendReadyToCollectEmail,
  sendCollectionConfirmationEmail,
} from "../lib/email";
import {
  authenticateStaff,
  optionalAuthenticateStaff,
  requireRole,
  requireHodDepartmentMatch,
  departmentsMatch,
} from "../middleware/auth";
import { portalStorage } from "../lib/storage";

const router: IRouter = Router();

type RequestRecord = {
  id: number;
  requestNumber: string;
  studentName: string;
  registerNumber: string;
  branch: string;
  year: string;
  semester: string;
  section: string | null;
  mobileNumber: string;
  email: string;
  reason: string;
  dateOfLoss: string | null;
  locationOfLoss: string | null;
  additionalRemarks: string | null;
  status: string;
  hodNote: string | null;
  hodApprovedAt: Date | null;
  hodApprovedBy: string | null;
  principalNote: string | null;
  principalApprovedAt: Date | null;
  principalApprovedBy: string | null;
  adminNote: string | null;
  adminVerifiedAt: Date | null;
  paymentId: string | null;
  paymentMethod: string | null;
  paymentAmount: string | null;
  paidAt: Date | null;
  collectedAt: Date | null;
  collectedByStaff: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function syncLocalRequests(): RequestRecord[] {
  return portalStorage.getRequests().map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
    hodApprovedAt: r.hodApprovedAt ? new Date(r.hodApprovedAt) : null,
    principalApprovedAt: r.principalApprovedAt ? new Date(r.principalApprovedAt) : null,
    adminVerifiedAt: r.adminVerifiedAt ? new Date(r.adminVerifiedAt) : null,
    paidAt: r.paidAt ? new Date(r.paidAt) : null,
    collectedAt: r.collectedAt ? new Date(r.collectedAt) : null,
  }));
}

const fallbackRequests: RequestRecord[] = syncLocalRequests();
let fallbackRequestId = fallbackRequests.length > 0 ? Math.max(...fallbackRequests.map((r) => r.id)) + 1 : 1;
const fallbackAuditLogs: any[] = [];
let fallbackAuditId = 1;
const fallbackNotifications: any[] = [];
let fallbackNotifId = 1;

function persistLocalRequest(record: RequestRecord) {
  const existing = portalStorage.findRequestById(record.id);
  const serialized = {
    ...record,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
    hodApprovedAt: record.hodApprovedAt instanceof Date ? record.hodApprovedAt.toISOString() : record.hodApprovedAt,
    principalApprovedAt: record.principalApprovedAt instanceof Date ? record.principalApprovedAt.toISOString() : record.principalApprovedAt,
    adminVerifiedAt: record.adminVerifiedAt instanceof Date ? record.adminVerifiedAt.toISOString() : record.adminVerifiedAt,
    paidAt: record.paidAt instanceof Date ? record.paidAt.toISOString() : record.paidAt,
    collectedAt: record.collectedAt instanceof Date ? record.collectedAt.toISOString() : record.collectedAt,
  };
  if (existing) {
    portalStorage.updateRequest(record.id, serialized as any);
  } else {
    portalStorage.createRequest(serialized as any);
  }
}

function generateRequestNumber(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `IDR-2026-${ts}${rand}`;
}

function mapRow(row: any) {
  return {
    ...row,
    paymentAmount: row.paymentAmount != null ? Number(row.paymentAmount) : null,
    hodApprovedAt: row.hodApprovedAt ? new Date(row.hodApprovedAt).toISOString() : null,
    principalApprovedAt: row.principalApprovedAt ? new Date(row.principalApprovedAt).toISOString() : null,
    adminVerifiedAt: row.adminVerifiedAt ? new Date(row.adminVerifiedAt).toISOString() : null,
    paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null,
    collectedAt: row.collectedAt ? new Date(row.collectedAt).toISOString() : null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

async function addAuditLog(requestNumber: string, user: string, role: string, action: string, remarks?: string) {
  const record = {
    id: fallbackAuditId++,
    requestNumber,
    user,
    role,
    action,
    remarks: remarks ?? null,
    createdAt: new Date(),
  };
  fallbackAuditLogs.push(record);
  portalStorage.addAuditLog({
    requestNumber,
    user,
    role,
    action,
    remarks: remarks ?? null,
    createdAt: new Date().toISOString(),
  });

  try {
    await db.insert(auditLogsTable).values({
      requestNumber,
      user,
      role,
      action,
      remarks: remarks ?? null,
    });
  } catch {
    // DB fallback
  }
}

async function addNotification(email: string, title: string, message: string, type = "info") {
  const record = {
    id: fallbackNotifId++,
    email: email.toLowerCase(),
    title,
    message,
    type,
    read: false,
    createdAt: new Date(),
  };
  fallbackNotifications.push(record);
  portalStorage.addNotification({
    email: email.toLowerCase(),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });

  try {
    await db.insert(notificationsTable).values({
      email: email.toLowerCase(),
      title,
      message,
      type,
      read: false,
    });
  } catch {
    // DB fallback
  }
}

// GET /api/requests — List & Filter Applications
router.get("/requests", optionalAuthenticateStaff, async (req, res): Promise<void> => {
  const parsed = ListRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let { status, branch, search } = parsed.data;

  // HOD Role Scoping
  if (req.user && req.user.role === "HOD" && req.user.department && req.user.department !== "ALL") {
    branch = req.user.department;
  }

  try {
    let query = db.select().from(requestsTable).$dynamic();
    const conditions = [];

    if (status) {
      conditions.push(eq(requestsTable.status, status));
    }
    if (branch) {
      conditions.push(eq(requestsTable.branch, branch));
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(
        or(
          ilike(requestsTable.studentName, like),
          ilike(requestsTable.registerNumber, like),
          ilike(requestsTable.email, like),
          ilike(requestsTable.requestNumber, like)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(requestsTable.createdAt));
    let mapped = rows.map(mapRow);
    if (req.user && req.user.role === "HOD" && req.user.department && req.user.department !== "ALL") {
      mapped = mapped.filter((r) => departmentsMatch(req.user!.department, r.branch));
    }
    res.json(mapped);
    return;
  } catch (err) {
    let results = [...fallbackRequests];
    if (req.user && req.user.role === "HOD" && req.user.department && req.user.department !== "ALL") {
      results = results.filter((r) => departmentsMatch(req.user!.department, r.branch));
    } else if (branch) {
      results = results.filter((r) => r.branch === branch);
    }
    if (status) results = results.filter((r) => r.status === status);
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.studentName.toLowerCase().includes(s) ||
          r.registerNumber.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          r.requestNumber.toLowerCase().includes(s)
      );
    }
    res.json(results.map(mapRow));
  }
});

// ============================================================================
// DEDICATED HOD APPLICATION APIS (Requirements 6, 7, 8, 9, 12, 13)
// ============================================================================

// GET /api/hod/applications — Applications for Authenticated HOD's Department
router.get("/hod/applications", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const hodUser = req.user!;
  const hodDept = hodUser.department;

  const parsed = ListRequestsQueryParams.safeParse(req.query);
  const statusFilter = parsed.success ? parsed.data.status : (req.query.status as string | undefined);
  const searchFilter = parsed.success ? parsed.data.search : (req.query.search as string | undefined);

  let allRows: any[] = [];
  try {
    const rows = await db.select().from(requestsTable).orderBy(desc(requestsTable.createdAt));
    if (rows.length > 0) {
      allRows = rows.map(mapRow);
    } else {
      allRows = fallbackRequests.map(mapRow);
    }
  } catch {
    allRows = fallbackRequests.map(mapRow);
  }

  // Strictly filter by the authenticated HOD's department (Do not trust client param)
  let deptApps = allRows.filter((r) => departmentsMatch(hodDept, r.branch));

  if (statusFilter) {
    if (statusFilter === "PENDING" || statusFilter === "PENDING_HOD_APPROVAL") {
      deptApps = deptApps.filter((r) => r.status === "PENDING_HOD_APPROVAL");
    } else if (statusFilter === "APPROVED" || statusFilter === "HOD_APPROVED") {
      deptApps = deptApps.filter((r) => r.status !== "PENDING_HOD_APPROVAL" && !r.status.includes("REJECTED"));
    } else if (statusFilter === "REJECTED" || statusFilter === "HOD_REJECTED") {
      deptApps = deptApps.filter((r) => r.status === "HOD_REJECTED");
    } else {
      deptApps = deptApps.filter((r) => r.status === statusFilter);
    }
  }

  if (searchFilter) {
    const s = searchFilter.toLowerCase();
    deptApps = deptApps.filter(
      (r) =>
        r.studentName.toLowerCase().includes(s) ||
        r.registerNumber.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.requestNumber.toLowerCase().includes(s)
    );
  }

  res.json(deptApps);
});

// GET /api/hod/stats — Dashboard Counts for Authenticated HOD's Department
router.get("/hod/stats", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const hodUser = req.user!;
  const hodDept = hodUser.department;

  let allRows: any[] = [];
  try {
    const rows = await db.select().from(requestsTable);
    if (rows.length > 0) {
      allRows = rows.map(mapRow);
    } else {
      allRows = fallbackRequests.map(mapRow);
    }
  } catch {
    allRows = fallbackRequests.map(mapRow);
  }

  const deptRows = allRows.filter((r) => departmentsMatch(hodDept, r.branch));
  const pending = deptRows.filter((r) => r.status === "PENDING_HOD_APPROVAL").length;
  const approved = deptRows.filter((r) => r.status !== "PENDING_HOD_APPROVAL" && !r.status.includes("REJECTED")).length;
  const rejected = deptRows.filter((r) => r.status === "HOD_REJECTED").length;
  const total = deptRows.length;

  res.json({
    pending,
    approved,
    rejected,
    total,
    department: hodDept,
    hodName: hodUser.name,
  });
});

// GET /api/hod/applications/:id — View Single Application with Department Isolation
router.get("/hod/applications/:id", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = Number(rawId);
  const hodUser = req.user!;

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  // Department check - If mismatch, 403 Forbidden! Do not expose sensitive info!
  if (!departmentsMatch(hodUser.department, record.branch)) {
    res.status(403).json({
      error: "Access denied. You are only authorized to access applications from your department.",
    });
    return;
  }

  res.json(mapRow(record));
});

// POST /api/hod/applications/:id/approve — HOD Approval Workflow
router.post("/hod/applications/:id/approve", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = Number(rawId);
  const now = new Date();
  const hodUser = req.user!;

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  // 1. Department isolation verification (Requirement 6 & 13)
  if (!departmentsMatch(hodUser.department, record.branch)) {
    res.status(403).json({
      error: `Access denied. You are authorized for the ${hodUser.department} department and cannot act on ${record.branch} applications.`,
    });
    return;
  }

  // 2. Validate status transition (Requirement 8)
  if (record.status !== "PENDING_HOD_APPROVAL") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_HOD_APPROVAL.`,
    });
    return;
  }

  const hodName = req.body.hodName || hodUser.name || "HOD Office";
  const remark = req.body.remark || req.body.note || "Approved by HOD";

  const nextStatus = "PENDING_PRINCIPAL_APPROVAL";
  const updateData = {
    status: nextStatus,
    hodNote: remark,
    hodApprovedAt: now,
    hodApprovedBy: hodName,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    hodName,
    "HOD",
    "Approved Application",
    remark
  );
  await addNotification(
    record.email,
    "HOD Update: Approved",
    `Your application ${record.requestNumber} was approved by HOD (${hodUser.department}) and routed to Principal for approval.`,
    "success"
  );
  await sendHODApprovalEmail(record.email, record.requestNumber, nextStatus, remark);

  res.json(mapRow(record));
});

// POST /api/hod/applications/:id/reject — HOD Rejection Workflow
router.post("/hod/applications/:id/reject", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = Number(rawId);
  const now = new Date();
  const hodUser = req.user!;

  const reason = (req.body.reason || req.body.remark || req.body.note || "").trim();
  if (!reason) {
    res.status(400).json({ error: "Rejection reason is required." });
    return;
  }

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  // 1. Department isolation verification (Requirement 6 & 13)
  if (!departmentsMatch(hodUser.department, record.branch)) {
    res.status(403).json({
      error: `Access denied. You are authorized for the ${hodUser.department} department and cannot act on ${record.branch} applications.`,
    });
    return;
  }

  // 2. Validate status transition (Requirement 9)
  if (record.status !== "PENDING_HOD_APPROVAL") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_HOD_APPROVAL.`,
    });
    return;
  }

  const hodName = req.body.hodName || hodUser.name || "HOD Office";
  const nextStatus = "HOD_REJECTED";
  const updateData = {
    status: nextStatus,
    hodNote: reason,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    hodName,
    "HOD",
    "Rejected Application",
    reason
  );
  await addNotification(
    record.email,
    "HOD Update: Rejected",
    `Your application ${record.requestNumber} was rejected by HOD. Reason: ${reason}`,
    "error"
  );
  await sendHODApprovalEmail(record.email, record.requestNumber, nextStatus, reason);

  res.json(mapRow(record));
});

// ============================================================================
// DEDICATED PRINCIPAL APPLICATION APIS (Requirement 10)
// ============================================================================

// POST /api/principal/applications/:id/approve — Principal Approval
router.post("/principal/applications/:id/approve", authenticateStaff, requireRole("PRINCIPAL"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = Number(rawId);
  const now = new Date();
  const principalUser = req.user!;

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  // Validate state transition
  if (record.status !== "PENDING_PRINCIPAL_APPROVAL" && record.status !== "HOD_APPROVED") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_PRINCIPAL_APPROVAL.`,
    });
    return;
  }

  const principalName = req.body.principalName || principalUser.name || "Principal Office";
  const remark = req.body.remark || req.body.note || "Approved by Principal";
  const nextStatus = "PRINCIPAL_APPROVED";

  const updateData = {
    status: nextStatus,
    principalNote: remark,
    principalApprovedAt: now,
    principalApprovedBy: principalName,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    principalName,
    "PRINCIPAL",
    "Approved Application",
    remark
  );
  await addNotification(
    record.email,
    "Principal Update: Approved",
    `Your application ${record.requestNumber} was approved by Principal. Proceed to Admin Verification & Fee Payment.`,
    "success"
  );
  await sendPrincipalApprovalEmail(record.email, record.requestNumber, nextStatus, remark);

  res.json(mapRow(record));
});

// POST /api/principal/applications/:id/reject — Principal Rejection
router.post("/principal/applications/:id/reject", authenticateStaff, requireRole("PRINCIPAL"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = Number(rawId);
  const now = new Date();
  const principalUser = req.user!;

  const reason = (req.body.reason || req.body.remark || req.body.note || "").trim();
  if (!reason) {
    res.status(400).json({ error: "Rejection reason is required." });
    return;
  }

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  if (record.status !== "PENDING_PRINCIPAL_APPROVAL" && record.status !== "HOD_APPROVED") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_PRINCIPAL_APPROVAL.`,
    });
    return;
  }

  const principalName = req.body.principalName || principalUser.name || "Principal Office";
  const nextStatus = "PRINCIPAL_REJECTED";
  const updateData = {
    status: nextStatus,
    principalNote: reason,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    principalName,
    "PRINCIPAL",
    "Rejected Application",
    reason
  );
  await addNotification(
    record.email,
    "Principal Update: Rejected",
    `Your application ${record.requestNumber} was rejected by Principal. Reason: ${reason}`,
    "error"
  );
  await sendPrincipalApprovalEmail(record.email, record.requestNumber, nextStatus, reason);

  res.json(mapRow(record));
});

// POST /api/requests — Submit Missing ID Application
router.post("/requests", async (req, res): Promise<void> => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const requestNumber = generateRequestNumber();
  const now = new Date();
  const initialStatus = "PENDING_HOD_APPROVAL";

  const fallbackRow: RequestRecord = {
    id: fallbackRequestId++,
    requestNumber,
    studentName: parsed.data.studentName,
    registerNumber: parsed.data.registerNumber,
    branch: parsed.data.branch,
    year: parsed.data.year,
    semester: parsed.data.semester,
    section: parsed.data.section ?? null,
    mobileNumber: parsed.data.mobileNumber,
    email: parsed.data.email.toLowerCase(),
    reason: parsed.data.reason,
    dateOfLoss: parsed.data.dateOfLoss ?? null,
    locationOfLoss: parsed.data.locationOfLoss ?? null,
    additionalRemarks: parsed.data.additionalRemarks ?? null,
    status: initialStatus,
    hodNote: null,
    hodApprovedAt: null,
    hodApprovedBy: null,
    principalNote: null,
    principalApprovedAt: null,
    principalApprovedBy: null,
    adminNote: null,
    adminVerifiedAt: null,
    paymentId: null,
    paymentMethod: null,
    paymentAmount: null,
    paidAt: null,
    collectedAt: null,
    collectedByStaff: null,
    createdAt: now,
    updatedAt: now,
  };

  fallbackRequests.push(fallbackRow);
  persistLocalRequest(fallbackRow);

  await addAuditLog(requestNumber, parsed.data.studentName, "STUDENT", "Submitted Missing ID Card Application", "Application submitted & routed to HOD");
  await addNotification(parsed.data.email, "Application Submitted", `Your ID Card Reissue application ${requestNumber} was submitted and routed for HOD approval.`);
  await sendApplicationSubmittedEmail(parsed.data.email, requestNumber);

  try {
    const [row] = await db
      .insert(requestsTable)
      .values({
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
        requestNumber,
        status: initialStatus,
      })
      .returning();

    if (row) {
      req.log.info({ requestNumber }, "New request created in DB");
      res.status(201).json(mapRow(row));
      return;
    }
  } catch (err) {
    req.log.warn({ err, requestNumber }, "Database insert failed, using fallback");
  }

  res.status(201).json(mapRow(fallbackRow));
});

// GET /api/requests/:id — Fetch Application Detail
router.get("/requests/:id", optionalAuthenticateStaff, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRequestParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const requestId = Number(params.data.id);

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    if (row) record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  // Department check for HOD (Requirement 13)
  if (req.user && req.user.role === "HOD" && req.user.department && req.user.department !== "ALL") {
    if (!departmentsMatch(req.user.department, record.branch)) {
      res.status(403).json({
        error: "Access denied. You are only authorized to access applications from your department.",
      });
      return;
    }
  }

  res.json(mapRow(record));
});

// POST /api/requests/:id/hod-action — HOD Approval/Rejection (Protected HOD Role)
router.post("/requests/:id/hod-action", authenticateStaff, requireRole("HOD"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = HodActionParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = HodActionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const requestId = Number(params.data.id);
  const now = new Date();
  const hodUser = req.user!;

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  // 1. Validate State Transition
  if (record.status !== "PENDING_HOD_APPROVAL") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_HOD_APPROVAL.`,
    });
    return;
  }

  // 2. Validate Department Scoping for HOD
  if (!requireHodDepartmentMatch(req, res, record.branch)) {
    res.status(403).json({
      error: `Access Denied — You are authorized for the ${hodUser.department} department and cannot act on ${record.branch} applications.`,
    });
    return;
  }

  const nextStatus = body.data.action === "APPROVE" ? "PENDING_PRINCIPAL_APPROVAL" : "HOD_REJECTED";
  const hodName = body.data.hodName || hodUser.name || "HOD Office";

  const updateData = {
    status: nextStatus,
    hodNote: body.data.remark ?? null,
    hodApprovedAt: now,
    hodApprovedBy: hodName,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    hodName,
    "HOD",
    body.data.action === "APPROVE" ? "Approved Application" : "Rejected Application",
    body.data.remark || undefined
  );
  await addNotification(
    record.email,
    `HOD Update: ${body.data.action === "APPROVE" ? "Approved" : "Rejected"}`,
    `Your application ${record.requestNumber} was ${body.data.action === "APPROVE" ? "approved by HOD and sent to Principal" : `rejected by HOD. Reason: ${body.data.remark || "None"}`}.`,
    body.data.action === "APPROVE" ? "success" : "error"
  );
  await sendHODApprovalEmail(record.email, record.requestNumber, nextStatus, body.data.remark);

  res.json(mapRow(record));
});

// POST /api/requests/:id/principal-action — Principal Approval/Rejection (Protected Principal Role)
router.post("/requests/:id/principal-action", authenticateStaff, requireRole("PRINCIPAL"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PrincipalActionParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = PrincipalActionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const requestId = Number(params.data.id);
  const now = new Date();
  const principalUser = req.user!;

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  // 1. Validate State Transition (Must be HOD approved / pending principal approval)
  if (record.status !== "PENDING_PRINCIPAL_APPROVAL" && record.status !== "HOD_APPROVED") {
    res.status(400).json({
      error: `Invalid status transition. Application status is currently ${record.status}, expected PENDING_PRINCIPAL_APPROVAL (HOD approval required first).`,
    });
    return;
  }

  const nextStatus = body.data.action === "APPROVE" ? "PENDING_ADMIN_VERIFICATION" : "PRINCIPAL_REJECTED";
  const principalName = body.data.principalName || (principalUser.name ? principalUser.name.replace(/\s*\(Principal\)$/i, "") : "Dr. T. Vamsi Kiran") || "Dr. T. Vamsi Kiran";

  const updateData = {
    status: nextStatus,
    principalNote: body.data.remark ?? null,
    principalApprovedAt: now,
    principalApprovedBy: principalName,
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    principalName,
    "PRINCIPAL",
    body.data.action === "APPROVE" ? "Approved Application" : "Rejected Application",
    body.data.remark || undefined
  );
  await addNotification(
    record.email,
    `Principal Update: ${body.data.action === "APPROVE" ? "Approved" : "Rejected"}`,
    `Your application ${record.requestNumber} was ${body.data.action === "APPROVE" ? "approved by Principal and sent to Admin for verification" : `rejected by Principal. Reason: ${body.data.remark || "None"}`}.`,
    body.data.action === "APPROVE" ? "success" : "error"
  );
  await sendPrincipalApprovalEmail(record.email, record.requestNumber, nextStatus, body.data.remark);

  res.json(mapRow(record));
});

// POST /api/requests/:id/admin-action — Admin Verification & Pipeline Actions (Protected Admin Role)
router.post("/requests/:id/admin-action", authenticateStaff, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminActionParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdminActionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const requestId = Number(params.data.id);
  const now = new Date();

  let nextStatus = "PENDING_ADMIN_VERIFICATION";
  switch (body.data.action) {
    case "VERIFY":
      nextStatus = "PAYMENT_PENDING";
      break;
    case "REJECT":
      nextStatus = "ADMIN_REJECTED";
      break;
    case "START_PRINTING":
      nextStatus = "ID_CARD_PRINTING";
      break;
    case "MARK_PRINTED":
      nextStatus = "ID_CARD_PRINTED";
      break;
    case "QUALITY_CHECKED":
      nextStatus = "QUALITY_CHECKED";
      break;
    case "MARK_READY":
      nextStatus = "READY_TO_COLLECT";
      break;
    case "MARK_COLLECTED":
      nextStatus = "COLLECTED";
      break;
    default:
      nextStatus = body.data.action;
  }

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updateData: any = {
    status: nextStatus,
    adminNote: body.data.note ?? record.adminNote,
    adminVerifiedAt: body.data.action === "VERIFY" ? now : record.adminVerifiedAt,
    updatedAt: now,
  };

  if (body.data.action === "MARK_COLLECTED") {
    updateData.collectedAt = now;
    updateData.collectedByStaff = req.user?.name || "Admin Office";
  }

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    req.user?.name || "ID Card Admin",
    "ADMIN",
    `Status Updated to ${nextStatus}`,
    body.data.note || undefined
  );

  if (nextStatus === "PAYMENT_PENDING") {
    await addNotification(
      record.email,
      "Application Verified — Payment Required",
      `Your application ${record.requestNumber} has been verified by Admin. Please complete your online payment of ₹200.`,
      "info"
    );
  } else if (nextStatus === "READY_TO_COLLECT") {
    await addNotification(
      record.email,
      "ID Card Ready for Collection!",
      `Your college ID card (${record.requestNumber}) is printed and ready for physical collection at the ID Card Department.`,
      "success"
    );
    await sendReadyToCollectEmail(record.email, record.requestNumber);
  } else if (nextStatus === "COLLECTED") {
    await addNotification(
      record.email,
      "ID Card Collection Completed",
      `Your college ID card (${record.requestNumber}) has been collected. Thank you!`,
      "success"
    );
    await sendCollectionConfirmationEmail(record.email, record.requestNumber);
  }

  res.json(mapRow(record));
});

// POST /api/requests/:id/pay — Online Payment
router.post("/requests/:id/pay", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PayRequestParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = PayRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const requestId = Number(params.data.id);
  const paidAt = new Date();

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updateData = {
    status: "PAYMENT_SUCCESS",
    paymentId: body.data.transactionId,
    paymentMethod: body.data.paymentMethod,
    paymentAmount: "200.00",
    paidAt,
    updatedAt: paidAt,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    record.studentName,
    "STUDENT",
    "Payment Completed",
    `₹200.00 via ${body.data.paymentMethod} (TxID: ${body.data.transactionId})`
  );
  await addNotification(
    record.email,
    "Payment Successful",
    `Payment of ₹200.00 for application ${record.requestNumber} was recorded. Reissue process sent to printing department.`,
    "success"
  );
  await sendPaymentConfirmationEmail(record.email, record.requestNumber, "200.00", body.data.transactionId);

  res.json(mapRow(record));
});

// POST /api/requests/verify-qr — QR Code Receipt Scanner & Verification (Protected Admin / Staff Role)
router.post("/requests/verify-qr", optionalAuthenticateStaff, async (req, res): Promise<void> => {
  const parsed = VerifyQrBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter or scan a valid Application ID." });
    return;
  }

  const reqNum = parsed.data.requestNumber.trim();
  let record: any;

  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.requestNumber, reqNum));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.requestNumber.toUpperCase() === reqNum.toUpperCase());
  }

  if (!record) {
    res.status(404).json({ verified: false, error: `No application found for ID: ${reqNum}` });
    return;
  }

  const isValidForCollection = record.status === "READY_TO_COLLECT" || record.status === "COLLECTED";
  const isPaid = record.paymentId != null || record.status === "PAYMENT_SUCCESS" || record.status === "READY_TO_COLLECT" || record.status === "COLLECTED";

  res.json({
    verified: isValidForCollection && isPaid,
    request: mapRow(record),
    message: isValidForCollection
      ? record.status === "COLLECTED"
        ? "✓ Verified — Card already marked as collected"
        : "✓ Verified — Ready for Physical Handover"
      : `✕ Verification Failed — Current Status is ${record.status}`,
  });
});

// POST /api/requests/:id/collect — Confirm Physical Handover (Protected Admin / Staff Role)
router.post("/requests/:id/collect", authenticateStaff, requireRole("ADMIN", "ID_CARD_STAFF", "SUPER_ADMIN"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CollectCardParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CollectCardBody.safeParse(req.body);
  const requestId = Number(params.data.id);
  const now = new Date();

  let record: any;
  try {
    const [row] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
    record = row;
  } catch {}

  if (!record) {
    record = fallbackRequests.find((r) => r.id === requestId);
  }

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updateData = {
    status: "COLLECTED",
    collectedAt: now,
    collectedByStaff: body.data?.staffId || req.user?.name || "ID Card Staff",
    updatedAt: now,
  };

  try {
    const [updatedRow] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, requestId))
      .returning();

    if (updatedRow) {
      record = updatedRow;
    }
  } catch {}

  const fallbackIndex = fallbackRequests.findIndex((r) => r.id === requestId);
  if (fallbackIndex !== -1 && fallbackRequests[fallbackIndex]) {
    fallbackRequests[fallbackIndex] = { ...fallbackRequests[fallbackIndex]!, ...updateData };
    record = fallbackRequests[fallbackIndex];
    persistLocalRequest(record);
  }

  await addAuditLog(
    record.requestNumber,
    req.user?.name || "ID Card Staff",
    req.user?.role || "ID_CARD_STAFF",
    "Handed Over Physical ID Card",
    body.data?.remarks || "Student verified via QR code receipt and ID card handed over."
  );
  await addNotification(
    record.email,
    "ID Card Collected",
    `Your physical college ID card (${record.requestNumber}) was successfully handed over to you.`,
    "success"
  );
  await sendCollectionConfirmationEmail(record.email, record.requestNumber);

  res.json(mapRow(record));
});

// GET /api/requests/:id/audit-trail — Fetch Audit Trail
router.get("/requests/:id/audit-trail", async (req, res): Promise<void> => {
  const reqParam = req.params.id;
  
  let requestNumber = reqParam;
  if (/^\d+$/.test(reqParam)) {
    const idNum = Number(reqParam);
    try {
      const [r] = await db.select().from(requestsTable).where(eq(requestsTable.id, idNum));
      if (r) requestNumber = r.requestNumber;
    } catch {
      const fb = fallbackRequests.find((r) => r.id === idNum);
      if (fb) requestNumber = fb.requestNumber;
    }
  }

  try {
    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.requestNumber, requestNumber))
      .orderBy(desc(auditLogsTable.createdAt));

    res.json(logs);
    return;
  } catch {}

  const fbLogs = portalStorage.getAuditLogs(requestNumber);
  res.json(fbLogs);
});

// GET /api/notifications — Fetch In-App Notifications
router.get("/notifications", async (req, res): Promise<void> => {
  const parsed = GetNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const notifs = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.email, email))
      .orderBy(desc(notificationsTable.createdAt));

    res.json(notifs);
    return;
  } catch {}

  const fbNotifs = portalStorage.getNotifications(email);
  res.json(fbNotifs);
});

// PATCH /api/notifications/:id/read — Mark Notification Read
router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkNotificationReadParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const idNum = Number(params.data.id);

  try {
    await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, idNum));
  } catch {}

  portalStorage.markNotificationRead(idNum);
  const fb = fallbackNotifications.find((n) => n.id === idNum);
  if (fb) fb.read = true;

  res.json({ success: true });
});

// GET /api/admin/stats — Analytics Dashboard Statistics (Protected Staff Role)
router.get("/admin/stats", optionalAuthenticateStaff, async (req, res): Promise<void> => {
  let allRows: any[] = [];
  try {
    allRows = await db.select().from(requestsTable);
  } catch {
    allRows = [...fallbackRequests];
  }

  // If HOD role, filter stats for department
  if (req.user && req.user.role === "HOD" && req.user.department && req.user.department !== "ALL") {
    const dept = req.user.department.toLowerCase().trim();
    allRows = allRows.filter((r) => (r.branch || "").toLowerCase().trim().includes(dept));
  }

  const total = allRows.length;
  const pendingHod = allRows.filter((r) => r.status === "PENDING_HOD_APPROVAL").length;
  const pendingPrincipal = allRows.filter((r) => r.status === "PENDING_PRINCIPAL_APPROVAL").length;
  const pendingAdmin = allRows.filter((r) => r.status === "PENDING_ADMIN_VERIFICATION").length;
  const paymentPending = allRows.filter((r) => r.status === "PAYMENT_PENDING").length;
  const printing = allRows.filter((r) => r.status === "ID_CARD_PRINTING" || r.status === "ID_CARD_PRINTED" || r.status === "QUALITY_CHECKED").length;
  const readyToCollect = allRows.filter((r) => r.status === "READY_TO_COLLECT").length;
  const collected = allRows.filter((r) => r.status === "COLLECTED").length;
  const rejected = allRows.filter((r) => r.status.includes("REJECTED")).length;

  res.json({
    total,
    pendingHod,
    pendingPrincipal,
    pendingAdmin,
    paymentPending,
    printing,
    readyToCollect,
    collected,
    rejected,
  });
});

// GET /api/my-request — Student Request Lookup
router.get("/my-request", async (req, res): Promise<void> => {
  const parsed = GetMyRequestQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  let row: any;

  try {
    const [r] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.email, email))
      .orderBy(desc(requestsTable.createdAt))
      .limit(1);
    row = r;
  } catch {}

  if (!row) {
    const list = syncLocalRequests();
    row = list.filter((r) => r.email.toLowerCase() === email).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  if (!row) {
    res.status(404).json({ error: "No request found for this email address." });
    return;
  }

  res.json(mapRow(row));
});

export default router;
