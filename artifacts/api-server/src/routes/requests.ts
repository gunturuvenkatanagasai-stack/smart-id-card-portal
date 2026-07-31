import { Router, type IRouter } from "express";
import { db, requestsTable } from "@workspace/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import {
  CreateRequestBody,
  GetRequestParams,
  ListRequestsQueryParams,
  PayRequestParams,
  PayRequestBody,
  UpdateRequestStatusParams,
  UpdateRequestStatusBody,
  GetMyRequestQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateRequestNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IDR-${ts}-${rand}`;
}

function mapRow(row: typeof requestsTable.$inferSelect) {
  return {
    ...row,
    paymentAmount: row.paymentAmount != null ? Number(row.paymentAmount) : null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/requests", async (req, res): Promise<void> => {
  const parsed = ListRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search } = parsed.data;

  let query = db.select().from(requestsTable).$dynamic();

  if (status) {
    query = query.where(eq(requestsTable.status, status));
  }

  if (search) {
    const like = `%${search}%`;
    query = query.where(
      or(
        ilike(requestsTable.studentName, like),
        ilike(requestsTable.registerNumber, like),
        ilike(requestsTable.email, like),
        ilike(requestsTable.requestNumber, like)
      )
    );
  }

  const rows = await query.orderBy(desc(requestsTable.createdAt));
  res.json(rows.map(mapRow));
});

router.post("/requests", async (req, res): Promise<void> => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const requestNumber = generateRequestNumber();

  const [row] = await db
    .insert(requestsTable)
    .values({
      ...parsed.data,
      requestNumber,
      status: "payment_pending",
      photoUrl: parsed.data.photoUrl ?? null,
    })
    .returning();

  req.log.info({ requestNumber }, "New request created");
  res.status(201).json(mapRow(row));
});

router.get("/requests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRequestParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json(mapRow(row));
});

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

  const [existing] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [row] = await db
    .update(requestsTable)
    .set({
      status: "pending",
      paymentId: body.data.transactionId,
      paymentMethod: body.data.paymentMethod,
      paymentAmount: "200.00",
      paidAt: new Date(),
    })
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  req.log.info({ requestId: params.data.id, paymentId: body.data.transactionId }, "Payment recorded");
  res.json(mapRow(row));
});

router.patch("/requests/:id/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRequestStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateRequestStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updateData: Partial<typeof requestsTable.$inferInsert> = {
    status: body.data.status,
  };

  if (body.data.adminNote !== undefined) {
    updateData.adminNote = body.data.adminNote;
  }

  const [row] = await db
    .update(requestsTable)
    .set(updateData)
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  req.log.info({ requestId: params.data.id, status: body.data.status }, "Status updated");
  res.json(mapRow(row));
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const allRequests = await db
    .select()
    .from(requestsTable)
    .orderBy(desc(requestsTable.createdAt));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    paymentPending: allRequests.filter((r) => r.status === "payment_pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    readyToCollect: allRequests.filter((r) => r.status === "ready_to_collect").length,
    collected: allRequests.filter((r) => r.status === "collected").length,
    todayCount: allRequests.filter((r) => r.createdAt >= today).length,
    recentRequests: allRequests.slice(0, 10).map(mapRow),
  };

  res.json(stats);
});

router.get("/my-request", async (req, res): Promise<void> => {
  const parsed = GetMyRequestQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.email, parsed.data.email))
    .orderBy(desc(requestsTable.createdAt))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "No request found for this email" });
    return;
  }

  res.json(mapRow(row));
});

export default router;
