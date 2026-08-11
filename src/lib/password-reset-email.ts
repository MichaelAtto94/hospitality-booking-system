import nodemailer from "nodemailer";
function configuration() {
  const host = process.env.SMTP_HOST,
    user = process.env.SMTP_USER,
    pass = process.env.SMTP_PASS,
    from = process.env.SMTP_FROM,
    port = Number(process.env.SMTP_PORT ?? "587");
  return host && user && pass && from && Number.isInteger(port)
    ? { host, user, pass, from, port }
    : null;
}
export function passwordEmailConfigured() {
  return configuration() !== null;
}
function safe(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
export async function sendPasswordResetCode(i: {
  email: string;
  firstName: string;
  code: string;
}) {
  const c = configuration();
  if (!c) throw new Error("Email is not configured");
  const transport = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465,
    auth: { user: c.user, pass: c.pass },
  });
  await transport.sendMail({
    from: c.from,
    to: i.email,
    subject: "Your ZedStay password reset code",
    text:
      "Your ZedStay verification code is " +
      i.code +
      ". It expires in 10 minutes.",
    html:
      '<div style="font-family:Arial;max-width:520px;margin:auto;padding:28px"><h2>ZedStay password recovery</h2><p>Hello ' +
      safe(i.firstName) +
      ',</p><p>Use this code to confirm your identity:</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#ecfdf5;color:#047857;padding:20px;text-align:center;border-radius:14px">' +
      i.code +
      "</div><p>It expires in 10 minutes. Ignore this email if you did not request it.</p></div>",
  });
}
