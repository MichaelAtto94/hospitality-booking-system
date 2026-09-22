import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ClosePdfData = {
  property: { name: string; address: string; town: string; phone: string; email: string | null; tpin: string | null };
  close: {
    businessDate: Date; status: string; cashAmount: unknown; cardAmount: unknown; bankTransferAmount: unknown;
    mtnAmount: unknown; airtelAmount: unknown; zamtelAmount: unknown; refundAmount: unknown; grossAmount: unknown;
    expenseAmount: unknown; netAmount: unknown; expectedCash: unknown; countedCash: unknown; cashVariance: unknown;
    transactionCount: number; notes: string | null; preparedAt: Date; approvedAt: Date | null;
    preparedBy: { firstName: string; lastName: string }; approvedBy: { firstName: string; lastName: string } | null;
  };
};

const money = (value: unknown) => `K ${Number(value).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function createDailyClosePdf({ property, close }: ClosePdfData) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);
  page.drawRectangle({ x: 0, y: 700, width: 595.28, height: 142, color: rgb(0.025, 0.07, 0.15) });
  page.drawRectangle({ x: 0, y: 700, width: 10, height: 142, color: rgb(0.06, 0.72, 0.51) });
  page.drawText(property.name.slice(0, 45), { x: 50, y: 790, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("END-OF-DAY FINANCIAL CLOSING", { x: 50, y: 748, size: 14, font: bold, color: rgb(0.55, 0.9, 0.8) });
  page.drawText(close.businessDate.toLocaleDateString("en-ZM", { timeZone: "UTC", dateStyle: "long" }), { x: 50, y: 725, size: 10, font: regular, color: rgb(1, 1, 1) });
  page.drawText(close.status, { x: 465, y: 748, size: 9, font: bold, color: rgb(1, 1, 1) });
  const rows: [string, unknown][] = [
    ["Cash", close.cashAmount], ["Card", close.cardAmount], ["Bank transfer", close.bankTransferAmount],
    ["MTN Mobile Money", close.mtnAmount], ["Airtel Money", close.airtelAmount], ["Zamtel Kwacha", close.zamtelAmount],
    ["Gross receipts", close.grossAmount], ["Refunds", close.refundAmount], ["Expenses", close.expenseAmount],
    ["Net collection", close.netAmount], ["Expected cash", close.expectedCash], ["Cash counted", close.countedCash],
    ["Cash variance", close.cashVariance],
  ];
  let y = 655;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 55, y, size: 10, font: regular, color: rgb(0.35, 0.42, 0.52) });
    const amount = money(value); const width = bold.widthOfTextAtSize(amount, 10.5);
    page.drawText(amount, { x: 540 - width, y, size: 10.5, font: bold, color: rgb(0.07, 0.11, 0.19) });
    page.drawLine({ start: { x: 55, y: y - 10 }, end: { x: 540, y: y - 10 }, thickness: 0.5, color: rgb(0.9, 0.92, 0.95) });
    y -= 30;
  }
  page.drawText(`Transactions: ${close.transactionCount}`, { x: 55, y: 245, size: 10, font: bold, color: rgb(0.07, 0.11, 0.19) });
  page.drawText(`Prepared by: ${close.preparedBy.firstName} ${close.preparedBy.lastName}`, { x: 55, y: 215, size: 9, font: regular, color: rgb(0.35, 0.42, 0.52) });
  page.drawText(`Approved by: ${close.approvedBy ? `${close.approvedBy.firstName} ${close.approvedBy.lastName}` : "Pending approval"}`, { x: 55, y: 195, size: 9, font: regular, color: rgb(0.35, 0.42, 0.52) });
  page.drawText(`Property: ${property.address}, ${property.town} | ${property.phone}`, { x: 55, y: 135, size: 8.5, font: regular, color: rgb(0.4, 0.46, 0.55) });
  page.drawText("Computer-generated control report. All access and changes are recorded in the audit trail.", { x: 55, y: 105, size: 8, font: regular, color: rgb(0.45, 0.5, 0.58) });
  pdf.setTitle(`Daily financial close ${close.businessDate.toISOString().slice(0, 10)}`);
  pdf.setAuthor(property.name);
  return pdf.save();
}
