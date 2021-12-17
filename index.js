const cors = require("cors");
const database = require("mariadb");
let express = require("express");
let session = require("express-session");
let bodyParser = require("body-parser");
let jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const PORT = 3001;

const pool = database.createPool({
    host: "localhost",
    port: "3307", // 3306 or 3307.
    user: "root",
    password: "password",
    database: "bookingsystem",
});

function generateToken(mail) {
    // HMAC SHA256
    const token = jwt.sign({mail: mail}, process.env.TOKEN_SECRET);
    console.log(`The token is: ${token}`);

    return token;
    //return jwt.sign(mail, process.env.TOKEN_SECRET, { expiresIn: '1800s' }, null);
}

function verifyPayload(token) {
    // HMAC SHA256
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(`The verified payload is: ${JSON.stringify(payload)}`); // iat: Issued AT: Unix time when created.

    return payload;
}

let app = express();
app.use(
    session({
        secret: "secret",
        resave: "true",
        saveUninitialized: true,
    })
);

let corsOptions = {
    origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Routes
app.get("/", (req, res) => {
    const sqlSelect = "SELECT * FROM  customers;";
    database.query(sqlSelect, (err, result) => {
        res.send(result);
    });
});

app.post("/customerbookings", async (req, res) => {
    const customerID = req.body.customerID;

    const getCustomerBookingsQuery =
        "SELECT * FROM `bookings` WHERE customer_id=?";

    const connection = await pool.getConnection();
    const result = await connection.query(getCustomerBookingsQuery, [customerID]);
    connection.end();
    res.send(result);
});

app.post("/getcustomer", async (req, res) => {
    const {customerID, customerEmail} = req.body;


    const connection = await pool.getConnection();
    if (customerID != null) {
        const getCustomerQuery = "SELECT * FROM `customers` WHERE customer_id=?"
        const result = await connection.query(getCustomerQuery, [customerID]);
        console.log("id: ", result);
        res.send(result)
    } else if (customerEmail != null) {
        const getCustomerQuery = "SELECT * FROM `customers` WHERE mail=?";
        const result = await connection.query(getCustomerQuery, [customerEmail]);
        console.log("mail: ", result);
        res.send(result);
    } else {
        res.send("Fail to get customer");
    }
    connection.end();
})

app.delete("/deletebooking/:id", async (req, res) => {
    const bookingID = req.params.id;

    const deleteBookingQuery =
        "DELETE FROM `bookings` WHERE `bookings`.`booking_id` = ?";
    const connection = await pool.getConnection();
    await connection.query(deleteBookingQuery, bookingID);
    connection.end();

    res.send("Deleted");
});

app.post("/bookcleaning", async (req, res) => {
    const {customerID, startDateTime, adress, serviceType, price, message} =
        req.body;
    const bookingQuery =
        "INSERT INTO `bookings` " +
        "(`customer_id`, `start_date_time`, `adress`, `service_type`, `price`, `message`) " +
        "VALUES (?, ?, ?, ?, ?, ?)";

    const connection = await pool.getConnection();
    const result = await connection.query(bookingQuery, [
        customerID,
        startDateTime,
        adress,
        serviceType,
        price,
        message,
    ]);

    if (result.affectedRows === 1) {
        console.log("*** Data was added ***");
        res.send("Success");
    } else {
        console.log("*** Error ***");
        res.send("Fail");
    }
});

app.post("/bookCustomer", function (req, res) {
    console.log(req.body);
    let userName = req.body.firstName + "." + req.body.lastName;

    pool.query(
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

    pool.query(
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

app.post("/login", async (request, response) => {
    console.log(request.body);
    let mail = request.body.mail,
        password = request.body.password;

    if (mail && password) {
        try {
            const connection = await pool.getConnection();
            const sql = "SELECT * FROM customers WHERE mail = ? AND password = ?";
            const result = await connection.query(sql, [mail, password]);

            const userExists = result && result.length > 0;
            if (userExists) {
                console.log("*** Username + password exists in db ***");
                let token = generateToken(mail);
                let payload = verifyPayload(token); // data contained in token.
                console.log(mail);
                console.log(payload.mail);

                const tokenAndPayloadExists = token && payload;
                if (tokenAndPayloadExists) {
                    const mailIsSame = mail === payload.mail;
                    if (mailIsSame) {
                        console.log("*** Payload is correct. ***");
                        response.send(token);
                    } else {
                        console.log("*** Payload data is not correct! ***");
                        response.send("There was an error with your token 2.");
                    }
                } else {
                    console.log("*** Token or payload is null ***");
                    response.send("There was an error with your token 1.");
                }

                // empty sensitive data
                token = "";
                payload = "";
            } else {
                console.log("*** Username + password does NOT exist in db ***");
                response.send("Username or password does not exist!");
            }
        } catch (err) {
            response.send("There was an error while trying to log in!");
            throw err;
        }
    } else {
        console.log("null username of password");
        response.send("Please type a username and password.");
    }

    // empty sensitive data
    mail = "";
    password = "";
});

app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;

    console.log(id);
    database.query("DELETE FROM customers WHERE mail = ?;", id, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted");
            res.send(result);
        }
    });
});

app.get("/getBookings", (req, res) => {
    const sqlSelect =
        "SELECT * FROM customers AS c\
      INNER JOIN bookings ON c.customer_id = bookings.customer_id;";

    database.query(sqlSelect, (err, result) => {
        res.send(result);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
