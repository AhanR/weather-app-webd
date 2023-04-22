import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import http from 'http';
import sqlite3 from "sqlite3";

const router = express();

// mongoose.connect("mongodb://localhost/weather-app").then(()=>console.log("DB connected"));
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(':memory:');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());

router.get("/",(req, res, next)=> {
    console.log(req.cookies);
    if(req.cookies["email-user"]){
        // if cookie exists, check the db for the user
        db.get("SELECT * FROM users WHERE email = '"+req.cookies["email-user"]+"'",(err, row)=> {
            if(row===undefined) {
                // invalid user
                res.redirect("/login");
            }
        })
    } else {
        // else, ask them to sign up
        res.redirect("/login");
        return;
    }
    next();
});

router.get("/login", (req, res, next)=> res.sendFile("public/news.html", {root: process.cwd() }));

router.post("/login", async (req, res, next) => {
    if(req.body.firstName, req.body.lastName, req.body.email, req.body.password) {
        // check for user in table, if not add user to table
        db.get("SELECT * FROM users WHERE email = '"+req.body.email+"'", (err,row)=>{
            if(err) {
                // some error has occured, exit the function
                res.redirect("/login");
                console.log("error has occured", err);
                return;
            } else if (row === undefined){
                // user not found, register user
                db.run("INSERT INTO users VALUES ( '"+req.body.firstName+"', '"+req.body.lastName+"', '"+req.body.email+"', '"+req.body.password+"' )", (err)=>{
                    if(err) {
                        // re register user if registration failed
                        res.redirect("/login");
                        console.log("user registration failed");
                        return;
                    } else {
                        // log the user in and add 1 hour cookie
                        res
                            .cookie("email-user", req.body.email)
                            .redirect("/index2.html");
                        console.log("user has been registered");
                        // return;
                    }
                });
            } else if (req.body.password === row.password) {
                // go to next page
                res.cookie('email-user', req.body.email, {expire: 3600000 + Date.now()}).sendFile("public/index2.html", { root:  process.cwd()});
                return;
            }
            else {
                res.redirect("/login");
            }
        })
    }
    else
    res.sendFile("public/news.html", {root: process.cwd() });
})

router.use(express.static(process.cwd()+'/public'));

http.createServer(router).listen(3000, ()=> {
    console.log("Server ready...");
    db.exec("CREATE TABLE users ( first_name varchar(40), last_name varchar(40), email varchar(40) PRIMARY KEY, password varchar(40) NOT NULL )", (err) => err && console.log(err));
})