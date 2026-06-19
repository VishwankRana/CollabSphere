export const DEFAULT_STARTER_CODE = {
  javascript: "function solution(input) {\n  // Write your solution here\n}\n",
  python: "def solution(input):\n    # Write your solution here\n    pass\n",
  java: "public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
};

export function getYjsRoomName(roomId) {
  return `interview-${String(roomId)}`;
}

export function getRoomRole(room, userId) {
  const normalizedUserId = String(userId);

  if (String(room.interviewerId?._id || room.interviewerId) === normalizedUserId) {
    return "interviewer";
  }

  if (String(room.candidateId?._id || room.candidateId) === normalizedUserId) {
    return "candidate";
  }

  return null;
}

export function isInterviewer(room, userId) {
  return getRoomRole(room, userId) === "interviewer";
}

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id || user),
    name: user.name,
    email: user.email,
  };
}

function serializeTestCases(testCases, role) {
  const cases = testCases || [];

  if (role === "candidate") {
    return cases
      .filter((testCase) => !testCase.isHidden)
      .map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isHidden: false,
      }));
  }

  return cases.map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    isHidden: Boolean(testCase.isHidden),
  }));
}

export function serializeRoom(room, role) {
  const serialized = {
    id: String(room._id),
    title: room.title,
    problem: room.problem || {},
    starterCode: room.starterCode || {},
    language: room.language,
    status: room.status,
    testCases: serializeTestCases(room.testCases, role),
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    finalScore: room.finalScore,
    createdAt: room.createdAt,
    yjsRoomName: getYjsRoomName(room._id),
    role,
    interviewer: serializeUser(room.interviewerId),
    candidate: serializeUser(room.candidateId),
  };

  if (role === "interviewer") {
    serialized.inviteToken = room.inviteToken;
    serialized.notes = room.notes || "";
  }

  return serialized;
}

export function formatDuration(ms) {
  if (!ms || ms < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function sampleRecordingEvents(events, max = 500) {
  if (events.length <= max) {
    return events;
  }

  const sampled = [];
  const step = events.length / max;

  for (let index = 0; index < max; index += 1) {
    sampled.push(events[Math.floor(index * step)]);
  }

  return sampled;
}

export function mergeStarterCode(starterCode = {}) {
  return {
    ...DEFAULT_STARTER_CODE,
    ...starterCode,
  };
}
