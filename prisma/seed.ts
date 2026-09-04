import { PrismaClient, Priority } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.tag.deleteMany()
  await prisma.task.deleteMany()
  await prisma.column.deleteMany()
  await prisma.project.deleteMany()

  const project = await prisma.project.create({
    data: {
      name: "Herupu Launch Sprint",
    },
  })

  // Seed standard tags
  const tagFrontend = await prisma.tag.create({ data: { name: "Frontend", color: "#3b82f6" } })
  const tagBackend = await prisma.tag.create({ data: { name: "Backend", color: "#10b981" } })
  const tagBug = await prisma.tag.create({ data: { name: "Bug", color: "#ef4444" } })

  const columnsData = [
    { name: "To Do", order: 0 },
    { name: "In Progress", order: 1 },
    { name: "Review", order: 2 },
    { name: "Done", order: 3 },
  ]

  const createdColumns = []
  for (const col of columnsData) {
    const c = await prisma.column.create({
      data: {
        name: col.name,
        order: col.order,
        projectId: project.id,
      },
    })
    createdColumns.push(c)
  }

  // To Do tasks
  await prisma.task.create({
    data: {
      title: "Design ClickUp task drawer",
      description: "Allow full screen or drawer editing for descriptions and custom metadata.",
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      order: 0,
      columnId: createdColumns[0].id,
      tags: { connect: [{ id: tagFrontend.id }] },
    },
  })

  // In Progress tasks
  await prisma.task.create({
    data: {
      title: "Set up PostgreSQL relation mapping",
      description: "Support many-to-many relationship between tags and tasks.",
      priority: Priority.URGENT,
      dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Overdue
      order: 0,
      columnId: createdColumns[1].id,
      tags: { connect: [{ id: tagBackend.id }, { id: tagBug.id }] },
    },
  })

  console.log("Database seeded successfully with tags and due dates.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })