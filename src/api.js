const BASE_URL = "https://jsonplaceholder.typicode.com/todos";

// GET: read the to-dos
export async function getTodos() {
  const res = await fetch(BASE_URL + "?_limit=8");
  if (!res.ok) throw new Error("Could not load to-dos");
  return res.json();
}

// POST: create a to-do
export async function addTodo(title) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title, completed: false, userId: 1 }),
  });
  if (!res.ok) throw new Error("Could not add the to-do");
  return res.json();
}

// PATCH: change only some fields
export async function updateTodo(id, changes) {
  if (id > 200) return changes;  // pretend server has only 200 items
  const res = await fetch(BASE_URL + "/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error("Could not update the to-do");
  return res.json();
}

// PUT: replace the whole to-do
export async function replaceTodo(id, todo) {
  if (id > 200) return todo;
  const res = await fetch(BASE_URL + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo),
  });
  if (!res.ok) throw new Error("Could not rename the to-do");
  return res.json();
}

// DELETE: remove a to-do
export async function deleteTodo(id) {
  if (id > 200) return;
  const res = await fetch(BASE_URL + "/" + id, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not delete the to-do");
}
