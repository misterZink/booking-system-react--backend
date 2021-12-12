const express = require("express");
const app = express();
const PORT = 3001;
const cors = require("cors");
var mysql = require("mysql");
var corsOptions = {
	origin: "http://localhost:3000",
};

const database = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "password",
	database: "booking_system",
});

app.use(cors(corsOptions));

// If you don't parse the body of the request then undefined will be returned
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});

//Routes
app.get("/", (req, res) => {
	const sqlSelect = "SELECT * FROM  customers;";
	database.query(sqlSelect, (err, result) => {
		res.send(result);
	});
});

app.post("/bookcleaning", (req, res) => {
	const customerID = req.body.customerID;
	const startDateTime = req.body.startDateTime;
	const adress = req.body.adress;
	const serviceType = req.body.serviceType;
	const price = req.body.price;
	const message = req.body.message;

	const bookingQuery =
		"INSERT INTO `bookings` " +
		"(`customer_id`, `start_date_time`, `adress`, `service_type`, `price`, `message`) " +
		"VALUES (?, ?, ?, ?, ?, ?)";

	database.query(
		bookingQuery,
		[customerID, startDateTime, adress, serviceType, price, message],
		(err, result) => {
			if (err) {
				console.log(err);
				res.send("Fail");
			}
			res.send("Booking done!");
		}
	);
});

app.post("/bookCustomer", function (req, res) {
	console.log(req.body);
	let userName = req.body.firstName + "." + req.body.lastName;

	database.query(
		"INSERT INTO customers\
        (username, company_name, org_number, personal_id_number, first_name, last_name, phone_number)\
        VALUES(?, ?, ?, ?, ?, ?, ?)",
		[
			userName,
			req.body.Company,
			req.body.CompanyID,
			req.body.socialID,
			req.body.firstName,
			req.body.lastName,
			req.body.phoneNumber,
			req.body.email,
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

app.post("/registerCustomer", function (req, res) {
	console.log(req.body);
	let userName = req.body.firstName + "." + req.body.lastName;

	database.query(
		"INSERT INTO customers\
        (username, company_name, company_or_private, org_number, personal_id_number, first_name, last_name, phone_number, password)\
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
		[
			userName,
			req.body.Company,
			req.body.customerType,
			req.body.CompanyID,
			req.body.socialID,
			req.body.firstName,
			req.body.lastName,
			req.body.phoneNumber,
			req.body.password,
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
