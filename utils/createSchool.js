'use strict';

var	mongojs = require('mongojs'),
	uuid = require('node-uuid'),
	db = mongojs('dragonstar', [ 'school' ]),
	prompt = require('prompt');

prompt.message = '';
prompt.delimiter = '';
prompt.start();

var input = [
	{
		name: 'academyName',
		description: 'School Name:',
		default: 'Dragon Star Kung Fu',
		type: 'string',
		required: true
	},
	{
		name: 'sifu',
		description: 'Sifu Name:',
		type: 'string',
		default: 'Tom',
		required: true
	},
	{
		name: 'email',
		description: 'Email:',
		type: 'string',
		default: '',
		required: false
	},
	{
		name: 'address',
		description: 'Address:',
		default: '705 SE Crest Park Ave',
		type: 'string',
		required: true
	},
	{
		name: 'city',
		description: 'City:',
		default: 'Vancouver',
		type: 'string',
		required: true
	},
	{
		name: 'state',
		description: 'State:',
		default: 'WA',
		type: 'string',
		required: true
	},
	{
		name: 'zip',
		description: 'Zip:',
		default: '98683',
		type: 'string',
		required: true
	},
	{
		name: 'levels',
		description: 'Class Levels:',
		default: 'Child,Teen,Adult',
		type: 'string',
		required: true
	},
	{
		name: 'sashes',
		description: 'Sashes:',
		default: 'White,Yellow,Purple,Purple/Blue,Blue,Blue/Green,Green,Green/Brown,Brown,Black',
		type: 'string',
		required: true
	}
];

prompt.get(input, function (err, result) {
	result.students = [];
	result.key = uuid.v4();
	result.promotionDate = '';
	
	result.levels = result.levels.split(',');
	result.selectedLevels = result.levels;
	result.sashes = result.sashes.split(',');
	
	result.namePos = '225,464,0';
	result.sashPos = '255,557,0';
	result.dayPos = '170,590,0';
	result.monthPos = '295,590,0';
	result.yearPos = '435,590,0';
	
	db.school.insert(result, function (err) {
		console.log("School successfully created.");
		console.log("Access key: " + result.key);
		process.exit();
	});
});
