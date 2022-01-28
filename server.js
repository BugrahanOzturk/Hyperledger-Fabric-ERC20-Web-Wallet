const express = require('express');
const app = express();

const { init_connection, check_balance, mint } = require('./app.js');

init_connection();

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended:false}));

app.get('/', (req, res) => {
    res.render('index.ejs', {name: 'Dijital TL Uygulaması'});
});

app.post('/', (req, res) => {
    if(req.body.button == 1){
        console.log("Mint!");
        mint('5000');
        res.redirect('/');
    } 
    
    if(req.body.button == 2){
        console.log("Check Balance!");
        check_balance().then(val => {
            console.log(val);
            res.render('view.ejs', {balance: 'bakiye=' + val});
        }).catch(e => {
            console.log(e);
        });
    }
});

app.get('/view', (req, res) => {
    res.render('view.ejs')
});


app.listen(3000);