export const standardsCatalog = {
  nglsNys: [
    "HS-ETS1-1: Analyze a major global challenge to specify qualitative and quantitative design criteria.",
    "HS-ETS1-2: Design a solution to a complex real-world problem by breaking it into manageable parts.",
    "HS-ETS1-3: Evaluate a solution to a complex real-world problem based on prioritized criteria and trade-offs.",
    "HS-ETS1-4: Use computer simulations to model impacts of proposed solutions."
  ],
  nysCdos: [
    "CDOS Standard 1: Career Development - Students will be knowledgeable about the world of work.",
    "CDOS Standard 2: Integrated Learning - Students will demonstrate how academic knowledge connects to applications.",
    "CDOS Standard 3a: Universal Foundation Skills - Personal qualities, thinking skills, and resource management.",
    "CDOS Standard 3b: Career Majors - Technical knowledge and skills required for specific fields."
  ],
  etaiDigitalElectronics: [
    "ETA-I Digital Electronics: Analyze and verify truth tables for fundamental and universal logic gates.",
    "ETA-I Digital Electronics: Construct and troubleshoot combinational digital circuits using test instruments.",
    "ETA-I Digital Electronics: Interpret schematic diagrams and convert between schematic and breadboard layouts.",
    "ETA-I Digital Electronics: Document measurements and justify deviations between expected and measured output."
  ],
  noctiPreEngineering: [
    "NOCTI Pre-Engineering: Apply engineering design and troubleshooting methodology.",
    "NOCTI Pre-Engineering: Demonstrate safe and effective use of lab tools, meters, and prototyping equipment.",
    "NOCTI Pre-Engineering: Analyze and communicate technical data in written and graphical forms.",
    "NOCTI Pre-Engineering: Use technology and technical documentation to solve engineering problems."
  ]
};

export function getRelevantStandards(courseName: string) {
  const lower = courseName.toLowerCase();

  const selected = [
    ...standardsCatalog.nglsNys,
    ...standardsCatalog.nysCdos,
    ...standardsCatalog.noctiPreEngineering
  ];

  if (lower.includes("digital") || lower.includes("electronics") || lower.includes("logic")) {
    selected.push(...standardsCatalog.etaiDigitalElectronics);
  }

  return selected;
}
