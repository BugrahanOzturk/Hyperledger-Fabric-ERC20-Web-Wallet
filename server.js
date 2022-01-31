if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const { init_identity, connect_network, check_balance, mint, accountID, transfer_amount } = require('./app.js');

// Login Page Essentials 
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const initiliazePassport = require('./password-config.js');

initiliazePassport(
    passport,
    email => users.find(user => user.email == email),
    id => users.find(user => user.id == id)
);

const users = [];
/******************************************/

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended:false}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, async (req, res) => {
    try {
        let val = await accountID();
        res.render('index.ejs', {name: req.user.email, val: val});
    } catch(error) {
        console.log(error);
        res.render('index.ejs', {name: req.user.email});
    }
});

app.post('/', async (req, res) => {
    if(req.body.button == 1){
        console.log("Mint!");
        await mint(parseInt(req.body.mint));
        res.redirect('/');
    }     
    if(req.body.button == 2){
        console.log("Check Balance!");
        res.redirect('/view')
    }

    if(req.body.button == 3){
        console.log("Transfer Money");
        res.redirect('/transfer');
    }
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), async (req, res) => {
    try {
        await connect_network(JSON.stringify(req.body.email));
        res.redirect('/');
    } catch {
        res.redirect('/login');
    }
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            email: req.body.email,
            password: hashedPassword
        })
        init_identity();
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
});

app.get('/view', async (req, res) => {
    try {
        let val = await check_balance();
        res.render('view.ejs', {balance: val});
    } catch(error) {
        console.log(error);
        res.redirect('/');
    }
});

app.get('/transfer', checkAuthenticated, (req, res) => {
    res.render('transfer.ejs');
});

app.post('/transfer', async (req, res) => {
    try {
        await transfer_amount(req.body.recipient, parseInt(req.body.amount));
        res.redirect('/view')
    } catch(error) {
        console.log(error);
        res.redirect('/view');
    }
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    return res.redirect('/login');
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}

app.listen(3000);