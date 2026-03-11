import { SchoolSettings } from "@prisma/client";
import { GuidanceInput, GuidanceOutput } from "@/lib/ai/types";
import { getFallbackGuidance } from "@/lib/ai/fallback";

function buildPrompt(input: GuidanceInput) {
  return `You are an engineering lab coach for high school students.
Return valid JSON only with keys:
summary, nextStep, whyItMakesSense, guidedQuestions (array of 3 strings), diagnosticsChecklist (array of 4 strings), confidence (0-1), shouldEscalate (boolean), escalationReason (string or null).

Rules:
- Do not give final answers or full solutions.
- Scaffold diagnostic thinking.
- Prioritize checks in this order: setup, wiring/polarity, power, measurement method, expected vs measured behavior.
- Keep language practical and age-appropriate.
- Suggest exactly one next troubleshooting action.

Context:
Lab: ${input.labTitle}
Step: ${input.stepOrder ?? "unknown"} - ${input.stepTitle ?? "unknown"}
Issue: ${input.issueSummary}
Observed issue: ${input.observedIssue ?? "none provided"}
Tried already: ${input.troubleshootingAttempted}
Expected result: ${input.expectedResult ?? "not provided"}
Prior attempts: ${input.priorAttempts ?? 0}`;
}

function parseGuidance(jsonText: string): GuidanceOutput | null {
  try {
    const parsed = JSON.parse(jsonText);

    if (
      typeof parsed.summary !== "string" ||
      typeof parsed.nextStep !== "string" ||
      typeof parsed.whyItMakesSense !== "string" ||
      !Array.isArray(parsed.guidedQuestions) ||
      !Array.isArray(parsed.diagnosticsChecklist)
    ) {
      return null;
    }

    return {
      summary: parsed.summary,
      nextStep: parsed.nextStep,
      whyItMakesSense: parsed.whyItMakesSense,
      guidedQuestions: parsed.guidedQuestions.slice(0, 3),
      diagnosticsChecklist: parsed.diagnosticsChecklist.slice(0, 4),
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.55,
      shouldEscalate: Boolean(parsed.shouldEscalate),
      escalationReason:
        typeof parsed.escalationReason === "string" && parsed.escalationReason.length > 0
          ? parsed.escalationReason
          : undefined
    };
  } catch {
    return null;
  }
}

export async function generateGuidance(
  input: GuidanceInput,
  settings: Pick<SchoolSettings, "aiEnabled" | "fallbackModeEnabled">
): Promise<GuidanceOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!settings.aiEnabled || !apiKey) {
    return getFallbackGuidance(input);
  }

  try {
    // Keep model output structured so UI and alert logic can remain deterministic.
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You produce concise lab-coaching JSON."
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
      throw new Error("No model content returned.");
    }

    const parsed = parseGuidance(content);
    if (parsed) {
      return parsed;
    }

    throw new Error("Could not parse AI response JSON.");
  } catch {
    if (settings.fallbackModeEnabled) {
      return getFallbackGuidance(input);
    }

    return {
      summary: "AI guidance is temporarily unavailable.",
      nextStep: "Request teacher support for this step.",
      whyItMakesSense: "No fallback mode is enabled, so teacher intervention is safest.",
      guidedQuestions: ["What exact step failed?", "What have you already tried?", "What value/output did you measure?"],
      diagnosticsChecklist: ["Capture symptom", "Capture step number", "Capture measured output", "Share with teacher"],
      confidence: 0.2,
      shouldEscalate: true,
      escalationReason: "AI unavailable and fallback disabled"
    };
  }
}
