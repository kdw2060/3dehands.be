var express = require('express');
var bodyparser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var request = require("request");
var app = express();
app.use(bodyparser.json());

// Verwijs express webserver naar map waar te hosten files staan
app.use(express.static('client'));

//connectie naar MongoDB database + definiëring variabelen
var db;
var adsTable;
var usersTable;
//we connecteren naar de database '3dehands', als die nog niet bestaat zal mongo die automatisch aanmaken
MongoClient.connect('mongodb://localhost:27017/3dehands', function (err, _db){
    if (err) throw err;
    console.log("Connected to MongoDB");
    db = _db;
    // binnen de database '3dehands' gebruiken we 2 collecties (worden ook automatisch aangemaakt wanneer voor eerst gebruikt)
    adsTable = db.collection('advertenties');
    usersTable = db.collection('users');
});
    //wanneer process gekilled wordt (via ctrl+c)
    process.on('SIGINT', function(){
        db.close();
        process.exit(0);
})

// data | de lokale arrays zijn later verhuisd naar mongodb en in commentaar gezet

    var inlogger = {};

    //var advertenties = [{
    //    titel:'mijn advertentie', beschrijving:'ik verkoop shizzle', foto:'', website:'http://www.shizzle.com', plaatser:'Jef'
    //}]
    //
    //var registeredUsers = [{
    //            name: 'Jef',
    //            pass: '1234'
    //          },
    //            {
    //            name: 'Marcel',
    //            pass: '7777'
    //          }]

    //opmerking: manueel onderstaand commando uitgevoerd in de shell/cli van mongo om de geregistreerde gebruiker(s) daar op te slaan; bedoeling is uiteraard dat er ook een registratiemodule komt op de site, waarmee je een account kunt aanmaken, uit tijdgebrek nu niet voorzien
    //db.users.insert({'name': 'Jef', 'pass': '1234'});


// express functies

    app.get('/api/getRegisteredUsers', function(req, res){
    usersTable.find().toArray(function(err, data){
        res.status(200).json(data); 
        });
    });

    app.get('/api/getAds', function (req, res) {
        //ophalen advertenties uit lokaal advertenties array
        //res.status(200).json(advertenties);

        //ophalen advertenties uit mongoDB collectie en als resultaat terugsturen naar get functie in index.html
        adsTable.find().toArray(function (err, ads){
            res.status(200).json(ads);
        })
    });

    app.post('/api/login', function (req, res) {
        var gebruikerbestaat = false;
        //deze gegevens komen binnen via de $http.post uit angular
        inlogger = { 'name': req.body.name, 'pass': req.body.pass };
        
        //ophalen geregistreerde gebruikers uit mongoDB (request package gebruikt om vanop server een request naar de dezelfde server te kunnen sturen)
        request("http://localhost:3000/api/getRegisteredUsers", function(error, response, body){
            //parsen van de body respons is nodig omdat object anders undefined is wanneer je elementen uit het array probeert te selecteren
            var parsedData = JSON.parse(body);
            var registeredUsers = [];
            registeredUsers = parsedData;
            //controleren of de inlogger bekend is als geregistreerde gebruiker
            for (i = 0; i < registeredUsers.length; i++) {
                if (registeredUsers[i].name == inlogger.name && registeredUsers[i].pass == inlogger.pass ) {
                    gebruikerbestaat = true;
                }
            }
        
        //als res(ultaat) sturen we over http een boodschap terug naar de angular login-functie. Die wordt daar opgepikt door het .success gedeelte
            if (gebruikerbestaat == true) {res.status(201).json({ message: 'true' })}
            else {res.status(201).json({ message: 'false' })} ; 
        });
    });

    app.post('/api/plaatsAd', function (req, res){
        console.log(req.body);
        //advertentie opslaan in lokaal array in dit bestand 
            //advertenties.push({'titel': req.body.titel, 'beschrijving': req.body.beschrijving, 'website': req.body.website, 'plaatser':req.body.plaatser});
        
        //advertentie opslaan in MongoDB
        adsTable.insert({'titel': req.body.titel, 'beschrijving': req.body.beschrijving, 'website': req.body.website, 'plaatser':req.body.plaatser});
        res.status(201).json({message: 'Je advertentie werd geplaatst'});
    })

    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

app.listen(3000);
