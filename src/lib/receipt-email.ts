import nodemailer from "nodemailer";

import { createReceiptPdf, getReceiptData } from "@/lib/receipt-pdf";

function mailConfiguration() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from || !Number.isInteger(port)) return null;
  return { host, port, user, pass, from };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPaymentReceipt(input: {
  paymentId: string;
  propertyId: string;
  recipient: string;
}) {
  const config = mailConfiguration();
  if (!config) throw new Error("Receipt email is not configured");

  const payment = await getReceiptData(input.paymentId, input.propertyId);
  if (!payment) throw new Error("Payment receipt was not found");

  const pdf = await createReceiptPdf(payment);
  const guestName =
    payment.booking.guest.firstName + " " + payment.booking.guest.lastName;
  const propertyName = payment.booking.property.name;
  const amount = Number(payment.amount).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: input.recipient,
    subject: "Payment receipt " + payment.receiptNumber + " - " + propertyName,
    text:
      "Hello " +
      guestName +
      ", your payment of K " +
      amount +
      " has been received. Your official receipt is attached as a PDF.",
    html:
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#0f172a">' +
      '<div style="background:#071126;color:white;padding:26px;border-radius:18px"><p style="margin:0;color:#6ee7b7;font-size:12px;font-weight:700">PAYMENT CONFIRMED</p><h1 style="margin:8px 0 0">' +
      escapeHtml(propertyName) +
      "</h1></div>" +
      '<p style="margin-top:24px">Hello <strong>' +
      escapeHtml(guestName) +
      "</strong>,</p><p>We have received your payment of <strong>K " +
      amount +
      "</strong> for booking <strong>" +
      escapeHtml(payment.booking.bookingNumber) +
      "</strong>.</p>" +
      '<div style="background:#ecfdf5;color:#047857;padding:18px;border-radius:14px;margin:22px 0"><strong>Receipt ' +
      escapeHtml(payment.receiptNumber) +
      "</strong><br>Your official PDF receipt is attached to this email.</div>" +
      "<p>Thank you for choosing " +
      escapeHtml(propertyName) +
      '.</p><p style="color:#64748b;font-size:12px;margin-top:30px">This is an automated transactional message.</p></div>',
    attachments: [
      {
        filename: "Receipt-" + payment.receiptNumber + ".pdf",
        content: Buffer.from(pdf),
        contentType: "application/pdf",
      },
    ],
  });

  return payment;
}
