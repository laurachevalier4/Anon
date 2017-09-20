// some code taken from http://bl.ocks.org/dbuezas/9306799 and https://bl.ocks.org/mbostock/3887235
function drawChart(question_id, prod) {
  var svg = d3.select("#" + question_id); // individual svg has id #question_id
  var margin = 50,
      width = $("svg").parent().width(),
      height = +svg.attr("height"),
      radius = Math.min(width, height) / 2 - margin,
      g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + height / 2 + ")");

  var color = d3.scaleOrdinal(d3.schemeCategory20b);

  var pie = d3.pie()
      .sort(null)
      .value(function(d) { 
        if (d.voters) {
          return d.voters.length;
        } else {
          return d.count;
        }
      });

  svg.append("g")
    .attr("class", "labels");

  var path = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var label = d3.arc()
      .outerRadius(radius * .8)
      .innerRadius(radius * .8);

  function countGenders(voters) {
    var genders = {};
    voters.forEach(function(voter) {
      genders[voter.gender] = genders[voter.gender] + 1 || 1;
    });
    genderList = [];
    Object.keys(genders).forEach(function(el) {
      genderList.push({ "gender": el, "count": genders[el], "percent": genders[el]/voters.length * 100 });
    });
    return genderList;
  }

  function averageAge(voters) {
    var ageSum = voters.reduce(function(acc, voter) {
      return acc + voter.age;
    }, 0);
    return ageSum / voters.length;
  }

  var url;
  if (prod) {
    url = "https://anonymus.herokuapp.com/api/";
  } else {
    url = "http://localhost:5000/api/";
  }
  d3.json(url + question_id.slice(3) + "/voters.json", function(error, data) {
    function draw(mydata) {
      if (error) throw error;

      var arc = g.selectAll(".arc")
        .data(pie(mydata))
        .enter().append("g")
          .attr("class", "arc")

      arc
        .append("path")
        .attr("d", path)
        .attr("id", function(d) {
        })
        .attr("fill", function(d, i) { return color(i); })

      arc
        .on("mouseover", onMouseover)
        .on("mouseout", onMouseout);

      appendText(arc);
    }

    function onMouseover(sector) {
      d3.select(this)
        .select("path")
        .style("stroke", "white")
        .style("stroke-width", "1.5px");

      d3.select("#tooltip")
        .style('visibility', 'visible')
          .html(() => { 
            var describe = "";
            var genderData = countGenders(sector.data.voters);
            var avgAge = averageAge(sector.data.voters);
            describe+="<h3>" + sector.data.answer + "</h3>"
            genderData.forEach(function(gender) {
              if (gender.gender === "F") {
                describe+="<p>" + gender.percent.toFixed(1) + "%" + " Female</p>";
              } else {
                describe+="<p>" + gender.percent.toFixed(1) + "%" + " Male</p>";
              }
            });
            describe+="<p>Average age: " + avgAge.toFixed(1) + "</p>";
            return describe; 
          })
            .style("top", function () {
              return d3.event.pageY - 20 + "px"/*$("#"+question_id).offset().top + 20 + 'px'*/;
            })
            .style("left", function () {
              return d3.event.pageX - 20 + 'px';
            })
            .style('font-size', '1em')
            .style('font-family', 'Buda, cursive');
    }

    function onMouseout() {
      d3.select(this)
        .select("path")
        .style("stroke", "none");
      d3.select("#tooltip")
        .style('visibility', 'hidden');
    }

    function appendText(arc) {
      arc.append("text") // angles taken from http://stackoverflow.com/questions/8053424/label-outside-arc-pie-chart-d3-js
        .attr("transform", function(d) { 
          var c = label.centroid(d), x = c[0], y = c[1],
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
          if (d.data.voters.length > 0) {
            return d.data.answer;
          } else {
            return "";
          } 
        });
      }

    data = [data];
    data.forEach(function(d) {
      d.answers = Object.keys(d);
      d.answers = d.answers.map(function(ans) {
        return {
          "answer": ans,
          "voters": d[ans].slice(1),
          "id": d[ans][0].id
        };
      });
    });
    data = data[0].answers;

    draw(data);

  });
}


