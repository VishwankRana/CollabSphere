export const QUESTION_TAGS = [
  "Array",
  "String",
  "Hash Map",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Stack",
  "Linked List",
  "Tree",
  "Graph",
  "Dynamic Programming",
  "Greedy",
  "Divide and Conquer",
  "Heap",
  "BFS",
  "DFS",
  "Union Find",
  "Trie",
  "Math",
  "Sorting",
  "Prefix Sum",
];

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

export const STARTER_STUBS = {
  javascript: "function solution(input) {\n  \n}",
  python: "def solution(input):\n    pass",
  java: "class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}",
};

export function getDifficultyClass(difficulty) {
  const normalized = String(difficulty || "Medium").toLowerCase();

  if (normalized === "easy") {
    return "easy";
  }

  if (normalized === "hard") {
    return "hard";
  }

  return "medium";
}

export function formatDifficultyLabel(difficulty) {
  const normalized = String(difficulty || "Medium").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function questionToRoomPayload(question) {
  return {
    problemTitle: question.title,
    problemDescription: question.description,
    difficulty: String(question.difficulty || "Medium").toLowerCase(),
    examples: question.examples || [],
    constraints: (question.constraints || []).join("\n"),
    starterCode: question.starterCode || {},
    testCases: (question.testCases || []).map((testCase) => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      isHidden: Boolean(testCase.isHidden),
    })),
  };
}

export function buildQuestionsQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
