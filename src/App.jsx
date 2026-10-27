import { useState, useEffect } from "react";
import { getTodos, addTodo, updateTodo, replaceTodo, deleteTodo } from "./api";
import "./App.css";

export default function App() {
  // This is the main list of tasks
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");

  // Load tasks when the app opens
  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Add a new task
  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const saved = await addTodo(text);
      setTodos([{ ...saved, id: Date.now() }, ...todos]);
      setText("");
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // Mark a task as done or not done
  async function handleToggle(todo) {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      setTodos(
        todos.map((t) =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Change task name
  async function handleRename(todo) {
    const newTitle = window.prompt("Edit task:", todo.title);
    if (!newTitle) return;

    try {
      const updated = { ...todo, title: newTitle };
      await replaceTodo(todo.id, updated);
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  // Remove task
  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="msg">Loading...</p>;

  return (
    <div className="app">
      <h1>Developer Task Planner</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleAdd} className="add-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you need to do?"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo)}
            />
            <span className={todo.completed ? "done" : ""}>{todo.title}</span>
            <div className="actions">
              <button onClick={() => handleRename(todo)}>Rename</button>
              <button className="delete-btn" onClick={() => handleDelete(todo.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
