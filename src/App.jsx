import { useMemo, useState } from "react";
import { getTodos, addTodo, updateTodo, deleteTodo } from "./api";
import "./App.css";

const PRIORITIES = [
  { value: "high", label: "High", color: "var(--priority-high)" },
  { value: "med", label: "Medium", color: "var(--priority-med)" },
  { value: "low", label: "Low", color: "var(--priority-low)" },
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

function isOverdue(todo) {
  if (todo.completed || !todo.dueDate) return false;
  const today = new Date();
  const due = new Date(todo.dueDate + "T23:59:59");
  return due < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function formatDueDate(date) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("med");
  const [project, setProject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("created");

  useState(() => {
    getTodos()
      .then((items) => {
        setTodos(items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const saved = await addTodo({
        title,
        description,
        priority,
        project,
        dueDate,
        tags,
      });
      setTodos((prev) => [saved, ...prev]);
      setTitle("");
      setDescription("");
      setTagsInput("");
      setProject("");
      setDueDate("");
      setPriority("med");
      setShowAdvanced(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? updated || { ...t, completed: !t.completed } : t))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const projects = useMemo(() => {
    const set = new Set();
    todos.forEach((t) => {
      if (t.project) set.add(t.project);
    });
    return Array.from(set).sort();
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const overdue = todos.filter((t) => isOverdue(t)).length;
    const high = todos.filter((t) => t.priority === "high" && !t.completed).length;
    return { total, completed, active, overdue, high };
  }, [todos]);

  const filtered = useMemo(() => {
    let list = [...todos];

    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);
    if (filter === "overdue") list = list.filter((t) => isOverdue(t));

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => {
        const haystack = [
          t.title,
          t.description,
          t.project,
          ...(t.tags || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { high: 0, med: 1, low: 2 };
        const diff = order[a.priority || "med"] - order[b.priority || "med"];
        if (diff !== 0) return diff;
      }
      if (sortBy === "due") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "project") {
        return (a.project || "").localeCompare(b.project || "");
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [todos, filter, query, sortBy]);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="loading">Loading your dev workspace...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DevForge · Task Management</p>
          <h1>Developer Task Board</h1>
          <p className="subtitle">
            Plan sprints, track bugs, and ship with clarity. Everything stays local in your browser.
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Active</span>
            <span className="stat-value">{stats.active}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          <div className="stat-card warn">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{stats.overdue}</span>
          </div>
          <div className="stat-card danger">
            <span className="stat-label">High Priority</span>
            <span className="stat-value">{stats.high}</span>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="composer">
        <form onSubmit={handleAdd} className="composer-form">
          <div className="composer-main">
            <input
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task... (e.g. Fix auth redirect on refresh)"
              required
            />
            <button className="primary-btn" type="submit">
              Add Task
            </button>
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Hide details" : "Add details (project, due, tags, notes)"}
          </button>
          {showAdvanced && (
            <div className="composer-advanced">
              <div className="field-grid">
                <label className="field">
                  <span>Project / Repo</span>
                  <input
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="api-service"
                    list="project-suggestions"
                  />
                  <datalist id="project-suggestions">
                    {projects.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
                <label className="field">
                  <span>Tags (comma separated)</span>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="bug, api, tests"
                  />
                </label>
              </div>
              <label className="field field-full">
                <span>Description / Notes</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Acceptance criteria, links, or reproduction steps..."
                  rows={3}
                />
              </label>
            </div>
          )}
        </form>
      </section>

      <section className="toolbar">
        <div className="toolbar-group">
          <div className="search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, projects, tags..."
            />
          </div>
          <div className="filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={filter === f.value ? "tab active" : "tab"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <label className="sort">
          <span>Sort by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created">Newest</option>
            <option value="priority">Priority</option>
            <option value="due">Due date</option>
            <option value="project">Project</option>
          </select>
        </label>
      </section>

      <section className="task-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h2>No tasks here</h2>
            <p>Clear your focus by adding a task above, or change your filters/search.</p>
          </div>
        ) : (
          filtered.map((todo) => {
            const overdue = isOverdue(todo);
            const pr = PRIORITIES.find((p) => p.value === (todo.priority || "med"));
            return (
              <article key={todo.id} className={`task-card ${todo.completed ? "completed" : ""}`}>
                <div className="task-main">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                    />
                    <span className="checkmark" />
                  </label>
                  <div className="task-content">
                    <div className="task-header">
                      <h3>{todo.title}</h3>
                      <div className="task-meta">
                        {todo.project && <span className="pill project">{todo.project}</span>}
                        {pr && (
                          <span className="pill priority" style={{ color: pr.color }}>
                            {pr.label}
                          </span>
                        )}
                        {todo.dueDate && (
                          <span className={`pill due ${overdue ? "overdue" : ""}`}>
                            Due {formatDueDate(todo.dueDate)}
                            {overdue && !todo.completed ? " · Overdue" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {todo.description && <p className="task-desc">{todo.description}</p>}
                    {(todo.tags || []).length > 0 && (
                      <div className="tag-row">
                        {(todo.tags || []).map((tag) => (
                          <span key={tag} className="tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="icon-btn danger" onClick={() => handleDelete(todo.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <footer className="app-footer">
        <p>
          {stats.total} total · {stats.completed} done · Focus on shipping, not clutter.
        </p>
      </footer>
    </div>
  );
}
