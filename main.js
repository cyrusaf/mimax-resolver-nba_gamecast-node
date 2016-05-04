let request = require('request')
let sync    = require('synchronize')
let fs      = require('fs');
let https   = require('https');
let express = require('express')
let cors    = require('cors');
let Handlebars = require('handlebars');
let app     = express()

let nba    = require('./services/nba')

// Wrap all requests in fiber for async
app.use(function(req, res, next){
  sync.fiber(next)
})

// Options for https
let options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};

// Since Mixmax calls this API directly from the client-side, it must be whitelisted.
let corsOptions = {
  origin: /^[^.\s]+\.mixmax\.com$/,
  credentials: true
};

// Resolver route
app.get('/resolver', cors(corsOptions), function(req, res) {
  let url = req.query.url.trim();
  let game = nba.Game.fromUrl(url)
  console.log(game)

  let source   = fs.readFileSync("templates/nba_widget.hbs", "utf8")
  var template = Handlebars.compile(source);
  res.json({
    body: template(game)
  })
})


https.createServer(options, app).listen(3000, function () {
  console.log('Link resolver running on port 3000. Route /resolver.');
});
