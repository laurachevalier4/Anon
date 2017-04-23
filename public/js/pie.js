// some code taken from http://bl.ocks.org/dbuezas/9306799 and https://bl.ocks.org/mbostock/3887235
function drawChart(question_id, prod) {
  console.log(prod);
  console.log(question_id);
  var svg = d3.select("#" + question_id); // individual svg has id #question_id
  console.log(svg);
  var margin = 50,
      width = $("svg").parent().width(),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2 - margin,
      g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + height / 2 + ")");

  var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.voters; });

  svg.append("g")
    .attr("class", "labels");
  svg.append("g")
    .attr("class", "lines");

  var key = function(d) { return d.answer; };

  var path = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var label = d3.arc()
      .outerRadius(radius * .8)
      .innerRadius(radius * .8);

  function midAngle(d){
    return d.startAngle + (d.endAngle - d.startAngle)/2;
  }

  var url;
  if (prod) {
    url = "https://anonymus.herokuapp.com/api/";
  } else {
    url = "http://localhost:5000/api/";
  }
  d3.json(url + question_id.slice(3) + "/voters.json", function(error, data) {
    data = [data];
    data.forEach(function(d) {
      d.answers = Object.keys(d);
      d.answers = d.answers.map(function(ans) {
        return {
          "answer": ans,
          "voters": d[ans].length
        };
      });
    });
    data = data[0].answers;
    if (error) throw error;

    var arc = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { return color(d.data.answer); });

    arc.append("text") // angles taken from http://stackoverflow.com/questions/8053424/label-outside-arc-pie-chart-d3-js
        .attr("transform", function(d) { 
          var c = path.centroid(d), x = c[0], y = c[1],
          // pythagorean theorem for hypotenuse
          h = Math.sqrt(x*x + y*y);
          var labelr = radius + 5; // label starts outside of the graph
          return "translate(" + (x/h * labelr) +  ',' + (y/h * labelr) +  ")"; 
        })
        .attr("text-anchor", function(d) {
          return (d.endAngle + d.startAngle)/2 > Math.PI ? "end" : "start";
        })
        .attr("dy", "0.1em")
        .classed("charttext", true)
        .text(function(d) { 
          if (d.data.voters > 0) {
            return d.data.answer;
          } else {
            return ""; // if there are no voters, don't add label
          }
        })
  });
}
