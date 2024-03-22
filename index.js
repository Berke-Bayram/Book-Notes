import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local';
import session from "express-session";
import flash from "connect-flash";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();
const API_URL = "https://covers.openlibrary.org/b/olid/";

// To ensure that correct reviews are sorted
var userChecks = false;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user.username;
  }
  next();
});

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

function getAllRecordsMessage(DB) {
  let message = "";
  if(DB.rows.length == 1) {
    message = "There is one reviews in the website.";
  }
  else if(DB.rows.length == 0) {
    message = "No reviews to display.";
  }
  else {
    message = `There are ${DB.rows.length} reviews in the website.`;
  }
  return message;
};

function getYourRecordsMessage(DB) {
  let message = "";
  if(DB.rows.length == 1) {
    message = "You have one review in the website.";
  }
  else if(DB.rows.length == 0) {
    message = "You have no reviews yet. Create one now!";
  }
  else {
    message = `You have ${DB.rows.length} reviews in the website.`;
  }
  return message;
};

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render('partials/login.ejs', { message: "Please login first."});
};

function urlHelper(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  }
  else {
    return next();
  }
};

app.get("/", async (req, res) => {
  try {
    const allRecords = await db.query("SELECT * FROM books");
    const message = getAllRecordsMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
      auth: req.isAuthenticated() ? true : false,
    });
  }
  catch(err) {
    console.error("Error: ", err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/create", checkAuth, async (req, res) => {
  res.render("partials/create.ejs");
});

app.get('/login', (req, res) => {
  const queryMessage = req.query.queryMessage;
  res.render("partials/login.ejs", {message: req.flash('error'), queryMessage: queryMessage});
});

app.get('/register', urlHelper, (req, res) => {
  const queryMessage = req.query.queryMessage;
  res.render("partials/register.ejs", {queryMessage: queryMessage});
});

app.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/'); 
    }
    res.redirect('/');
  });
});

app.get("/date-sorted", async (req, res) => {
  try {
    var allRecords;
    var message;
    if (userChecks === true) {
      allRecords = await db.query("SELECT * FROM books WHERE user_ = $1 ORDER BY entry_date DESC", [req.user.username]);
      message = getYourRecordsMessage(allRecords);
    } else {
      allRecords = await db.query("SELECT * FROM books ORDER BY entry_date DESC");
      message = getAllRecordsMessage(allRecords);
    }
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
      auth: req.isAuthenticated() ? true : false,
    })
  }
  catch (err) {
    res.status(500).send("Failed to sort reviews.");
  }
});

app.get("/rating-sorted", async (req, res) => {
  try {
    var allRecords;
    var message;
    if (userChecks === true) {
      allRecords = await db.query("SELECT * FROM books WHERE user_ = $1 ORDER BY rating DESC", [req.user.username]);
      message = getYourRecordsMessage(allRecords);
    } else {
      allRecords = await db.query("SELECT * FROM books ORDER BY rating DESC");
      message = getAllRecordsMessage(allRecords);
    }
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
      auth: req.isAuthenticated() ? true : false,
    })
  }
  catch (err) {
    res.status(500).send("Failed to sort reviews.");
  }
});

app.get("/title-sorted", async (req, res) => {
  try {
    var allRecords;
    var message;
    if (userChecks === true) {
      allRecords = await db.query("SELECT * FROM books WHERE user_ = $1 ORDER BY title", [req.user.username]);
      message = getYourRecordsMessage(allRecords);
    } else {
      allRecords = await db.query("SELECT * FROM books ORDER BY title");
      message = getAllRecordsMessage(allRecords);
    }
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
      auth: req.isAuthenticated() ? true : false,
    })
  }
  catch (err) {
    res.status(500).send("Failed to sort reviews.");
  }
});

app.get("/all-reviews", async (req, res) => {
  userChecks = false;
  res.redirect("/");
});

app.get("/your-reviews", checkAuth, async (req, res) => {
  userChecks = true;
  try {
    const allRecords = await db.query("SELECT * FROM books WHERE user_ = $1", [req.user.username]);
    const message = getYourRecordsMessage(allRecords);
    res.render("index.ejs", {
      message: message,
      allRecords: allRecords,
      auth: req.isAuthenticated() ? true : false,
    })
  }
  catch (err) {
    res.status(500).send("Failed to fetch the reviews of the user.");
  }
});

