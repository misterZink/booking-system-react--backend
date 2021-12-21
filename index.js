const cors = require("cors");
const database = require("mariadb");
let express = require("express");
let session = require("express-session");
let bodyParser = require("body-parser");
const dotenv = require("dotenv");
const {encrypt, decrypt} = require("./encryptionHandler")


const tokenTool = require("./token")
dotenv.config();

const PORT = 3001;

const pool = database.createPool({
    host: "localhost",
    port: "3306", // 3306 or 3307.
    user: "root",
    password: "password",
    database: "bookingsystem",
});

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

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post("/registerCustomer", function (req, res) {
    const password = req.body.password
    const hashedPassword = encrypt(password);
    console.log(hashedPassword.iv)

    try {
        pool.getConnection()
            .then(conn => {

                conn.query("INSERT INTO customers(\
                company_name, \
                is_company, \
                personal_id_number, \
                first_name, \
                last_name, \
                phone_number, \
                password, \
                mail,\
                iv\
                )\
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                    req.body.companyName,
                    req.body.customerType,
                    req.body.socialID,
                    req.body.firstName,
                    req.body.lastName,
                    req.body.phoneNumber,
                    hashedPassword.password,
                    req.body.email,
                    hashedPassword.iv
                ])
                    .catch(err => {
                        console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
                        console.log(err);
                        console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

                        //conn.end();
                    })
                    .then((rows) => {
                        res.send(rows)

                    })
            })
    } catch (error) {
        console.log("ERROR")
    }

})

app.get("/getBookings", (req, res) => {
    console.log("GETBOOKINGS: ")
    const sqlSelect = "SELECT first_name, last_name, mail, adress, start_date_time, service_type, price, message, status, is_company, org_number FROM customers INNER JOIN bookings ON customers.customer_id=bookings.customer_id;"

    const sql = "SELECT * FROM customers;"

    pool.getConnection()
        .then(conn => {
            conn.query(sqlSelect)
                .then((rows) => {
                    console.log(rows);
                    res.send(rows)
                })
                .then((res) => {
                    console.log(res);
                    conn.end();
                })
                .catch(err => {
                    console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
                    console.log(err);
                    console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
                    conn.end();
                })

        }).catch(err => {
        });

})

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
                let token = tokenTool.generateToken(mail);
                let payload = tokenTool.verifyPayload(token); // data contained in token.
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

            } else {
                console.log("null username of password")
                response.send("Please type a username and password.")
            }

            // empty sensitive data
            mail = ""
            password = ""
        } catch (err) {
            response.send("There was an error while trying to log in!");
            throw err;
        }
        // empty sensitive data
        token = "";
        payload = "";
    } else {
        console.log("null username of password");
        response.send("Please type a username and password.");
    }
    // empty sensitive data
    mail = "";
    password = "";

});


app.delete("/deleteCustomer/:id", (req, res) => {
    const fullInfo = req.params.id.split(":")
    const email = fullInfo[0]
    const socialID = fullInfo[1]
    const password = fullInfo[2]
    console.log("|-")
    console.log(email)
    console.log(socialID)
    console.log(password)
    console.log("-|")
    

    //-------------------------------------------------------------------------------------------------------------
    try {
        pool.getConnection()
            .then(conn => {
                conn.query(`SELECT mail, personal_id_number, password, iv\
                            FROM customers\
                            WHERE mail = "${email}" AND personal_id_number = ${socialID}`)
                    .then((rows) => {
                        console.log("Encrypted password: " + rows[0].password)
                        const encryptedPassword = rows[0].password;
                        let decryptedPassword = decrypt({
                            password: rows[0].password,
                            iv: rows[0].iv
                        })
                        console.log("Decrypted password: " + decryptedPassword)

                        if(password === decryptedPassword){

                            pool.getConnection()
                            .then(conn => {
                                conn.query(`DELETE FROM customers WHERE mail = ?`,
                                email)
                            })

                            console.log(email)
                            console.log(socialID)
                            console.log(encryptedPassword)
                            console.log("HEJHEJ")
                        }
                        return rows
                    })
            })
    } catch (err) {
        console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
        console.log(err)
        console.log("--------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
    }
   

});



