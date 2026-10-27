// Fake JSONPlaceholder: 200 todos, writes are accepted but NOT saved, ids > 200 give 500 on PUT/PATCH/DELETE
export function installFakeFetch() {
  const log = [];
  const todos = Array.from({ length: 200 }, (_, i) => ({
    userId: Math.floor(i / 20) + 1, id: i + 1, title: "todo number " + (i + 1), completed: i % 3 === 0,
  }));
  globalThis.fetch = async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    const u = new URL(url);
    const m = u.pathname.match(/^\/todos(?:\/(\d+))?$/);
    log.push({ method, url: String(url), headers: opts.headers, body: opts.body });
    const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
    if (!m) return reply(404, {});
    const id = m[1] ? Number(m[1]) : null;
    if (method === "GET" && id === null) {
      const lim = Number(u.searchParams.get("_limit") || 200);
      return reply(200, todos.slice(0, lim));
    }
    if (method === "GET") return id <= 200 ? reply(200, todos[id - 1]) : reply(404, {});
    if (method === "POST") return reply(201, { ...JSON.parse(opts.body), id: 201 });
    if (id === null || id > 200) return reply(500, {});
    if (method === "PUT") return reply(200, { ...JSON.parse(opts.body), id });
    if (method === "PATCH") return reply(200, { ...todos[id - 1], ...JSON.parse(opts.body) });
    if (method === "DELETE") return reply(200, {});
    return reply(405, {});
  };
  return log;
}
