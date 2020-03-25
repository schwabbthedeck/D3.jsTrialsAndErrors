// testing creating stacked bar chart
// using example from this site: 
// https://tympanus.net/codrops/2012/08/29/multiple-area-charts-with-d3-js/
// reproduced here for better understanding
// goal is to rebuild, then repurpose with multiple bar graphs

(function () {
  var margin = { top: 10, right: 40, bottom: 150, left: 60 };
  var width = 940 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;
  var contextHeight = 50;
  var contextWidth = width * 0.5;

  var svg = d3.select(".chart")
    .attr("width", (width + margin.left + margin.right))
    .attr("height", (height + margin.top + margin.bottom));
 
  // d3.csv('./MultipleAreaChartsD3/data.csv', createChart);
  d3.csv('./MultipleAreaChartsD3/data.csv', function (d) {
    return {
      Year: d.Year,
      France: d.France,
      Germany: d.Germany,
      Japan: d.Japan,
      UK: d.UK,
      USA: d.USA
    }
  }).then(createLineChart);

  function createLineChart(data) {
    var countries = [];
    var charts = [];
    var maxDataPoint = 0;

    /* Loop through first row and get each country 
    and push it into an array to use later */
    // TODO NOTES country == employee
    for (var prop in data[0]) {
      if (data[0].hasOwnProperty(prop)) {
        if (prop != 'Year') {
          countries.push(prop);
        }
      }
    };

    var countriesCount = countries.length;
    var startYear = data[0].Year;
    var endYear = data[data.length - 1].Year;
    var chartHeight = height * (1 / countriesCount);

    /* Let's make sure these are all numbers, 
    we don't want javaScript thinking it's text 
    
    Let's also figure out the maximum data point
    We'll use this later to set the Y-Axis scale
    */
    /* TODO NOTE we wont need to find out y axis because
    every y axis is going to have the same max of hours?
    */
    data.forEach(function (d) {
      for (var prop in d) {
        if (d.hasOwnProperty(prop)) {
          d[prop] = parseFloat(d[prop]);

          if (d[prop] > maxDataPoint) {
            maxDataPoint = d[prop];
          }
        }
      }

      // D3 needs a date object, let's convert it just one time
      d.Year = new Date(d.Year, 0, 1);
    });

    for (var i = 0; i < countriesCount; i++) {
      charts.push(new Chart({
        data: data.slice(),
        id: i,
        name: countries[i],
        width: width,
        height: height * (1 / countriesCount),
        maxDataPoint: maxDataPoint,
        svg: svg,
        margin: margin,
        showBottomAxis: (i == countries.length - 1)
      }));
    }

    /* Let's create the context brush that will 
    let us zoom and pan the chart */
    var contextXScale = d3.scaleTime()
      .range([0, contextWidth])
      .domain(charts[0].xScale.domain());

    var contextAxis = d3.axisBottom(contextXScale)
      .tickSize(contextHeight)
      .tickPadding(-10);

    var contextArea = d3.area()
      .curve(d3.curveMonotoneX)
      .x(function (d) { return contextXScale(d.date); })
      .y0(contextHeight)
      .y1(0);

    var brush = d3.brushX(contextXScale)
      .on("end", onBrush);

    var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + (margin.left + width * .25) + "," + (height + margin.top + chartHeight) + ")");

    context.append("g")
      .attr("class", "x axis top")
      .attr("transform", "translate(0,0)")
      .call(contextAxis)

    context.append("g")
      .attr("class", "x brush")
      .call(brush)
      .selectAll("rect")
      .attr("y", 0)
      .attr("height", contextHeight);

    context.append("text")
      .attr("class", "instructions")
      .attr("transform", "translate(0," + (contextHeight + 20) + ")")
      .text('Click and drag above to zoom / pan the data');

    function onBrush() {
      /* this will return a date range to pass into the chart object */
      // var b = brush.empty() ? contextXScale.domain() : brush.extent();
      if (!d3.event.sourceEvent) return; // Only transition after input.
      if (!d3.event.selection) return; // Ignore empty selections.
      var d0 = d3.event.selection.map(contextXScale.invert);
      var d1 = d0.map(d3.timeDay.round);
      // If empty when rounded, use floor & ceil instead.
      if (d1[0] >= d1[1]) {
        d1[0] = d3.timeDay.floor(d0[0]);
        d1[1] = d3.timeDay.offset(d1[0]);
      }
      var b = d1;
      for (var i = 0; i < countriesCount; i++) {
        charts[i].showOnly(b);
      }
    }

    function Chart(options) {
      this.chartData = options.data;
      this.width = options.width;
      this.height = options.height;
      this.maxDataPoint = options.maxDataPoint;
      this.svg = options.svg;
      this.id = options.id;
      this.name = options.name;
      this.margin = options.margin;
      this.showBottomAxis = options.showBottomAxis;

      var localName = this.name;

      /* XScale is time based */
      this.xScale = d3.scaleTime()
        .range([0, this.width])
        .domain(d3.extent(this.chartData.map(function (d) { return d.Year; })));

      /* YScale is linear based on the maxData Point we found earlier */
      this.yScale = d3.scaleLinear()
        .range([this.height, 0])
        .domain([0, this.maxDataPoint]);
      var xS = this.xScale;
      var yS = this.yScale;

      /* 
        This is what creates the chart.
        There are a number of interpolation options. 
        'basis' smooths it the most, however, when working with a lot of data, this will slow it down 
      */
      this.area = d3.area()
        .curve(d3.curveBasis)
        .x(function (d) { return xS(d.Year); })
        .y0(this.height)
        .y1(function (d) { return yS(d[localName]); });
      /*
        This isn't required - it simply creates a mask. If this wasn't here,
        when we zoom/panned, we'd see the chart go off to the left under the y-axis 
      */
      this.svg.append("defs").append("clipPath")
        .attr("id", "clip-" + this.id)
        .append("rect")
        .attr("width", this.width)
        .attr("height", this.height);
      /*
        Assign it a class so we can assign a fill color
        And position it on the page
      */
      this.chartContainer = svg.append("g")
        .attr('class', this.name.toLowerCase())
        .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (10 * this.id)) + ")");

      /* We've created everything, let's actually add it to the page */
      this.chartContainer.append("path")
        .data([this.chartData])
        .attr("class", "chart")
        .attr("clip-path", "url(#clip-" + this.id + ")")
        .attr("d", this.area);

      // this.xAxisTop = d3.svg.axis().scale(this.xScale).orient("bottom");
      this.xAxisTop = d3.axisBottom(this.xScale);
      // this.xAxisBottom = d3.svg.axis().scale(this.xScale).orient("top");
      this.xAxisBottom = d3.axisTop(this.xScale);
      /* We only want a top axis if it's the first country */
      if (this.id == 0) {
        this.chartContainer.append("g")
          .attr("class", "x axis top")
          .attr("transform", "translate(0,0)")
          .call(this.xAxisTop);
      }

      /* Only want a bottom axis on the last country */
      if (this.showBottomAxis) {
        this.chartContainer.append("g")
          .attr("class", "x axis bottom")
          .attr("transform", "translate(0," + this.height + ")")
          .call(this.xAxisBottom);
      }

      // this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);
      this.yAxis = d3.axisLeft(this.yScale).ticks(5);

      this.chartContainer.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(-15,0)")
        .call(this.yAxis);

      this.chartContainer.append("text")
        .attr("class", "country-title")
        .attr("transform", "translate(15,40)")
        .text(this.name);

    }

    Chart.prototype.showOnly = function (b) {
      this.xScale.domain(b);
      this.chartContainer.select("path").data([this.chartData]).attr("d", this.area);
      this.chartContainer.select(".x.axis.top").call(this.xAxisTop);
      this.chartContainer.select(".x.axis.bottom").call(this.xAxisBottom);
    }

  }

})();

