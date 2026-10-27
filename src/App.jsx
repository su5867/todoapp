import { useState, useEffect } from "react";
import { getTodos, addTodo, updateTodo, replaceTodo, deleteTodo } from "./api";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  // GET: runs once when the page opens
  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  // POST: add a new to-do
  async function handleAdd(e) {
    e.preventDefault();                 // stop the page from reloading
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
  // PATCH: tick or untick
  async function handleToggle(todo) {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      setTodos(todos.map((t) =>
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      setError(err.message);
    }
  }
  // PUT: rename
  async function handleRename(todo) {
    const title = window.prompt("New title:", todo.title);
    if (!title) return;
    try {
      const newTodo = { ...todo, title: title };
      await replaceTodo(todo.id, newTodo);
      setTodos(todos.map((t) => (t.id === todo.id ? newTodo : t)));
    } catch (err) {
      setError(err.message);
    }
  }
  // DELETE: remove
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
      <h1>My To-Do App</h1>
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
            <button onClick={() => handleRename(todo)}>Rename</button>
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
