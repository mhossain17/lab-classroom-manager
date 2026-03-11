import {
  ActivityType,
  AlertSeverity,
  AlertType,
  ProgressStatus,
  UserRole,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

type StepSeed = {
  order: number;
  title: string;
  description: string;
  expectedResult: string;
  commonProblems: string;
  hints: string;
  troubleshootingPrompt: string;
  escalationGuidance: string;
};

type CheckpointSeed = {
  stepOrder?: number;
  title: string;
  checkpointQuestion: string;
  expectedObservation: string;
  actionIfPass: string;
  actionIfFail: string;
};

async function createLabSeed(data: {
  classId: string;
  title: string;
  objective: string;
  materials: string;
  startHereContent: string;
  openingRecap: string;
  priorKnowledge: string;
  commonMistakes: string;
  whatFirst: string;
  completionCriteria: string;
  steps: StepSeed[];
  checkpoints: CheckpointSeed[];
}) {
  const lab = await prisma.lab.create({
    data: {
      classId: data.classId,
      title: data.title,
      objective: data.objective,
      materials: data.materials,
      startHereContent: data.startHereContent,
      openingRecap: data.openingRecap,
      priorKnowledge: data.priorKnowledge,
      commonMistakes: data.commonMistakes,
      whatFirst: data.whatFirst,
      completionCriteria: data.completionCriteria,
      isActive: true,
      steps: {
        create: data.steps
      }
    },
    include: {
      steps: true
    }
  });

  const stepByOrder = new Map(lab.steps.map((step) => [step.order, step]));

  await prisma.troubleshootingCheckpoint.createMany({
    data: data.checkpoints.map((checkpoint) => ({
      labId: lab.id,
      labStepId: checkpoint.stepOrder ? stepByOrder.get(checkpoint.stepOrder)?.id : null,
      title: checkpoint.title,
      checkpointQuestion: checkpoint.checkpointQuestion,
      expectedObservation: checkpoint.expectedObservation,
      actionIfPass: checkpoint.actionIfPass,
      actionIfFail: checkpoint.actionIfFail
    }))
  });

  return {
    ...lab,
    stepByOrder
  };
}

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.teacherAlert.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.studentLabProgress.deleteMany();
  await prisma.troubleshootingCheckpoint.deleteMany();
  await prisma.labStep.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.schoolSettings.deleteMany();
  await prisma.themeSettings.deleteMany();
  await prisma.user.deleteMany();

  const teacher = await prisma.user.create({
    data: {
      name: "Ms. Rivera",
      username: "teacher_rivera",
      email: "rivera@example.edu",
      role: UserRole.TEACHER
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin Account",
      username: "admin_lab",
      email: "admin@example.edu",
      role: UserRole.ADMIN
    }
  });

  const students = await Promise.all(
    [
      ["Avery Jackson", "avery"],
      ["Jordan Kim", "jordan"],
      ["Nina Patel", "nina"],
      ["Ethan Brooks", "ethan"],
      ["Mia Chen", "mia"],
      ["Leo Martinez", "leo"]
    ].map(([name, username]) =>
      prisma.user.create({
        data: {
          name,
          username,
          role: UserRole.STUDENT
        }
      })
    )
  );

  const classFoundations = await prisma.class.create({
    data: {
      name: "Engineering Foundations",
      courseCode: "ENGR-101",
      section: "A1",
      teacherId: teacher.id
    }
  });

  const classDigital = await prisma.class.create({
    data: {
      name: "Digital Electronics",
      courseCode: "ENGR-201",
      section: "B2",
      teacherId: teacher.id
    }
  });

  await prisma.enrollment.createMany({
    data: [
      { classId: classFoundations.id, studentId: students[0].id },
      { classId: classFoundations.id, studentId: students[1].id },
      { classId: classFoundations.id, studentId: students[2].id },
      { classId: classFoundations.id, studentId: students[3].id },
      { classId: classDigital.id, studentId: students[2].id },
      { classId: classDigital.id, studentId: students[3].id },
      { classId: classDigital.id, studentId: students[4].id },
      { classId: classDigital.id, studentId: students[5].id }
    ]
  });

  const seriesLab = await createLabSeed({
    classId: classFoundations.id,
    title: "Series Circuit Resistor Lab",
    objective: "Build and validate a simple series circuit while comparing expected and measured voltage drop.",
    materials: "Breadboard\n5V supply\nLED\n220Ω resistor\n1kΩ resistor\nJumper wires\nMultimeter",
    startHereContent:
      "If you missed opening instructions: 1) Confirm your power rails first. 2) Place components before wiring. 3) Use meter checks before changing your design.",
    openingRecap:
      "Teacher demo emphasized tracing current path from + rail to - rail, checking LED polarity, and measuring voltage across each resistor.",
    priorKnowledge:
      "Ohm's Law (V=IR)\nSeries circuits share current\nLED polarity: long leg to positive",
    commonMistakes:
      "Skipping power rail check\nPlacing resistor in parallel instead of series\nUsing wrong meter mode",
    whatFirst:
      "Build only the power rails and verify 5V before placing any components.",
    completionCriteria:
      "Circuit lights LED consistently, measured values are recorded, and expected vs measured explanation is submitted.",
    steps: [
      {
        order: 1,
        title: "Prepare rails",
        description: "Connect power supply to breadboard rails and verify polarity labels.",
        expectedResult: "A stable 5V reading between positive and ground rails.",
        commonProblems: "Reversed rail wiring, missing ground reference.",
        hints: "Measure rails before adding any other wires.",
        troubleshootingPrompt: "Do you have the expected rail voltage in two different locations?",
        escalationGuidance: "If rail voltage is unstable after two checks, call teacher."
      },
      {
        order: 2,
        title: "Build resistor + LED series path",
        description: "Place resistor and LED in one continuous series path from + rail to ground.",
        expectedResult: "LED turns on with moderate brightness.",
        commonProblems: "LED reversed, resistor bypassed, open circuit gap.",
        hints: "Trace one continuous path with your finger.",
        troubleshootingPrompt: "Can you identify one uninterrupted path through resistor and LED?",
        escalationGuidance: "If polarity and path are confirmed but LED stays off, request support."
      },
      {
        order: 3,
        title: "Measure voltage drops",
        description: "Measure voltage across resistor and LED and compare to expected totals.",
        expectedResult: "Component voltage drops sum close to supply voltage.",
        commonProblems: "Meter probes on wrong nodes, incorrect meter setting.",
        hints: "Measure across each component, not along the same node.",
        troubleshootingPrompt: "Do your measured drops approximately add to source voltage?",
        escalationGuidance: "Ask teacher if values are inconsistent after meter-mode check."
      },
      {
        order: 4,
        title: "Analyze expected vs measured",
        description: "Record expected values and explain differences from measured results.",
        expectedResult: "Short explanation uses tolerance and measurement limitations.",
        commonProblems: "No comparison math shown, ignores tolerance.",
        hints: "Include one sentence on why values differ slightly.",
        troubleshootingPrompt: "Did you compare each measured value with a calculated estimate?",
        escalationGuidance: "Request teacher check if differences are unusually large."
      }
    ],
    checkpoints: [
      {
        stepOrder: 1,
        title: "Power confirmation",
        checkpointQuestion: "What voltage do you read directly across rails?",
        expectedObservation: "Around 5.0V",
        actionIfPass: "Proceed to component placement.",
        actionIfFail: "Reconnect supply and verify rail polarity."
      },
      {
        stepOrder: 2,
        title: "LED polarity check",
        checkpointQuestion: "Is LED anode (long leg) toward positive side?",
        expectedObservation: "Yes",
        actionIfPass: "Continue with measurement.",
        actionIfFail: "Flip LED and retest."
      },
      {
        stepOrder: 3,
        title: "Meter setup check",
        checkpointQuestion: "Is meter in DC voltage mode with probes in V/COM?",
        expectedObservation: "Correct mode and ports",
        actionIfPass: "Capture voltage drops.",
        actionIfFail: "Correct mode/ports before re-measuring."
      }
    ]
  });

  const breadboardLab = await createLabSeed({
    classId: classFoundations.id,
    title: "Breadboard Basics Lab",
    objective: "Build confidence with breadboard rows, rails, and component placement conventions.",
    materials: "Breadboard\nJumper kit\nResistors\nLED\nPower module\nMultimeter",
    startHereContent:
      "Use this if you are unsure where to plug wires: center rows are horizontal groups, rails are vertical columns on most boards.",
    openingRecap:
      "Teacher modeled row continuity checks and why mirrored placement across the center gap matters for ICs.",
    priorKnowledge:
      "Breadboard internal connections\nContinuity mode basics\nColor-coding wires",
    commonMistakes:
      "Assuming all holes connect\nForgetting split power rails\nCrossing center gap incorrectly",
    whatFirst:
      "Use continuity mode to map one full row and one rail segment before wiring the circuit.",
    completionCriteria:
      "Student can explain row/rail behavior and build a functioning LED test circuit without assistance.",
    steps: [
      {
        order: 1,
        title: "Map row connectivity",
        description: "Use continuity mode to verify how center rows are connected.",
        expectedResult: "Consistent beep within row group only.",
        commonProblems: "Testing non-adjacent rows, wrong meter mode.",
        hints: "Mark tested rows with sticky notes.",
        troubleshootingPrompt: "Where does continuity stop and why?",
        escalationGuidance: "Ask teacher if continuity behavior seems inconsistent across board sections."
      },
      {
        order: 2,
        title: "Map rail connectivity",
        description: "Check if rails are split in the middle and label segments.",
        expectedResult: "Rail segments understood and labeled clearly.",
        commonProblems: "Assuming top rail is continuous end-to-end.",
        hints: "Test both halves of each rail separately.",
        troubleshootingPrompt: "Do your rail labels match meter readings?",
        escalationGuidance: "Escalate if readings conflict with expected board architecture."
      },
      {
        order: 3,
        title: "Build LED test circuit",
        description: "Create a simple LED circuit using one resistor and verified rails.",
        expectedResult: "LED lights and turns off correctly with switch wire.",
        commonProblems: "Floating ground, resistor placed on same node as LED leg.",
        hints: "Trace every connection from source to sink.",
        troubleshootingPrompt: "Which exact node path carries current?",
        escalationGuidance: "If path checks out and still no light, request teacher verification."
      },
      {
        order: 4,
        title: "Reflection and documentation",
        description: "Document row/rail map and one troubleshooting insight.",
        expectedResult: "Map and note uploaded in notebook.",
        commonProblems: "Incomplete sketch, no troubleshooting reasoning.",
        hints: "Annotate one error you fixed during build.",
        troubleshootingPrompt: "What check helped you isolate a wiring issue fastest?",
        escalationGuidance: "Teacher check only if notebook template is unclear."
      }
    ],
    checkpoints: [
      {
        stepOrder: 1,
        title: "Continuity mode check",
        checkpointQuestion: "Does meter beep only within intended row group?",
        expectedObservation: "Yes",
        actionIfPass: "Proceed to rail mapping.",
        actionIfFail: "Reset probes and verify meter mode."
      },
      {
        stepOrder: 3,
        title: "Current path trace",
        checkpointQuestion: "Can student point to full path from + to - through resistor and LED?",
        expectedObservation: "Yes",
        actionIfPass: "Proceed to reflection.",
        actionIfFail: "Rebuild path one wire at a time."
      }
    ]
  });

  const binaryLab = await createLabSeed({
    classId: classDigital.id,
    title: "Binary Addition Lab",
    objective: "Model binary addition and validate sum/carry outputs with switch inputs.",
    materials: "Breadboard\n74HC86 XOR IC\n74HC08 AND IC\nLEDs\nResistors\nSwitches\nPower supply",
    startHereContent:
      "If you missed directions: set up power/ground to both ICs first, then wire XOR for sum and AND for carry.",
    openingRecap:
      "Teacher explained half-adder truth table and emphasized checking each input combination one at a time.",
    priorKnowledge:
      "Binary place value\nTruth table reading\nIC pinout orientation",
    commonMistakes:
      "Floating inputs\nIncorrect chip orientation\nSkipping truth-table validation",
    whatFirst:
      "Draw the 4-row truth table and keep it visible while testing each switch combination.",
    completionCriteria:
      "All four input combinations produce correct sum and carry outputs and are logged.",
    steps: [
      {
        order: 1,
        title: "Power and orient ICs",
        description: "Place XOR and AND chips with correct notch orientation and connect VCC/GND.",
        expectedResult: "Both chips powered with stable rails.",
        commonProblems: "Chip rotated 180 degrees, missing ground pin connection.",
        hints: "Pin 1 should match board orientation from diagram.",
        troubleshootingPrompt: "Have you verified power pins with the datasheet pinout?",
        escalationGuidance: "Escalate if chip heating or unstable behavior occurs."
      },
      {
        order: 2,
        title: "Wire sum and carry outputs",
        description: "Wire XOR output to Sum LED and AND output to Carry LED.",
        expectedResult: "LED outputs respond to input changes.",
        commonProblems: "Output pin mismatch, LED polarity reversed.",
        hints: "Label each wire with tape tags for A, B, Sum, Carry.",
        troubleshootingPrompt: "Do outputs map to correct pins from your pin diagram?",
        escalationGuidance: "Request support if output pin mapping stays inconsistent."
      },
      {
        order: 3,
        title: "Run full truth-table test",
        description: "Test input pairs 00, 01, 10, 11 and record outputs.",
        expectedResult: "Measured outputs match half-adder truth table.",
        commonProblems: "Skipping one input pair, floating input state.",
        hints: "Tie unused inputs to known states.",
        troubleshootingPrompt: "Which input pair fails and what output do you actually see?",
        escalationGuidance: "Escalate if same pair repeatedly fails after rewiring."
      },
      {
        order: 4,
        title: "Explain mismatch cases",
        description: "For any mismatch, explain likely root cause and fix attempt.",
        expectedResult: "Reasoned reflection with measured evidence.",
        commonProblems: "No evidence cited, vague cause descriptions.",
        hints: "Reference exact row in truth table.",
        troubleshootingPrompt: "What changed between failing and passing attempt?",
        escalationGuidance: "Ask teacher if mismatch persists without identifiable pattern."
      }
    ],
    checkpoints: [
      {
        stepOrder: 1,
        title: "IC orientation",
        checkpointQuestion: "Is notch orientation aligned with pinout diagram?",
        expectedObservation: "Yes",
        actionIfPass: "Proceed with output wiring.",
        actionIfFail: "Re-seat ICs in correct orientation."
      },
      {
        stepOrder: 3,
        title: "Truth-table coverage",
        checkpointQuestion: "Did student test all 4 input combinations?",
        expectedObservation: "All rows tested",
        actionIfPass: "Move to explanation step.",
        actionIfFail: "Complete missing rows before troubleshooting deeper."
      }
    ]
  });

  const logicLab = await createLabSeed({
    classId: classDigital.id,
    title: "NAND/NOR Gate Lab",
    objective: "Compare NAND and NOR logic behavior and identify when each gate outputs HIGH/LOW.",
    materials: "Breadboard\n74HC00 NAND IC\n74HC02 NOR IC\nLED indicators\nResistors\nSwitch inputs\nPower supply",
    startHereContent:
      "Set one gate at a time. Start with NAND only, validate truth table, then replicate process for NOR.",
    openingRecap:
      "Teacher stressed avoiding floating inputs and checking expected vs measured outputs for each input pair.",
    priorKnowledge:
      "NOT/AND/OR logic\nGate truth tables\nInput pull-up/pull-down concept",
    commonMistakes:
      "Leaving inputs floating\nConfusing NAND and NOR output conditions\nMisreading chip pin map",
    whatFirst:
      "Write both truth tables side-by-side before wiring to avoid logic confusion.",
    completionCriteria:
      "Both gates tested with all input combinations and comparison summary submitted.",
    steps: [
      {
        order: 1,
        title: "Build and test NAND",
        description: "Wire one NAND gate with two switch inputs and one LED output.",
        expectedResult: "Output LOW only when both inputs are HIGH.",
        commonProblems: "Inverted input labels, output pin mismatch.",
        hints: "Mark switches as A and B physically.",
        troubleshootingPrompt: "For input 11, does output go LOW as expected?",
        escalationGuidance: "If 11 row is wrong after rewiring, request teacher help."
      },
      {
        order: 2,
        title: "Build and test NOR",
        description: "Wire one NOR gate and repeat truth-table checks.",
        expectedResult: "Output HIGH only when both inputs are LOW.",
        commonProblems: "Confusing NOR with OR behavior.",
        hints: "Compare each row against written table before next input change.",
        troubleshootingPrompt: "Which NOR row differs from expected output?",
        escalationGuidance: "Escalate if mismatch remains after pinout and floating input checks."
      },
      {
        order: 3,
        title: "Compare gate behavior",
        description: "Summarize how NAND and NOR differ for each input pair.",
        expectedResult: "Clear comparison chart with correct outputs.",
        commonProblems: "Mixing rows between gates.",
        hints: "Use separate columns for measured NAND and measured NOR.",
        troubleshootingPrompt: "Can you explain one row where NAND and NOR differ?",
        escalationGuidance: "Teacher review if conceptual explanation remains unclear."
      }
    ],
    checkpoints: [
      {
        stepOrder: 1,
        title: "NAND row 11 check",
        checkpointQuestion: "Does NAND output LOW when inputs are 1 and 1?",
        expectedObservation: "LOW",
        actionIfPass: "Proceed to NOR wiring.",
        actionIfFail: "Re-check NAND output pin and input states."
      },
      {
        stepOrder: 2,
        title: "NOR row 00 check",
        checkpointQuestion: "Does NOR output HIGH when inputs are 0 and 0?",
        expectedObservation: "HIGH",
        actionIfPass: "Proceed to comparison summary.",
        actionIfFail: "Check floating inputs and pull-down setup."
      }
    ]
  });

  await prisma.studentLabProgress.createMany({
    data: [
      {
        studentId: students[0].id,
        labId: seriesLab.id,
        currentStepId: seriesLab.stepByOrder.get(2)?.id,
        status: ProgressStatus.STUCK,
        isStuck: true,
        waitingForHelp: false,
        troubleshootingAttempts: 2,
        aiConfidence: 0.52,
        notes: "LED still off after rewire"
      },
      {
        studentId: students[1].id,
        labId: seriesLab.id,
        currentStepId: seriesLab.stepByOrder.get(3)?.id,
        status: ProgressStatus.IN_PROGRESS,
        isStuck: false,
        waitingForHelp: false,
        troubleshootingAttempts: 1,
        aiConfidence: 0.72,
        notes: "Collecting voltage values"
      },
      {
        studentId: students[2].id,
        labId: breadboardLab.id,
        currentStepId: breadboardLab.stepByOrder.get(3)?.id,
        status: ProgressStatus.WAITING_FOR_HELP,
        isStuck: true,
        waitingForHelp: true,
        troubleshootingAttempts: 3,
        aiConfidence: 0.49,
        notes: "Continuity checks pass but LED path still fails"
      },
      {
        studentId: students[3].id,
        labId: breadboardLab.id,
        currentStepId: breadboardLab.stepByOrder.get(4)?.id,
        status: ProgressStatus.COMPLETED,
        isStuck: false,
        waitingForHelp: false,
        troubleshootingAttempts: 1,
        aiConfidence: 0.87,
        notes: "Completed reflection"
      },
      {
        studentId: students[4].id,
        labId: binaryLab.id,
        currentStepId: binaryLab.stepByOrder.get(3)?.id,
        status: ProgressStatus.STUCK,
        isStuck: true,
        waitingForHelp: false,
        troubleshootingAttempts: 2,
        aiConfidence: 0.58,
        notes: "Carry output incorrect on 11"
      },
      {
        studentId: students[5].id,
        labId: logicLab.id,
        currentStepId: logicLab.stepByOrder.get(2)?.id,
        status: ProgressStatus.WAITING_FOR_HELP,
        isStuck: true,
        waitingForHelp: true,
        troubleshootingAttempts: 3,
        aiConfidence: 0.46,
        notes: "NOR output stuck high"
      }
    ]
  });

  const helpRequestA = await prisma.helpRequest.create({
    data: {
      studentId: students[0].id,
      labId: seriesLab.id,
      labStepId: seriesLab.stepByOrder.get(2)?.id,
      issueSummary: "LED not turning on",
      troubleshootingAttempted: "Checked resistor value and rewired one side",
      aiRecommendation:
        "Check LED polarity and verify a continuous path from + rail through resistor and LED to ground before changing components.",
      aiFollowUpQuestions:
        "Is LED long leg on positive side?\nDo you measure voltage across LED path?\nDoes wiring match the diagram exactly?",
      aiConfidence: 0.52,
      resolved: false,
      teacherNotified: true,
      escalationReason: "Repeated attempts with low AI confidence"
    }
  });

  const helpRequestB = await prisma.helpRequest.create({
    data: {
      studentId: students[2].id,
      labId: breadboardLab.id,
      labStepId: breadboardLab.stepByOrder.get(3)?.id,
      issueSummary: "Circuit still open after continuity checks",
      troubleshootingAttempted: "Mapped rows and rails, rebuilt wires twice",
      aiRecommendation:
        "Rebuild the path one connection at a time and validate each node with continuity before powering.",
      aiFollowUpQuestions:
        "Where does continuity stop?\nIs ground rail connected to source?\nAre resistor and LED sharing a node incorrectly?",
      aiConfidence: 0.49,
      resolved: false,
      teacherNotified: true,
      escalationReason: "Waiting for help after multiple failed attempts"
    }
  });

  await prisma.helpRequest.create({
    data: {
      studentId: students[3].id,
      labId: breadboardLab.id,
      labStepId: breadboardLab.stepByOrder.get(2)?.id,
      issueSummary: "Unsure whether rail is split",
      troubleshootingAttempted: "Ran continuity on left side only",
      aiRecommendation: "Test both halves of the rail and bridge if split.",
      aiFollowUpQuestions: "Did right-side rail beep with left?",
      aiConfidence: 0.81,
      resolved: true,
      teacherNotified: false
    }
  });

  await prisma.teacherAlert.createMany({
    data: [
      {
        teacherId: teacher.id,
        classId: classFoundations.id,
        labId: seriesLab.id,
        labStepId: seriesLab.stepByOrder.get(2)?.id,
        type: AlertType.REPEATED_STUCK,
        severity: AlertSeverity.HIGH,
        title: "Student repeatedly stuck on LED wiring",
        message: "Avery Jackson has multiple unsuccessful attempts on Series Circuit step 2.",
        isActive: true
      },
      {
        teacherId: teacher.id,
        classId: classFoundations.id,
        labId: breadboardLab.id,
        labStepId: breadboardLab.stepByOrder.get(3)?.id,
        type: AlertType.DIRECT_HELP_REQUEST,
        severity: AlertSeverity.HIGH,
        title: "Direct help request",
        message: "Nina Patel requested teacher intervention during Breadboard Basics step 3.",
        isActive: true
      },
      {
        teacherId: teacher.id,
        classId: classDigital.id,
        labId: logicLab.id,
        labStepId: logicLab.stepByOrder.get(2)?.id,
        type: AlertType.BOTTLENECK_STEP,
        severity: AlertSeverity.MEDIUM,
        title: "Emerging bottleneck on NOR troubleshooting",
        message: "Multiple students are reporting incorrect NOR outputs.",
        isActive: true
      }
    ]
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: students[0].id,
        classId: classFoundations.id,
        labId: seriesLab.id,
        labStepId: seriesLab.stepByOrder.get(2)?.id,
        type: ActivityType.SUBMITTED_HELP_REQUEST,
        details: "Asked for help: LED not turning on"
      },
      {
        userId: students[0].id,
        classId: classFoundations.id,
        labId: seriesLab.id,
        labStepId: seriesLab.stepByOrder.get(2)?.id,
        type: ActivityType.RECEIVED_AI_GUIDANCE,
        details: "Received guidance to verify polarity and voltage path"
      },
      {
        userId: students[2].id,
        classId: classFoundations.id,
        labId: breadboardLab.id,
        labStepId: breadboardLab.stepByOrder.get(3)?.id,
        type: ActivityType.UPDATED_PROGRESS,
        details: "Status changed to waiting for help"
      },
      {
        userId: students[5].id,
        classId: classDigital.id,
        labId: logicLab.id,
        labStepId: logicLab.stepByOrder.get(2)?.id,
        type: ActivityType.UPDATED_PROGRESS,
        details: "Reported stuck on NOR output check"
      },
      {
        userId: students[3].id,
        classId: classFoundations.id,
        labId: breadboardLab.id,
        labStepId: breadboardLab.stepByOrder.get(4)?.id,
        type: ActivityType.RESOLVED_HELP_REQUEST,
        details: "Completed reflection after quick teacher check"
      },
      {
        userId: students[1].id,
        classId: classFoundations.id,
        labId: seriesLab.id,
        labStepId: seriesLab.stepByOrder.get(3)?.id,
        type: ActivityType.VIEWED_LAB,
        details: "Opened instruction hub before measuring values"
      }
    ]
  });

  await prisma.themeSettings.create({
    data: {
      id: 1,
      schoolName: "Engineering Innovation High",
      logoUrl: "/logo.svg",
      primaryColor: "#0F4C81",
      secondaryColor: "#1B9AAA",
      accentColor: "#F4A259",
      darkMode: true
    }
  });

  await prisma.schoolSettings.create({
    data: {
      id: 1,
      aiEnabled: true,
      fallbackModeEnabled: true,
      teacherAlertsEnabled: true,
      repeatedStuckThreshold: 2,
      waitingMinutesThreshold: 8,
      lowConfidenceThreshold: 0.55,
      classWideBottleneckThreshold: 3,
      localCustomizationNotes: "Default seed settings for classroom pilot."
    }
  });

  console.log("Seed complete.");
  console.log(`Teacher login: ${teacher.username}`);
  console.log(`Admin login: ${admin.username}`);
  console.log(`Student logins: ${students.map((student) => student.username).join(", ")}`);
  console.log(`Open help queue sample IDs: ${helpRequestA.id}, ${helpRequestB.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
