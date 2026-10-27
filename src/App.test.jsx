import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { installFakeFetch } from "./fakeServer";
import { getTodos, addTodo, updateTodo, replaceTodo, deleteTodo } from "./api";

let log;
beforeEach(() => { log = installFakeFetch(); });
afterEach(() => vi.restoreAllMocks());

describe("api.js functions", () => {
  test("GET returns 8 todos and uses ?_limit=8", async () => {
    const t = await getTodos();
    expect(t).toHaveLength(8);
    expect(log[0]).toMatchObject({ method: "GET" });
    expect(log[0].url).toContain("/todos?_limit=8");
  });
  test("POST sends JSON body + header and gets 201 item", async () => {
    const r = await addTodo("Learn APIs");
    expect(r).toMatchObject({ title: "Learn APIs", completed: false, userId: 1, id: 201 });
    expect(log[0].headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(log[0].body)).toEqual({ title: "Learn APIs", completed: false, userId: 1 });
  });
  test("PATCH sends only the changed field", async () => {
    const r = await updateTodo(2, { completed: true });
    expect(JSON.parse(log[0].body)).toEqual({ completed: true });
    expect(log[0].method).toBe("PATCH");
    expect(r.title).toBe("todo number 2");
  });
  test("PUT sends the whole todo", async () => {
    const todo = { id: 2, userId: 1, title: "New", completed: true };
    const r = await replaceTodo(2, todo);
    expect(log[0].method).toBe("PUT");
    expect(JSON.parse(log[0].body)).toEqual(todo);
    expect(r.title).toBe("New");
  });
  test("DELETE hits /todos/3", async () => {
    await deleteTodo(3);
    expect(log[0]).toMatchObject({ method: "DELETE" });
    expect(log[0].url).toMatch(/\/todos\/3$/);
  });
  test("ids above 200 skip the server", async () => {
    await updateTodo(999, { completed: true }); await replaceTodo(999, {}); await deleteTodo(999);
    expect(log).toHaveLength(0);
  });
  test("failed request throws", async () => {
    await expect(updateTodo(150, {}).then(() => fetch("https://x.test/nope"))).resolves.toBeTruthy();
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
    await expect(getTodos()).rejects.toThrow("Could not load to-dos");
  });
});

describe("App.jsx in the browser (jsdom)", () => {
  test("shows Loading, then 8 todos (GET)", async () => {
    render(<App />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(await screen.findAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("todo number 1")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();   // todo 1 completed
  });
  test("Add (POST) puts new todo on top and clears input", async () => {
    const user = userEvent.setup(); render(<App />);
    await screen.findAllByRole("listitem");
    await user.type(screen.getByPlaceholderText("What do you need to do?"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(9));
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Buy milk");
    expect(screen.getByPlaceholderText("What do you need to do?")).toHaveValue("");
    expect(log.some((l) => l.method === "POST")).toBe(true);
  });
  test("empty input does not call the server", async () => {
    const user = userEvent.setup(); render(<App />);
    await screen.findAllByRole("listitem"); const n = log.length;
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(log.length).toBe(n);
  });
  test("two added todos both work (unique keys, no duplicate warning)", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup(); render(<App />);
    await screen.findAllByRole("listitem");
    const box = screen.getByPlaceholderText("What do you need to do?");
    await user.type(box, "A"); await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(9));
    await new Promise((r) => setTimeout(r, 5));
    await user.type(box, "B"); await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(10));
    expect(err.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  });
  test("checkbox (PATCH) toggles and sends only completed", async () => {
    const user = userEvent.setup(); render(<App />);
    const items = await screen.findAllByRole("listitem");
    const cb = within(items[1]).getByRole("checkbox"); expect(cb).not.toBeChecked();
    await user.click(cb);
    await waitFor(() => expect(cb).toBeChecked());
    const p = log.find((l) => l.method === "PATCH");
    expect(JSON.parse(p.body)).toEqual({ completed: true });
    expect(within(items[1]).getByText("todo number 2")).toHaveClass("done");
  });
  test("Rename (PUT) updates title; cancel does nothing", async () => {
    const user = userEvent.setup(); render(<App />);
    const items = await screen.findAllByRole("listitem");
    vi.spyOn(window, "prompt").mockReturnValueOnce("Renamed!");
    await user.click(within(items[1]).getByRole("button", { name: "Rename" }));
    expect(await screen.findByText("Renamed!")).toBeInTheDocument();
    expect(log.find((l) => l.method === "PUT")).toBeTruthy();
    const before = log.length;
    vi.spyOn(window, "prompt").mockReturnValueOnce(null);
    await user.click(within(items[2]).getByRole("button", { name: "Rename" }));
    expect(log.length).toBe(before);
  });
  test("Delete (DELETE) removes the row", async () => {
    const user = userEvent.setup(); render(<App />);
    const items = await screen.findAllByRole("listitem");
    await user.click(within(items[0]).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByText("todo number 1")).not.toBeInTheDocument());
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(log.find((l) => l.method === "DELETE")).toBeTruthy();
  });
  test("locally added todo can be ticked, renamed, deleted without server", async () => {
    const user = userEvent.setup(); render(<App />);
    await screen.findAllByRole("listitem");
    await user.type(screen.getByPlaceholderText("What do you need to do?"), "Mine");
    await user.click(screen.getByRole("button", { name: "Add" }));
    const row = (await screen.findByText("Mine")).closest("li");
    await user.click(within(row).getByRole("checkbox"));
    await waitFor(() => expect(within(row).getByRole("checkbox")).toBeChecked());
    vi.spyOn(window, "prompt").mockReturnValueOnce("Mine2");
    await user.click(within(row).getByRole("button", { name: "Rename" }));
    expect(await screen.findByText("Mine2")).toBeInTheDocument();
    await user.click(within(screen.getByText("Mine2").closest("li")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByText("Mine2")).not.toBeInTheDocument());
  });
  test("server failure shows an error message (not a crash)", async () => {
    render(<App />); await screen.findAllByRole("listitem");
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(await screen.findByText("Could not update the to-do")).toBeInTheDocument();
  });
  test("GET failure shows the error and no crash", async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
    render(<App />);
    expect(await screen.findByText("Could not load to-dos")).toBeInTheDocument();
  });
});
