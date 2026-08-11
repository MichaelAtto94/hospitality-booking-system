import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const email = (process.env.RECOVERY_EMAIL ?? "").trim().toLowerCase();
const password = process.env.RECOVERY_PASSWORD ?? "";

const valid =
  password.length >= 12 &&
  password.length <= 72 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

async function main() {
  if (!email || !valid) throw new Error("Recovery input failed security validation.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("An eligible Super Administrator account was not found.");
  }

  const passwordHash = await hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: {
        action: "EMERGENCY_ADMIN_PASSWORD_RESET",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        details: { method: "LOCAL_RECOVERY_SCRIPT" },
      },
    }),
  ]);
  console.log("Super Administrator password reset successfully.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Recovery failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());