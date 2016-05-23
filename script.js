var rootUri = "user/repo"
var token = "add github application token"

function apiCall(uri, callback) {
	$.ajax({
		url: "https://api.github.com/repos/" + rootUri + uri,
		headers: {
			"Authorization": "token " + token
		}
	}).done(function(data, status, xhr) {
		callback(data, status, xhr);
	}).fail(function(error) {
		console.log(error);
	});
}

function loadLabels(callback) {
	apiCall("/labels", function(labels) {
		callback(labels);
	});
}

function loadIssues(callback) {
	loadIssuesPages([], 1, callback);
}

function loadIssuesPages(issues, page, callback) {
	apiCall(
		"/issues?state=all&per_page=100&page=" + page,
		function(new_issues, status, xhr) {
			issues = issues.concat(new_issues);
			var lnk = xhr.getResponseHeader("Link");
			if(lnk && lnk.indexOf("next") > -1) {
				loadIssuesPages(issues, page + 1, callback);
			} else {
				callback(issues);
			}
		}
	);
}

function filterIssues(issues, state, label) {
	var res = []
	issues.forEach(function(issue) {
		if(state && issue.state != state) { return; }
		if(label) {
			var found = false
			for(var i = 0; i < issue.labels.length; i++) {
				var l = issue.labels[i];
				if(l.name == label) { found = true; }
			}
			if(!found) { return; }
		}
		res.push(issue)
	})
	return res
}

function loadCountdown(target, date) {
	$(target).countdown(date, function (event) {
		var $this = $(this).html(event.strftime(''
		+ '<span>%w</span> weeks '
		+ '<span>%d</span> days '
		+ '<span>%H</span> hr '
		+ '<span>%M</span> min '
		+ '<span>%S</span> sec'));
	});
}

function overallProgress(total, open) {
	var div = $("<div>")
	div.append(
		$("<h1>").append(
			$("<a>")
			.attr("href", "https://github.com/ppepos/CS-Games-2016/issues")
			.text("Overall Progress")
		).append(
			$("<small>")
			.css("margin-left", "25px")
			.text(open + " open / " + total + " issues")
		)
	).append(progressBar(total, open))
	return div;
}

function labelProgress(label, total, open) {
	var div = $("<div>")
	div.append(
		$("<h3>").append(
			$("<a>")
			.attr("href", "https://github.com/ppepos/CS-Games-2016/labels/" + label.name)
			.text(label.name)
		).append(
			$("<small>")
			.css("margin-left", "25px")
			.text(open + " open / " + total + " issues")
		)
	).append(progressBar(total, open))
	return div;
}

function progressBar(total, open) {
	var percent = Math.round( (total - open) / total * 100 )
	var div = $("<div>")
	div.addClass("progress")
	.append(
		$("<div>").attr({
			"class": "progress-bar progress-bar-danger progress-bar-striped active",
			"role": "progressbar",
			"aria-valuenow": percent,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"style": "width: " + percent + "%;"
		}).append(
			$("<span>").text(percent + "% done")
		)
	)
	return div
}

$(function () {
	loadCountdown("#countdown", "2016/03/11 09:00:00");

	loadIssues(function(issues) {
		var overall = filterIssues(issues, "open");
		$("#overall").html(
			overallProgress(issues.length, overall.length)
		);
		$("#poles").empty()
		loadLabels(function(labels) {
			labels.sort(function(a, b) {
				if(a.name < b.name) {
					return -1
				} else if(a.name > b.name) {
					return 1
				} else {
					return 0
				}
			})
			labels.forEach(function(label) {
				var poleall = filterIssues(issues, null, label.name)
				var poleopen = filterIssues(issues, "open", label.name)
				$("#poles").append(
					labelProgress(label, poleall.length, poleopen.length)
				)
			});
		});
	});
});
