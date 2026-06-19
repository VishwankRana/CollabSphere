export const DEFAULT_STARTER_CODE = {
  javascript: "function solution(input) {\n  // Write your solution here\n}\n",
  python: "def solution(input):\n    # Write your solution here\n    pass\n",
  java: "public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
};

export const MONACO_LANGUAGE_IDS = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

export function getStarterCodeForLanguage(language, starterCode = {}) {
  return (
    starterCode?.[language] ||
    DEFAULT_STARTER_CODE[language] ||
    DEFAULT_STARTER_CODE.javascript
  );
}

export function getAwarenessColor(role) {
  return role === "interviewer" ? "#7F77DD" : "#D85A30";
}
