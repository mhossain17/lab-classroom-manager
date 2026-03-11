import { GuidanceInput, GuidanceOutput } from "@/lib/ai/types";

const genericQuestions = [
  "What behavior did you expect at this step?",
  "What behavior are you actually seeing?",
  "What single check can confirm whether power and wiring are correct?"
];

function lowerText(input: GuidanceInput) {
  return [input.issueSummary, input.troubleshootingAttempted, input.observedIssue]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getFallbackGuidance(input: GuidanceInput): GuidanceOutput {
  const text = lowerText(input);
  const priorAttempts = input.priorAttempts ?? 0;

  if (text.includes("led") && (text.includes("not") || text.includes("off"))) {
    return {
      summary: "The most likely failure is in polarity, resistor placement, or missing power.",
      nextStep:
        "Verify LED polarity first, then trace wiring from power rail to resistor to LED to ground against the diagram.",
      whyItMakesSense:
        "LED circuits fail most often when polarity is reversed, resistance is bypassed, or the circuit is open.",
      guidedQuestions: [
        "Is the LED long leg connected toward the positive side of the circuit?",
        "Is there a resistor in series with the LED rather than in parallel?",
        "Do you measure expected voltage across the LED path?"
      ],
      diagnosticsChecklist: [
        "Check LED orientation",
        "Confirm resistor value and placement",
        "Measure voltage between power and ground rails",
        "Compare every wire with the lab diagram"
      ],
      confidence: 0.71,
      shouldEscalate: priorAttempts >= 2,
      escalationReason: priorAttempts >= 2 ? "Multiple attempts with no progress on a basic power path." : undefined
    };
  }

  if (text.includes("multimeter") || text.includes("meter") || text.includes("reads 0") || text.includes("measurement")) {
    return {
      summary: "The measurement setup may be incorrect, not necessarily the circuit itself.",
      nextStep:
        "Set the meter to the correct mode/range and verify probe placement relative to where voltage or current should be measured.",
      whyItMakesSense:
        "Incorrect meter mode, port, or probe location often creates zero or unstable readings even in a working circuit.",
      guidedQuestions: [
        "Is the meter set to DC voltage, resistance, or continuity as required by this step?",
        "Are probes in the correct ports for this measurement type?",
        "Are you measuring across the component (voltage) instead of through it (current)?"
      ],
      diagnosticsChecklist: [
        "Confirm meter mode",
        "Confirm probe ports",
        "Measure source voltage first",
        "Re-measure expected node pair"
      ],
      confidence: 0.66,
      shouldEscalate: priorAttempts >= 3,
      escalationReason:
        priorAttempts >= 3 ? "Repeated measurement mismatch after mode and probe checks." : undefined
    };
  }

  if (text.includes("logic") || text.includes("gate") || text.includes("binary") || text.includes("wrong output")) {
    return {
      summary: "Logic output errors usually come from input states, floating pins, or truth-table mismatch.",
      nextStep:
        "Test one input combination at a time and compare measured output to the truth table before changing wiring.",
      whyItMakesSense:
        "A structured truth-table check isolates whether the issue is wiring, interpretation, or chip pin mapping.",
      guidedQuestions: [
        "Which exact input combination produces the wrong output?",
        "Are all unused inputs tied to a known state and not floating?",
        "Does the chip pin map match your breadboard orientation?"
      ],
      diagnosticsChecklist: [
        "Confirm IC orientation notch",
        "Check VCC and GND pins",
        "Run 4-row truth-table test",
        "Record expected vs actual output"
      ],
      confidence: 0.64,
      shouldEscalate: priorAttempts >= 2,
      escalationReason: priorAttempts >= 2 ? "Persistent logic mismatch across multiple test rows." : undefined
    };
  }

  return {
    summary: "The next best move is a structured baseline check before changing the build.",
    nextStep:
      "Pause edits and run a quick sequence: power check, wiring check against diagram, then expected-vs-measured comparison for this step.",
    whyItMakesSense:
      "Most lab issues are introduced by setup drift; confirming baseline conditions avoids random trial-and-error.",
    guidedQuestions: genericQuestions,
    diagnosticsChecklist: [
      "Check power source and rails",
      "Check component orientation",
      "Check wire-to-diagram match",
      "Measure expected point and record value"
    ],
    confidence: 0.58,
    shouldEscalate: priorAttempts >= 3,
    escalationReason: priorAttempts >= 3 ? "Student is still blocked after repeated baseline checks." : undefined
  };
}
