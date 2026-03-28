import { ActivityType, AlertSeverity, AlertType, ProgressStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PresentationUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
};

type PresentationHelpRow = {
  id: string;
  createdAt: Date;
  issueSummary: string;
  studentName: string;
  labTitle: string;
  className: string;
  section: string;
  stepLabel: string;
};

type PresentationAlertRow = {
  id: string;
  createdAt: Date;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
};

type PresentationActivityRow = {
  id: string;
  createdAt: Date;
  type: ActivityType;
  details: string;
  userName: string;
};

export type PresentationSnapshot = {
  users: {
    all: PresentationUser[];
    students: PresentationUser[];
    teachers: PresentationUser[];
    admins: PresentationUser[];
  };
  totals: {
    users: number;
    classes: number;
    labs: number;
    openHelp: number;
    activeAlerts: number;
  };
  progressDistribution: Array<{
    status: ProgressStatus;
    count: number;
  }>;
  needsTeacherNow: PresentationHelpRow[];
  activeAlerts: PresentationAlertRow[];
  recentActivity: PresentationActivityRow[];
  launchTargets: {
    studentUserId: string | null;
    teacherUserId: string | null;
    adminUserId: string | null;
    studentLabId: string | null;
    teacherLabId: string | null;
  };
};

function pickPreferredUser(users: PresentationUser[], preferredUsernames: string[]) {
  if (users.length === 0) {
    return null;
  }

  return users.find((user) => preferredUsernames.includes(user.username)) ?? users[0];
}

export async function getOrCreateGlobalConfig() {
  const [theme, settings] = await Promise.all([
    prisma.themeSettings.upsert({
      where: { id: 1 },
      create: {
        schoolName: "Engineering Innovation High",
        logoUrl: "/logo.svg",
        primaryColor: "#0F4C81",
        secondaryColor: "#1B9AAA",
        accentColor: "#F4A259",
        darkMode: true
      },
      update: {}
    }),
    prisma.schoolSettings.upsert({
      where: { id: 1 },
      create: {
        aiEnabled: true,
        fallbackModeEnabled: true,
        teacherAlertsEnabled: true,
        repeatedStuckThreshold: 2,
        waitingMinutesThreshold: 8,
        lowConfidenceThreshold: 0.55,
        classWideBottleneckThreshold: 3
      },
      update: {}
    })
  ]);

  return { theme, settings };
}

export async function getLoginUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      role: true
    }
  });
}

export async function getPresentationSnapshot(): Promise<PresentationSnapshot> {
  const [
    users,
    classCount,
    labCount,
    openHelpCount,
    activeAlertCount,
    progressCounts,
    needsTeacherNowRaw,
    activeAlertsRaw,
    recentActivityRaw
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    }),
    prisma.class.count(),
    prisma.lab.count(),
    prisma.helpRequest.count({
      where: { resolved: false }
    }),
    prisma.teacherAlert.count({
      where: { isActive: true }
    }),
    prisma.studentLabProgress.groupBy({
      by: ["status"],
      _count: {
        status: true
      }
    }),
    prisma.helpRequest.findMany({
      where: {
        resolved: false
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        issueSummary: true,
        student: {
          select: {
            name: true
          }
        },
        lab: {
          select: {
            title: true,
            class: {
              select: {
                name: true,
                section: true
              }
            }
          }
        },
        labStep: {
          select: {
            order: true,
            title: true
          }
        }
      }
    }),
    prisma.teacherAlert.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        severity: true,
        type: true,
        title: true,
        message: true
      }
    }),
    prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        type: true,
        details: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const students = users.filter((user) => user.role === UserRole.STUDENT);
  const teachers = users.filter((user) => user.role === UserRole.TEACHER);
  const admins = users.filter((user) => user.role === UserRole.ADMIN);

  const preferredStudent = pickPreferredUser(students, ["avery", "jordan", "nina"]);
  const preferredTeacher = pickPreferredUser(teachers, ["teacher_rivera"]) ?? pickPreferredUser(admins, ["admin_lab"]);
  const preferredAdmin = pickPreferredUser(admins, ["admin_lab"]);

  const [studentLab, teacherLab] = await Promise.all([
    preferredStudent
      ? prisma.lab.findFirst({
          where: {
            isActive: true,
            class: {
              enrollments: {
                some: {
                  studentId: preferredStudent.id
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true
          }
        })
      : Promise.resolve(null),
    preferredTeacher
      ? prisma.lab.findFirst({
          where:
            preferredTeacher.role === UserRole.ADMIN
              ? {}
              : {
                  class: {
                    teacherId: preferredTeacher.id
                  }
                },
          orderBy: {
            updatedAt: "desc"
          },
          select: {
            id: true
          }
        })
      : Promise.resolve(null)
  ]);

  const countByStatus = new Map(progressCounts.map((row) => [row.status, row._count.status]));
  const orderedStatuses: ProgressStatus[] = [
    ProgressStatus.NOT_STARTED,
    ProgressStatus.STARTED,
    ProgressStatus.IN_PROGRESS,
    ProgressStatus.STUCK,
    ProgressStatus.WAITING_FOR_HELP,
    ProgressStatus.COMPLETED
  ];

  return {
    users: {
      all: users,
      students,
      teachers,
      admins
    },
    totals: {
      users: users.length,
      classes: classCount,
      labs: labCount,
      openHelp: openHelpCount,
      activeAlerts: activeAlertCount
    },
    progressDistribution: orderedStatuses.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0
    })),
    needsTeacherNow: needsTeacherNowRaw.map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      issueSummary: request.issueSummary,
      studentName: request.student.name,
      labTitle: request.lab.title,
      className: request.lab.class.name,
      section: request.lab.class.section,
      stepLabel: request.labStep ? `Step ${request.labStep.order}: ${request.labStep.title}` : "Step not specified"
    })),
    activeAlerts: activeAlertsRaw,
    recentActivity: recentActivityRaw.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      type: item.type,
      details: item.details,
      userName: item.user.name
    })),
    launchTargets: {
      studentUserId: preferredStudent?.id ?? null,
      teacherUserId: preferredTeacher?.id ?? null,
      adminUserId: preferredAdmin?.id ?? null,
      studentLabId: studentLab?.id ?? null,
      teacherLabId: teacherLab?.id ?? null
    }
  };
}

