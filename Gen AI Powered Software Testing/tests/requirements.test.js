const { requirements, epics, userStories, sprintPlan, testCases } = require("../src");

describe("requirements catalog and Agile planning", () => {
  test("TC-REQ-001 covers all assignment-required categories", () => {
    const categories = new Set(requirements.map((requirement) => requirement.category));

    expect([...categories]).toEqual(
      expect.arrayContaining([
        "Chatbot Functionality",
        "NLP Capabilities",
        "Integration",
        "KYC Data",
        "AML Monitoring",
        "Scalability",
        "Performance",
        "Reporting"
      ])
    );

    for (const requirement of requirements) {
      expect(requirement.id).toMatch(/^REQ-/);
      expect(requirement.acceptanceCriteria.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("epics and user stories trace to valid requirements", () => {
    const requirementIds = new Set(requirements.map((requirement) => requirement.id));

    for (const epic of epics) {
      expect(epic.requirementIds.length).toBeGreaterThan(0);
      epic.requirementIds.forEach((id) => expect(requirementIds.has(id)).toBe(true));
    }

    for (const story of userStories) {
      expect(story.storyPoints).toBeGreaterThan(0);
      expect(story.priority).toMatch(/High|Medium|Low/);
      story.requirementIds.forEach((id) => expect(requirementIds.has(id)).toBe(true));
    }
  });

  test("sprint plan assigns every user story exactly once", () => {
    const plannedStoryIds = sprintPlan.flatMap((sprint) => sprint.storyIds);
    const allStoryIds = userStories.map((story) => story.id);

    expect(new Set(plannedStoryIds)).toEqual(new Set(allStoryIds));
    expect(plannedStoryIds).toHaveLength(allStoryIds.length);
  });

  test("every test case maps to at least one valid requirement", () => {
    const requirementIds = new Set(requirements.map((requirement) => requirement.id));

    for (const testCase of testCases) {
      expect(testCase.requirementIds.length).toBeGreaterThan(0);
      testCase.requirementIds.forEach((id) => expect(requirementIds.has(id)).toBe(true));
    }
  });
});
