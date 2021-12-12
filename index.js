const PORT = 3001

const cors = require("cors")

let usingMariadb = false; // TODO: Remember to change this if using MySQL!

let database;
if (usingMariadb)
    database = require('mariadb')
else
    database = require('mysql')

let express = require('express')
let session = require('express-session')
let bodyParser = require('body-parser')
//const connection = require("mysql");

const pool = database.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'bookingsystem'
})

let app = express()
app.use(session({
    secret: 'secret',
    resave: 'true',
    saveUninitialized: true
}))

let corsOptions = {
    origin: "http://localhost:3000"
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

//Routes
/*app.get("/", (req, res) => {
    const sqlSelect = "SELECT * FROM  customers;"
    database.query(sqlSelect, (err, result) => {
        res.send(result)
    })
});*/

/*app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname + '/login.html'))
})*/

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

app.post('/login', async (request, response) => {
    //console.log(request.body);

    let username = request.body.mail
    let password = request.body.password

    if (username && password) {
        try {
            const connection = await pool.getConnection()
            const sql = "SELECT * FROM customers WHERE username = ? AND password = ?"
            const result = await connection.query(sql, [username, password])
            //console.log(result)

            if (result && result.length > 0) {
                console.log("*** Username + password exists in db ***")
                response.redirect("/loggedIn")
            } else {
                console.log("*** Username + password does NOT exist in db ***")
                response.send("Username or password does not exist!")
            }
        } catch (err) {
            response.send("There was an error while trying to log in!")
            response.end()
            throw err
        }
    } else {
        console.log("null username of password")
        response.send("Please type a username and password.")
        response.end()
    }

    // empty sensitive data
    username = ""
    password = ""
})

/*async function checkUserExistInDatabase(username, password) {
    let connection
    let userExists = false
    try {
        connection = await pool.getConnection(); // Grab idle connection or create new connection if all are being used already.
        const response = await connection.query("SELECT * FROM customers WHERE username = ? AND password = ?", [username, password])
        //console.log(res)
        if (response && response.length) {
            console.log("*** USER EXISTS! ***")
            // do something
            userExists = true
        }
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log("Connection closed.")
        }
    }

    // empty sensitive data
    username = ""
    password = ""

    return userExists
}*/

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
