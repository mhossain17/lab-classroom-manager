import { SchoolSettings } from "@prisma/client";
import { getRelevantStandards } from "@/lib/standards";

export type LabPacketInput = {
  labTitle: string;
  courseName: string;
  existingObjective?: string;
  narration: string;
  dueDate?: string;
};

export type LabPacketDraft = {
  standardsAlignment: string;
  objective: string;
  equipmentNeeded: string;
  backgroundInformation: string;
  practicalSignificance: string;
  preLabPreparation: string;
  preLabQuestions: string;
  equipmentDatasheets: string;
  labDataSheetTemplate: string;
  procedures: string;
  inProcedureQuestions: string;
  helpfulTips: string;
  labReportGuidelines: string;
  rubric: string;
};

function fallbackLabPacket(input: LabPacketInput): LabPacketDraft {
  const standards = getRelevantStandards(input.courseName);

  return {
    standardsAlignment: standards.map((standard) => `- ${standard}`).join("\n"),
    objective:
      input.existingObjective ||
      `Students will apply engineering troubleshooting and documentation skills in ${input.labTitle}, using evidence-based reasoning and standards-aligned technical practices.`,
    equipmentNeeded:
      "- Breadboard\n- Power source\n- Test components\n- Multimeter\n- Jumper wires\n- Manufacturer datasheets",
    backgroundInformation:
      `Use this section to explain the concept focus for ${input.labTitle}. Include theory, expected behavior, and terminology students must use accurately.`,
    practicalSignificance:
      "Connect this lab to real systems: reliability testing, troubleshooting workflows, digital/electrical diagnostics, and design validation.",
    preLabPreparation:
      "Students should review safety rules, component polarity/orientation, expected measurements, and the relevant truth table or circuit behavior before starting.",
    preLabQuestions:
      "1. What is the expected output behavior in this lab?\n2. Which measurements will confirm your setup is correct?\n3. What are two likely failure points and how will you test them?",
    equipmentDatasheets:
      "List each component with a datasheet link and key values students should extract (pinout, operating range, tolerance, truth table, etc.).",
    labDataSheetTemplate:
      "- Student Name / Date / Class\n- Initial setup checks\n- Measurement table (expected vs actual)\n- Schematic section\n- Troubleshooting attempts\n- Final validation",
    procedures:
      "Experiment 1: Setup + baseline checks\nExperiment 2: Functional test + expected-vs-measured comparison\nExperiment 3: Fault injection + diagnostic correction",
    inProcedureQuestions:
      "At each step, ask: What did you observe? What did you expect? What evidence supports your next action?",
    helpfulTips:
      "Tip 1: Validate power rails before debugging logic.\nTip 2: Change one variable at a time.\nTip 3: Document every test, not just successful ones.",
    labReportGuidelines:
      "Introduction, Methodology, Lab Datasheet, Results, Discussion, Applications, Conclusion, Questions, References.",
    rubric:
      "- Setup Accuracy (20)\n- Data Quality (20)\n- Troubleshooting Process (20)\n- Technical Explanation (20)\n- Report Quality + References (20)"
  };
}

function buildPrompt(input: LabPacketInput) {
  const standards = getRelevantStandards(input.courseName);

  return `You are generating a high-school engineering lab packet for a teacher.
Return strict JSON only with keys:
standardsAlignment, objective, equipmentNeeded, backgroundInformation, practicalSignificance, preLabPreparation, preLabQuestions, equipmentDatasheets, labDataSheetTemplate, procedures, inProcedureQuestions, helpfulTips, labReportGuidelines, rubric.

Requirements:
- Align the content with these standards:\n${standards.map((item) => `- ${item}`).join("\n")}
- Include clear sections students can follow.
- Include procedure-embedded reflection prompts.
- Include lab report guidance and grading rubric criteria.
- Keep language classroom-ready and practical for teachers.

Context:
Lab title: ${input.labTitle}
Course: ${input.courseName}
Existing objective: ${input.existingObjective ?? "none"}
Teacher narration notes: ${input.narration}
Due date: ${input.dueDate ?? "none specified"}`;
}

function parseDraft(text: string): LabPacketDraft | null {
  try {
    const parsed = JSON.parse(text);
    const requiredKeys: Array<keyof LabPacketDraft> = [
      "standardsAlignment",
      "objective",
      "equipmentNeeded",
      "backgroundInformation",
      "practicalSignificance",
      "preLabPreparation",
      "preLabQuestions",
      "equipmentDatasheets",
      "labDataSheetTemplate",
      "procedures",
      "inProcedureQuestions",
      "helpfulTips",
      "labReportGuidelines",
      "rubric"
    ];

    for (const key of requiredKeys) {
      if (typeof parsed[key] !== "string") {
        return null;
      }
    }

    return parsed as LabPacketDraft;
  } catch {
    return null;
  }
}

export async function generateLabPacketDraft(
  input: LabPacketInput,
  settings: Pick<SchoolSettings, "aiEnabled" | "fallbackModeEnabled">
): Promise<LabPacketDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!settings.aiEnabled || !apiKey) {
    return fallbackLabPacket(input);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You generate standards-aligned engineering lab packets in strict JSON."
          },
          {
            role: "user",
            content: buildPrompt(input)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("No content returned.");
    }

    const parsed = parseDraft(content);
    if (parsed) {
      return parsed;
    }

    throw new Error("Failed to parse JSON draft.");
  } catch {
    if (settings.fallbackModeEnabled) {
      return fallbackLabPacket(input);
    }

    return fallbackLabPacket(input);
  }
}
