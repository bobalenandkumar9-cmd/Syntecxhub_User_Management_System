// Offline API test: swaps the Mongoose model for a tiny in-memory fake so the
// routes, auth middleware, roles and validation can be exercised without MongoDB.
process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

const path = require("path");
const assert = require("assert");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const store = [];
const query = (result) => {
    const q = Promise.resolve(result);
    q.select = () => q;
    q.sort = () => q;
    q.skip = () => q;
    q.limit = () => q;
    return q;
};
const matches = (u, f) =>
    Object.entries(f).every(([k, v]) =>
        v && v.$ne !== undefined ? String(u[k]) !== String(v.$ne) : String(u[k]) === String(v));

class FakeUser {
    constructor(d) {
        Object.assign(this, { _id: new mongoose.Types.ObjectId(), role: "user" }, d);
    }
    async save() {
        // mimic the real pre-save hook: hash only when the password was (re)set
        if (this.password !== this._hashed) {
            this.password = await bcrypt.hash(this.password, 10);
            this._hashed = this.password;
        }
        this._saved = true;
        if (!store.includes(this)) store.push(this);
        return this;
    }
    comparePassword(c) { return bcrypt.compare(c, this.password); }
    async deleteOne() { store.splice(store.indexOf(this), 1); }
    toJSON() { const { password, _hashed, _saved, ...rest } = this; return rest; }
    static async create(d) { return new FakeUser(d).save(); }
    static findOne(f) { return query(store.find((u) => matches(u, f)) || null); }
    static findById(id) { return query(store.find((u) => String(u._id) === String(id)) || null); }
    static find() {
        let rows = [...store], skip = 0, limit = Infinity;
        const q = {
            sort: () => q,
            skip: (n) => ((skip = n), q),
            limit: (n) => ((limit = n), q),
            then: (res, rej) => Promise.resolve(rows.slice(skip, skip + limit)).then(res, rej)
        };
        return q;
    }
    static countDocuments() { return Promise.resolve(store.length); }
}
const modelPath = require.resolve(path.join(__dirname, "../models/user"));
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: FakeUser };

const app = require("../app");

(async () => {
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;
    const call = async (method, url, body, token) => {
        const res = await fetch(base + url, {
            method,
            headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
            body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
        });
        return { status: res.status, body: await res.json() };
    };
    const check = (name, actual, expected) => {
        assert.strictEqual(actual, expected, `${name}: expected ${expected}, got ${actual}`);
        console.log(`  ✓ ${name}`);
    };

    let r;
    r = await call("POST", "/api/users", { name: "Alice", email: "Alice@Example.com", password: "secret1", role: "admin" });
    check("register -> 201", r.status, 201);
    check("register ignores role escalation", r.body.user.role, "user");
    check("register returns no password", "password" in r.body.user, false);
    const aliceToken = r.body.token, aliceId = r.body.user.id;

    r = await call("POST", "/api/users", { name: "Alice", email: "alice@example.com", password: "secret1" });
    check("duplicate email (case-insensitive) -> 409", r.status, 409);
    r = await call("POST", "/api/users", { name: "x", email: "bad", password: "secret1" });
    check("invalid email -> 400", r.status, 400);
    r = await call("POST", "/api/users", { name: "x", email: "x@y.com", password: "123" });
    check("short password -> 400", r.status, 400);
    r = await call("POST", "/api/users", "{bad json");
    check("malformed JSON -> 400", r.status, 400);
    r = await call("POST", "/api/users");
    check("empty body -> 400", r.status, 400);

    r = await call("POST", "/api/users/login", { email: "alice@example.com", password: "wrong" });
    check("wrong password -> 401", r.status, 401);
    r = await call("POST", "/api/users/login", { email: "nobody@example.com", password: "secret1" });
    check("unknown email -> 401", r.status, 401);
    r = await call("POST", "/api/users/login", { email: "ALICE@example.com", password: "secret1" });
    check("login -> 200", r.status, 200);
    check("login returns token", typeof r.body.token, "string");

    r = await call("GET", "/api/users/profile");
    check("profile without token -> 401", r.status, 401);
    r = await call("GET", "/api/users/profile", undefined, "garbage");
    check("profile bad token -> 401", r.status, 401);
    r = await call("GET", "/api/users/profile", undefined, aliceToken);
    check("profile -> 200", r.status, 200);

    r = await call("GET", "/api/users", undefined, aliceToken);
    check("list users as normal user -> 403", r.status, 403);

    r = await call("POST", "/api/users", { name: "Bob", email: "bob@example.com", password: "secret2" });
    const bobToken = r.body.token, bobId = r.body.user.id;
    r = await call("GET", `/api/users/${bobId}`, undefined, aliceToken);
    check("read someone else's account -> 403", r.status, 403);
    r = await call("GET", `/api/users/${aliceId}`, undefined, aliceToken);
    check("read own account -> 200", r.status, 200);
    r = await call("GET", "/api/users/not-an-id", undefined, aliceToken);
    check("invalid id -> 400", r.status, 400);

    r = await call("PUT", `/api/users/${aliceId}`, { name: "Alice B", role: "admin" }, aliceToken);
    check("self role-escalation -> 403", r.status, 403);
    r = await call("PUT", `/api/users/${aliceId}`, { name: "Alice B", password: "newpass1" }, aliceToken);
    check("self update -> 200", r.status, 200);
    check("name updated", r.body.user.name, "Alice B");
    r = await call("PUT", `/api/users/${aliceId}`, { email: "bob@example.com" }, aliceToken);
    check("update to taken email -> 409", r.status, 409);
    r = await call("POST", "/api/users/login", { email: "alice@example.com", password: "newpass1" });
    check("login with new password -> 200", r.status, 200);
    r = await call("POST", "/api/users/login", { email: "alice@example.com", password: "secret1" });
    check("old password rejected -> 401", r.status, 401);

    // Promote Alice to admin directly (what `npm run seed:admin` does)
    store.find((u) => String(u._id) === aliceId).role = "admin";
    r = await call("GET", "/api/users?limit=1", undefined, aliceToken);
    check("admin list -> 200", r.status, 200);
    check("pagination limit respected", r.body.users.length, 1);
    check("pagination total", r.body.total, 2);
    r = await call("PUT", `/api/users/${bobId}`, { role: "admin" }, aliceToken);
    check("admin changes role -> 200", r.status, 200);
    r = await call("PUT", `/api/users/${bobId}`, { role: "superuser" }, aliceToken);
    check("invalid role -> 400", r.status, 400);

    r = await call("DELETE", `/api/users/${bobId}`, undefined, aliceToken);
    check("admin delete -> 200", r.status, 200);
    r = await call("GET", `/api/users/${bobId}`, undefined, aliceToken);
    check("deleted user -> 404", r.status, 404);
    r = await call("GET", "/api/users/profile", undefined, bobToken);
    check("token of deleted user rejected -> 401", r.status, 401);

    r = await call("GET", "/nope");
    check("unknown route -> 404", r.status, 404);

    server.close();
    console.log("\nAll tests passed");
})().catch((e) => { console.error("\nFAILED:", e.message); process.exit(1); });
