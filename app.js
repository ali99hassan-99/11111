const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      User = require("./models/user"),
      Mens = require("./models/mens"),
      Receipt = require("./models/receipt"),
      // Admin = require("./models/admin"),
      Customizedclothing = require("./models/clothes"),
      mongoose = require("mongoose"),
      passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      session = require("express-session"), 
      passportLocalMongoose = require("passport-local-mongoose"),
      nodemailer = require("nodemailer"),
      flash = require("connect-flash");
      

//Connecting to database
mongoose.connect("mongodb://localhost:27017/project1", {useNewUrlParser: true,useUnifiedTopology: true});

//APP CONFIG
app.set("view engine", "ejs");    //To search ejs extension files
app.use(bodyParser.urlencoded({ extended: true }));   //To transfer data to one templete to another
app.use(express.static(__dirname));   //To Use Local Files
// app.use(
//         require("express-session")({
//         secret: "This can be anything",
//         resave: false,
//         saveUninitialized: false,
//   })
// );
app.use(flash())
app.use(session({ 
  secret:'secret', 
  saveUninitialized: false, 
  resave: false
})); 
app.use(passport.initialize());
app.use(passport.session());

//To Signin, Signup and Signout Buttons on Navbar
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//AUTHENTICATE CONFIG
// passport.use(new LocalStrategy(User.authenticate()));





// passport.use(new LocalStrategy({ 
//   passReqToCallback : true
// },
//   function(username, password, authCheckDone) {
//     User.findOne({ username: username }, function(err, user) {
//       if (err) { return authCheckDone(err); }
//       if (!user) {
//         return authCheckDone(null, false, { message: 'Incorrect username.' });
//       }
//       if (!user.password!==password) {
//         return authCheckDone(null, false, { message: 'Incorrect password.' });
//       }
//       return authCheckDone(null, user);
//     });
//   }
// ));


passport.use(new LocalStrategy(
    function(username, password, authCheckDone) {
      User.findOne({ username: username }, function(err, user) {
        if (err) { return authCheckDone(err); }
        if (!user) {
          return authCheckDone(null, false, { message: 'Incorrect username.' });
        }
        if (!user.password!==password) {
          return authCheckDone(null, false, { message: 'Incorrect password.' });
        }
        return authCheckDone(null, user);
      });
    }
  ));


passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    done(null, {id})
});


//MAIL CONFIG (It will use later while sending mail).
var transporter = nodemailer.createTransport({
  service: "gmail",
  requireTLS:true,
  auth: {
    user: "clothes4youclothing@gmail.com",
    pass: "rvlgkdapdzbfvnmd",
  },
  connectionTimeout: 5 * 60 * 1000,
});

// ========================
//ROUTES CONFIG
// ========================
app.get("/", function (req, res) {
  res.redirect("home");
});

app.get("/home", function (req, res) {
  Mens.find({}, function (err, allProduct) {
    if (err) {
      console.log("Something Went Wrong");
    } else {
      res.render("home", { Mens: allProduct });
    }
  });
});

app.get("/home/:id", isLoggedIn, function (req, res) {
  Mens.findById(req.params.id, function (err, foundId) {
    if (err) {
      console.log(err);
    } else {
      res.render("details", { Mens: foundId });
    }
  });
});

app.post("/home/:id", isLoggedIn, function (req, res) {
  var data = {
    quantity: req.body.quantity,
    size: req.body.size,
    address: req.body.address,
  };
  Receipt.create(data, function (err, productReceipt) {
    if (err) {
      console.log(err);
      return res.render("/home/:id");
    }
    Mens.findById(req.params.id, function (err, foundId) {
      var mailOptions = {
        from: "clothes4youclothing@gmail.com",
        to: req.user.username,
        subject: "Order Received",
        html:
          "<h4>We have received your order for following product</h4><p>" +
          foundId.head +
          "</P><P><img src=" +
          foundId.url +
          "></p><p>Size: " +
          foundId.size +
          "</p><p>Bill amount:" +
          foundId.price +
          "</p><p>Your order will be delivered in 5 working days at '" +
          req.body.address +
          "'' this address</p><p>Thank you for shopping with us.</p>",
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    });
    console.log("Order request received...");
    res.redirect("/home");
  });
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/aboutus", function (req, res) {
  res.render("aboutus");
});


// ========================
//SIGNUP CONFIG
// ========================
app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signup", function (req, res) {
  User.register(
    new User({ username: req.body.username, name: req.body.name }),
    req.body.password,
    function (err, user) {
      if (err) {
        alert("Something went wrong! Please try agian");
        console.log(err);
        return res.render("signup");
      }
      passport.authenticate("local")(req, res, function () {
        var mailOptions = {
          from: "clothes4youclothing@gmail.com",
          to: req.body.username,
          subject: "You Have Successfully Signup on Clothes 4 You...",
          html:
            "<h1>WELCOME TO THE CLOTHES 4 YOU SHOPPING SITE</h1><p>Hey " +
            req.body.name +
            " you have successfully registered on <b>CLOTHES 4 YOU</b> online shopping site.</p>",
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
        console.log("User Data Saved Successfully...");
        res.redirect("/home");
      });
    }
  );
});

