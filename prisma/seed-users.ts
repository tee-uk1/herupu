import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10)
  const memberPassword = await bcrypt.hash("member123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@herupu.local" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@herupu.local",
      name: "Tee (Admin)",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  })

  const member = await prisma.user.upsert({
    where: { email: "member@herupu.local" },
    update: {},
    create: {
      email: "member@herupu.local",
      name: "Alex Rivera",
      passwordHash: memberPassword,
      role: "MEMBER",
    },
  })

  console.log("Seeded accounts:")
  console.log("- Admin:", admin.email, "(pwd: admin123)")
  console.log("- Member:", member.email, "(pwd: member123)")
}

main().finally(() => prisma.$disconnect())