const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_CONFIG = {
  javascript: { language: "javascript", version: "*", filename: "main.js" },
  python: { language: "python", version: "*", filename: "main.py" },
  java: { language: "java", version: "*", filename: "Main.java" },
  cpp: { language: "c++", version: "*", filename: "main.cpp" },
};

export async function executeCode(language, code, stdin = "") {
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(PISTON_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: config.filename, content: code }],
        stdin,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Execution service unavailable. Please try again.");
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    return {
      stdout: result.run?.stdout || "",
      stderr: result.run?.stderr || "",
      exitCode: result.run?.code ?? 1,
      executionTime,
      timedOut: result.run?.signal === "SIGKILL",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Execution timed out after 15 seconds.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
