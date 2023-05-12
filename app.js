var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');
const bodyParser = require("body-parser");
const router = express.Router();

var cookieParser = require('cookie-parser')

// get the name
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

var customConfig = {
  dictionaries: [colors, animals],
  separator: ' ',
  length: 2,
};

//var privateKey  = fs.readFileSync('server.key', 'utf8');
//var certificate = fs.readFileSync('server.crt', 'utf8');

// https://stackoverflow.com/questions/11744975/enabling-https-on-express-js
//openssl genrsa -out key.pem
//openssl req -new -key key.pem -out csr.pem
//openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
//rm csr.pem

// npm install express cookie-parser

function readText(filename)
{
	const buffer = fs.readFileSync(filename, 'utf-8');
	return buffer;
}

function writeTextFile(filename, output)
{
	fs.appendFile(filename, output, 'utf-8', function (err) {
	  if (err)
	  {
		  throw err;
	  }
	  //console.log('Saved!');
	});
}

function processImmediate(data, escapeSequence, userName)
{
	if (typeof userName === 'undefined') {
		return data;
	}
		
	let newData = data.replace(escapeSequence, userName) 
	//console.log("Replaced immediate{randomParticipantName} with: " + userName )
	return newData;
}

// Make a note of the server start date
var serverStartDate = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", true);
console.log("Server started at: " + serverStartDate );

app = express();

app.use( cookieParser() );

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// https://stackoverflow.com/questions/10645994/how-to-format-a-utc-date-as-a-yyyy-mm-dd-hhmmss-string-using-nodejs
function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

router.post("/",(req, res) => {
	console.log( "Creating entry" );

	// Write old style
	var fDate = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", true);
	
	var wanderData = req.body.wanderData;
	
	console.log( "DateTime: "    + fDate );
	console.log( "Participant: " + wanderData.participantName );
	console.log( "One: " 		 + wanderData.one );
	console.log( "Two: " 		 + wanderData.two );
	console.log( "Three: " 		 + wanderData.three );
	console.log( "lat: " 		 + wanderData.lat );
	console.log( "lon: " 		 + wanderData.lon );
	
	writeTextFile("server.txt", wanderData.participantName + "," + wanderData.lat + "," + wanderData.lon + "," + fDate + "," + wanderData.one + "." + wanderData.two + "." + wanderData.three + "\n");

	// Write new style
	var filename = "maps/" + wanderData.participantName + ".txt";
	writeTextFile(filename, wanderData.lat + "," + wanderData.lon + "," + fDate + "," + wanderData.one + "," + wanderData.two + "," + wanderData.three + "\n");
	
	// Acknowledge this worked
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end();
});

// add router in the Express app.
app.use("/", router);

app.get('/style.css', (req, res) => {
	res.set('Cache-Control', 'no-store')
	pathname = '/style.css';
	fs.readFile(pathname.substr(1), (err, data) => {
	
	if (err) {
		
		console.error(err);
		
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.write('404 - file not found');
		
	} else {
		console.log("Serving style.css");
		
		res.writeHead(200, { 'Content-Type': 'text/css' });
		res.write(data.toString());
	}
	
	res.end();
	});
});

app.get('/clear', (req, res) => {
	console.log("Cleared cookies");
	
	res.clearCookie('username', { path: '/' });
	res.writeHead(200, { 'Content-Type': 'text/css' });
	
	// Write old style
	var fDate = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", true);
	res.write("Server started at: " + serverStartDate );
	res.write("\nCleared cookies at: " + fDate);
	res.end();
});

router.get("/restart",(req, res) => {
	console.log( "Restart" );
	
	var fDate = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", true);
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write("Server restarted at " + fDate );
	res.end();
	
	writeTextFile("tmp/restart.txt", fDate);
});

router.post("/password",(req, res) => {
	console.log( "Posted password" );
	
	var wanderData = req.body.wanderData;
	console.log(wanderData);
	
	if( wanderData.password.toLowerCase() == "bluebell" )
	{
		// set the cookie for username
		console.log("Set password");
		
		currUsername = uniqueNamesGenerator(customConfig);
		res.cookie('username', currUsername, { maxAge: 1000 * 60 * 12, httpOnly: false } );
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end();
	}
	else {
		console.log("Wrong password:" + wanderData.password);
		res.writeHead(511, { 'Content-Type': 'text/html' });
		res.end();		
	}
});

