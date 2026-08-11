import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import { prisma } from "@/lib/prisma";

export async function getReceiptData(paymentId: string, propertyId: string) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      status: "COMPLETED",
      booking: { propertyId },
    },
    include: {
      booking: {
        include: {
          property: true,
          guest: true,
          room: { include: { roomType: true } },
          payments: { where: { status: "COMPLETED" } },
        },
      },
    },
  });
}

function money(value: number) {
  return (
    "K " +
    value.toLocaleString("en-ZM", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function clean(value: string | null | undefined) {
  return (value ?? "-")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fit(value: string, max: number) {
  const text = clean(value);
  return text.length <= max
    ? text
    : text.slice(0, Math.max(1, max - 3)) + "...";
}

function labelValue(
  page: PDFPage,
  regular: PDFFont,
  bold: PDFFont,
  label: string,
  value: string,
  y: number,
) {
  page.drawText(label, {
    x: 55,
    y,
    size: 10,
    font: regular,
    color: rgb(0.39, 0.45, 0.55),
  });
  const safeValue = fit(value, 58);
  const width = bold.widthOfTextAtSize(safeValue, 10.5);
  page.drawText(safeValue, {
    x: Math.max(250, 540 - width),
    y,
    size: 10.5,
    font: bold,
    color: rgb(0.08, 0.12, 0.2),
  });
}

export async function createReceiptPdf(
  data: NonNullable<Awaited<ReturnType<typeof getReceiptData>>>,
) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const page = document.addPage([595.28, 841.89]);

  const property = data.booking.property;
  const guest = data.booking.guest;
  const total = Number(data.booking.totalAmount);
  const totalPaid = data.booking.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const balance = Math.max(0, total - totalPaid);

  page.drawRectangle({
    x: 0,
    y: 700,
    width: 595.28,
    height: 141.89,
    color: rgb(0.025, 0.07, 0.15),
  });
  page.drawRectangle({
    x: 0,
    y: 700,
    width: 10,
    height: 141.89,
    color: rgb(0.06, 0.72, 0.51),
  });

  page.drawText(fit(property.name, 45), {
    x: 55,
    y: 790,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(fit(property.type + " HOSPITALITY MANAGEMENT", 65), {
    x: 55,
    y: 770,
    size: 8,
    font: bold,
    color: rgb(0.45, 0.85, 0.75),
  });
  page.drawText("OFFICIAL PAYMENT RECEIPT", {
    x: 55,
    y: 730,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(clean(data.receiptNumber), {
    x: 365,
    y: 731,
    size: 11,
    font: bold,
    color: rgb(0.68, 0.78, 0.94),
  });

  page.drawText("PAYMENT CONFIRMATION", {
    x: 55,
    y: 660,
    size: 9,
    font: bold,
    color: rgb(0.06, 0.55, 0.4),
  });
  page.drawText(money(Number(data.amount)), {
    x: 55,
    y: 615,
    size: 34,
    font: bold,
    color: rgb(0.025, 0.4, 0.3),
  });
  page.drawText("Amount received", {
    x: 57,
    y: 595,
    size: 10,
    font: regular,
    color: rgb(0.39, 0.45, 0.55),
  });

  page.drawRectangle({
    x: 55,
    y: 565,
    width: 485,
    height: 1,
    color: rgb(0.89, 0.91, 0.94),
  });

  labelValue(
    page,
    regular,
    bold,
    "Received from",
    guest.firstName + " " + guest.lastName,
    535,
  );
  labelValue(
    page,
    regular,
    bold,
    "Booking number",
    data.booking.bookingNumber,
    505,
  );
  labelValue(
    page,
    regular,
    bold,
    "Room",
    data.booking.room.roomNumber + " - " + data.booking.room.roomType.name,
    475,
  );
  labelValue(
    page,
    regular,
    bold,
    "Payment method",
    data.method.replaceAll("_", " "),
    445,
  );
  labelValue(
    page,
    regular,
    bold,
    "Transaction reference",
    data.transactionId ?? "-",
    415,
  );
  labelValue(
    page,
    regular,
    bold,
    "Payment date",
    data.paidAt.toLocaleString("en-ZM"),
    385,
  );

  page.drawRectangle({
    x: 55,
    y: 250,
    width: 485,
    height: 100,
    color: rgb(0.965, 0.975, 0.985),
    borderColor: rgb(0.88, 0.9, 0.93),
    borderWidth: 1,
  });
  labelValue(page, regular, bold, "Booking total", money(total), 320);
  labelValue(page, regular, bold, "Total paid", money(totalPaid), 290);
  labelValue(page, regular, bold, "Outstanding balance", money(balance), 260);

  page.drawText(fit(property.address + ", " + property.town + ", Zambia", 80), {
    x: 55,
    y: 185,
    size: 9,
    font: regular,
    color: rgb(0.39, 0.45, 0.55),
  });
  page.drawText(
    fit(
      "Phone: " +
        property.phone +
        (property.email ? "  |  Email: " + property.email : "") +
        (property.tpin ? "  |  TPIN: " + property.tpin : ""),
      95,
    ),
    {
      x: 55,
      y: 167,
      size: 8.5,
      font: regular,
      color: rgb(0.39, 0.45, 0.55),
    },
  );

  page.drawRectangle({
    x: 55,
    y: 135,
    width: 485,
    height: 1,
    color: rgb(0.89, 0.91, 0.94),
  });
  page.drawText(
    "This is a computer-generated receipt and is valid without a signature.",
    {
      x: 55,
      y: 110,
      size: 8.5,
      font: regular,
      color: rgb(0.48, 0.53, 0.62),
    },
  );
  page.drawText("Thank you for choosing " + fit(property.name, 35) + ".", {
    x: 55,
    y: 90,
    size: 9,
    font: bold,
    color: rgb(0.06, 0.55, 0.4),
  });

  document.setTitle("Receipt " + data.receiptNumber);
  document.setAuthor(property.name);
  document.setSubject("Payment receipt for " + data.booking.bookingNumber);
  document.setCreator("ZedStay Hospitality Management");
  return document.save();
}
