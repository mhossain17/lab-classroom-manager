"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ActivityType, ProgressStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireRole, setSessionUser } from "@/lib/auth";
import { raiseAlertsFromHelpRequest } from "@/lib/alerts";
import { generateGuidance } from "@/lib/ai/assistant";
import type { GuidanceOutput } from "@/lib/ai/types";
import { normalizeCsvHeader, parseCsvRows, safeUsernameBase } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { presetThemes } from "@/lib/theme";

type ActionResult = {
  ok: boolean;
  message: string;
};

export type AiHelpState = {
  ok: boolean;
  message?: string;
  guidance?: GuidanceOutput;
  requestId?: string;
};

const defaultAiState: AiHelpState = { ok: false };

async function logActivity(payload: {
  userId: string;
  classId?: string | null;
  labId?: string | null;
  labStepId?: string | null;
  type: ActivityType;
  details: string;
}) {
  await prisma.activityLog.create({
    data: {
      userId: payload.userId,
      classId: payload.classId ?? null,
      labId: payload.labId ?? null,
      labStepId: payload.labStepId ?? null,
      type: payload.type,
      details: payload.details
    }
  });
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

async function getUniqueUsername(baseInput: string) {
  const base = safeUsernameBase(baseInput);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base.slice(0, 20)}${suffix}`;
    suffix += 1;
  }
}

export async function loginAction(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    return { ok: false, message: "Choose your classroom identity." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, message: "Selected user was not found." };
  }

  await setSessionUser(user.id);

  if (user.role === UserRole.STUDENT) {
    redirect("/student");
  }

  redirect("/teacher");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function quickLoginAsAction(formData: FormData) {
  const userId = String(formData.get("userId") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "").trim();

  if (!userId) {
    redirect("/demo");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    redirect("/demo");
  }

  await setSessionUser(user.id);

  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  if (user.role === UserRole.STUDENT) {
    redirect("/student");
  }

  redirect("/teacher");
}

export async function updateStudentProgressAction(formData: FormData) {
  const student = await requireRole([UserRole.STUDENT]);
  const labId = String(formData.get("labId") || "").trim();
  const currentStepIdRaw = String(formData.get("currentStepId") || "").trim();
  const statusRaw = String(formData.get("status") || "IN_PROGRESS").trim() as ProgressStatus;
  const notes = String(formData.get("notes") || "").trim();
  const isStuck = String(formData.get("isStuck") || "") === "on";
  const waitingForHelp = String(formData.get("waitingForHelp") || "") === "on";

  const lab = await prisma.lab.findFirst({
    where: {
      id: labId,
      class: {
        enrollments: {
          some: {
            studentId: student.id
          }
        }
      }
    },
    include: {
      class: true
    }
  });

  if (!lab) {
    return;
  }

  const validStatuses: ProgressStatus[] = [
    ProgressStatus.NOT_STARTED,
    ProgressStatus.STARTED,
    ProgressStatus.IN_PROGRESS,
    ProgressStatus.STUCK,
    ProgressStatus.WAITING_FOR_HELP,
    ProgressStatus.COMPLETED
  ];

  const status = validStatuses.includes(statusRaw) ? statusRaw : ProgressStatus.IN_PROGRESS;

  await prisma.studentLabProgress.upsert({
    where: {
      studentId_labId: {
        studentId: student.id,
        labId
      }
    },
    create: {
      studentId: student.id,
      labId,
      currentStepId: currentStepIdRaw || null,
      status,
      isStuck,
      waitingForHelp,
      notes,
      troubleshootingAttempts: isStuck || waitingForHelp ? 1 : 0
    },
    update: {
      currentStepId: currentStepIdRaw || null,
      status,
      isStuck,
      waitingForHelp,
      notes
    }
  });

  await logActivity({
    userId: student.id,
    classId: lab.classId,
    labId: lab.id,
    labStepId: currentStepIdRaw || null,
    type: ActivityType.UPDATED_PROGRESS,
    details: `Updated progress to ${status}`
  });

  revalidatePath("/student");
  revalidatePath(`/student/labs/${labId}`);
  revalidatePath(`/student/labs/${labId}/instructions`);
  revalidatePath("/student/progress");
  revalidatePath("/teacher");
  revalidatePath("/teacher/monitor");
}

export async function requestAiHelpAction(
  _prevState: AiHelpState = defaultAiState,
  formData: FormData
): Promise<AiHelpState> {
  void _prevState;
  const student = await requireRole([UserRole.STUDENT]);

  const labId = String(formData.get("labId") || "").trim();
  const labStepIdRaw = String(formData.get("labStepId") || "").trim();
  const issueSummary = String(formData.get("issueSummary") || "").trim();
  const troubleshootingAttempted = String(formData.get("troubleshootingAttempted") || "").trim();
  const observedIssue = String(formData.get("observedIssue") || "").trim();
  const requestTeacher = String(formData.get("requestTeacher") || "") === "on";

  if (!labId || !issueSummary || !troubleshootingAttempted) {
    return {
      ok: false,
      message: "Add your issue summary and what you have already tried."
    };
  }

  const lab = await prisma.lab.findFirst({
    where: {
      id: labId,
      class: {
        enrollments: {
          some: {
            studentId: student.id
          }
        }
      }
    },
    include: {
      class: {
        include: {
          teacher: true
        }
      },
      steps: {
        orderBy: {
          order: "asc"
        }
      }
    }
  });

  if (!lab) {
    return {
      ok: false,
      message: "Lab not found for your enrollment."
    };
  }

  const step = lab.steps.find((item) => item.id === labStepIdRaw) ?? null;

  const [progress, settings] = await Promise.all([
    prisma.studentLabProgress.findUnique({
      where: {
        studentId_labId: {
          studentId: student.id,
          labId: lab.id
        }
      }
    }),
    prisma.schoolSettings.findUnique({ where: { id: 1 } })
  ]);

  const guidance = await generateGuidance(
    {
      labTitle: lab.title,
      stepTitle: step?.title,
      stepOrder: step?.order,
      issueSummary,
      troubleshootingAttempted,
      observedIssue,
      expectedResult: step?.expectedResult,
      priorAttempts: progress?.troubleshootingAttempts ?? 0
    },
    {
      aiEnabled: settings?.aiEnabled ?? true,
      fallbackModeEnabled: settings?.fallbackModeEnabled ?? true
    }
  );

  const attempts = (progress?.troubleshootingAttempts ?? 0) + 1;
  const status = requestTeacher || guidance.shouldEscalate ? ProgressStatus.WAITING_FOR_HELP : ProgressStatus.STUCK;

  const [request] = await prisma.$transaction([
    prisma.helpRequest.create({
      data: {
        studentId: student.id,
        labId: lab.id,
        labStepId: step?.id ?? null,
        issueSummary,
        troubleshootingAttempted,
        aiRecommendation: `${guidance.summary}\n\nNext Step: ${guidance.nextStep}\nWhy: ${guidance.whyItMakesSense}`,
        aiFollowUpQuestions: guidance.guidedQuestions.join("\n"),
        aiConfidence: guidance.confidence,
        teacherNotified: requestTeacher || guidance.shouldEscalate,
        escalationReason: guidance.escalationReason
      }
    }),
    prisma.studentLabProgress.upsert({
      where: {
        studentId_labId: {
          studentId: student.id,
          labId: lab.id
        }
      },
      create: {
        studentId: student.id,
        labId: lab.id,
        currentStepId: step?.id ?? null,
        status,
        isStuck: true,
        waitingForHelp: requestTeacher || guidance.shouldEscalate,
        troubleshootingAttempts: attempts,
        aiConfidence: guidance.confidence,
        notes: issueSummary
      },
      update: {
        currentStepId: step?.id ?? null,
        status,
        isStuck: true,
        waitingForHelp: requestTeacher || guidance.shouldEscalate,
        troubleshootingAttempts: attempts,
        aiConfidence: guidance.confidence,
        notes: issueSummary
      }
    })
  ]);

  await Promise.all([
    logActivity({
      userId: student.id,
      classId: lab.classId,
      labId: lab.id,
      labStepId: step?.id ?? null,
      type: ActivityType.SUBMITTED_HELP_REQUEST,
      details: issueSummary
    }),
    logActivity({
      userId: student.id,
      classId: lab.classId,
      labId: lab.id,
      labStepId: step?.id ?? null,
      type: ActivityType.RECEIVED_AI_GUIDANCE,
      details: guidance.nextStep
    })
  ]);

  await raiseAlertsFromHelpRequest({
    teacherId: lab.class.teacherId,
    classId: lab.classId,
    labId: lab.id,
    labStepId: step?.id,
    studentName: student.name,
    issueSummary,
    confidence: guidance.confidence,
    troubleshootingAttempts: attempts,
    aiEscalationReason: guidance.shouldEscalate ? guidance.escalationReason : undefined,
    directTeacherRequest: requestTeacher
  });

  revalidatePath(`/student/labs/${lab.id}`);
  revalidatePath(`/student/labs/${lab.id}/help`);
  revalidatePath("/student/progress");
  revalidatePath("/teacher");
  revalidatePath("/teacher/monitor");
  revalidatePath("/teacher/alerts");

  return {
    ok: true,
    message: "Guidance generated. Follow the next action and update your status.",
    guidance,
    requestId: request.id
  };
}

export async function resolveHelpRequestAction(formData: FormData) {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const helpRequestId = String(formData.get("helpRequestId") || "").trim();

  const whereClause =
    actor.role === UserRole.ADMIN
      ? { id: helpRequestId }
      : {
          id: helpRequestId,
          lab: {
            class: {
              teacherId: actor.id
            }
          }
        };

  const request = await prisma.helpRequest.findFirst({
    where: whereClause,
    include: {
      lab: true,
      student: true
    }
  });

  if (!request) {
    return;
  }

  await prisma.$transaction([
    prisma.helpRequest.update({
      where: { id: request.id },
      data: {
        resolved: true
      }
    }),
    prisma.studentLabProgress.updateMany({
      where: {
        studentId: request.studentId,
        labId: request.labId
      },
      data: {
        waitingForHelp: false,
        isStuck: false,
        status: ProgressStatus.IN_PROGRESS
      }
    }),
    prisma.teacherAlert.updateMany({
      where: {
        labId: request.labId,
        isActive: true
      },
      data: {
        isActive: false
      }
    }),
    prisma.activityLog.create({
      data: {
        userId: request.studentId,
        classId: request.lab.classId,
        labId: request.labId,
        labStepId: request.labStepId,
        type: ActivityType.RESOLVED_HELP_REQUEST,
        details: `Teacher ${actor.name} resolved support request.`
      }
    })
  ]);

  revalidatePath("/teacher");
  revalidatePath("/teacher/alerts");
  revalidatePath("/teacher/monitor");
  revalidatePath(`/student/labs/${request.labId}`);
}

export async function dismissAlertAction(formData: FormData) {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const alertId = String(formData.get("alertId") || "").trim();

  const whereClause =
    actor.role === UserRole.ADMIN
      ? { id: alertId }
      : {
          id: alertId,
          teacherId: actor.id
        };

  await prisma.teacherAlert.updateMany({
    where: whereClause,
    data: {
      isActive: false
    }
  });

  revalidatePath("/teacher");
  revalidatePath("/teacher/alerts");
}

export async function createClassAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

  const name = String(formData.get("name") || "").trim();
  const courseCode = String(formData.get("courseCode") || "").trim();
  const section = String(formData.get("section") || "").trim();

  if (!name || !courseCode || !section) {
    return { ok: false, message: "Name, course code, and section are required." };
  }

  await prisma.class.create({
    data: {
      name,
      courseCode,
      section,
      teacherId: teacher.id
    }
  });

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");

  return { ok: true, message: "Class created." };
}

export async function enrollStudentAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const classId = String(formData.get("classId") || "").trim();
  const username = String(formData.get("username") || "").trim();

  if (!classId || !username) {
    return { ok: false, message: "Class and student username are required." };
  }

  const classroom = await prisma.class.findFirst({
    where: {
      id: classId
    }
  });

  if (!classroom) {
    return { ok: false, message: "Class not found." };
  }

  const canManageClass = actor.role === UserRole.ADMIN || classroom.teacherId === actor.id;
  if (!canManageClass) {
    return { ok: false, message: "You can only enroll students in your own classes." };
  }

  const student = await prisma.user.findFirst({
    where: {
      username,
      role: UserRole.STUDENT
    }
  });

  if (!student) {
    return { ok: false, message: "Student username not found." };
  }

  await prisma.enrollment.upsert({
    where: {
      classId_studentId: {
        classId,
        studentId: student.id
      }
    },
    create: {
      classId,
      studentId: student.id
    },
    update: {}
  });

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
  revalidatePath("/student");

  return { ok: true, message: `Enrolled ${student.name} in ${classroom.name}.` };
}

export async function createUserAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireRole([UserRole.ADMIN]);

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const roleRaw = String(formData.get("role") || "STUDENT").trim();
  const emailRaw = String(formData.get("email") || "").trim().toLowerCase();
  const studentIdRaw = String(formData.get("studentId") || "").trim();
  const usernameRaw = String(formData.get("username") || "").trim();

  const validRoles = [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN];
  const role = validRoles.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : UserRole.STUDENT;
  const email = emailRaw.length > 0 ? emailRaw : null;
  const studentId = studentIdRaw.length > 0 ? studentIdRaw : null;

  if (!firstName || !lastName) {
    return { ok: false, message: "First and last name are required." };
  }

  if (role === UserRole.STUDENT && !studentId) {
    return { ok: false, message: "Student ID is required for student accounts." };
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { ok: false, message: "That email is already used by another account." };
    }
  }

  if (studentId) {
    const existingStudentId = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudentId) {
      return { ok: false, message: "That student ID is already used by another account." };
    }
  }

  let username = usernameRaw;
  if (!username) {
    const fallback = studentId || (email ? email.split("@")[0] : `${firstName}.${lastName}`);
    username = await getUniqueUsername(fallback);
  } else {
    const normalized = safeUsernameBase(username);
    const existing = await prisma.user.findUnique({ where: { username: normalized } });
    if (existing) {
      return { ok: false, message: "That username is already taken." };
    }
    username = normalized;
  }

  await prisma.user.create({
    data: {
      name: `${firstName} ${lastName}`.trim(),
      role,
      email,
      studentId,
      username
    }
  });

  revalidatePath("/teacher/users");
  revalidatePath("/teacher/classes");
  revalidatePath("/login");

  return { ok: true, message: `Created ${role.toLowerCase()} account for ${firstName} ${lastName}.` };
}

export async function importStudentsCsvAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

  const classId = String(formData.get("classId") || "").trim();
  const csvFile = formData.get("csvFile");

  if (!classId) {
    return { ok: false, message: "Choose a class before uploading the CSV file." };
  }

  if (!(csvFile instanceof File) || csvFile.size === 0) {
    return { ok: false, message: "Upload a CSV file first." };
  }

  const classroom = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, teacherId: true }
  });

  if (!classroom) {
    return { ok: false, message: "Class not found." };
  }

  const canManageClass = actor.role === UserRole.ADMIN || classroom.teacherId === actor.id;
  if (!canManageClass) {
    return { ok: false, message: "You can only import students into your own classes." };
  }

  const text = await csvFile.text();
  const rows = parseCsvRows(text);

  if (rows.length < 2) {
    return { ok: false, message: "CSV must include a header row and at least one student row." };
  }

  const headers = rows[0].map((header) => normalizeCsvHeader(header));
  const studentIdIndex = findHeaderIndex(headers, ["studentid", "id", "studentnumber"]);
  const firstNameIndex = findHeaderIndex(headers, ["firstname", "first"]);
  const lastNameIndex = findHeaderIndex(headers, ["lastname", "last"]);
  const emailIndex = findHeaderIndex(headers, ["email", "emailaddress", "eaddress"]);

  if (studentIdIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
    return {
      ok: false,
      message:
        "CSV header must include: student ID, first name, last name. Optional: e-mail."
    };
  }

  let createdUsers = 0;
  let updatedUsers = 0;
  let newEnrollments = 0;
  let skippedRows = 0;
  const rowErrors: string[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const studentIdValue = String(row[studentIdIndex] || "").trim();
    const firstName = String(row[firstNameIndex] || "").trim();
    const lastName = String(row[lastNameIndex] || "").trim();
    const emailRaw = emailIndex >= 0 ? String(row[emailIndex] || "").trim().toLowerCase() : "";
    const email = emailRaw.length > 0 ? emailRaw : null;

    if (!studentIdValue && !firstName && !lastName && !email) {
      continue;
    }

    if (!studentIdValue || !firstName || !lastName) {
      skippedRows += 1;
      rowErrors.push(`Row ${rowIndex + 1}: missing required fields.`);
      continue;
    }

    const matches = await prisma.user.findMany({
      where: {
        OR: [{ studentId: studentIdValue }, ...(email ? [{ email }] : [])]
      },
      take: 2
    });

    if (matches.length > 1) {
      skippedRows += 1;
      rowErrors.push(`Row ${rowIndex + 1}: multiple users matched student ID/email.`);
      continue;
    }

    let user = matches[0] ?? null;

    if (user && user.role !== UserRole.STUDENT) {
      skippedRows += 1;
      rowErrors.push(`Row ${rowIndex + 1}: matched non-student account (${user.username}).`);
      continue;
    }

    if (!user) {
      const usernameBase = studentIdValue || email || `${firstName}.${lastName}`;
      const username = await getUniqueUsername(usernameBase);
      user = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`.trim(),
          studentId: studentIdValue,
          email,
          username,
          role: UserRole.STUDENT
        }
      });
      createdUsers += 1;
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: `${firstName} ${lastName}`.trim(),
          studentId: studentIdValue,
          email: email ?? user.email,
          role: UserRole.STUDENT
        }
      });
      updatedUsers += 1;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classroom.id,
          studentId: user.id
        }
      },
      select: { id: true }
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          classId: classroom.id,
          studentId: user.id
        }
      });
      newEnrollments += 1;
    }
  }

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/users");
  revalidatePath("/teacher");
  revalidatePath("/login");

  const errorPreview =
    rowErrors.length > 0
      ? ` Issues: ${rowErrors.slice(0, 3).join(" ")}${rowErrors.length > 3 ? " ..." : ""}`
      : "";

  return {
    ok: true,
    message: `Import finished for ${classroom.name}. Created ${createdUsers}, updated ${updatedUsers}, enrolled ${newEnrollments}, skipped ${skippedRows}.${errorPreview}`
  };
}

