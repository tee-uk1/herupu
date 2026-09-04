import { PrismaClient, Priority } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.task.deleteMany()
  await prisma.column.deleteMany()
  await prisma.project.deleteMany()
  await prisma.workspace.deleteMany()

  const workspace = await prisma.workspace.create({
    data: {
      name: "T's Workspace",
      projects: {
        create: {
          name: "Sprint 1",
          columns: {
            create: [
              {
                name: "To Do",
                order: 0,
                tasks: {
                  create: [
                    {
                      title: "Design card UI with Base UI",
                      description: "Use compact cards with tags, avatars, and priority flags.",
                      priority: Priority.HIGH,
                      order: 0,
                    },
                    {
                      title: "Add drag-and-drop mechanics",
                      description: "Integrate @dnd-kit to move cards across lanes.",
                      priority: Priority.URGENT,
                      order: 1,
                    },
                  ],
                },
              },
              {
                name: "In Progress",
                order: 1,
                tasks: {
                  create: [
                    {
                      title: "Configure Docker & Postgres",
                      description: "Set up Prisma schema and initial container setup.",
                      priority: Priority.MEDIUM,
                      order: 0,
                    },
                  ],
                },
              },
              {
                name: "Review",
                order: 2,
              },
              {
                name: "Done",
                order: 3,
                tasks: {
                  create: [
                    {
                      title: "Initialize Next.js project",
                      description: "Set up Next.js App Router with Tailwind CSS.",
                      priority: Priority.LOW,
                      order: 0,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  })

  console.log(`Database seeded with workspace: ${workspace.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })