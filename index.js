
const axios = require('axios');
const express = require("express");
const app = express();
const PORT = 3001;
const router = express.Router();
const bodyParser = require('body-parser');

const cors = require("cors");

var mysql = require('mysql');
const { response } = require('express');

const database = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "booking_system"
});

var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));
// If you don't parse the body of the request then undefined will be returned
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Routes
app.get("/", (req, res) => {
  const sqlSelect = "SELECT * FROM  customers;"
  database.query(sqlSelect, (err, result) => {
    res.send(result)
  })
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'booking_system'
})
connection.connect()

app.post('/bookCustomer', function (req, res) {
  console.log(req.body);
  let userName = req.body.firstName + "." + req.body.lastName
  
  database.query(
    "INSERT INTO customers\
    (username, company_name, org_number, personal_id_number, first_name, last_name, phone_number)\
    VALUES(?, ?, ?, ?, ?, ?, ?)", [
      userName,
      req.body.Company, 
      req.body.CompanyID, 
      req.body.socialID,
      req.body.firstName,
      req.body.lastName,
      req.body.phoneNumber,
      req.body.email
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

app.post('/registerCustomer', function (req, res) {
  console.log(req.body);
  let userName = req.body.firstName + "." + req.body.lastName

  database.query(
    "INSERT INTO customers\
    (username, company_name, company_or_private, org_number, personal_id_number, first_name, last_name, phone_number, password)\
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      userName,
      req.body.Company, 
      req.body.customerType,
      req.body.CompanyID, 
      req.body.socialID,
      req.body.firstName,
      req.body.lastName,
      req.body.phoneNumber,
      req.body.password
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});
