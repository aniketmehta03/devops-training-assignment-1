import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Utility to get formatted date
const currentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month}`;
};

let items = [];

// Wrap everything in an async function to await table creation before starting server
(async () => {
  try {
    await db.connect();
    console.log("✅ Connected to PostgreSQL");

    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
      );
    `);
    console.log("✅ Ensured 'items' table exists");

    // Routes
    app.get("/", async (req, res) => {
      try {
        const result = await db.query("SELECT * FROM items ORDER BY id ASC");
        items = result.rows;

        res.render("index.ejs", {
          listTitle: currentDate() + " To-Do List",
          listItems: items,
        });
      } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).send("Error loading to-do list.");
      }
    });

    app.post("/add", async (req, res) => {
      const item = req.body.newItem;
      try {
        await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
        res.redirect("/");
      } catch (err) {
        console.error("Error adding item:", err);
        res.status(500).send("Error adding item.");
      }
    });

    app.post("/edit", async (req, res) => {
      const item = req.body.updatedItemTitle;
      const id = req.body.updatedItemId;

      try {
        await db.query("UPDATE items SET title = $1 WHERE id = $2", [item, id]);
        res.redirect("/");
      } catch (err) {
        console.error("Error editing item:", err);
        res.status(500).send("Error editing item.");
      }
    });

    app.post("/delete", async (req, res) => {
      const id = req.body.deleteItemId;
      try {
        await db.query("DELETE FROM items WHERE id = $1", [id]);
        res.redirect("/");
      } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).send("Error deleting item.");
      }
    });

    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error("❌ Failed to start app:", err);
  }
})();
