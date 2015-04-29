var pdfkit = require('pdfkit'),              
	fs = require('fs')
	doc = new pdfkit();
		 
doc.pipe(fs.createWriteStream('alignmentGuide.pdf'));
doc.addPage({margin: 0});

for(var y = 25; y < 800; y += 25) {
	doc.text(y, 10, y);
	doc.moveTo(10, y).lineTo(600, y).stroke();
}

for(var x = 25; x < 600; x += 25) {
	doc.text(x, x, 10);
	doc.moveTo(x, 10).lineTo(x, 775).stroke();
}

doc.end();