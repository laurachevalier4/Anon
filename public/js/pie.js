function drawChart(question_id) {
  console.log(question_id);
  var svg = d3.select("#" + question_id); // individual svg has id #question_id
  console.log(svg);
  var width = +svg.attr("width"),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2,
      g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var color = d3.scaleOrdinal(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.voters; });

  var path = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var label = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

  // need to change this so it's not hardcoded as localhost
  d3.json("http://localhost:5000/api/" + question_id.slice(3) + "/voters.json", function(error, data) {
    console.log("data in d3.json", data);
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
    console.log(data);
    console.log("in d3.json callback");
    if (error) throw error;

    var arc = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { console.log(d); return color(d.data.answer); });

    arc.append("text")
        .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
        .attr("dy", "0.1em")
        .classed("charttext", true)
        .text(function(d) { return d.data.answer; })
  });
}
