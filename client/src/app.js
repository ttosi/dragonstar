var serviceUrl = '[url-of-server]';

$(function () {
	'use strict';
	
	var CertificateViewModel = function (school) {
		var self = this;
		ko.mapping.fromJS(school, {}, self);

		delete self['_id'];
		self.promotionDate('');
		self.selectedLevels(ko.toJS(self.levels()));
		self.showConfig = ko.observable(false);

		var Student = function () {
			this.active = ko.observable(true);
			this.name = ko.observable('');
			this.level = ko.observable(undefined);
			this.sashColor = ko.observable(undefined);
			
			this.name.subscribe(function (value) {
				if (value.length > 0) {
					var dupNames = ko.utils.arrayFilter(self.students(), function (student) {
						return value === student.name();
					});
					
					if (dupNames.length > 1) {
						humane.log(value + " already exists");
						this.name('');
					}
				}
			}.bind(this));
		};
		
		self.addStudent = function () {
			self.students.push(new Student());
		};
		
		self.deleteStudent = function () {
			var remove = true;
			if (this.name().length > 0) {
				remove = confirm("Are you sure you want to delete this student?");
			}
			
			if (remove) {
				self.students.remove(this);
				if (this.name().length > 1) {
					$.ajax({
						url: serviceUrl + '/delete',
						type: 'POST',
						dataType: 'json',
						contentType: 'application/json',
						data: JSON.stringify({ 
							key: self.key(),
							name: this.name()
						})
					});
				}
			}
		};

		self.save = function (a, b, c, d) {
			self.saveToServer(false)
		};
		
		self.createPdf = function () {
			var err;
			
			if (self.promotionDate().length === 0) {
				err = "A promotion date is required";
			}
			
			if (parseInt(self.selectedStudents(), 10) === 0) {
				err = "One or more students must be selected to print";
			}

			self.saveToServer(true, err);
		};
		
		self.saveToServer = function(createPdf, err) {
			for(var i in self.students()) {
				if (self.students()[i].name().length === 0 ||
					self.students()[i].level() === undefined ||
					self.students()[i].sashColor() === undefined) {
						err = "A student name cannot be blank and a class level and sash must be selected";
						break;
				}
			}
			
			if (!err) {
				$.ajax({
					url: serviceUrl + '/save',
					type: 'POST',
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify({ 
						createPdf: createPdf, 
						school: ko.mapping.toJS(self) 
					})
				}).done(function () {
					if(createPdf) {
						window.location.href = serviceUrl + '/pdf/' + self.key();
					} else {
						humane.log("Your changes were successfully saved", { timeout: 4500, addnCls: 'humane-jackedup-success' });
					}
				});
			} else {
				humane.log(err, { timeout: 6000, addnCls: 'humane-jackedup-error' });
			}
		};
		
		self.selectedStudents = ko.computed(function () {
			return ko.utils.arrayFilter(self.students(), function (student) {
				return student.active() &&
					student.name() !== '' &&
					self.selectedLevels().indexOf(student.level()) > -1 &&
					student.sashColor() !== undefined;
			}).length;
		});
		
		self.sortAscending = ko.observable(undefined);
		self.sortBy = ko.observable('name');
		self.sort = function (sortBy) {
			if(self.sortAscending() === undefined) { self.sortAscending(false); }
			self.sortBy(sortBy);
			
			self.students.sort(function (a, b) {
				if(self.sortAscending()) {
					return a[sortBy]() < b[sortBy]() ? 1 : -1;
				} else {
					return a[sortBy]() > b[sortBy]() ? 1 : -1;
				}
			});

			if(self.sortAscending() !== undefined) { self.sortAscending(!self.sortAscending()); }
		};
		
		self.configure = function () {
			self.showConfig(!self.showConfig());
		};
	};
		
	$.ajax({
		url: serviceUrl + '/school/' + getQueryParam('key'),
		type: 'GET',
		dataType: 'json'
	}).done(function (school) {
		ko.applyBindings(new CertificateViewModel(school));
	});
		
	$('.input-group.date').datepicker({
		orientation: 'top left',
		autoclose: true
	}).on('show', function (e) {
		$('.datepicker').css('top', '220px');
		$('.datepicker').css('left', '138px');
	});
});

ko.bindingHandlers.studentVisible = {
	update: function(element, valueAccessor, allBindings, data, context) {
		var level = ko.unwrap(valueAccessor);
		var selectedLevels = context.$parent.selectedLevels();
		
		$(element).hide();
		if(selectedLevels.indexOf(level()) > -1 || level() === undefined) {
			$(element).show();
		}
	}
};

function getQueryParam(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
