import { render, screen } from "@testing-library/react";
import { useState, useEffect } from "react";
import React from "react";
import { installFakeFetch } from "./fakeServer";
import fs from "node:fs";
const blocks = JSON.parse(fs.readFileSync("../blocks.json", "utf8"));
const get = (start) => blocks.find((b) => b.includes(start));
let log; beforeEach(() => { log = installFakeFetch(); });

test("fetch basics snippet", async () => {
  const src = get('const response = await fetch(');
  const out = []; const console2 = { log: (x) => out.push(x) };
  await new Function("fetch", "console", "return (async()=>{" + src + "})()")(globalThis.fetch, console2);
  expect(out[0]).toMatchObject({ id: 1, title: "todo number 1" });
});
test("POST snippet", async () => {
  const src = get("async function addTodo(title)"); const out = [];
  await new Function("fetch", "console", src + "; return addTodo('Hi');")(globalThis.fetch, { log: (x) => out.push(x) });
  expect(out[0]).toMatchObject({ title: "Hi", id: 201 });
});
test("PUT snippet", async () => {
  const src = get("async function replaceTodo(id)"); const out = [];
  await new Function("fetch", "console", src + "; return replaceTodo(5);")(globalThis.fetch, { log: (x) => out.push(x) });
  expect(out[0]).toMatchObject({ id: 5, title: "New title", completed: true });
});
test("PATCH snippet", async () => {
  const src = get("async function markDone(id)"); const out = [];
  await new Function("fetch", "console", src + "; return markDone(5);")(globalThis.fetch, { log: (x) => out.push(x) });
  expect(out[0]).toMatchObject({ id: 5, completed: true, title: "todo number 5" });
});
test("DELETE snippet", async () => {
  const src = get("async function deleteTodo(id)"); let saved = null;
  const todos = [{ id: 1 }, { id: 2 }, { id: 3 }];
  await new Function("fetch", "todos", "setTodos", src + "; return deleteTodo(2);")(globalThis.fetch, todos, (v) => (saved = v));
  expect(saved).toEqual([{ id: 1 }, { id: 3 }]);
});
test("headers snippet sends Authorization", async () => {
  const src = get('fetch("https://api.example.com/profile"');
  globalThis.fetch = async (u, o) => { globalThis.__h = o.headers; return {}; };
  new Function("fetch", "token", src)(globalThis.fetch, "abc123");
  expect(globalThis.__h.Authorization).toBe("Bearer abc123");
});
test("GET component snippet renders list", async () => {
  const { default: Todos } = await import("./Todos.jsx");
  render(React.createElement(Todos));
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(await screen.findAllByRole("listitem")).toHaveLength(5);
});
