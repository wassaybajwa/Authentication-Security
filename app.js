require('dotenv').config();
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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const usersWithSecrets = [];

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
    password: String,
    googleId: String,
    secret: String
});

//Step-6. Add plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

//Step-7
//Static authenticate 
passport.use(User.createStrategy());

//Step-8
//Cookie creation and destroy passport methods
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//----End of Steps---Cookies & Session
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
   
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){

    res.render("home");
})

app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
    


app.get("/login", function(req, res){

    res.render("login");
})

app.get("/secrets", function(req, res){

    User.findOne({"secret": {$ne: null}}, function(err, foundUsers){

        if(err){
            console.log(err);
        }else {
            if(foundUsers){
                console.log(foundUsers);
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
})

app.get("/register", function(req, res){

    res.render("register")
})

app.get("/logout", function(req, res){

    req.logout();
    res.redirect("/")
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
    
app.get("/submit", function(req, res){

    if(req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res){

    const submittedSecret = req.body.secret;

    console.log(req.user);
    User.findById(req.user.id, function(err, foundUser){

        if(err){
            console.log(err);
        }else {
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
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