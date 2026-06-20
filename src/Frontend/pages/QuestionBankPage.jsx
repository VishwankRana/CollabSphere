import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "../components/IconLabel";
import { apiRequest } from "../lib/api";
import { applyCodescreenMonacoTheme } from "../lib/monacoTheme";
import { buildQuestionsQuery } from "../lib/questionBank";

function DifficultyBadge({ difficulty }) {
  const normalized = String(difficulty || "Medium").toLowerCase();

  return (
    <span className={`qb-difficulty qb-difficulty--${normalized}`}>
      <span className="qb-difficulty-dot" aria-hidden="true" />
      {difficulty}
    </span>
  );
}

function QuestionDetailPanel({ question, onClose, onUse, onEdit, onDelete, token }) {
  const [deleting, setDeleting] = useState(false);

  if (!question) {
    return null;
  }

  const visibleTests = (question.testCases || []).filter((testCase) => !testCase.isHidden);
  const isCustom = question.source === "custom";

  async function handleDelete() {
    if (!window.confirm(`Delete "${question.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      await apiRequest(`/api/questions/${question.id}`, { method: "DELETE", token });
      onDelete?.(question.id);
      onClose();
    } catch (requestError) {
      window.alert(requestError.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <button type="button" className="qb-panel-backdrop" aria-label="Close panel" onClick={onClose} />
      <aside className="qb-detail-panel">
        <div className="qb-detail-panel-header">
          <h2>{question.title}</h2>
          <button type="button" className="btn-ghost btn-icon" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="qb-detail-panel-body">
          <DifficultyBadge difficulty={question.difficulty} />

          {question.tags?.length ? (
            <div className="qb-tag-row">
              {question.tags.map((tag) => (
                <span className="qb-tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="qb-detail-section">
            <h3>Description</h3>
            <p className="qb-detail-description">{question.description}</p>
          </div>

          {question.examples?.length ? (
            <div className="qb-detail-section">
              <h3>Examples</h3>
              {question.examples.map((example, index) => (
                <div className="qb-example-block" key={`example-${index}`}>
                  <strong>Example {index + 1}</strong>
                  <p>
                    <span>Input</span>
                    <pre>{example.input}</pre>
                  </p>
                  <p>
                    <span>Output</span>
                    <pre>{example.output}</pre>
                  </p>
                  {example.explanation ? <p>{example.explanation}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {question.constraints?.length ? (
            <div className="qb-detail-section">
              <h3>Constraints</h3>
              <ul className="qb-constraint-list">
                {question.constraints.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="qb-detail-section">
            <h3>Starter code (JavaScript)</h3>
            <div className="qb-monaco-snippet">
              <Editor
                height="160px"
                language="javascript"
                value={question.starterCode?.javascript || ""}
                onMount={(_editor, monaco) => applyCodescreenMonacoTheme(monaco)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  lineNumbers: "off",
                  folding: false,
                }}
                theme="codescreen-dark"
              />
            </div>
          </div>

          {visibleTests.length ? (
            <div className="qb-detail-section">
              <h3>Test cases</h3>
              {visibleTests.map((testCase, index) => (
                <div className="qb-example-block" key={`test-${index}`}>
                  <strong>Case {index + 1}</strong>
                  <p>
                    <span>Input</span>
                    <pre>{testCase.input}</pre>
                  </p>
                  <p>
                    <span>Expected</span>
                    <pre>{testCase.expectedOutput}</pre>
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="qb-detail-panel-footer">
          {isCustom ? (
            <div className="qb-detail-panel-actions">
              <button type="button" className="btn-ghost" onClick={() => onEdit?.(question)}>
                <IconLabel icon={Pencil} size={14}>
                  Edit
                </IconLabel>
              </button>
              <button type="button" className="btn-ghost" disabled={deleting} onClick={handleDelete}>
                <IconLabel icon={Trash2} size={14}>
                  {deleting ? "Deleting..." : "Delete"}
                </IconLabel>
              </button>
            </div>
          ) : null}
          <button type="button" className="btn-primary" onClick={() => onUse?.(question)}>
            <IconLabel icon={Play} size={16}>
              Use in Interview
            </IconLabel>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [source, setSource] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [summary, setSummary] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = buildQuestionsQuery({
        search: search.trim(),
        difficulty: difficulty || undefined,
        source: source || undefined,
        tags: activeTags.length ? activeTags.join(",") : undefined,
        page,
        limit: 20,
      });

      const data = await apiRequest(`/api/questions${query}`, { token });
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (requestError) {
      setQuestions([]);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [activeTags, difficulty, page, search, source, token]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!token) {
      return;
    }

    apiRequest("/api/questions?limit=100", { token })
      .then((data) => {
        const items = data.questions || [];
        setSummary({
          total: data.total || items.length,
          easy: items.filter((item) => item.difficulty === "Easy").length,
          medium: items.filter((item) => item.difficulty === "Medium").length,
          hard: items.filter((item) => item.difficulty === "Hard").length,
        });
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [search, difficulty, source, activeTags]);

  const availableTagSuggestions = useMemo(() => {
    const tagSet = new Set();

    questions.forEach((question) => {
      (question.tags || []).forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).filter((tag) => !activeTags.includes(tag));
  }, [activeTags, questions]);

  async function handleUseQuestion(question) {
    try {
      await apiRequest(`/api/questions/${question.id}/use`, { method: "POST", token });
      navigate("/rooms/new", { state: { question } });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function addTag(tag) {
    const trimmed = tag.trim();

    if (!trimmed || activeTags.includes(trimmed)) {
      return;
    }

    setActiveTags((current) => [...current, trimmed]);
    setTagInput("");
  }

  return (
    <main className="qb-shell">
      <div className="qb-page-header page-section">
        <div>
          <h1 className="font-display">
            <IconLabel icon={BookOpen} size={24}>
              Question Bank
            </IconLabel>
          </h1>
          <p className="cs-page-subtitle">
            {summary.total} problems · {summary.easy} Easy · {summary.medium} Medium · {summary.hard}{" "}
            Hard
          </p>
        </div>
        <Link className="btn-primary" to="/question-bank/new">
          <IconLabel icon={Plus} size={16}>
            New Question
          </IconLabel>
        </Link>
      </div>

      <section className="qb-filter-bar page-section">
        <label className="qb-search">
          <Search size={16} strokeWidth={1.5} />
          <input
            className="comment-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search problems..."
          />
        </label>

        <div className="qb-filter-group">
          <span className="qb-filter-label">Difficulty</span>
          <div className="qb-filter-chips">
            {["", "Easy", "Medium", "Hard"].map((value) => (
              <button
                key={value || "all"}
                type="button"
                className={`filter-chip${difficulty === value ? " active" : ""}${
                  value ? ` ${value.toLowerCase()}` : ""
                }`}
                onClick={() => setDifficulty(value)}
              >
                {value || "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="qb-filter-group">
          <span className="qb-filter-label">Source</span>
          <div className="qb-filter-chips">
            {[
              { value: "", label: "All" },
              { value: "seed", label: "Built-in" },
              { value: "custom", label: "Custom" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                className={`filter-chip${source === option.value ? " active" : ""}`}
                onClick={() => setSource(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="qb-filter-group">
          <span className="qb-filter-label">Tags</span>
          <div className="qb-filter-chips">
            {activeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="filter-chip active"
                onClick={() => setActiveTags((current) => current.filter((entry) => entry !== tag))}
              >
                {tag} ×
              </button>
            ))}
            <input
              className="comment-input qb-tag-input"
              value={tagInput}
              list="qb-tag-suggestions"
              placeholder="+ Add tag"
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
            <datalist id="qb-tag-suggestions">
              {availableTagSuggestions.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      {error ? <p className="access-message page-section">{error}</p> : null}

      <div className="cs-table-wrap page-section qb-table-wrap">
        <table className="cs-table qb-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Tags</th>
              <th>Used</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td colSpan={5}>
                      <div className="cs-skeleton cs-skeleton-row" />
                    </td>
                  </tr>
                ))
              : questions.map((question) => (
                  <tr key={question.id} className="qb-table-row">
                    <td>
                      <div className="cs-table-title-cell">
                        <span className="cs-table-title-main">{question.title}</span>
                        <span className="cs-table-title-sub">
                          {question.source === "seed" ? "Built-in" : "Custom"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <DifficultyBadge difficulty={question.difficulty} />
                    </td>
                    <td>
                      <div className="qb-tag-row">
                        {(question.tags || []).slice(0, 3).map((tag) => (
                          <span className="qb-tag-chip" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="cs-table-meta">{question.usageCount || 0}×</span>
                    </td>
                    <td className="cs-table-actions">
                      <div className="cs-table-actions-group qb-row-actions">
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleUseQuestion(question)}
                        >
                          <IconLabel icon={Play} size={13}>
                            Use in Interview
                          </IconLabel>
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setSelectedQuestion(question)}
                        >
                          <IconLabel icon={Eye} size={13}>
                            View
                          </IconLabel>
                        </button>
                        {question.source === "custom" &&
                        question.createdBy === String(user?.id) ? (
                          <>
                            <Link className="btn-ghost" to={`/question-bank/${question.id}/edit`}>
                              <IconLabel icon={Pencil} size={13}>
                                Edit
                              </IconLabel>
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && !questions.length ? (
          <div className="cs-empty-state-panel">
            <BookOpen size={40} strokeWidth={1.5} />
            <h2>No questions found</h2>
            <p>Try adjusting your filters or create a custom problem.</p>
          </div>
        ) : null}
      </div>

      <div className="qb-pagination page-section">
        <button
          type="button"
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <IconLabel icon={ChevronLeft} size={14}>
            Prev
          </IconLabel>
        </button>
        <span className="cs-table-meta">
          Page {page} of {totalPages} · {total} total
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          <IconLabel icon={ChevronRight} size={14}>
            Next
          </IconLabel>
        </button>
      </div>

      <QuestionDetailPanel
        question={selectedQuestion}
        token={token}
        onClose={() => setSelectedQuestion(null)}
        onDelete={(id) => {
          setQuestions((current) => current.filter((entry) => entry.id !== id));
          setSelectedQuestion(null);
          loadQuestions();
        }}
        onEdit={(question) => navigate(`/question-bank/${question.id}/edit`)}
        onUse={handleUseQuestion}
      />
    </main>
  );
}
