// ******* Initialize constants and global values *******
var data = []
var unitedairlines_data = []
var jetblue_data = []
var virginamerica_data = []
var deltaairlines_data = []
var southwestairlines_data = []
var svg, div, width, height; // global D3/SVG elements
var airline_selection;
var y_axis = "Number of Negative Tweets"; // number of negative tweets or ratio of neg:pos on y axis
var dict = {'unitedairlines': unitedairlines_data, 'jetblue': jetblue_data, 'virginamerica': virginamerica_data,
'deltaairlines': deltaairlines_data, 'southwestairlines': southwestairlines_data}

// ******* Load in Data *******
d3.csv("data/airline_data.csv", function(error, airline_data) {
  data = airline_data
  for(var i = 0; i < data.length; i++) {
    var d1 = Date.parse(data[i]['day']);
    var d2 = Date.parse("2017-10-01"); // upper bound
    var d3 = Date.parse("2017-03-31"); // lower bound
    if (d1 < d2 && d1 > d3) {
      if(data[i]['airline'] == "unitedairlines") {
        unitedairlines_data.push(data[i])
      }
      else if(data[i]['airline'] == "jetblue") {
        jetblue_data.push(data[i])
      }
      else if(data[i]['airline'] == "virginamerica") {
        virginamerica_data.push(data[i])
      }
      else if(data[i]['airline'] == "deltaairlines") {
        deltaairlines_data.push(data[i])
      }
      else if(data[i]['airline'] == "southwestairlines") {
        southwestairlines_data.push(data[i])
      }
    }
  }
  console.log(data)
  document.getElementById("loader").remove(); // remove the loader before drawing the svg
  main();
})

// ******* Actions that Require Altering SVG *******
$(window).resize(function() {
  main();
});

// ******* Main function to draw svg and refresh the graphs *******
function main() {
  // ******* Reset Canvas *******
  $('svg').remove();
  $('.tooltip').remove();
  // ******* Variables *******
  var domRect = document.getElementById("container").getBoundingClientRect();
  width = domRect.width;
  height = 500;
  // ******* Create SVG *******
  svg = d3.select("#container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("margin", "0 auto")
  .style("display", "block")
  .style("overflow", "visible")

  div = d3.select("#container").append("div")
  .attr("class", "tooltip")
  .style("margin-top", "100px")
  .html("-") // occupy tooltip space;

  generateGraph()
}

function generateGraph() { // for not hard resets, for example pressing the slider
  $('text').remove();
  $('.y-axis').remove();
  $('.graph-text').remove();

  airline_select = document.getElementById("airline_select");
  airline_selection = airline_select.options[airline_select.selectedIndex].text;
  console.log(airline_selection)
  // Parse the date / time
  var	parseDate = d3.isoParse

  var x = d3.scaleBand().rangeRound([0, width], .05).padding(0.1);
  var y = d3.scaleLinear().range([height, 0]);

  var xAxis = d3.axisBottom()
  .scale(x)
  .tickFormat(d3.timeFormat("%Y-%m-%d"));

  var yAxis = d3.axisLeft()
  .scale(y)
  .ticks(10);

  dict[airline_selection].forEach(function(d) {
    d.day = parseDate(d.day);
    d.negative_count = +d.negative_count;
    d.neutral_count = +d.neutral_count;
    d.positive_count = +d.positive_count;
  })

  console.log(dict[airline_selection])

  var y_axis_code = ""
  if (y_axis == "Number of Negative Tweets") { // which code to execute based on y_axis
    y_axis_code = "d.negative_count"
  }
  else {
    y_axis_code = "Math.round(d.negative_count * 100.0 / d.positive_count) / 100"
  }

  x.domain(dict[airline_selection].map(function(d) { return d.day; }).reverse());
  y.domain([0, d3.max(dict[airline_selection], function(d) {
    if(d['positive_count'] == 0) { // divide by 0 error
      return 0
    }
    return eval(y_axis_code);
  })]);

  svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis)
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-.8em")
  .attr("dy", "-.55em")
  .attr("transform", "rotate(-90)" )
  .style("font-size", 8);

  svg.append("g")
  .attr("class", "y-axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .text("Value");

  var update = svg.selectAll("bar")
  .data(dict[airline_selection])

  svg.selectAll("rect").remove(); // NOTE: remove since data may change!

  update.enter().append("rect")
  .style("fill", "#000000")
  .attr("x", function(d) { return x(d.day); })
  .attr("width", x.bandwidth())
  .attr("y", function(d) {
    if(d['positive_count'] == 0) { // divide by 0 error
      return 0
    };
    return y(eval(y_axis_code));
  })
  .attr("height", function(d) {
    if(d['positive_count'] == 0) { // divide by 0 error
      return 0
    }
    return height - y(eval(y_axis_code));
  })
  .on('mouseover', function(d) {
    d3.select(this).style('fill', "#03A9F4").transition().duration(1000); //pop of blue color
    div.html("" + d.day + " --- " + y_axis + ": " + eval(y_axis_code) + " --- Neg: " + d.negative_count + " --- Neu: " + d.neutral_count + " --- Pos: " + d.positive_count); //show tooltip
  })
  .on('mouseout', function(d) {
    d3.select(this).style('fill', "#000000").transition().duration(1000);
  })
  .on('click', function(d) {

  });

  // update.transition()
  // .duration(600)
  // .ease(d3.easeLinear)
  // .style("fill", "#000000")
  // .attr("y", function(d) { return y(eval(y_axis_code)); })
  // .attr("height", function(d) { return height - y(eval(y_axis_code)); })

  // graph title

  svg.append("text")
  .attr("class", "graph-text")
  .attr("x", (width / 2))
  .attr("y", -15)
  .attr("text-anchor", "middle")
  .style("font-size", "24px")
  .style("text-decoration", "underline")
  .text(y_axis + " Over Time");

  // now add titles to the axes

  svg.append("text")
  .attr("class", "graph-text")
  .attr("text-anchor", "middle") // center the text as the transform is applied to the anchor
  .attr("transform", "translate("+ (width/2) +","+(height+(75))+")")  // center below x axis
  .text("Date");

  svg.append("text")
  .attr("class", "graph-text")
  .attr("text-anchor", "middle")
  .attr("transform", "translate("+ 30 +","+(height/2)+")rotate(-90)") // move down, rotate, and slightly to left
  .text(y_axis);

};

function check() { // show the incorrectly categorized articles
  checkbox = document.getElementById("slider-switch");
  if (checkbox.checked) // true means it is checked (slider to right)
  {
    y_axis = "Ratio of Negative to Positive Tweets"
    generateGraph()
  }
  else {
    y_axis = "Number of Negative Tweets"
    generateGraph()
  }
}
