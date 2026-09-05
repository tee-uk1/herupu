const { PrismaClient } = require("@prisma/client");
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

async function run() {
  console.log("Purging old records...");
  await prisma.activityLog.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.workspace.deleteMany({});

  console.log("Creating 'The Job Hackers' Organization...");
  const ws = await prisma.workspace.create({
    data: { name: "The Job Hackers" },
  });

  for (const name of WORKING_GROUPS) {
    console.log(`Creating Working Group: ${name}`);
    const board = await prisma.board.create({
      data: {
        name,
        isMaster: name === "Main Board",
        workspaceId: ws.id,
        columns: { create: STANDARD_COLUMNS },
      },
      include: { columns: true },
    });

    const howTo = board.columns.find((c) => c.name === "HOW TO");
    if (howTo) {
      await prisma.task.create({
        data: {
          title: "HOW TO: Kaizen-Originated Tasks — What to Expect & How to Handle",
          description: "Guidance on how Kaizens move from the Retro Board to Requests and through the DoR/DoD checks.",
          priority: "MEDIUM",
          order: 0,
          columnId: howTo.id,
        },
      });

      await prisma.task.create({
        data: {
          title: "[TEMPLATE] JH Work Item — Duplicate me or Save as Template",
          description: "Acceptance criteria, DoR checklist, and KPI alignment placeholder.",
          priority: "URGENT",
          order: 1,
          columnId: howTo.id,
        },
      });
    }

    await prisma.document.create({
      data: {
        title: `${name} — Working Agreement & Notes`,
        content: `<h2>${name} Working Group</h2><p>Welcome to the <strong>${name}</strong> space. Use this document to keep meeting minutes, definitions of ready/done, and group guidelines.</p>`,
        boardId: board.id,
        workspaceId: ws.id,
      },
    });
  }

  console.log("Creating Retro & Off-Board boards...");
  await prisma.board.create({
    data: {
      name: "Retro Board",
      isMaster: false,
      workspaceId: ws.id,
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
      workspaceId: ws.id,
      columns: {
        create: [
          { name: "NOT NOW (Parking Lot)", order: 0 },
          { name: "REJECTED", order: 1 },
        ],
      },
    },
  });

  console.log("All 13 boards and workspaces created successfully!");
}

run()
  .catch((err) => {
    console.error("Reseed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });