const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const STANDARD_COLUMNS = [
  { name: "HOW TO", order: 0 },
  { name: "REQUESTS (NOT READY)", order: 1 },
  { name: "APPROVED (READY)", order: 2 },
  { name: "DOING", order: 3 },
  { name: "REVIEW", order: 4 },
  { name: "DONE", order: 5 },
];

const WORKING_GROUPS = [
  "Main Board",
  "Newsletter",
  "Analytics",
  "Development/Partners",
  "Core (Programs)",
  "Events",
  "Tech-Ops-Support",
  "Ops",
  "Outreach/Social Media",
  "Volunteer Coordination",
  "Wednesday Meetings",
];

async function main() {
  console.log("Cleaning database...");
  await prisma.activityLog.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.workspace.deleteMany({});

  console.log("Creating Admin user...");
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@thejobhackers.org",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
  }

  console.log("Creating 'The Job Hackers' Workspace...");
  const workspace = await prisma.workspace.create({
    data: { name: "The Job Hackers" },
  });

  for (let i = 0; i < WORKING_GROUPS.length; i++) {
    const name = WORKING_GROUPS[i];
    const board = await prisma.board.create({
      data: {
        name,
        isMaster: name === "Main Board",
        workspaceId: workspace.id,
        columns: { create: STANDARD_COLUMNS },
      },
      include: { columns: true },
    });

    const howToCol = board.columns.find((c) => c.name === "HOW TO");
    if (howToCol) {
      await prisma.task.create({
        data: {
          title: "HOW TO: Kaizen-Originated Tasks — What to Expect & How to Handle",
          description: "Guidance on how Kaizens move from the Retro Board to Requests and through the DoR/DoD checks.",
          priority: "MEDIUM",
          columnId: howToCol.id,
        },
      });

      await prisma.task.create({
        data: {
          title: "[TEMPLATE] JH Work Item — Duplicate me or Save as Template",
          description: "Acceptance criteria, DoR checklist, and KPI alignment placeholder.",
          priority: "URGENT",
          columnId: howToCol.id,
        },
      });
    }

    await prisma.document.create({
      data: {
        title: `${name} — Working Agreement & Notes`,
        content: `<h2>${name} Working Group</h2><p>Welcome to the <strong>${name}</strong> space. Use this document to keep meeting minutes, definitions of ready/done, and group guidelines.</p>`,
        boardId: board.id,
        workspaceId: workspace.id,
      },
    });
  }

  await prisma.board.create({
    data: {
      name: "Retro Board",
      isMaster: false,
      workspaceId: workspace.id,
      columns: {
        create: [
          { name: "STOP", order: 0 },
          { name: "START", order: 1 },
          { name: "CONTINUE", order: 2 },
          { name: "KAIZENS", order: 3 },
        ],
      },
    },
  });

  await prisma.board.create({
    data: {
      name: "Off-Board Lists",
      isMaster: false,
      workspaceId: workspace.id,
      columns: {
        create: [
          { name: "NOT NOW (Parking Lot)", order: 0 },
          { name: "REJECTED", order: 1 },
        ],
      },
    },
  });

  console.log("Database successfully seeded with The Job Hackers workflow!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });