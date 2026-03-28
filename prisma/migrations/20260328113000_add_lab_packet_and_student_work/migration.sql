CREATE TABLE "LabPacket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labId" TEXT NOT NULL,
    "sourceNarration" TEXT NOT NULL,
    "standardsAlignment" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "equipmentNeeded" TEXT NOT NULL,
    "backgroundInformation" TEXT NOT NULL,
    "practicalSignificance" TEXT NOT NULL,
    "preLabPreparation" TEXT NOT NULL,
    "preLabQuestions" TEXT NOT NULL,
    "equipmentDatasheets" TEXT NOT NULL,
    "labDataSheetTemplate" TEXT NOT NULL,
    "procedures" TEXT NOT NULL,
    "inProcedureQuestions" TEXT NOT NULL,
    "helpfulTips" TEXT NOT NULL,
    "labReportGuidelines" TEXT NOT NULL,
    "rubric" TEXT NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabPacket_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StudentLabWork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "preLabResponses" TEXT,
    "procedureThinkingLog" TEXT,
    "equipmentDataEntries" TEXT,
    "schematicComponents" TEXT,
    "schematicConnections" TEXT,
    "schematicDiagram" TEXT,
    "reportIntroduction" TEXT,
    "reportMethodology" TEXT,
    "reportDatasheetSummary" TEXT,
    "reportResults" TEXT,
    "reportDiscussion" TEXT,
    "reportApplications" TEXT,
    "reportConclusion" TEXT,
    "reportQuestions" TEXT,
    "reportReferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentLabWork_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentLabWork_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LabPacket_labId_key" ON "LabPacket"("labId");
CREATE UNIQUE INDEX "StudentLabWork_studentId_labId_key" ON "StudentLabWork"("studentId", "labId");