function getMainPage(req, res)
{
	var language = req.headers["accept-language"];
	console.log( "Language: " + language );
	
	var userName = req.cookies['username'];
	if (typeof userName === 'undefined') {
		console.log('Username is not set');

		pathname = '/password.html';
		
		if( ( language.toLowerCase().search( "gr" ) != -1 ) ||
			( language.toLowerCase().search( "el" ) != -1 ) )
		{
			pathname = '/password_gr.html';
		}
	}
	else
	{
		pathname = '/index.html';
		
		if( ( language.toLowerCase().search( "gr" ) != -1 ) ||
			( language.toLowerCase().search( "el" ) != -1 ) )
		{
			pathname = '/index_gr.html';
		}
	}

	fs.readFile(pathname.substr(1), 'utf8', (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
			console.log("Serving index.html in utf8 for user:" + userName);
			
			processedPage = processImmediate( data.toString(), /immediate{randomParticipantName}/g, userName );
			
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});	
}

app.get('/', (req, res) => {

	getMainPage(req, res);
});

function toFixed(x) {
	return Number.parseFloat(x).toFixed(5);
}

app.get('/map/:userName/', (req, res) => {
	res.set('Cache-Control', 'no-store')
	
	var userName = req.params.userName;
	var filename = "maps/" + userName + ".txt";
	
	// https://openstreetmap.be/en/projects/howto/openlayers.html	
	var language = req.headers["accept-language"];
	// console.log( "Language: " + language );
			
	var pathname = '/map.html';

	// Find  the centre
	var centreLat = 0;
	var centreLon = 0;
	var count = 0;
	
	// Add markers
	mapPoint1 = "";
	var output = "";
	try {
		// read contents of the file
		const data = fs.readFileSync(filename, 'UTF-8');

		// split the contents by new line
		const lines = data.split(/\r?\n/);
	
		// print all lines
		lines.forEach((line) => {
			if( line.length )
			{
				count++;
				
				// Split the line
				var arr = line.split(",");
				
				console.log(line);
				
				// Get the latitude
				var lat = toFixed(arr[0]);
				
				// Get the longitude
				var longitude = toFixed(arr[1]);
				
				centreLat += parseFloat(lat);
				centreLon += parseFloat(longitude);
				
				console.log( "Coord " + lat + " " + longitude );
				
				// Get the first word
				var first = arr[3];
				
				// Get the second word
				var second = arr[4];
				
				// Get the third word
				var third = arr[5];
				
				console.log( "words " + first + "." + second + "." + third );
									
				// Now add each point
				mapPoint1 += `mapPoints.push(new ol.Feature({ geometry: new ol.geom.Point( ol.proj.fromLonLat([${longitude}, ${lat}]) ), name: '${first}.${second}.${third}' }));`;
				mapPoint1 += "\n\t";
			}
		});
	} catch (err) {
		console.error(err);
	}
	
	if( count > 0 )
	{
		centreLat /= count;
		centreLon /= count;
	}
	
	console.log( "center " + centreLat );
	console.log( "center " + centreLon );
	console.log( "mapPoint1 " + mapPoint1 );
	
	fs.readFile(pathname.substr(1), 'utf8', (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
			//console.log("Serving index.html in utf8 for user:" + userName);
			
			// Set the position of the map
			processedPage = data.toString();
			processedPage = processImmediate( processedPage, /immediate{long}/g, centreLon );
			processedPage = processImmediate( processedPage, /immediate{lat}/g,  centreLat );
		
			processedPage = processImmediate( processedPage, /immediate{mapPoints}/g, mapPoint1 );			
			
			// Send the rest of the header
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});	
});

app.get('/show', (req, res) => {	
	res.set('Cache-Control', 'no-store')

	var userName = req.cookies['username'];
	
	if (typeof userName === 'undefined') {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.write('404 - Not authorised');
		res.end();
		return;
	}
	
	pathname = '/showUTF8.html';

	var list = readText("server.txt");
	
	fs.readFile(pathname.substr(1), 'utf8', (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
			
			list = list.replace(/\n/g, "<br>");
			
			processedPage = processImmediate( data.toString(), /immediate{words}/g, list );
			
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});	
});

app.get('/showUTF8', (req, res) => {	
	
	res.set('Cache-Control', 'no-store')
	
	pathname = '/showUTF8.html';

	var list = readText("server.txt");
	
	fs.readFile(pathname.substr(1), 'utf8', (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
			
			processedPage = processImmediate( data.toString(), /immediate{words}/g, list );
			
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});	
});

