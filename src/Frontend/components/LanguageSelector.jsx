import { INTERVIEW_LANGUAGES } from "../lib/interview";

export default function LanguageSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) {
  if (readOnly) {
    const label =
      INTERVIEW_LANGUAGES.find((option) => option.value === value)?.label || value;

    return (
      <div className="interview-language-readonly">
        <span>Language</span>
        <strong>{label}</strong>
      </div>
    );
  }

  return (
    <label className="interview-language-select">
      <span>Language</span>
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
    </label>
  );
}
