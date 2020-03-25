// hierarchial bar chart 
// https://github.com/d3/d3-hierarchy
// https://observablehq.com/@d3/hierarchical-bar-chart

function renderData(data) {
  var root = d3.hierarchy(data)
    .sum(function(d) { return d.value})
    .sort(function(a, b) { return b.value - a.value})
    .eachAfter(function(d) {return d.index = d.parent ? d.parent.index = d.parent.index + 1 || 0 : 0});

  var margin = { top: 30, right: 30, bottom: 0, left: 100 };
  var duration = 750;

  var barStep = 27;
  var barPadding = 3 / barStep;
  var color = d3.scaleOrdinal([true, false], ["steelblue", "#aaa"]);

  var width = 888;

  // height calculation
  let max = 1;
  root.each(function(d) {return d.children && (max = Math.max(max, d.children.length))});
  var height = max * barStep + margin.top + margin.bottom;

  // axes
  var xAxis = function xAxis(g) { return g
    .attr("class", "x-axis")
    .attr("transform", "translate(0,".concat(margin.top, ")"))
    .call(d3.axisTop(x).ticks(width / 80, "s"))
    .call(function(g) {return (g.selection ? g.selection() : g).select(".domain").remove()})};
  var yAxis = function yAxiz(g) { return g
    .attr("class", "y-axis")
    .attr("transform", "translate(".concat(margin.left + 0.5, ",0)"))
    .call(function(g) {return g.append("line")
      .attr("stroke", "currentColor")
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)})};

  // x
  var x = d3.scaleLinear().range([margin.left, width - margin.right]);

  function stagger() {
    let value = 0;
    return function(d, i) {
      const t = "translate(".concat(x(value) - x(0), ",").concat(barStep * i, ")");
      value += d.value;
      return t;
    };
  }

  function stack(i) {
    let value = 0;
    return function(d) {
      const t = "translate(".concat(x(value) - x(0), ",").concat(barStep * i, ")");
      value += d.value;
      return t;
    };
  }

  function up(svg, d) {
    if (!d.parent || !svg.selectAll(".exit").empty()) return;

    // Rebind the current node to the background.
    svg.select(".background").datum(d.parent);

    // Define two sequenced transitions.
    const transition1 = svg.transition().duration(duration);
    const transition2 = transition1.transition();

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Update the x-scale domain.
    x.domain([0, d3.max(d.parent.children, function(d) { return d.value })]);

    // Update the x-axis.
    svg.selectAll(".x-axis").transition(transition1)
      .call(xAxis);

    // Transition exiting bars to the new x-scale.
    exit.selectAll("g").transition(transition1)
      .attr("transform", stagger());

    // Transition exiting bars to the parent’s position.
    exit.selectAll("g").transition(transition2)
      .attr("transform", stack(d.index));

    // Transition exiting rects to the new scale and fade to parent color.
    exit.selectAll("rect").transition(transition1)
      .attr("width", function(d) { return x(d.value) - x(0)})
      .attr("fill", color(true));

    // Transition exiting text to fade out.
    // Remove exiting nodes.
    exit.transition(transition2)
      .attr("fill-opacity", 0)
      .remove();

    // Enter the new bars for the clicked-on data's parent.
    const enter = bar(svg, down, d.parent, ".exit")
      .attr("fill-opacity", 0);

    enter.selectAll("g")
      .attr("transform", function(d, i) { return "translate(0,".concat(barStep * i, ")")});

    // Transition entering bars to fade in over the full duration.
    enter.transition(transition2)
      .attr("fill-opacity", 1);

    // Color the bars as appropriate.
    // Exiting nodes will obscure the parent bar, so hide it.
    // Transition entering rects to the new x-scale.
    // When the entering parent rect is done, make it visible!
    enter.selectAll("rect")
      .attr("fill", function(d) {return color(!!d.children)})
      .attr("fill-opacity", function(p) {return p === d ? 0 : null})
      .transition(transition2)
      .attr("width", function(d) {return x(d.value) - x(0)})
      .on("end", function (p) { d3.select(this).attr("fill-opacity", 1); });
  }

  function down(svg, d) {
    if (!d.children || d3.active(svg.node())) return;

    // Rebind the current node to the background.
    svg.select(".background").datum(d);

    // Define two sequenced transitions.
    const transition1 = svg.transition().duration(duration);
    const transition2 = transition1.transition();

    // Mark any currently-displayed bars as exiting.
    const exit = svg.selectAll(".enter")
      .attr("class", "exit");

    // Entering nodes immediately obscure the clicked-on bar, so hide it.
    exit.selectAll("rect")
      .attr("fill-opacity", function(p) {return p === d ? 0 : null});

    // Transition exiting bars to fade out.
    exit.transition(transition1)
      .attr("fill-opacity", 0)
      .remove();

    // Enter the new bars for the clicked-on data.
    // Per above, entering bars are immediately visible.
    const enter = bar(svg, down, d, ".y-axis")
      .attr("fill-opacity", 0);

    // Have the text fade-in, even though the bars are visible.
    enter.transition(transition1)
      .attr("fill-opacity", 1);

    // Transition entering bars to their new y-position.
    enter.selectAll("g")
      .attr("transform", stack(d.index))
      .transition(transition1)
      .attr("transform", stagger());

    // Update the x-scale domain.
    x.domain([0, d3.max(d.children, function(d) {return d.value})]);

    // Update the x-axis.
    svg.selectAll(".x-axis").transition(transition2)
      .call(xAxis);

    // Transition entering bars to the new x-scale.
    enter.selectAll("g").transition(transition2)
      .attr("transform", function(d, i) {return "translate(0,".concat(barStep * i, ")")});

    // Color the bars as parents; they will fade to children if appropriate.
    enter.selectAll("rect")
      .attr("fill", color(true))
      .attr("fill-opacity", 1)
      .transition(transition2)
      .attr("fill", function(d) {return color(!!d.children)})
      .attr("width", function(d) {return x(d.value) - x(0)});
  }

  // Creates a set of bars for the given data node, at the specified index.
  function bar(svg, down, d, selector) {
    const g = svg.insert("g", selector)
      .attr("class", "enter")
      .attr("transform", "translate(0,".concat(margin.top + barStep * barPadding, ")"))
      .attr("text-anchor", "end")
      .style("font", "10px sans-serif");

    const bar = g.selectAll("g")
      .data(d.children)
      .join("g")
      .attr("cursor", function(d) {return !d.children ? null : "pointer"})
      .on("click", function(d) {return down(svg, d)});

    bar.append("text")
      .attr("x", margin.left - 6)
      .attr("y", barStep * (1 - barPadding) / 2)
      .attr("dy", ".35em")
      .text(function(d) {return d.data.name});

    bar.append("rect")
      .attr("x", x(0))
      .attr("width", function(d) {return x(d.value) - x(0)})
      .attr("height", barStep * (1 - barPadding));

    return g;
  }

  // const svg = d3.create("svg")
  const svg = d3.select(".chart")
    .attr("width", width)
    .attr("height", height);

  x.domain([0, root.value]);

  svg.append("rect")
    .attr("class", "background")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .attr("width", width)
    .attr("height", height)
    .attr("cursor", "pointer")
    .on("click", function(d) {return up(svg, d)});

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  down(svg, root);

};

// fetch json file from library
function fetchJsonFile() {
  var siteUrl = _spPageContextInfo.siteAbsoluteUrl;
  var executor = new SP.RequestExecutor(siteUrl);
  var url = siteUrl + "/_api/web/GetFileByServerRelativeUrl('/accounting_/Accounting-Internal-Site/D3Data/flare-2.json')/$value";
  executor.executeAsync({
    url: url,
    method: "GET",
    headers: { "Accept": "application/json; odata=verbose" },
    success: successFetchJson,
    error: errorFetchJson
  });
}

function successFetchJson(data) {
  var jsonData = JSON.parse(data.body);
  renderData(jsonData);
}

function errorFetchJson(data, errorCode, errorMessage) {
  console.log("Error retrieving JSON data from library.");
  console.log(data.body);

}

fetchJsonFile();

