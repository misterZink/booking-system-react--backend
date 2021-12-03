const express = require("express");
const app = express();
const PORT = 3001;

//Routes
app.get("/", (req, res) => {
  res.send("Welcome to serve !");
});

app.listen(PORT, () => {
  console.log("Server started!");
});
