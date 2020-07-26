const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/LibraryDB" , { useUnifiedTopology: true, useNewUrlParser: true});

var isloggedin = false;
var Rstatus = "hidden";
var Lstatus = "hidden";
var ResetPass = "hidden";
var Bstatus = "hidden";
var mess = "";
var mess1 = "";
var namme = "";
var mess2 = "";

const userSchema = mongoose.Schema({
    email:String,
    name:String,
    password:String,
    admin:Number
});
 
const User = mongoose.model("User",userSchema);

const bookSchema = mongoose.Schema({
    title:String,
    price:String,
    author:String,
    genre:String,
    release_date:Date,
    publication:String
});
 
const Book = mongoose.model("Book",bookSchema);

app.get("/" , function(req,res)
{
    res.render("home");
    User.findOne({name:"Admin"} , function(err,found)
    {
        if(!found)
        {
            const user = new User({
                name:"Admin",
                email:"admin@gmail.com",
                password:md5("789654"),
                admin:1
            })
            user.save(function(err)
            {
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    namme = "Admin";
                    isloggedin=true;
                }
            });
        }
    })
})

app.get("/login" , function(req,res)
{
    res.render("login" , {status:Lstatus ,message:mess});
})

app.get("/register" , function(req,res)
{
    res.render("register" , {status:Rstatus});
})

app.get("/addData" , function(req,res)
{
    Bstatus="hidden";
    mess2="";
    res.render("addData" , {status:Bstatus , message:mess2});
})

app.get("/logout" , function(req,res)
{
    ResetPass="hidden";
    Rstatus="hidden";
    Lstatus="hidden";
    mess="";
    mess1="";
    mess2="";
    isloggedin=false;
    res.redirect("/");
})

app.post("/login" , function(req,res)
{
    const email = req.body.email;
    const password = md5(req.body.password);

    User.findOne({email:email},function(err,foundUser){
        if(err)
        {
            console.log(err);
        }
        else
        {
            if(foundUser)
            {
                if(foundUser.password===password)
                {
                    namme = (foundUser.name);
                    isloggedin=true;
                    res.redirect("/home");
                }
                else
                {
                    Lstatus="visible";
                    mess="Incorrect Password";
                    res.render("login" , {status:Lstatus , message:mess});
                }
            }
            else
            {
                mess="Email ID not regsistered";
                Lstatus="visible";
                res.render("login" , {status:Lstatus ,message:mess});
            }
        }
    });
})

app.post("/register" , function(req,res)
{
    const mail = req.body.email;
    User.findOne({email:mail} , function(err,found)
    {
        if(found)
        {
            Rstatus="visible";
            res.render("register" , {status:Rstatus});
        }
        else
        {
            const user = new User({
                name:req.body.username,
                email:req.body.email,
                password:md5(req.body.password),
                admin:0
            })
            user.save(function(err)
            {
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    namme = (req.body.username);
                    isloggedin=true;
                    res.redirect("/home");
                }
            });
        }
    });
});

app.post("/updatePassword" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    const pass = req.body.password;
    const newPass = req.body.Newpass;
    User.findOne({name:namme} , function(err,foundUser)
    {
        if(foundUser)
        {
            if(foundUser.password===md5(pass))
            {
                User.updateOne({name:namme} , {password:md5(newPass)} , function(err)
                {
                    if(err)
                    {
                        console.log(err)
                    }
                    mess1="Password Changed Succesfully";
                    ResetPass="visible";
                    res.render("updatePassword" , {status:ResetPass , message:mess1});
                });
            }
            else
            {
                ResetPass="visible";
                mess1="Incorrect Current Password";
                res.render("updatePassword" , {status:ResetPass , message:mess1});
            }
        };
    });
})

app.get("/updatePassword" , function(req,res)
{
    if(!isloggedin==true)
    {
        res.redirect("/");
    }
    res.render("updatePassword" , {status:ResetPass , message:mess1});
});

app.get("/home" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    User.findOne({name:namme} , function(err,found)
    {
        if(found)
        {
            if(found.admin===1)
            {
                Book.find({} , function(err,foundBooks)
                {
                    res.render("main" , {name:namme , status:1 , books:foundBooks});
                });
            }
            else
            {
                Book.find({} , function(err,foundBooks)
                {
                    res.render("main" , {name:namme , status:0 , books:foundBooks});
                });
            }
        }
    })
})

app.get("/admin" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    
    User.findOne({name:namme} , function(err,found)
    {
        if(found)
        {
            if(found.admin===1)
            {
                User.find({} , function(err,foundItems)
                {
                    res.render("adminPage" , {items:foundItems});
                });
            }
            else
            {
                res.redirect("/home");
            }
        };
    });
});

app.get("/delUser/:id" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    User.findOne({_id:req.params.id} , function(err,found)
    {
        if(found)
        {
            User.deleteOne({_id:req.params.id} , function(err){});
            res.redirect("/admin");
        }
    });
    Book.findOne({_id:req.params.id} , function(err,found){
        if(found)
        {
            Book.deleteOne({_id:req.params.id} , function(err){});
            res.redirect("/home");
        }
    });
})

app.get("/adminAccess/:id" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    User.findOne({_id:req.params.id} , function(err,found)
    {
        if(found)
        {
            if(found.admin===1)
            {
                User.updateOne({_id:req.params.id} , {admin:0} , function(err){});
            }
            else
            {
                User.updateOne({_id:req.params.id} , {admin:1} , function(err){});
            }
        };
    });
    res.redirect("/admin");
});

app.post("/addData" , function(req,res)
{
    if(!isloggedin)
    {
        res.redirect("/");
    }
    Bstatus="hidden";
    mess2="";
    const title = req.body.title;
    Book.findOne({title:title} , function(err,found)
    {
        if(found)
        {
            Bstatus="visible";
            mess2="Book Already Added";
            res.render("addData" , {status:Bstatus , message:mess2});
        }
        else
        {
            const book = new Book({
                title:req.body.title,
                author:req.body.author,
                genre:req.body.genre,
                publication:req.body.publication,
                price:req.body.price,
                release_Date:req.body.release_date
            })
            book.save(function(err)
            {
                if(err)
                {
                    console.log(err)
                }
                else
                {
                    Bstatus="visible";
                    mess2="Book Added Successfully";
                    res.render("addData" , {status:Bstatus , message:mess2});
                }
            });
        }
    });
})

app.listen(3000 ,function(req,res)
{
	console.log("Started");
});