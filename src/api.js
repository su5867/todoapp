const STORAGE_KEY = "devforge-todos-v1";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // ignore write errors
  }
}

let todos = loadTodos();

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTodos() {
  return Promise.resolve([...todos]);
}

export function addTodo(payload) {
  const todo = {
    id: uid(),
    title: payload.title?.trim() || "Untitled",
    description: payload.description?.trim() || "",
    completed: false,
    priority: payload.priority || "med",
    tags: Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [],
    project: payload.project?.trim() || "",
    dueDate: payload.dueDate || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  todos = [todo, ...todos];
  saveTodos(todos);
  return Promise.resolve({ ...todo });
}

export function updateTodo(id, changes) {
  todos = todos.map((todo) => {
    if (todo.id !== id) return todo;
    return {
      ...todo,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
  });
  saveTodos(todos);
  return Promise.resolve(todos.find((todo) => todo.id === id));
}

export function replaceTodo(id, todo) {
  todos = todos.map((t) => (t.id === id ? { ...todo, id, updatedAt: new Date().toISOString() } : t));
  saveTodos(todos);
  return Promise.resolve(todos.find((t) => t.id === id));
}

export function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos(todos);
  return Promise.resolve();
}
