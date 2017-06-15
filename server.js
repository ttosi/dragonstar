'use strict';

var express = require('express'),
	mongojs = require('mongojs'),
	bodyParser = require('body-parser'),
	pdfkit = require('pdfkit'),              
	fs = require('fs'),
	favicon = require('serve-favicon');

var db = mongojs('dragonstar', [ 'school' ]),
	app = express(),
	monthNames = [ 'January', 'February', 'March', 'April',
				   'May', 'June', 'July', 'August', 'September',
				   'October', 'November', 'December' ];

// configure express
app.use('/client', express.static(__dirname + '/client'));
app.use(favicon(__dirname + '/client/favicon.ico'));
app.use(bodyParser.json());

app.listen(1400, function () {
    console.log("Server running on port 1400.");
});

app.get('/', function (req, res) {
	db.school.count({ key: req.query.key }, function(err, count) {
		if(!err) {
			if(count === 1) {
				res.sendFile(__dirname + '/client/index.html');
			} else {
				res.sendFile(__dirname + '/client/unauthorized.html');
			}
		}
	});
});

app.get('/school/:key', function (req, res) {
	db.school.findOne({ key: req.params.key }, function (err, school) {
		if (!err) {
			res.end(JSON.stringify(school));
		}
	});
});

app.post('/save', function (req, res) {
	db.school.remove({ key: req.body.school.key }, function (err) {
		db.school.insert(req.body.school, function(err) {
			if(req.body.createPdf && !err) {
				createPdf(req.body.school);
			}
			
			res.end(JSON.stringify({ success: true }));
		});
	});
});

app.post('/delete', function (req, res) {
	db.school.update(
		{ key: req.body.key },
		{ $pull: { students: { name: req.body.name }}}
	);
	
	res.end(JSON.stringify({ success: true }));
});

function createPdf(data) {
	var students = data.students,
		doc = new pdfkit();
		 
	doc.font('fonts/niconne.ttf');
	doc.fontSize(21);
	doc.pipe(fs.createWriteStream('temp/' + data.key + '.pdf'));
	
	var namePos = parsePosition(data.namePos),
		sashPos = parsePosition(data.sashPos),
		dayPos = parsePosition(data.dayPos),
		monthPos = parsePosition(data.monthPos),
		yearPos = parsePosition(data.yearPos);
	
	var promotionDate = new Date(data.promotionDate),
		day = getDaySuffix(promotionDate.getDate()),
		month = monthNames[promotionDate.getMonth()],
		year = promotionDate.getFullYear().toString().substr(2);
	
	var certsToPrint = students.filter(function (student) {
		if(student.active && data.selectedLevels.indexOf(student.level) > -1) {
			return student;
		}
	});
	
	for (var i in certsToPrint) {
		doc.text(certsToPrint[i].name, namePos[0], namePos[1]);
		doc.text(certsToPrint[i].sashColor, sashPos[0], sashPos[1]);
		
		doc.text(day, dayPos[0], dayPos[1]);
		doc.text(month, monthPos[0], monthPos[1]);
		doc.text(year, yearPos[0], yearPos[1]);
		
		if (i < certsToPrint.length - 1) {
			doc.addPage();
		}	
	}
	
	doc.end();
}

app.get('/pdf/:key', function (req, res) {
	var pdf = 'temp/' + req.params.key + '.pdf'
	fs.exists(pdf, function(exists) {
		if(exists) {
			res.download(__dirname + '/' + pdf, 'certificates.pdf', function () {
				fs.unlink(pdf);
			});   
		}
	});
});

function parsePosition (setting) {
	var settingValues = setting.split(',');
	settingValues = settingValues.map(function (val) { 
		return parseInt(val, 10);
	});
	
	return settingValues;
}

function getDaySuffix (i) {
    var j = i % 10,
        k = i % 100;
	
    if (j == 1 && k != 11) { return i + 'st'; } 
	
    if (j == 2 && k != 12) { return i + 'nd'; }
	
    if (j == 3 && k != 13) { return i + 'rd'; }
	
    return i + "th";
}
