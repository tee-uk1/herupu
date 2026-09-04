import { prisma } from "@/lib/prisma"
import { KanbanBoard, ColumnItem } from "@/components/kanban-board"

export default async function Home() {
  const project = await prisma.project.findFirst({
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  const columns: ColumnItem[] = project?.columns ?? []

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Herupu</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Project: {project?.name ?? "No Project Found"}
          </p>
        </div>
      </header>

      <section>
        <KanbanBoard initialColumns={columns} />
      </section>
    </main>
  )
}