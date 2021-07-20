//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
//This is very importent to follow steps for express.session
//make sure to keep things as follows
//Cookies & Session
//Step-1.
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();


app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

//Step-2.
//place express.session initiazing object before connections after app.set
app.use(session({ 
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

//Step-3.
//initializing passport
app.use(passport.initialize());

//Step-4
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true}); 
mongoose.set('useCreateIndex', true); //to get rid of deprecation warning, current mongoose V5.13.3
//Step-5
//Change mongoose Schema
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

//Step-6. Add plugin
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

//Step-7
//Static authenticate 
passport.use(User.createStrategy());

//Step-8
//Cookie creation and destroy passport methods
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//----End of Steps---Cookies & Session

app.get("/", function(req, res){

    res.render("home");
})

app.get("/login", function(req, res){

    res.render("login");
})

app.get("/secrets", function(req, res){

    if(req.isAuthenticated()){
        res.render("secrets");
    }else {
        re.redirect("/login");
    }
})

app.get("/register", function(req, res){

    res.render("register")
})

app.post("/register", function(req, res){
//Authenticate method
User.register({username: req.body.username}, req.body.password, function(err, user){

        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){

             res.redirect("/secrets");
        }) 
    }
})
})
    


app.post("/login", function(req, res){

   const user = new User({
       username: req.body.username,
       password: req.body.password
   });
   
   req.login(user, function(err){
       if(err){
           console.log(err);
       }else {
           passport.authenticate("local")(req, res, function(){
               res.redirect("secrets");
           })
       }
   })
})






app.listen(3000, function(req, res){
    console.log("Server started on port 3000")
});