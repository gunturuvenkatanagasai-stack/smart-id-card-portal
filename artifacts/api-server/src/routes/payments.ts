import { Router, type IRouter } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db, requestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

router.post("/payments/create-order", async (req, res): Promise<void> => {
  const { requestId } = req.body as { requestId: number };
  if (!requestId) {
    res.status(400).json({ error: "requestId is required" });
    return;
  }

  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503).json({ error: "Payment gateway not configured. Please contact the administrator." });
    return;
  }

  const order = await razorpay.orders.create({
    amount: 20000,
    currency: "INR",
    receipt: request.requestNumber,
    notes: {
      requestId: String(requestId),
      studentName: request.studentName,
      registerNumber: request.registerNumber,
    },
  });

  req.log.info({ orderId: order.id, requestId }, "Razorpay order created");

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

router.post("/payments/verify", async (req, res): Promise<void> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, requestId } =
    req.body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      requestId: number;
    };

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Payment gateway not configured" });
    return;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    return;
  }

  const [row] = await db
    .update(requestsTable)
    .set({
      status: "pending",
      paymentId: razorpay_payment_id,
      paymentMethod: "razorpay",
      paymentAmount: "200.00",
      paidAt: new Date(),
    })
    .where(eq(requestsTable.id, requestId))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  req.log.info({ requestId, paymentId: razorpay_payment_id }, "Payment verified and recorded");

  res.json({
    success: true,
    paymentId: razorpay_payment_id,
    request: {
      ...row,
      paymentAmount: row.paymentAmount != null ? Number(row.paymentAmount) : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
});

export default router;