// ========================
//SIGNIN CONFIG
// ========================
app.get("/signin", function (req, res) {
  const errors = req.flash.error || [];
  res.render("signin",{errors});
});

app.post("/signin",passport.authenticate("local", {   //Second Argument is Middleware
    successRedirect: "/",
    failureRedirect: "/signin",
    failureFlash: true
    })
);

const ensureAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/signin");
}

// app.post("/signin", passport.authenticate("local",{
//   failureFlash: true,
//   failureRedirect: "/signin", 
// }) ,function(req, res){
//       return res.redirect("/");
// });


// app.post('/signin', function(req,res,next){
//   passport.authenticate('local', function(err, user) {
//       if (err) { return next(err); }
//       if (!user) { return res.redirect('/')}
//       req.logIn(user, function(err) {
//           if (err) { return next(err); } 
//               //arenderFunction(req,res);
//           });
//       })
//   (req, res, next);
//   });


// app.post('/signin', (req, res) => {
//   if (req.body.username == '' || req.body.password == '') {
//       res.status(401).send({ error: "Wrong username or password" });
//   } else {
//       queries.login(req.body.username, req.body.password)
//           .tryc((user) => {
//               res.json(auth.getToken(user.id, user.username));
//           });
//           .catch((error) => {
//               res.status(401).send({ error: 'Wrong username or password' });
//           });
//   }
// });


// ========================
//ADMIN SIGNUP CONFIG
// ========================

// app.get("/adminsignup", function(req, res){
//    res.render("adminsignup");
// });

// app.post("/adminsignup", function(req, res){
// 	User.register(new User({username:req.body.username, name:req.body.name}), req.body.password, function(err, user){
// 		if(err){
// 			console.log(err);
//             return res.render("adminsignup");
//         }

// 		console.log("Admin data Saved Successfully...");
// 		res.redirect("/addclothesform");
// 	});
// });

// // ========================
// //ADMIN SIGNIN CONFIG
// // ========================
// app.get("/adminsignin", function(req, res){
// 	res.render("adminsignin");
// });

// app.post("/adminsignin", passport.authenticate("local", {    //Second Argument is Middleware
//     successRedirect: "/addclothesform",
//     failureRedirect: "/adminsignin"}),
//     function(req, res){
// });

// ========================
//ADDING CLOTHES CONFIG
// ========================
app.get("/addclothesform", function (req, res) {
  res.render("addclothesform");
});

app.post("/addclothesform", function (req, res) {
  var data = {
    username: req.body.username,
    head: req.body.head,
    name: req.body.name,
    disc: req.body.disc,
    url: req.body.url,
    price: req.body.price,
  };
  Mens.create(data, function (err, newproduct) {
    if (err) {
      console.log(err);
      return res.render("addclothesform");
    } else {
      console.log("New Product Data Saved Successfully");
      res.redirect("home");
    }
  });
});

app.get("/customizedclothing", isLoggedIn, function (req, res) {
  res.render("customizedclothing");
});

app.post("/customizedclothing", isLoggedIn, function (req, res) {
  var data = {
    garment: req.body.garment,
    size: req.body.size,
    clothe: req.body.clothe,
    addinfo: req.body.addinfo,
    address: req.body.address,
    user: req.user.username,
  };
  Customizedclothing.create(data, function (err, cust) {
    if (err) {
      console.log(err);
      return res.render("customizedclothing");
    }
    var mailOptions = {
      from: "clothes4youclothing@gmail.com",
      to: req.user.username,
      subject: "Request received for Customized Clothing",
      html:
        "<h3>We have received your request for Customized Clothing</h3><p>Hey we have successfully registered your Customized Clothing request. Details are mentioned below:</p><p>Garment: " +
        req.body.garment +
        "</p><p>Size: " +
        req.body.size +
        "</p><p>Clothe: " +
        req.body.clothe +
        "</p><p>Additional information: " +
        req.body.addinfo +
        "</p><p>Address: " +
        req.body.address +
        "</p>",
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log("Customized Clothing Data Saved Successfully...");
    console.log(cust);
    res.redirect("/home");
  });
});

app.get("/signout", function (req, res) {
  req.logout();
  res.redirect("/home");
});



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

//SERVER CONFIG
app.listen(3000, function () {
  console.log("Server started at port 3000");
});
