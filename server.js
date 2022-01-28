const express = require('express');
const app = express();

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended:false}));

app.get('/', (req, res) => {
    res.render('index.ejs', {name: 'Cüzdan Uygulaması'})
});

app.post('/', (req, res) => {
    console.log("1000");
});

app.get('/test', (req, res) => {
    
});


app.listen(3000);