var fs = require('fs');
var express = require('express');
var app = express();

var results, urlTime;
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
    console.log(req)
		  res.sendFile(process.cwd() + '/views/index.html');
    })

app.route('/*')
    .get(function(req, res) {
    // grabs requested url and removes forward slash
    urlTime = req.url.replace('/','');
    // checks if it is a number 
    if (Number.isInteger(+urlTime)){
      // returns the requested time as an integer and uses convertTime function to return the natural language date
      results = { 
        "unix": +urlTime,
        "natural": convertTime(urlTime)
        };
      res.json(results);    
    } 
    // need some logic to handle invalid requests (non-unixtime numbers and improperly formatted natural language dates)
    else {
      // grabs requested url, removes forward slash and fixes HTML space codes
      var str = req.url.replace(/%20/g, ' ').replace('/', '');
      console.log(str);
      // splits the url string and p
      var dateArray = str.split(' ')
      // checks to see if the array has 3 elements (expecting day, month, year).  If not we know it is an invalid request.  Verifying the elements match a real date comes later.
      if (dateArray.length != 3){
        results = {
          "unix": null,
          "natural": null
        };
        res.json(results);
      }
      // Passes the particular array elements to a new Date object to get the unixtime
      var date = new Date(dateArray[2] + "." + (months.indexOf(dateArray[0])+1) +"." + dateArray[1].replace(',','')).getTime() / 1000;
      // checks if the Date object returned a number.  It won't if the date is not a valid date, meaning that the input contained three elements but they weren't valid
      if (isNaN(date)){
        results = {
          "unix": null,
          "natural": null
        };
        res.json(results);
      };
      // returns the formatted natural language date amnd calculated unixtime
      results = { 
        "unix": date, 
        "natural": str
        };
      res.json(results);
    };

    })


// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);

});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

// function to convert unixtime to a natural language date
function convertTime(time){
  var date = new Date(time*1000);
  var month = date.getMonth();
  var year = date.getFullYear();
  var day = date.getDate();
  var formattedTime = months[month] + " " + day + ", " + year;
  return formattedTime;
}

