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
