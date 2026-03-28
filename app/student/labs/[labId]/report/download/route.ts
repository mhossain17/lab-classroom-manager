import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeFileName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  const { labId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("acm_user")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true
    }
  });

  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await prisma.lab.findFirst({
    where: {
      id: labId,
      class: {
        enrollments: {
          some: {
            studentId: user.id
          }
        }
      }
    },
    include: {
      class: true,
      packet: true
    }
  });

  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const work = await prisma.studentLabWork.findUnique({
    where: {
      studentId_labId: {
        studentId: user.id,
        labId: lab.id
      }
    }
  });

  const lines = [
    `# ${lab.title} - Student Lab Work Export`,
    "",
    `Student: ${user.name}`,
    `Class: ${lab.class.name} (${lab.class.section})`,
    `Downloaded: ${new Date().toLocaleString()}`,
    ""
  ];

  if (lab.packet) {
    lines.push("## Published Lab Packet");
    lines.push("");
    lines.push(`### Objective\n${lab.packet.objective}`);
    lines.push("");
    lines.push(`### Procedures\n${lab.packet.procedures}`);
    lines.push("");
    lines.push(`### In-Procedure Questions\n${lab.packet.inProcedureQuestions}`);
    lines.push("");
    lines.push(`### Rubric\n${lab.packet.rubric}`);
    lines.push("");
  }

  lines.push("## Student Responses");
  lines.push("");
  lines.push(`### Pre-Lab Responses\n${work?.preLabResponses ?? ""}`);
  lines.push("");
  lines.push(`### Procedure Thinking Log\n${work?.procedureThinkingLog ?? ""}`);
  lines.push("");
  lines.push(`### Equipment Data Entries\n${work?.equipmentDataEntries ?? ""}`);
  lines.push("");
  lines.push(`### Schematic Components\n${work?.schematicComponents ?? ""}`);
  lines.push("");
  lines.push(`### Schematic Connections\n${work?.schematicConnections ?? ""}`);
  lines.push("");
  lines.push("### Mermaid Diagram");
  lines.push("```mermaid");
  lines.push(work?.schematicDiagram ?? "");
  lines.push("```");
  lines.push("");

  lines.push("## Lab Report Draft Sections");
  lines.push("");
  lines.push(`### Introduction\n${work?.reportIntroduction ?? ""}`);
  lines.push("");
  lines.push(`### Methodology\n${work?.reportMethodology ?? ""}`);
  lines.push("");
  lines.push(`### Lab Datasheet\n${work?.reportDatasheetSummary ?? ""}`);
  lines.push("");
  lines.push(`### Results\n${work?.reportResults ?? ""}`);
  lines.push("");
  lines.push(`### Discussion\n${work?.reportDiscussion ?? ""}`);
  lines.push("");
  lines.push(`### Applications\n${work?.reportApplications ?? ""}`);
  lines.push("");
  lines.push(`### Conclusion\n${work?.reportConclusion ?? ""}`);
  lines.push("");
  lines.push(`### Questions\n${work?.reportQuestions ?? ""}`);
  lines.push("");
  lines.push(`### References\n${work?.reportReferences ?? ""}`);

  const markdown = lines.join("\n");

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName(lab.title)}-lab-work.md"`
    }
  });
}