function readStepRow(formData: FormData, index: number) {
  const title = String(formData.get(`stepTitle_${index}`) || "").trim();
  const description = String(formData.get(`stepDescription_${index}`) || "").trim();
  const expectedResult = String(formData.get(`stepExpected_${index}`) || "").trim();
  const commonProblems = String(formData.get(`stepProblems_${index}`) || "").trim();
  const hints = String(formData.get(`stepHints_${index}`) || "").trim();
  const troubleshootingPrompt = String(formData.get(`stepTroubleshoot_${index}`) || "").trim();
  const escalationGuidance = String(formData.get(`stepEscalate_${index}`) || "").trim();

  if (!title || !description) {
    return null;
  }

  return {
    order: index,
    title,
    description,
    expectedResult: expectedResult || "Observe expected behavior before moving on.",
    commonProblems: commonProblems || "No common problems added yet.",
    hints: hints || "Re-check wiring and expected values.",
    troubleshootingPrompt:
      troubleshootingPrompt || "What did you measure and how does it compare to what should happen?",
    escalationGuidance:
      escalationGuidance || "If checks pass and behavior is still wrong, request teacher support."
  };
}

export async function createLabAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

  const classId = String(formData.get("classId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const objective = String(formData.get("objective") || "").trim();
  const materials = String(formData.get("materials") || "").trim();
  const startHereContent = String(formData.get("startHereContent") || "").trim();
  const openingRecap = String(formData.get("openingRecap") || "").trim();
  const priorKnowledge = String(formData.get("priorKnowledge") || "").trim();
  const commonMistakes = String(formData.get("commonMistakes") || "").trim();
  const whatFirst = String(formData.get("whatFirst") || "").trim();
  const completionCriteria = String(formData.get("completionCriteria") || "").trim();

  if (!classId || !title || !objective || !startHereContent) {
    return { ok: false, message: "Class, title, objective, and Start Here are required." };
  }

  const ownsClass = await prisma.class.findFirst({
    where: {
      id: classId
    }
  });

  if (!ownsClass) {
    return { ok: false, message: "Class not found." };
  }

  const canManageClass = actor.role === UserRole.ADMIN || ownsClass.teacherId === actor.id;
  if (!canManageClass) {
    return { ok: false, message: "You can only add labs to your own classes." };
  }

  const steps = Array.from({ length: 8 }, (_, index) => readStepRow(formData, index + 1)).filter(Boolean) as Array<{
    order: number;
    title: string;
    description: string;
    expectedResult: string;
    commonProblems: string;
    hints: string;
    troubleshootingPrompt: string;
    escalationGuidance: string;
  }>;

  if (steps.length === 0) {
    return { ok: false, message: "Add at least one lab step." };
  }

  await prisma.lab.create({
    data: {
      classId,
      title,
      objective,
      materials: materials || "No materials listed.",
      startHereContent,
      openingRecap: openingRecap || "Review safety checks and objective before starting.",
      priorKnowledge: priorKnowledge || "Basic circuit symbols and measurement setup.",
      commonMistakes: commonMistakes || "Skipping verification checks before troubleshooting.",
      whatFirst: whatFirst || "Collect materials, label your workspace, and read Step 1 fully.",
      completionCriteria: completionCriteria || "Demonstrate expected output and complete reflection notes.",
      isActive: true,
      steps: {
        create: steps
      }
    }
  });

  revalidatePath("/teacher/labs");
  revalidatePath("/teacher");
  revalidatePath("/student");

  return { ok: true, message: "Lab created and published." };
}

export async function toggleLabActiveAction(formData: FormData) {
  const actor = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const labId = String(formData.get("labId") || "").trim();

  const lab = await prisma.lab.findFirst({
    where: {
      id: labId
    },
    include: {
      class: true
    }
  });

  if (!lab) {
    return;
  }

  if (actor.role !== UserRole.ADMIN && lab.class.teacherId !== actor.id) {
    return;
  }

  await prisma.lab.update({
    where: { id: lab.id },
    data: {
      isActive: !lab.isActive
    }
  });

  revalidatePath("/teacher/labs");
  revalidatePath("/teacher");
  revalidatePath("/student");
}

export async function updateThemeSettingsAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

  const schoolName = String(formData.get("schoolName") || "Engineering Innovation High").trim();
  let logoUrl = String(formData.get("logoUrl") || "/logo.svg").trim();
  const primaryColor = String(formData.get("primaryColor") || "#0F4C81").trim();
  const secondaryColor = String(formData.get("secondaryColor") || "#1B9AAA").trim();
  const accentColor = String(formData.get("accentColor") || "#F4A259").trim();
  const darkMode = String(formData.get("darkMode") || "") === "on";
  const logoFile = formData.get("logoFile");

  if (logoFile instanceof File && logoFile.size > 0) {
    const extensionFromType = logoFile.type.split("/").pop();
    const extensionFromName = logoFile.name.includes(".") ? logoFile.name.split(".").pop() : undefined;
    const extension = extensionFromType || extensionFromName || "png";
    const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "png";
    const fileName = `school-logo-${Date.now()}.${safeExtension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const destination = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    await writeFile(destination, buffer);

    logoUrl = `/uploads/${fileName}`;
  }

  await prisma.themeSettings.upsert({
    where: { id: 1 },
    create: {
      schoolName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      darkMode
    },
    update: {
      schoolName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      darkMode
    }
  });

  revalidatePath("/");
  revalidatePath("/teacher/settings");
  revalidatePath("/teacher");
  revalidatePath("/student");

  return { ok: true, message: "Branding updated." };
}

export async function applyPresetThemeAction(formData: FormData) {
  await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const presetName = String(formData.get("presetName") || "").trim();

  const preset = presetThemes.find((item) => item.name === presetName);
  if (!preset) {
    return;
  }

  await prisma.themeSettings.upsert({
    where: { id: 1 },
    create: {
      schoolName: "Engineering Innovation High",
      logoUrl: "/logo.svg",
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      darkMode: true
    },
    update: {
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor
    }
  });

  revalidatePath("/teacher/settings");
  revalidatePath("/");
}

export async function updateSchoolSettingsAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

  const aiEnabled = String(formData.get("aiEnabled") || "") === "on";
  const fallbackModeEnabled = String(formData.get("fallbackModeEnabled") || "") === "on";
  const teacherAlertsEnabled = String(formData.get("teacherAlertsEnabled") || "") === "on";
  const repeatedStuckThreshold = Number(formData.get("repeatedStuckThreshold") || 2);
  const waitingMinutesThreshold = Number(formData.get("waitingMinutesThreshold") || 8);
  const lowConfidenceThreshold = Number(formData.get("lowConfidenceThreshold") || 0.55);
  const classWideBottleneckThreshold = Number(formData.get("classWideBottleneckThreshold") || 3);
  const localCustomizationNotes = String(formData.get("localCustomizationNotes") || "").trim();

  await prisma.schoolSettings.upsert({
    where: {
      id: 1
    },
    create: {
      aiEnabled,
      fallbackModeEnabled,
      teacherAlertsEnabled,
      repeatedStuckThreshold,
      waitingMinutesThreshold,
      lowConfidenceThreshold,
      classWideBottleneckThreshold,
      localCustomizationNotes: localCustomizationNotes || null
    },
    update: {
      aiEnabled,
      fallbackModeEnabled,
      teacherAlertsEnabled,
      repeatedStuckThreshold,
      waitingMinutesThreshold,
      lowConfidenceThreshold,
      classWideBottleneckThreshold,
      localCustomizationNotes: localCustomizationNotes || null
    }
  });

  revalidatePath("/teacher/settings");
  revalidatePath("/teacher");

  return { ok: true, message: "App settings updated." };
}