app.get('/icon.png', (req, res) => {	
	console.log("Icon");
	
	res.set('Cache-Control', 'no-store')

	console.log("Showing the list of words");
			
	res.writeHead(200, { 'Content-Type': 'image/png' });
	var buffer = readText("icon.png");
	res.write(buffer);
	res.end();
});

app.get('/show/:userName/', (req, res) => {
	
	res.set('Cache-Control', 'no-store')
	
	var userName = req.params.userName;
	var filename = "maps/" + userName + ".txt";
	
	console.log("Showing the list of words");
			
	res.writeHead(200, { 'Content-Type': 'text/plain' });

	// Make buffer
	buffer = "";
	buffer += '<?xml version="1.0" encoding="UTF-8"?>\n';
	buffer += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
	buffer += '<Document>\n';
	buffer += '<Placemark><name>' + userName + '</name>\n';
	buffer += '<description>' + userName + '</description>\n';
	buffer += '<LineString>\n';
	buffer += '<coordinates>\n';

	try {
		// read contents of the file
		const data = fs.readFileSync(filename, 'UTF-8');

		// split the contents by new line
		const lines = data.split(/\r?\n/);

		// print all lines
		lines.forEach((line) => {
			if( line.length )
			{
				var arr = line.split(",");
				buffer += arr[0] + "," + arr[1] + "\n";
			}
		});
	} catch (err) {
		console.error(err);
	}
		
	buffer += '</coordinates>\n';
	buffer += '</LineString>\n';
	buffer += '</Placemark>\n';
	buffer += '</Document>\n';
	buffer += '</kml>\n';

	// Send buffer
	res.write(buffer);	
	res.end();
});

app.get('/help', (req, res) => {	
	res.set('Cache-Control', 'no-store')

	pathname = '/help.html';

	fs.readFile(pathname.substr(1), (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
		
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(data);
		}		
		res.end();
	});
});

app.get('/maps', (req, res) => {	
	res.set('Cache-Control', 'no-store')

	var userName = req.cookies['username'];
	
	if (typeof userName === 'undefined') {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.write('404 - Not authorised');
		res.end();
		return;
	}	

	pathname = '/maps.html';
	
	// Get the folder

	var dir = 'maps';
	
	const unsortedFiles = fs.readdirSync(dir);

	var sortedFiles = unsortedFiles
		.map(fileName => ({
		  name: fileName,
		  time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
		}))
		.sort((a, b) => b.time - a.time)
		.map(file => file.name);
  
	// Get the list of maps
	var mapNames = "";	
	var files = sortedFiles;
	files.forEach(file => {	  
	
		const title = file.split('.').slice(0, -1).join('.');
		var url = "https://wanderstok.com/show/" + title;
		
		//console.log(file);
		mapNames += "<a href='"+url+"'>" + title + "</a>";
		mapNames += "<br>";
	})
	

	fs.readFile(pathname.substr(1), (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
		
			processedPage = processImmediate( data.toString(), /immediate{listOfMaps}/g, mapNames );
			
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});
});


app.get('/maps2', (req, res) => {

	res.set('Cache-Control', 'no-store')

	var userName = req.cookies['username'];
	
	if (typeof userName === 'undefined') {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.write('404 - Not authorised');
		res.end();
		return;
	}	

	pathname = '/maps.html';
	
	// Get the folder

	var dir = 'maps';
	
	const unsortedFiles = fs.readdirSync(dir);

	var sortedFiles = unsortedFiles
		.map(fileName => ({
		  name: fileName,
		  time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
		}))
		.sort((a, b) => b.time - a.time)
		.map(file => file.name);
  
	// Get the list of maps
	var mapNames = "";	
	var files = sortedFiles;
	files.forEach(file => {	  
	
		const title = file.split('.').slice(0, -1).join('.');
		//var url = "https://wanderstok.com/map/" + title;
		var url = "/map/" + title;
		
		//console.log(file);
		mapNames += "<a href='"+url+"'>" + title + "</a>";
		mapNames += "<br>";
	})
	
	// List the maps
	fs.readFile(pathname.substr(1), (err, data) => {	
		if (err) {
			
			console.error(err);
			
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.write('404 - file not found');
			
		} else {
		
			processedPage = processImmediate( data.toString(), /immediate{listOfMaps}/g, mapNames );
			
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write(processedPage);
		}		
		res.end();
	});
});

var server = http.createServer(app);

// 80
const port = 80;//process.env.PORT || 8080;

server.listen(port, () => {
  console.log("server starting on port : " + port)
});