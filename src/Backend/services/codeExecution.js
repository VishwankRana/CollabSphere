const JDOODLE_URL = "https://api.jdoodle.com/v1/execute";

const JDOODLE_LANGUAGES = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "3" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
};

export async function executeCode(language, code, stdin = "") {
  if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
    return {
      stdout: "",
      stderr: "No code executor configured. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET.",
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
    };
  }

  const config = JDOODLE_LANGUAGES[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  let res;

  try {
    res = await fetch(JDOODLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        stdin,
        language: config.language,
        versionIndex: config.versionIndex,
      }),
    });
  } catch {
    return {
      stdout: "",
      stderr: "Code execution service is unreachable. Please try again.",
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
    };
  }

  if (res.status === 401) {
    return {
      stdout: "",
      stderr: "Code execution auth failed. Check JDOODLE_CLIENT_ID and CLIENT_SECRET.",
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
    };
  }

  if (res.status === 429) {
    return {
      stdout: "",
      stderr: "Daily execution limit reached (200/day). Try again tomorrow.",
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
    };
  }

  if (!res.ok) {
    return {
      stdout: "",
      stderr: `Execution service error (HTTP ${res.status}). Please try again.`,
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
    };
  }

  const data = await res.json();
  const output = data.output || "";

  return {
    stdout: data.isError ? "" : output,
    stderr: data.isError ? output : "",
    exitCode: data.isError ? 1 : 0,
    executionTime: data.cpuTime ? Math.round(parseFloat(data.cpuTime) * 1000) : 0,
    timedOut: false,
  };
}
