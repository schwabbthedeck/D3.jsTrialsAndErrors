// For now all tutorials are done in this file -> decided to break up js files for easier debugging and such
// Each section will be labeled and include a link to the source when it's available


// Simple Bar Chart Video Tutorial - https://scrimba.com/p/pEKMsN/cast-1953
// var data = [30, 86, 168, 281, 303, 365];

// d3.select(".chart").selectAll("div").data(data).enter().append("div").style("width", function(d) { return d + "px"; }).text(function(d) { return d; });


// Let's Make a Bar Chart Part I - https://bost.ocks.org/mike/bar/
// var data = [4, 8, 15, 16, 23, 42];

// var x = d3.scaleLinear()
//     .domain([0, d3.max(data)])
//     .range([0, 420]);

// d3.select(".chart")
//   .selectAll("div")
//     .data(data)
//   .enter().append("div")
//     .style("width", function(d) { return x(d) + "px"; })
//     .text(function(d) { return d; });


// Let's Make a Bar Chart Part II - https://bost.ocks.org/mike/bar/2/
// had to update code and change some things around to get it to work
// (function () {
//   d3.tsv("./sampleData/data.tsv", function(d) {
//     return {
//       name: d.name,
//       value: +d.value
//     }
//   }).then(function (data) {
//     var width = 420;
//     var barHeight = 20;

//     var x = d3.scaleLinear()
//       .domain([0, d3.max(data, function(d){ return d.value; })])
//       .range([0, width]);

//     var chart = d3.select(".chart")
//       .attr("width", width)
//       .attr("height", barHeight * data.length);

//     var bar = chart.selectAll("g")
//       .data(data)
//       .enter().append("g")
//       .attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

//     bar.append("rect")
//       .attr("width", function(d) { return x(d.value); })
//       .attr("height", barHeight - 1);

//     bar.append("text")
//       .attr("x", function (d) { return x(d.value) - 3; })
//       .attr("y", barHeight / 2)
//       .attr("dy", ".35em")
//       .text(function (d) { return d.value; });
//   });
// })();


// Let's Make a Bar Chart Part III - https://bost.ocks.org/mike/bar/3/
(function () {
  var margin = { top: 20, right: 30, bottom: 30, left: 40 };
  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1);

  var y = d3.scaleLinear()
    .range([height, 0]);

  var xAxis = d3.axisBottom(x);

  var yAxis = d3.axisLeft(y).ticks(10, "%");

  var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.tsv("./sampleData/dataBarChart3.tsv", function (d) {
    return {
      name: d.name,
      value: +d.value
    }
  }).then(function (data) {
    x.domain(data.map(function (d) { return d.name; }));
    y.domain([0, d3.max(data, function (d) { return d.value; })]);

    // var bar = chart.selectAll("g")
    //   .data(data)
    //   .enter().append("g")
    //   .attr("transform", function (d, i) { return "translate(" + x(d.name) + ",0)"; });

    // bar.append("rect")
    //   .attr("y", function (d) { return y(d.value); })
    //   .attr("height", function (d) { return height - y(d.value); })
    //   .attr("width", x.bandwidth());

    // bar.append("text")
    //   .attr("x", x.bandwidth() / 2)
    //   .attr("y", function (d) { return y(d.value) + 3; })
    //   .attr("dy", ".75em")
    //   .text(function (d) { return d.value; });

    chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", ".71em")
      .style("text-anchor", "middle")
      .text("Frequency");

    chart.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x(d.name); })
      .attr("y", function (d) { return y(d.value); })
      .attr("height", function (d) { return height - y(d.value); })
      .attr("width", x.bandwidth());
  });
})();