app.get("/alert", (req, res) => {
  res.send(`
    <script>
      alert("You cannot edit or delete this review.");
      window.location.href = "/";
    </script>
  `);
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true 
})
);

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const saltRounds = 10;

  if (password !== confirmPassword) {
    const message = "Passwords do not match.";
    return res.redirect("/register?queryMessage=" + encodeURIComponent(message));
  }
  
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (checkResult.rows.length > 0) {
      const message = "The username exists, you may login.";
      return res.redirect("/login?queryMessage=" + encodeURIComponent(message));
    } 
    
    else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } 
        else {
          const result = await db.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
            [username, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            if(err) {
              res.send(err);
            }
            else {
              res.redirect("/");
            }
          });
        }
      });
    }
  } 
  catch (err) {
    res.send(err);
  }
});

app.post("/edit-review", checkAuth, async (req, res) => {
  const user = req.user.username;
  const id = req.body.idValue;

  try {
    const chosenRecord = await db.query(`SELECT * FROM books WHERE id = $1`, [id]);
    if (chosenRecord.rows.length > 0 && chosenRecord.rows[0].user_ !== user) {
      return res.redirect("/alert");
    }
    res.render("partials/edit.ejs", {
      record: chosenRecord.rows[0],
    });
  }
  catch (err) {
    console.error("Error: ", err);
    res.status(500).send("Something went wrong.");
  }
});

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

async function getImageUrl(olid) {
  try {
    const APIresult = await axios.get(API_URL + olid + "-M.jpg?default=false");
    return APIresult.config.url;
  }
  catch (err) {
    console.error("Error fetching image", err);
    return "./images/blank.jpg";
  }
}

app.post("/add", checkAuth, async (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const category = req.body.category;
  const notes = req.body.notes;
  const rating = req.body.rating;
  // typeof keywords: string
  const keywords = req.body.keywordArray;
  const olid = req.body.olid;
  // username
  const user = req.user.username;
  const imgURL = olid ? await getImageUrl(olid) : "./images/blank.jpg";

  try {
    const formattedDate = await db.query("SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')");
    await db.query(
      `INSERT INTO books (title, author, keywords, category, description, entry_date, rating, img_url, olid, user_)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [title, author, keywords, category, notes, formattedDate.rows[0].to_char, rating, imgURL, olid, user]
    );
    res.redirect("/");
  }
  catch(err) {
    console.error("Error adding review: ", err);
    res.status(500).send("Failed to add review.");
  }
});

app.post("/delete", checkAuth, async (req, res) => {
  const user = req.user.username;
  const id = req.body.idValue;

  try {
    const record = await db.query(`SELECT * FROM books WHERE id = $1`, [id]);
    if (record.rows.length > 0 && record.rows[0].user_ !== user) {
      return res.redirect("/alert");
    }
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  }
  catch(err) {
    console.error("Error deleting review: ", err);
    res.status(500).send("Failed to delete review.");
  }
})

app.post("/edit", checkAuth, async (req, res) => {
  // username
  const user = req.user.username;
  const id = req.body.idValue;

  const title = req.body.title;
  const author = req.body.author;
  const category = req.body.category;
  const notes = req.body.notes;
  const rating = req.body.rating;

  // typeof keywords: string
  const keywords = req.body.keywordArray;
  const olid = req.body.olid;
  const imgURL = olid ? await getImageUrl(olid) : "./images/blank.jpg";

  try {
    await db.query(`UPDATE books SET title = $1, author = $2,
    keywords = $3, category = $4, description = $5, rating = $6, img_url = $7,
    olid = $8, user_= $9 WHERE id = $10`,
    [title, author, keywords, category, notes, rating, imgURL, olid, user, id]);
    res.redirect("/");
  }
  catch(err) {
    console.error("Error editing review: ", err);
    res.status(500).send("Failed to edit review.");
  }
})

passport.use(new LocalStrategy(async function(username, password, callback) {
  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      
      bcrypt.compare(password, storedPassword, (err, valid) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return callback(err);
        } 
        if (valid) {
          return callback(null, user);
        } 
        else {
          return callback(null, false, { message: 'Incorrect password' });
        }
      });
    } 
    else {
      return callback(null, false, { message: 'User not found' });
    }
  } 
  catch (err) {
    console.error("Error finding user:", err);
    return callback(err);
  }
}));

passport.serializeUser((user, callback) => {
  callback(null, user);
});

passport.deserializeUser((user, callback) => {
  callback(null, user);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});