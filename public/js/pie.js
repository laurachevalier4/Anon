var d3 = require("d3");
var jsdom = require("node-jsdom");
var document = jsdom.jsdom();

function drawChart(question_id) {
  console.log(question_id);
  var svg = d3.select(document.body).append("svg"); // individual svg has id #question_id
  svg.attr("id", question_id);

  console.log("in pie.js");
  var width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2,
      g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.population; });

  var path = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var label = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

  // need to change this so it's not hardcoded as
  d3.json("http://localhost:5000/api/" + question_id + "/voters.json", function(d) {
    console.log(d);
    d.population = +d.population;
    return d;
  }, function(error, data) {
    if (error) throw error;

    var arc = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { return color(d.data.age); });

    arc.append("text")
        .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
        .attr("dy", "0.35em")
        .text(function(d) { return d.data.age; });
  });

  return svg.html();
};

module.exports = {
  drawChart
}
