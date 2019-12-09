var ElectionChart = (function(window, undefined, $, Chart) {
  var chartOptions = {
    scaleBeginAtZero: true,
    graphMin: 0,
    scaleShowGridLines: false,
    scaleGridLineColor: "rgba(0,0,0,.05)",
    scaleGridLineWidth: 1,
    scaleLabel: "<%= ' ' + value%>",
    barShowStroke: true,
    barStrokeWidth: 2,
    barValueSpacing: 5,
    barDatasetSpacing: 1,
    scaleFontSize: 16,
    scaleShowLabels: false,
    legendTemplate:
      '<ul class="<%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].lineColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>',
    inGraphDataShow: true,
    inGraphDataTmpl: "<%=v3%>",
    inGraphDataPaddingX: 5,
    thousandSeparator: ",",
    spaceRight: 50,
    xScaleLabelsMinimumWidth: 175
  };
  var toProperCase = function(str) {
    if (str.indexOf("U.S.") > -1)
      return "U.S." + toProperCase(str.replace("U.S.", ""));
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };
  var electionChart = function(options) {
    var _this = this;
    var defaults = {
      $container: $(".election-results"),
      contest: null,
      colors: ["blue", "red", "orange", "green", "yellow", "black", "gray"]
    };
    _this.$container =
      options && options.$container ? options.$container : defaults.$container;
    _this.contest = options && options.contest ? options.contest : null;
    _this.colors =
      options && options.colors
        ? options.colors.reverse()
        : defaults.colors.reverse();
    _this.chartOptions = chartOptions;
    _this.data = null;
    _this.ctx = null;
    _this.id = options && options.id ? options.id : null;
    var createChart = function(ctx, data) {
      return new Chart(_this.ctx).HorizontalBar(_this.data, _this.chartOptions);
    };
    var chartify = function() {
      _this.ctx = document
        .getElementById("contest" + _this.contest.id)
        .getContext("2d");
      _this.data = getChartData();
      return createChart();
    };
    var createContestHtml = function(numberOfCandidates) {
      var size = formatChartSize(numberOfCandidates);
      var html = "<div class='contest contest-" + _this.contest.id + "'>";
      html += "<h2>" + toProperCase(_this.contest.name) + "</h2>";
      html +=
        '<canvas class="contest-chart" id="contest' +
        _this.contest.id +
        '" height="' +
        size.height;
      html += 'px" width="' + size.width + 'px"></canvas>';
      html += "</div>";
      $(_this.$container.selector).append(html);
    };
    var init = function() {
      if (_this.contest) {
        var len = _this.contest.candidates.length;
        createContestHtml(len);
        chartify();
      } else if (typeof console !== "undefined")
        console.error("Contest object required to create a chart.");
    };
    var formatChartSize = function(numberOfBars) {
      var size = {};
      var baseHeight = 75;
      var maxHeight = 300;
      var minBarSize = 32;
      var overheadHeight = 30;
      size.width = 650;
      size.height = numberOfBars * minBarSize + overheadHeight;
      return size;
    };
    var getCandidateName = function(candidate) {
      var name = candidate.party
        ? candidate.name + " (" + candidate.party + ")"
        : candidate.name;
      return name;
    };
    var getCandidateNames = function(contest) {
      var candidateNames = [];
      var candidates = contest.candidates;
      var i;
      for (i = candidates.length - 1; i >= 0; i--)
        candidateNames.push(getCandidateName(candidates[i]));
      return candidateNames;
    };
    var getCandidateVotes = function(contest) {
      return getCandidateInfoByProperty(contest, "votes");
    };
    var getCandidateInfoByProperty = function(contest, property) {
      var candidateNames = [];
      var candidates = contest.candidates;
      var i;
      for (i = candidates.length - 1; i >= 0; i -= 1)
        candidateNames.push(candidates[i][property]);
      return candidateNames;
    };
    var getChartData = function() {
      var candidateNames = getCandidateNames(_this.contest);
      var candidateVotes = getCandidateVotes(_this.contest);
      return {
        labels: candidateNames,
        datasets: [
          {
            fillColor: _this.colors,
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: candidateVotes
          }
        ]
      };
    };
    this.Update = function(contest) {
      _this.contest = contest;
      _this.data = getChartData();
      window.Chart.Update(
        _this.ctx,
        _this.data,
        _this.chartOptions,
        true,
        true
      );
    };
    init();
  };
  return electionChart;
})(window, undefined, jQuery, Chart);
var ElectionAjaxService = (function($, ElectionParams) {
  return {
    ajax: function(ajaxProps) {
      $.ajax({
        contentType: "application/json",
        crossDomain: true,
        data: {},
        dataType: "json",
        type: "GET",
        url: ElectionParams.serviceUrl,
        success: function(data, textStatus, jqXHR) {
          if (ajaxProps.success && typeof ajaxProps.success === "function")
            ajaxProps.success(data, textStatus, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (ajaxProps.error && typeof ajaxProps.error === "function")
            ajaxProps.error(jqXHR, textStatus, errorThrown);
        },
        complete: function(jqXHR, textStatus) {
          if (ajaxProps.complete && typeof ajaxProps.complete === "function")
            ajaxProps.complete(jqXHR, textStatus);
        }
      });
    }
  };
})(jQuery, ElectionParams);
(function($, handlebars, ElectionChart, ElectionAjaxService, ElectionParams) {
  $.support.cors = true;
  var $charts;
  var $lists;
  var $contestFilter;
  var $electionUpdateDate;
  var $electionPrecinctsReporting;
  var charts = [];
  var listTemplate = "";
  listTemplate += "{{#AllElections}}";
  listTemplate += "{{#contests}}";
  listTemplate += '<div class="contest contest-{{id}}">';
  listTemplate += '<h2 class="contest-name">{{toProperCase name}}</h2>';
  listTemplate += '<table class="table contest-results">';
  listTemplate += "<thead>";
  listTemplate +=
    "<tr><th>{{formatTableHeading name}}</th><th>Votes</th><th>Percentage</th></tr>";
  listTemplate += "</thead>";
  listTemplate += "<tbody>";
  listTemplate += "{{#candidates}}";
  listTemplate += "<tr>";
  listTemplate +=
    "<td>{{name}} {{#if party}}({{party}}){{/if}}</td><td>{{formatNumber votes}}</td><td>{{percentage}}</td>";
  listTemplate += "</tr>";
  listTemplate += "{{/candidates}}";
  listTemplate += "</tbody>";
  listTemplate += "</table>";
  listTemplate += "</div>";
  listTemplate += "{{/contests}}";
  listTemplate += "{{/AllElections}}";
  listTemplate += "{{^AllElections}}";
  listTemplate += '<div class="no-result">';
  listTemplate +=
    "<p>There are currently no results.  Please check back in a few minutes.</p>";
  listTemplate += "</div>";
  listTemplate += "{{/AllElections}}";
  var selectTemplate = "";
  selectTemplate += "{{#AllElections}}";
  selectTemplate += '<select class="contest-filter-select">';
  selectTemplate += "<option value=''>All Contests</option>";
  selectTemplate += "{{#contests}}";
  selectTemplate +=
    '<option value="{{id}}" {{selectedValue id}}>{{toProperCase name}}</name>';
  selectTemplate += "{{/contests}}";
  selectTemplate += "</select>";
  selectTemplate += "{{/AllElections}}";
  var colors = {
    dem: "#0000cc",
    rep: "#cc0000",
    ind: "#9966cc",
    writeIn: "#999",
    lib: "#f8df0c",
    grn: "#008000",
    con: "#ff9900",
    yes: "#ff9900",
    no: "#339999",
    qFor: "#9966cc",
    qAgainst: "#cc0000",
    cDefault: "#Feb30c"
  };
  var toProperCase = function(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };
  var isCanvasSupported = function() {
    return !!document.createElement("canvas").getContext;
  };
  var chooseColor = function(candidate) {
    var name = candidate.name.toLowerCase();
    var party = candidate.party ? candidate.party.toLowerCase() : null;
    if (party && colors[party]) return colors[party];
    else if (name === "write-in votes") return colors.writeIn;
    else if (name.indexOf("for") > -1) return colors.qFor;
    else if (name.indexOf("against") > -1) return colors.qAgainst;
    else if (name.indexOf("yes") > -1) return colors.yes;
    else if (name.indexOf("no") > -1) return colors.no;
    else return colors.cDefault;
  };
  var arrayMap = function(arr, func) {
    var result = [];
    var i;
    for (i = 0; i < arr.length; i += 1) result.push(func(arr[i]));
    return result;
  };
  var arrayForEach = function(arr, func) {
    var i;
    for (i = 0; i < arr.length; i += 1) func(arr[i]);
  };
  var arrayFind = function(arr, func) {
    var i;
    for (i = 0; i < arr.length; i += 1) if (func(arr[i])) return arr[i];
  };
  var getColors = function(candidates) {
    return arrayMap(candidates, chooseColor);
  };
  var makeElectionChart = function(contest) {
    var chartColors = getColors(contest.candidates);
    return new ElectionChart({
      id: contest.id,
      $container: $charts,
      contest: contest,
      colors: chartColors
    });
  };
  var createCharts = function(resp) {
    if (isCanvasSupported()) {
      $(".display-options").addClass("display-inline");
      var contests = resp.AllElections[0].contests;
      charts = arrayMap(contests, makeElectionChart);
      return charts;
    }
  };
  var getContestPreference = function() {
    if (sessionStorage !== undefined)
      return sessionStorage.getItem("current-contest");
  };
  var getElectionDataError = function(xhr, ignore, thrownError) {
    $lists.append(
      "Election results are temporarily unavailable.  Please check back in a few minutes."
    );
    if (console !== undefined) {
      console.error(xhr.status);
      console.error(thrownError);
    }
  };
  var getElectionData = ElectionAjaxService.ajax;
  var getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  };
  var getResultsPreference = function() {
    if (localStorage !== undefined) return localStorage.getItem("results-type");
    else
      return $.trim(
        $(".display-button.active")
          .text()
          .toLowerCase()
      );
  };
  var setBrowserTitle = function() {
    var resultsStr = "(Results Updated)";
    if (document.title.indexOf(resultsStr) === -1)
      document.title = resultsStr + " " + document.title;
  };
  var setContestPreference = function(contestId) {
    if (sessionStorage !== undefined)
      sessionStorage.setItem("current-contest", contestId);
  };
  var setElectionPrecinctsReporting = function(election) {
    $electionPrecinctsReporting.html(
      election.precinctsReporting +
        " of " +
        election.precincts +
        " Precincts Reporting"
    );
  };
  var getAdjustedDate = function(dateString) {
    return moment(dateString)
      .subtract({ hours: 5 })
      .format("MM/DD/YYYY h:mm:ss A");
  };
  var setElectionUpdateDate = function(election) {
    var updateDate = getAdjustedDate(election.date);
    $electionUpdateDate.html("Last updated: " + updateDate);
  };
  var setElectionInfo = function(contest) {
    setElectionPrecinctsReporting(contest);
    setElectionUpdateDate(contest);
  };
  var createLists = function(resp) {
    var template = handlebars.compile(listTemplate);
    var html = template(resp);
    setElectionInfo(resp.AllElections[0]);
    $lists.html(html);
    if ($contestFilter.html().indexOf("select") === -1) {
      var filterTemplate = handlebars.compile(selectTemplate);
      var selectHtml = filterTemplate(resp);
      $contestFilter.append(selectHtml);
    }
  };
  var setResultsPreference = function(type) {
    if (localStorage !== undefined) localStorage.setItem("results-type", type);
  };
  var showChart = function() {
    $lists.hide();
    $charts.show();
  };
  var showList = function() {
    $charts.hide();
    $lists.show();
  };
  var displayMobileView = function() {
    if ($(this).width() <= "650" && getParameterByName("semobipref") === "true")
      showList();
    else if (getResultsPreference() === "chart") showChart();
  };
  var showNotification = function() {
    var $notify = $(".notify");
    if (!$notify.html())
      $(document).notifyMe(
        "top",
        "info",
        "New Results are Available",
        "Select to Refresh Results",
        300
      );
  };
  var pollCallback = function(resp) {
    var election = resp.AllElections[0];
    var pageLastUpdated = $.trim(
      $electionUpdateDate
        .text()
        .replace("Last updated: ", "")
        .replace("\r", "")
        .replace("\n", "")
    );
    var electionDateStr = $.trim(election.date.replace("\r", ""));
    var electionDate = getAdjustedDate(electionDateStr);
    var pageLastUpdatedDate = pageLastUpdated;
    if (electionDate !== pageLastUpdatedDate) {
      setBrowserTitle();
      showNotification();
    }
  };
  var getButtonType = function($button) {
    return $.trim($button.text().toLowerCase());
  };
  var setDisplayButton = function($button) {
    var activeClass = "active";
    $button
      .siblings()
      .removeClass(activeClass)
      .attr("disabled", null)
      .end()
      .addClass(activeClass)
      .attr("disabled", "disabled");
    return getButtonType($button);
  };
  var getButtonByPreference = function() {
    var userResultsPreference = getResultsPreference();
    if (userResultsPreference === "chart") return $(".display-charts");
    else return $(".display-lists");
  };
  var getChartById = function(id) {
    return arrayFind(charts, function(chart) {
      return chart.id === id;
    });
  };
  var updateContestChart = function(contest) {
    var contestId = contest.id;
    var chart = getChartById(contestId);
    chart.Update(contest);
  };
  (function poll() {
    setTimeout(function() {
      ElectionAjaxService.ajax({
        success: pollCallback,
        error: function() {
          return;
        },
        complete: poll
      });
    }, ElectionParams.refreshPoll);
  })();
  $(document).ready(function() {
    var $button;
    $charts = $(".election-chart-results");
    $lists = $(".election-list-results");
    $contestFilter = $(".contest-filter");
    $electionUpdateDate = $(".election-update-date");
    $electionPrecinctsReporting = $(".election-reporting");
    $charts.html("");
    $button = getButtonByPreference();
    $button.trigger("click");
    setDisplayButton($button);
    getElectionData({
      success: function(resp) {
        createLists(resp);
        createCharts(resp);
        if (getContestPreference())
          $(".contest-filter-select").trigger("change");
        displayMobileView();
      },
      error: getElectionDataError
    });
  });
  $(window).on("resize", function() {
    var $btn = $(".display-button.active");
    if (
      $btn
        .text()
        .toLowerCase()
        .indexOf("chart") > -1
    )
      displayMobileView();
  });
  $(document).on("change", ".contest-filter-select", function() {
    var $this = $(this);
    var $contests = $(".contest");
    var contestId = $this.val();
    var $activeContest = $(".contest-" + contestId);
    setContestPreference(contestId);
    if (!contestId) {
      $contests.show();
      return;
    }
    $contests.hide();
    $activeContest.show();
  });
  $(document).on("click", "button.display-button", function(e) {
    e.preventDefault();
    var type = setDisplayButton($(this));
    if (type === "list") showList();
    else showChart();
    setResultsPreference(type);
  });
  $(document).on("click", ".notify", function() {
    getElectionData({
      success: function(resp) {
        var contests = resp.AllElections[0].contests;
        createLists(resp);
        arrayForEach(contests, updateContestChart);
        if (getContestPreference())
          $(".contest-filter-select").trigger("change");
        setElectionInfo(resp.AllElections[0]);
        document.title = document.title.replace("(Results Updated) ", "");
      },
      error: getElectionDataError
    });
  });

  Handlebars.registerHelper("formatTableHeading", function(contestName) {
    contestName = contestName.toLowerCase();
    if (
      contestName.indexOf("question") > -1 ||
      contestName.indexOf("judge spec") > -1
    )
      return "Result";
    return "Candidate";
  });

  Handlebars.registerHelper("selectedValue", function(contestId) {
    var selectedId = parseInt(getContestPreference());
    if (selectedId === contestId) return "selected";
  });

  Handlebars.registerHelper("toProperCase", function(property) {
    if (property.indexOf("U.S.") > -1)
      return "U.S." + toProperCase(property.replace("U.S.", ""));
    return toProperCase(property);
  });

  Handlebars.registerHelper("formatNumber", function(num) {
    return num.toLocaleString();
  });
})(jQuery, Handlebars, ElectionChart, ElectionAjaxService, ElectionParams);
