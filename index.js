const express = require("express");
const app = express();
const PORT = 3001;
const mysql = require("mysql");

//DB connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "booking_system",
});

//Routes
app.get("/", (req, res) => {
  const insertQuery =
    "INSERT INTO tododata (todoname, todovalue) VALUES ('testtodo','test todo value')";

  db.query(insertQuery, (err, result) => {
    if (err) console.log(err);
    res.send("Addes to DB");
  });
});

app.listen(PORT, () => {
  console.log("Server started!");
});
