// creating stacked bar chart 
// using example from this site: 
// https://tympanus.net/codrops/2012/08/29/multiple-area-charts-with-d3-js/
// reproduced here for better understanding
// goal is to reuse multiple chart areas from link above to build multiple bar graphs

// TODO:
// add legend
// add add tool tips
// add title 
// (?)add bottom and right axis labels

(function () {
  var margin = { top: 10, right: 40, bottom: 150, left: 120 };
  var width = 940 - margin.left - margin.right;
  // putting off height measurement until we know how many employees we have
  // var height = 500 - margin.top - margin.bottom;

  var svg = d3.select(".chart")
    .attr("width", (width + margin.left + margin.right));
  //    .attr("height", (height + margin.top + margin.bottom));

  d3.csv('./sampleData/cleaned_planned_vs_actual.csv', function (d) {
    return {
      EmployeeName: d.EmployeeName,
      StartDate: new Date(d.StartDate),
      EndDate: new Date(d.EndDate),
      Project: d.Project,
      PeriodHrs: +d.PeriodHrs,
      ActualRegHrs: +d.ActualRegHrs,
      ActualOvtHrs: +d.ActualOvtHrs,
      ScaleMaxHrs: +d.scale_maxhrs
    }
  }).then(createCharts);

  function createCharts(data) {
    // array of charts
    var charts = [];
    // array of employees
    var employees = [];
    // used to track unique employees added to employees
    var uniqueEmployees = [];
    // set these all as first items values for comparison
    var minStartDate = data[0].StartDate;
    var maxEndDate = data[0].EndDate;
    var scaleMaxHours = data[0].ScaleMaxHrs;

    for (var i = 0; i < data.length; i++) {
      // check for unique employees name
      if (!uniqueEmployees[data[i].EmployeeName]) {
        employees.push(data[i].EmployeeName);
        uniqueEmployees[data[i].EmployeeName] = 1;
      }

      // check start date to set earliest date as start date for date range
      if (data[i].StartDate < minStartDate) {
        minStartDate = data[i].StartDate;
      }

      // check end date to set latest date as end date for date range
      if (data[i].EndDate > maxEndDate) {
        maxEndDate = data[i].EndDate;
      }

      // check scale max hours - want the largest number in the set
      if (data[i].ScaleMaxHrs > scaleMaxHours) {
        scaleMaxHours = data[i].ScaleMaxHrs;
      }

      // need to remove all NaN values and replace them with zeros
      if (isNaN(data[i].PeriodHrs)) { data[i].PeriodHrs = 0; }
      if (isNaN(data[i].ActualRegHrs)) { data[i].ActualRegHrs = 0; }
      if (isNaN(data[i].ActualOvtHrs)) { data[i].ActualOvtHrs = 0; }
    }

    // "nest" data by employee
    var nestedData = d3.nest()
      .key(function (d) { return d.EmployeeName })
      .entries(data);

    var employeeCount = nestedData.length;

    // calculate height here
    var perChartHeight = 150;
    var height = (perChartHeight * employeeCount) - margin.top - margin.bottom;
    svg.attr("height", (height + margin.top + margin.bottom + (perChartHeight + 20)));

    for (var i = 0; i < employeeCount; i++) {
      charts.push(new Chart({
        chartData: nestedData[i].values.slice(),
        width: width,
        height: height * (1 / employeeCount),
        maxDataPoint: scaleMaxHours,
        startDate: minStartDate,
        endDate: maxEndDate,
        svg: svg,
        id: i,
        name: nestedData[i].key,
        margin: margin,
        showBottomAxis: (i == employeeCount - 1)
      }));
    }

    // var employeeCount = employees.length;
    // for (var i = 0; i < employeeCount; i++) {
    //   charts.push(new Chart({
    //     data: data.slice(),
    //     width: width,
    //     height: height * (1 / employeeCount),
    //     maxDataPoint: scaleMaxHours,
    //     startDate: minStartDate,
    //     endDate: maxEndDate,
    //     svg: svg,
    //     id: i,
    //     name: employees[i],
    //     margin: margin,
    //     showBottomAxis: (i == employeeCount - 1)
    //   }));
    // }

    // charts.push(new Chart({
    //   data: data.slice(),
    //     width: width,
    //     height: height * (1/employeeCount),
    //     maxDataPoint: scaleMaxHours,
    //     startDate: minStartDate,
    //     endDate: maxEndDate,
    //     svg: svg,
    //     id: 0,
    //     name: employees[0],
    //     margin: margin,
    //     showBottomAxis: false
    // }));

    function Chart(options) {
      this.chartData = options.chartData;
      this.width = options.width;
      this.height = options.height;
      this.maxDataPoint = options.maxDataPoint;
      this.startDate = options.startDate;
      this.endDate = options.endDate;
      this.svg = options.svg;
      this.id = options.id;
      this.name = options.name;
      this.margin = options.margin;
      this.showBottomAxis = options.showBottomAxis;

      var localEmployeeName = this.name;
      var chartHeight = this.height - 10;
      var barWidth = 15;

      var chartContainer = svg.append("g")
        .attr("height", chartHeight)
        .attr("width", this.width)
        .attr("class", "chart_" + this.id + " " + localEmployeeName.replace(/ /g, "_"))
        .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (perChartHeight * this.id)) + ")");

      // x scale is time based
      var x = d3.scaleTime()
        .range([0, this.width])
        .domain([this.startDate, this.endDate]);

      // var x = d3.scaleBand()
      //   .rangeRound([0, this.width])
      //   .domain(this.chartData.map(function (d) { return d3.timeMonday(d.StartDate)}))
      //   .padding(0.1);

      // var x = d3.scaleOrdinal()
      //   .domain(this.chartData.map(function (d) { return d3.timeMonday(d.StartDate)}))
      //   .range([0, width]);

      // y scale is linear based on max hours
      var y = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, this.maxDataPoint]);

      // set up x-axis
      // one with labels for bottom chart
      var xAxisWithLabels = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b-%d-%y"))
        .ticks(d3.timeMonday);
      // one without labels for all other charts
      var xAxisWithoutLabels = d3.axisBottom(x)
        .tickFormat(d3.timeFormat(""))
        .ticks(d3.timeMonday);
      // set up y-axis
      var yAxis = d3.axisRight(y)

      // grid lines in y axis function
      var yAxisGridLines = d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("");

      // append/create actual hours bars
      chartContainer.selectAll(".bar.actual-hours")
        .data(this.chartData)
        .enter().append("rect")
        .attr("class", "bar actual-hours")
        .attr("x", function (d) { return x(d3.timeMonday(d.StartDate)); })
        .attr("y", function (d) { return y(d.ActualRegHrs); })
        .attr("height", function (d) { return chartHeight - y(d.ActualRegHrs); })
        .attr("width", barWidth)
        .attr("dx", -5);

      // append/create overtime hours bars
      chartContainer.selectAll(".bar.overtime-hours")
        .data(this.chartData)
        .enter().append("rect")
        .attr("class", "bar overtime-hours")
        .attr("x", function (d) { return x(d3.timeMonday(d.StartDate)); })
        .attr("y", function (d) { return y(d.ActualRegHrs + d.ActualOvtHrs); })
        .attr("height", function (d) { return chartHeight - y(d.ActualOvtHrs); })
        .attr("width", barWidth)
        .attr("dx", -5);

      // append/create planned hours bars
      chartContainer.selectAll(".bar.planned-hours")
        .data(this.chartData)
        .enter().append("rect")
        .attr("class", "bar planned-hours")
        .attr("x", function (d) { return x(d3.timeMonday(d.StartDate)); })
        .attr("y", function (d) { return y(d.PeriodHrs); })
        .attr("height", function (d) { return chartHeight - y(d.PeriodHrs); })
        .attr("width", barWidth)
        .attr("dx", -5);

      // only show bottom axis on last employee
      if (this.showBottomAxis) {
        chartContainer.append("g")
          .attr("class", "x axis bottom")
          .attr("transform", "translate(0," + chartHeight + ")")
          .call(xAxisWithLabels)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-1em")
          .attr("dy", "-0.6em")
          .attr("transform", "rotate(-90)");
      } else {
        // otherwise just show the tick marks to help reading the chart
        chartContainer.append("g")
          .attr("class", "x axis bottom")
          .attr("transform", "translate(0," + chartHeight + ")")
          .call(xAxisWithoutLabels);
      }

      // append y-axis
      chartContainer.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + this.width + ",0)")
        .call(yAxis);

      // append y-axis grid lines
      chartContainer.append("g")
        .attr("class", "grid")
        .call(yAxisGridLines);

      // append employee name to left
      chartContainer.append("g")
        .append("text")
        .attr("x", -110)
        .attr("y", this.height / 3)
        .attr("dy", ".71em")
        .attr("text-anchor", "start")
        .attr("font-size", "1.1em")
        .text(localEmployeeName);

    }
  }

})();