import { useState, useEffect } from "react";

function Todos() {
  const [todos, setTodos] = useState([]);       // memory for the data
  const [loading, setLoading] = useState(true); // are we waiting?
  const [error, setError] = useState(null);     // did it break?

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5");
        if (!res.ok) throw new Error("Failed: " + res.status);
        setTodos(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);   // empty [] = run only once, when the page opens

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Oops: {error}</p>;
  return <ul>{todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}

export default Todos;
