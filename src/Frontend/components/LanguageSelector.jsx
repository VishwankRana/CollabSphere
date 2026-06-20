import { INTERVIEW_LANGUAGES } from "../lib/interview";

const LANGUAGE_DOT_CLASS = {
  javascript: "lang-dot--javascript",
  python: "lang-dot--python",
  java: "lang-dot--java",
  cpp: "lang-dot--cpp",
};

export default function LanguageSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) {
  const dotClass = LANGUAGE_DOT_CLASS[value] || LANGUAGE_DOT_CLASS.javascript;

  if (readOnly) {
    const label =
      INTERVIEW_LANGUAGES.find((option) => option.value === value)?.label || value;

    return (
      <div className="interview-language-readonly">
        <span className="lang-select-wrap">
          <span className={`lang-dot ${dotClass}`} aria-hidden="true" />
          <strong>{label}</strong>
        </span>
      </div>
    );
  }

  return (
    <label className="interview-language-select">
      <span className="lang-select-wrap">
        <span className={`lang-dot ${dotClass}`} aria-hidden="true" />
        <select
          className="role-select"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {INTERVIEW_LANGUAGES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
