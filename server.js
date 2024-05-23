const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app =express();
const session = require('express-session');
app.set('view engine','ejs');
const path = require('path');
const { error } = require('console');
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

app.get('/', ( req,res)=>{
  //res.sendFile(path.join(__dirname,  'home.ejs'))
  User.find().exec((err,users)=>{ if(err){
    res.json({message:err.message});
  }
else{
  res.render('home',{users:users})
}})
})

app.get('/home', async ( req,res)=>{
  // Clear the message after displaying it
  const users = await User.find();
  const message = req.session.message;
  req.session.message = null;
  res.render('home', { users , message });
  //req.session.message = null;
 // res.sendFile(path.join(__dirname,  'home.ejs'))
})
app.get('/adduser', ( req,res)=>{
  res.sendFile(path.join(__dirname,  'adduser.html'))
})
app.get('/contacts', ( req,res)=>{
  res.sendFile(path.join(__dirname,  'contact.html'))
})

app.listen(3000,()=>{
  console.log("server is running")
})
mongoose
.connect('mongodb://localhost:27017/projecttrial')
.then(()=>{console.log("connected to db")})
.catch((error)=>console.log(`${error}`))

const userSchema = new mongoose.Schema({
  name: { type:String,
    required:true},
  registration: { type:String,
    required:true} ,
  email:  { type:String,
    required:true} ,
    contacts:{
      type:String,
      required:true
    }
});const User = mongoose.model('User', userSchema);
userSchema.index({ name: 'text', registration: 'text', email: 'text', contacts: 'text' });



app.post('/update/:id', (req, res) => {
  let id = req.params.id;
  User.findByIdAndUpdate(id, {
      name: req.body.name,
      registration: req.body.registration,
      email: req.body.email, 
      contacts: req.body.contacts
  }).then(result => {
      if (!result) {
          return res.status(404).json({ message: "User not found" });
      }
      req.session.message = {
          message: "User updated successfully"
      };
      res.redirect('/home');
  }).catch(err => {
      res.status(500).json({ message: err.message });
  });
});
app.get('/search', async (req, res) => {
  const query = req.query.query;
 
  try {
    let result = await User.find({ $text: { $search: query } });
      res.render('search.ejs', {  result });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/edituser/:id', async (req, res) => {
  try {
    let id = req.params.id;
    
    let user = await User.findById(id);
    if (!user) {
      res.redirect('/home');
    } else {
      res.render('edituser',{ user});
    }
  } catch (err) {
    res.redirect('/home');
  }
});


app.get('/delete/:id', async(req,res)=>{
  try {
    let id = req.params.id;
    let result = await User.findByIdAndDelete(id);
    if (!result) {
      throw new Error('User not found');
    }
    req.session.message = {
      message: "student deleted successfully"
    };
    res.redirect('/home');
  } catch (err) {
    res.json({ message: err.message });
  }
});


app.post('/adduser', async (req, res) => {
  const { name,registration,email, contacts } = req.body;

  let user = await User.findOne({ registration });
  if (user) {
    req.session.message={
      type:"success",
      message:"user exists"};
    
     // res.render('home', { message: req.session.message });
      
    res.redirect('/home')
  } else {
    user = new User({ name,registration, email,contacts  });
    await user.save();
    req.session.message={
      type:"success",
      message:"user added successfully"
    };
    
   res.redirect('/home')
  }
});