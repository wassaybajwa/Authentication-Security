//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");


const app = express();

console.log(md5("m123456"));

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true}); 

const userSchema = {
    email: String,
    password: String
};

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){

    res.render("home");
})

app.get("/login", function(req, res){

    res.render("login");
})

app.get("/register", function(req, res){

    res.render("register");
})

app.post("/register", function(req, res){

    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err){

       if(err){
           res.render(err);
       }else {
           res.render("secrets");
       } 
    })
})

app.post("/login", function(req, res){

    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, function(err, foundUser){

        if(err){
            console.log(err);
        }else {
            if (foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    })
})






app.listen(3000, function(req, res){
    console.log("Server started on port 3000")
});