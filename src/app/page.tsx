import { prisma } from "@/lib/prisma"
import { ColumnItem } from "@/components/kanban-board"
import { WorkspaceView } from "@/components/workspace-view"
import { CreateTaskDialog } from "@/components/create-task-dialog"

export default async function Home() {
  const [project, tags] = await Promise.all([
    prisma.project.findFirst({
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                tags: true,
                subtasks: {
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
      },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  const columns: ColumnItem[] = (project?.columns as unknown as ColumnItem[]) ?? []

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Herupu</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Project: {project?.name ?? "No Project Found"}
          </p>
        </div>

        <CreateTaskDialog
          columns={columns.map((c) => ({ id: c.id, name: c.name }))}
          availableTags={tags}
        />
      </header>

      <section>
        <WorkspaceView initialColumns={columns} availableTags={tags} />
      </section>
    </main>
  )
}