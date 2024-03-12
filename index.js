import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();
const API_URL = "https://covers.openlibrary.org/b/olid/";

const db = new pg.Client({
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DATABASE,
	password: process.env.PG_PASSWORD,
	port: process.env.PG_PORT,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

function getRecordMessage(DB) {
  let message = "";
  if(DB.rows.length == 1) {
    message = "There is one record in the website.";
  }
  else if(DB.rows.length == 0) {
    message = "No records to display.";
  }
  else {
    message = `There are ${DB.rows.length} records in the website.`;
  }
  return message;
};

app.get("/", async (req, res) => {
  try {
    const allRecords = await db.query("SELECT * FROM books");
    const message = getRecordMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
    });
  }
  catch(err) {
    res.send(err);
  }
});

app.get("/date-sorted", async (req, res) => {
  try {
    const allRecords = await db.query("SELECT * FROM books ORDER BY entry_date DESC");
    const message = getRecordMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
    })
  }
  catch (err) {
    res.send(err);
  }
});

app.get("/rating-sorted", async (req, res) => {
  try {
    const allRecords = await db.query("SELECT * FROM books ORDER BY rating DESC");
    const message = getRecordMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
    })
  }
  catch (err) {
    res.send(err);
  }
});

app.get("/title-sorted", async (req, res) => {
  try {
    const allRecords = await db.query("SELECT * FROM books ORDER BY title");
    const message = getRecordMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
    })
  }
  catch (err) {
    res.send(err);
  }
});

app.get("/create", async (req, res) => {
  res.render("partials/create.ejs");
});

app.post("/edit-review", async (req, res) => {
  try {
    const id = req.body.idValue;
    const chosenRecord = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    res.render("partials/edit.ejs", {
      record: chosenRecord.rows[0],
    });
  }
  catch (err) {
    res.send(err);
  }
})

app.post("/view", async (req, res) => {
  try {
    const chosenID = req.body.viewButton;
    const chosenRecord = await db.query("SELECT * FROM books WHERE id = $1", [chosenID]);
    const formattedDate = await db.query("SELECT TO_CHAR($1::DATE, 'YYYY-MM-DD')", [chosenRecord.rows[0].entry_date]);
    res.render("partials/view.ejs", {
      record: chosenRecord.rows[0],
      // Formatted as "YYYY/MM/DD"
      date: formattedDate.rows[0].to_char,
      id: chosenID
    });
  }
  catch(err) {
    res.send(err);
  }
});

app.post("/add", async (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const category = req.body.category;
  const notes = req.body.notes;
  const rating = req.body.rating;
  // typeof keywords: string
  const keywords = req.body.keywordArray;

  let olid = req.body.olid;
  let imgURL = "";

  if(olid !== "") {
    try {
      const APIresult = await axios.get(API_URL + olid + "-M.jpg?default=false");
      imgURL = APIresult.config.url;
    }
    catch(err) {
      imgURL = "./images/blank.jpg";
      olid = null;
    }
  }
  else {
    imgURL = "./images/blank.jpg";
    olid = null;
  }
  
  try {
    const formattedDate = await db.query("SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')");
    await db.query(
      `INSERT INTO books (title, author, keywords, category, description, entry_date, rating, img_url, olid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [title, author, keywords, category, notes, formattedDate.rows[0].to_char, rating, imgURL, olid]
    );
    res.redirect("/");
  }
  catch(err) {
    res.send(err);
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.idValue;
  try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  }
  catch(err) {
    res.send(err);
  }
})

app.post("/edit", async (req, res) => {
  const id = req.body.idValue;
  const title = req.body.title;
  const author = req.body.author;
  const category = req.body.category;
  const notes = req.body.notes;
  const rating = req.body.rating;
  const keywords = req.body.keywordArray;
  let olid = req.body.olid;
  let imgURL = req.body.olid;

  if(olid !== "") {
    try {
      const APIresult = await axios.get(API_URL + olid + "-M.jpg?default=false");
      imgURL = APIresult.config.url;
    }
    catch(err) {
      imgURL = "./images/blank.jpg";
      olid = null;
    }
  }
  else {
    imgURL = "./images/blank.jpg";
    olid = null;
  }

  try {
    await db.query(`UPDATE books SET title = $1, author = $2,
    keywords = $3, category = $4, description = $5, rating = $6, img_url = $7,
    olid = $8 WHERE id = $9`,
    [title, author, keywords, category, notes, rating, imgURL, olid, id]);
    res.redirect("/");
  }
  catch(err) {
    res.send(err);
  }
})

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});