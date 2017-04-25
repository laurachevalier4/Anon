// some code taken from http://bl.ocks.org/dbuezas/9306799 and https://bl.ocks.org/mbostock/3887235
function drawChart(question_id, prod) {
  var svg = d3.select("#" + question_id); // individual svg has id #question_id
  var margin = 50,
      width = $("svg").parent().width(),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2 - margin,
      g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + height / 2 + ")");

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { console.log(d); 
        if (d.voters) {
          return d.voters.length;
        } else {
          return d.count;
        }
      });

  svg.append("g")
    .attr("class", "labels");

  var arc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var label = d3.arc()
      .outerRadius(radius * .8)
      .innerRadius(radius * .8);

  function countGenders(data) {
    var genders = {};
    data.data.voters.forEach(function(voter) {
      genders[voter.gender] = genders[voter.gender] + 1 || 1;
    });
    genderList = [];
    Object.keys(genders).forEach(function(el) {
      genderList.push({ "gender": el, "count": genders[el] });
    });
    data.genders = genderList;
    return genderList;
  }

  var url;
  if (prod) {
    url = "https://anonymus.herokuapp.com/api/";
  } else {
    url = "http://localhost:5000/api/";
  }
  d3.json(url + question_id.slice(3) + "/voters.json", function(error, data) {
    function draw(mydata, el) {
      console.log(mydata);
      console.log("drawing");
      if (error) throw error;
      var path;
      if (el) {
        d3.select(el).selectAll("path").remove();
        path = d3.select(el).selectAll("path")
          .data(pie(mydata))
        .enter().append("path")
          .attr("fill", function(d, i) { console.log(d); return color(i); })
          .attr("d", arc)
          //.each(function(d) { this._current = d; }); // store the initial angles
      } else {
        path = g.selectAll("path")
            .data(pie(mydata))
          .enter().append("path")
            .attr("fill", function(d, i) { console.log(d); return color(i); })
            .attr("d", arc)
            //.each(function(d) { this._current = d; }); // store the initial angles
        appendText("answer");
      }

      console.log("path", path);

      d3.selectAll("path")
        .on("click", change)
        .each(function(d, i) { // each d is an answer
          this.data = d;
        });

      function appendText(text) {
        path.append("text") // angles taken from http://stackoverflow.com/questions/8053424/label-outside-arc-pie-chart-d3-js
          .attr("transform", function(d) { 
            console.log(d);
            var c = arc.centroid(d), x = c[0], y = c[1],
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
            //if (d.data.voters.length > 0) {
              if (text === "answer") {
                console.log("here");
                return d.data.answer;
              } else {
                return d.data.gender;
              }
          });
      }
    }

    data = [data];
    data.forEach(function(d) {
      d.answers = Object.keys(d);
      d.answers = d.answers.map(function(ans) {
        return {
          "answer": ans,
          "voters": d[ans]
        };
      });
    });
    data = data[0].answers;

    draw(data);

    function change() { // https://bl.ocks.org/mbostock/1346410
      // d3.select(this.parentNode.parentNode).selectAll(".charttext").remove(); // remove previous labels
      var genders = countGenders(this.data); // list of objects with gender, count
      /*pie.value(function(d) {
        console.log(d);
        return d.count;
      });
      path = path.data(pie(genders)); // compute the new angles
      console.log(this._current);
      path.transition().duration(750).attrTween("d", arcTween.bind(this)); // redraw the arcs
      appendText("gender");*/
      console.log(this.parentNode);
      draw(genders, this.parentNode);
    }
  });

  function arcTween(a) {
    console.log(a); // gender data for correct question
    console.log(this); // logs just clicked path
    console.log(this._current);
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      console.log(arc(i(t)));
      return arc(i(t));
    };
  }
  

  /*var width = 960,
    height = 500,
    radius = Math.min(width, height) / 2;

  var color = d3.scale.category20();

  var pie = d3.layout.pie()
      .value(function(d) { return d.apples; })
      .sort(null);

  var arc = d3.svg.arc()
      .innerRadius(radius - 100)
      .outerRadius(radius - 20);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  d3.tsv("data.tsv", type, function(error, data) {
    if (error) throw error;

    var path = svg.datum(data).selectAll("path")
        .data(pie)
      .enter().append("path")
        .attr("fill", function(d, i) { return color(i); })
        .attr("d", arc)
        .each(function(d) { this._current = d; }); // store the initial angles

    d3.selectAll("input")
        .on("change", change);

    var timeout = setTimeout(function() {
      d3.select("input[value=\"oranges\"]").property("checked", true).each(change);
    }, 2000);

    function change() {
      var value = this.value;
      clearTimeout(timeout);
      pie.value(function(d) { console.log(d); return d[value]; }); // change the value function
      // Object {apples: 28479, oranges: 200}
      path = path.data(pie); // compute the new angles
      path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
    }
  });

  function type(d) {
    d.apples = +d.apples;
    d.oranges = +d.oranges;
    return d;
  }

  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a) {
    console.log(this);
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }*/
}