export async function getStudentDashboardData(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      class: {
        include: {
          labs: {
            where: { isActive: true },
            include: {
              steps: {
                orderBy: { order: "asc" }
              },
              progressRecords: {
                where: { studentId },
                include: {
                  currentStep: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    },
    orderBy: {
      class: {
        name: "asc"
      }
    }
  });

  return enrollments;
}

export async function getStudentLabContext(studentId: string, labId: string) {
  return prisma.lab.findFirst({
    where: {
      id: labId,
      class: {
        enrollments: {
          some: {
            studentId
          }
        }
      }
    },
    include: {
      class: true,
      packet: true,
      steps: {
        orderBy: { order: "asc" }
      },
      checkpoints: {
        include: {
          step: true
        },
        orderBy: {
          createdAt: "asc"
        }
      },
      progressRecords: {
        where: {
          studentId
        },
        include: {
          currentStep: true
        }
      },
      helpRequests: {
        where: { studentId },
        include: {
          labStep: true
        },
        orderBy: { createdAt: "desc" },
        take: 8
      },
      studentWork: {
        where: { studentId },
        take: 1
      }
    }
  });
}

export async function getStudentProgressRows(studentId: string) {
  return prisma.studentLabProgress.findMany({
    where: { studentId },
    include: {
      lab: {
        include: {
          class: true
        }
      },
      currentStep: true
    },
    orderBy: {
      lastUpdated: "desc"
    }
  });
}

export async function getTeacherClasses(teacherId: string, includeAll = false) {
  return prisma.class.findMany({
    where: includeAll ? {} : { teacherId },
    include: {
      enrollments: {
        include: {
          student: true
        }
      },
      labs: {
        include: {
          steps: true
        }
      }
    },
    orderBy: [{ name: "asc" }, { section: "asc" }]
  });
}

export async function getTeacherLabs(teacherId: string, includeAll = false) {
  return prisma.lab.findMany({
    where: {
      ...(includeAll
        ? {}
        : {
            class: {
              teacherId
            }
          })
    },
    include: {
      class: true,
      packet: true,
      steps: {
        orderBy: {
          order: "asc"
        }
      },
      progressRecords: {
        include: {
          student: true,
          currentStep: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

export async function getTeacherDashboardData(teacherId: string, includeAll = false) {
  const classWhere = includeAll ? {} : { teacherId };
  const labWhere = includeAll ? {} : { class: { teacherId } };
  const helpWhere = includeAll ? { resolved: false } : { resolved: false, lab: { class: { teacherId } } };
  const alertsWhere = includeAll ? { isActive: true } : { teacherId, isActive: true };
  const activityWhere = includeAll
    ? {}
    : {
        OR: [
          {
            class: { is: { teacherId } }
          },
          {
            lab: { is: { class: { teacherId } } }
          }
        ]
      };

  const [classes, labs, helpRequests, activeAlerts, activity] = await Promise.all([
    prisma.class.findMany({
      where: { ...classWhere, isActive: true },
      include: {
        enrollments: {
          include: {
            student: true
          }
        }
      }
    }),
    prisma.lab.findMany({
      where: {
        ...labWhere,
        isActive: true
      },
      include: {
        class: true,
        steps: {
          orderBy: { order: "asc" }
        },
        progressRecords: {
          include: {
            student: true,
            currentStep: true
          }
        }
      }
    }),
    prisma.helpRequest.findMany({
      where: helpWhere,
      include: {
        student: true,
        lab: {
          include: {
            class: true
          }
        },
        labStep: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    prisma.teacherAlert.findMany({
      where: alertsWhere,
      include: {
        class: true,
        lab: true,
        labStep: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    }),
    prisma.activityLog.findMany({
      where: activityWhere,
      include: {
        user: true,
        class: true,
        lab: true,
        step: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    })
  ]);

  const allProgress = labs.flatMap((lab) => lab.progressRecords);
  const statusCounts = {
    notStarted: allProgress.filter((p) => p.status === ProgressStatus.NOT_STARTED).length,
    started: allProgress.filter((p) => p.status === ProgressStatus.STARTED).length,
    inProgress: allProgress.filter((p) => p.status === ProgressStatus.IN_PROGRESS).length,
    stuck: allProgress.filter((p) => p.status === ProgressStatus.STUCK || p.isStuck).length,
    waiting: allProgress.filter((p) => p.status === ProgressStatus.WAITING_FOR_HELP || p.waitingForHelp).length,
    completed: allProgress.filter((p) => p.status === ProgressStatus.COMPLETED).length
  };

  const stepDistribution = new Map<
    string,
    {
      label: string;
      count: number;
      labTitle: string;
      labId: string;
      stuckCount: number;
    }
  >();

  for (const progress of allProgress) {
    if (!progress.currentStep) continue;
    const key = progress.currentStep.id;
    const entry = stepDistribution.get(key);

    const stepData = {
      label: `Step ${progress.currentStep.order}: ${progress.currentStep.title}`,
      count: (entry?.count ?? 0) + 1,
      labTitle: progress.currentStep.labId
        ? labs.find((lab) => lab.id === progress.currentStep?.labId)?.title ?? "Unknown Lab"
        : "Unknown Lab",
      labId: progress.currentStep.labId,
      stuckCount: (entry?.stuckCount ?? 0) + (progress.isStuck ? 1 : 0)
    };

    stepDistribution.set(key, stepData);
  }

  const stepBuckets = [...stepDistribution.values()].sort((a, b) => b.count - a.count);
  const bottlenecks = stepBuckets.filter((bucket) => bucket.stuckCount >= 2).slice(0, 6);

  const needsTeacherNow = helpRequests.filter((request) => !request.resolved).slice(0, 8);

  return {
    classes,
    labs,
    helpRequests,
    activeAlerts,
    activity,
    statusCounts,
    stepBuckets,
    bottlenecks,
    needsTeacherNow,
    totals: {
      activeClasses: classes.length,
      activeLabs: labs.length,
      students: new Set(classes.flatMap((c) => c.enrollments.map((enrollment) => enrollment.studentId))).size
    }
  };
}

export async function getTeacherMonitoringData(teacherId: string, includeAll = false) {
  return prisma.studentLabProgress.findMany({
    where: {
      ...(includeAll
        ? {}
        : {
            lab: {
              class: {
                teacherId
              }
            }
          })
    },
    include: {
      student: true,
      currentStep: true,
      lab: {
        include: {
          class: true
        }
      }
    },
    orderBy: [{ waitingForHelp: "desc" }, { lastUpdated: "desc" }]
  });
}

export async function getTeacherAlertsData(teacherId: string, includeAll = false) {
  return prisma.teacherAlert.findMany({
    where: includeAll ? {} : { teacherId },
    include: {
      class: true,
      lab: true,
      labStep: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getTeacherSettingsData(teacherId: string) {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      role: true,
      name: true
    }
  });

  if (!teacher || (teacher.role !== UserRole.TEACHER && teacher.role !== UserRole.ADMIN)) {
    return null;
  }

  const [theme, settings] = await Promise.all([
    prisma.themeSettings.findUnique({ where: { id: 1 } }),
    prisma.schoolSettings.findUnique({ where: { id: 1 } })
  ]);

  return {
    theme,
    settings
  };
}

export async function getTeacherLabPacketContext(
  teacherId: string,
  labId: string,
  includeAll = false
) {
  const lab = await prisma.lab.findFirst({
    where: includeAll
      ? { id: labId }
      : {
          id: labId,
          class: {
            teacherId
          }
        },
    include: {
      class: true,
      steps: {
        orderBy: { order: "asc" }
      },
      packet: true
    }
  });

  return lab;
}

export async function getStudentLabReportWorkspace(studentId: string, labId: string) {
  return prisma.lab.findFirst({
    where: {
      id: labId,
      class: {
        enrollments: {
          some: { studentId }
        }
      }
    },
    include: {
      class: true,
      steps: {
        orderBy: { order: "asc" }
      },
      packet: true,
      studentWork: {
        where: { studentId },
        take: 1
      }
    }
  });
}

export async function getAdminUserManagementData() {
  const [users, classes] = await Promise.all([
    prisma.user.findMany({
      include: {
        enrollments: {
          include: {
            class: true
          }
        },
        taughtClasses: true
      },
      orderBy: [{ role: "asc" }, { name: "asc" }]
    }),
    prisma.class.findMany({
      include: {
        teacher: true
      },
      orderBy: [{ name: "asc" }, { section: "asc" }]
    })
  ]);

  return {
    users,
    classes,
    totals: {
      students: users.filter((user) => user.role === "STUDENT").length,
      teachers: users.filter((user) => user.role === "TEACHER").length,
      admins: users.filter((user) => user.role === "ADMIN").length
    }
  };
}
