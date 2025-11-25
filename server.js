import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type"],
  })
);

// ---- MySQL connection ----
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "langbuddy",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err.message);
  } else {
    console.log("✅ MySQL connected");
  }
});

// ---- Helpers ----
const ok = (res, data) => res.json({ success: true, ...data });
const fail = (res, error) => res.json({ success: false, error });

// ---- Health check ----
app.get("/", (_req, res) => {
  res.send("✅ Language Buddy Backend is Running");
});

// ===========================
// AUTH: SIGNUP + LOGIN
// ===========================

// POST /api/signup  { username, password, language }
app.post("/api/signup", async (req, res) => {
  console.log("SIGNUP API HIT");   // ✅ Debug point

  const { username, password, language } = req.body;

  if (!username || !password || !language) {
    return res.json({ success: false, error: "Missing fields" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (username, password, language, xp, hearts, streak, unit, lesson, last_day)
       VALUES (?, ?, ?, 0, 5, 0, 0, 0, CURDATE())`,
      [username, hashed, language],
      (err, result) => {

        if (err) {
          console.log("❌ MYSQL ERROR:", err);   // ✅ PRINT FULL ERROR
          return res.json({ success: false, error: "Unable to create user" });
        }

        console.log("✅ User created:", result);
        res.json({ success: true });
      }
    );
  } catch (err) {
    console.log("❌ HASH ERROR:", err);
    return res.json({ success: false, error: "Password hashing error" });
  }
});


// POST /api/login  { username, password }
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return fail(res, "username and password required");

  db.query(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, rows) => {
      if (err) return fail(res, "DB error");
      if (!rows.length) return fail(res, "User not found");

      const user = rows[0];
      try {
        const match = await bcrypt.compare(password, user.password || "");
        if (!match) return fail(res, "Wrong password");
        ok(res, { user });
      } catch {
        fail(res, "Auth error");
      }
    }
  );
});
//========================
// post/api/lesson/
//========================
app.post("/api/update-progress", (req, res) => {
  const { username, xp, hearts } = req.body;

  db.query(
    "UPDATE users SET xp=?, hearts=? WHERE username=?",
    [xp, hearts, username],
    (err) => {
      if (err) return res.json({ success: false, error: "DB update failed" });

      res.json({ success: true });
    }
  );
});


// ===========================
// USER PROGRESS UPDATE
// ===========================
// POST /api/update  { id, xp, hearts, unit, lesson, streak }

app.post("/api/update", (req, res) => {
  const { id, xp, hearts, unit, lesson, streak, language } = req.body;
  if (!id) return fail(res, "id required");

  db.query(
    `UPDATE users
       SET 
         xp = COALESCE(?, xp),
         hearts = COALESCE(?, hearts),
         unit = COALESCE(?, unit),
         lesson = COALESCE(?, lesson),
         streak = COALESCE(?, streak),
         language = COALESCE(?, language),
         last_day = CURDATE()
     WHERE id = ?`,
    [xp, hearts, unit, lesson, streak, language, id],
    (err) => {
      if (err) return fail(res, "DB update error");
      ok(res, { message: "updated" });
    }
  );
});


// ===========================
// NOTEBOOK
// ===========================
// POST /api/notebook/add  { user_id, en, tr }
app.post("/api/notebook/add", (req, res) => {
  const { user_id, en, tr } = req.body;
  if (!user_id || !en || !tr) return fail(res, "user_id, en, tr required");

  db.query(
    "INSERT INTO notebook (user_id, en_text, tr_text) VALUES (?, ?, ?)",
    [user_id, en, tr],
    (err) => {
      if (err) return fail(res, "DB insert error");
      ok(res, { message: "saved" });
    }
  );
});

// GET /api/notebook/:id
app.get("/api/notebook/:id", (req, res) => {
  db.query(
    "SELECT id, en_text, tr_text FROM notebook WHERE user_id=? ORDER BY id DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return fail(res, "DB fetch error");
      ok(res, { items: rows });
    }
  );
});

// DELETE /api/notebook/delete/:noteId
app.delete("/api/notebook/delete/:noteId", (req, res) => {
  const noteId = req.params.noteId;
  db.query("DELETE FROM notebook WHERE id=?", [noteId], (err, result) => {
    if (err) return fail(res, "DB delete error");
    if (result.affectedRows === 0) return fail(res, "Note not found");
    ok(res, { message: "deleted" });
  });
});

// ===========================
// MISTAKES
// ===========================
// POST /api/mistake  { user_id, en, tr }
app.post("/api/mistake", (req, res) => {
  const { user_id, en, tr } = req.body;
  if (!user_id || !en || !tr) return fail(res, "user_id, en, tr required");

  db.query(
    "INSERT INTO mistakes (user_id, en_text, tr_text) VALUES (?, ?, ?)",
    [user_id, en, tr],
    (err) => {
      if (err) return fail(res, "DB insert error");
      ok(res, { message: "logged" });
    }
  );
});

// GET /api/mistakes/:id
app.get("/api/mistakes/:id", (req, res) => {
  db.query(
    "SELECT id, en_text, tr_text, time FROM mistakes WHERE user_id=? ORDER BY time DESC",
    [req.params.id],
    (err, rows) => {
      if (err) return fail(res, "DB fetch error");
      ok(res, { items: rows });
    }
  );
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log("✅ Server file loaded");
  console.log("✅ Server running on port " + PORT);
});
