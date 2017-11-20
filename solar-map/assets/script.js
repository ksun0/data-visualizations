document.getElementById("slider-switch").disabled = true; // NOTE: This Functionality coming soon!

// ******* Initialize constants and global values *******
var dataset = [] // dataset contains 874068 entries: 1293 coordinates each with 676 time entries (52 weeks, 1 day in a week, 13 hours per day)
var ma_json = [] // json data for Massachusetts
var colors = [] // Color array used to represent GHI values for coordinates
var time_index = 0; // Keep track of which row of the 676 time entries (week and hour) that is used currently
var curWeek = 1; // keep track of the current Week
var curHour = 1; //keep trach of the current hour
var curData; // dataset that contains all of the data of the point currently selected
var curChoice = 0; // start out with the first coordinate point
var solarChoice = 'GHI'; // GHI or temperature data
var svg, svg_info, div, projection, width, height; // global D3/SVG elements

const padding = 30;
const numHoursWeek = 13; // Only data from 6AM to 6PM is being retrived for first day (Thursday) in every week (13 hours worth of data)
const numWeeksYear = 52;

// ******* Setup Time Sliders *******
// on page load, set the text of the week label based the value of the input slider
$('#weekLabel').text(getDate(getWeek()));

// setup an event handler to set the text when the week input is changed
$('#week').on('input change', function() {
  $('#weekLabel').text(getDate(getWeek()));
  time_index = getDataIndex(getWeek(), getHour());
  refreshData(); // data changes based on what time it is, so redraw svg
});

// on page load, set the text of the hour label based the value of the input slider
$('#hourLabel').text("Hour: " + (parseInt($('#hour').val()) + 5) + ":00 (Millitary Time)"); // 1 is hour 6, 2 is hour 7 ... so on ...

// setup an event handler to set the text when the hour input is changed
$('#hour').on('input change', function() {
  $('#hourLabel').text("Hour: " + (parseInt($('#hour').val()) + 5) + ":00 (Millitary Time)");
  time_index = getDataIndex(getWeek(), getHour());
  refreshData();
});

function getWeek() { // get the current week
  return parseInt($('#week').val());
}

function getHour() { // get the current hour
  return parseInt($('#hour').val());
}

function getDataIndex(weekVal, hourVal) { // get the index of 4745 time entries based on week and hour
  var index = (weekVal - 1) * numHoursWeek + (hourVal - 1);
  return index;
}

function getDate(weekVal) { // return string format of date based on the current week
  var numDaysMonth = [["January",31], ["February",59], ["March", 90], ["April",120], ["May",151], ["June",181],
  ["July",212], ["August",243], ["September",273], ["October",304], ["November",334], ["December",365]];
  var day = weekVal * 7 - 6;
  var month = ''
  if(day < 31) {
    return 'Date: January ' + day + ", 2015"
  }
  else {
    for(var i =0; i < numDaysMonth.length; i++) {
      if(day <= numDaysMonth[i][1]) {
        month = numDaysMonth[i][0];
        day = day - numDaysMonth[i-1][1];
        break;
      }
    }
    return 'Date: ' + month + " " + day + ", 2015"
  }
}

// ******* Load in Data *******
d3.json("assets/ma.json", function(error, json) {
  d3.csv("ma_coords.csv", function(error, ma_coords) { // 1293 coorginates
    d3.csv("data_2015_clean/data.csv", function(error, data) { // load in GHI and temp data for every coordinate
      ma_json = json // initialize ma_json so it can be used elsewhere
      var pointsPerYear = numWeeksYear * numHoursWeek; // number of time entries per year for a coordinate
      for (var i = 0; i < data.length; i += pointsPerYear) {
        var k = "" + ma_coords[i / pointsPerYear]['lat'] + "_" + ma_coords[i / pointsPerYear]['long']
        dataset.push({
          coords: k,
          data: data.slice(i, i + pointsPerYear)
        }) // setup the dataset nicely with a coordinate and that coordinate's time data (with GHI and temp)
      }
      var r = 255; // red value
      var g = 255; // gree value
      var b = 255; // blue value
      for (var i = 255; i >= 0; i--) {
        r -= 1;
        g -= 1;
        b -= 1;
        colors.push("rgb(" + r + "," + g + "," + b + ")");
      }
      document.getElementById("loader").remove(); // remove the loader before drawing the svg
      refreshGraphs();
    })
  })
})

// ******* Actions that Require Altering SVG *******
$(window).resize(function() {
  refreshGraphs();
});

function changeSolarChoice() {// change the solar choice when switch is clicked from GHI to temperature
  checkbox = document.getElementById("slider-switch");

  if (checkbox.checked) // true means it is checked (slider to right)
  {
    solarChoice = 'Temperature'
  }
  else {
    solarChoice = "GHI"
  }
  refreshData();
}

// ******* Main function to draw svg and refresh the graphs *******
function refreshGraphs() {
  // ******* Reset Canvas *******
  $('svg').remove();
  $('.tooltip').remove();
  // ******* Variables *******
  var domRect = document.getElementById("container").getBoundingClientRect();
  width = domRect.width;
  height = 450;
  // ******* Create SVG *******
  svg = d3.select("#container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("margin", "0 auto")
  .style("display", "block")
  .style("overflow", "visible")

  svg_info = d3.select("#info").append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("margin", "0 auto")
  .style("display", "block")
  .style("overflow", "visible")

  div = d3.select("#container").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .html("Latitude: -- Longitude: ") // occupy tooltip space;

  projection = d3.geoConicEquidistant()
  .rotate([74 + 30 / 60, -38 - 50 / 60])
  // ******* Generate path *******
  projection.fitExtent(
    [
      [padding, padding],
      [-padding + width, -padding + height]
    ],
    ma_json
  )
  var path = d3.geoPath().projection(projection);

  svg.selectAll("path")
  .data(ma_json.features)
  .enter()
  .append("path")
  .attr("d", path)
  .attr("stroke", "#000000")
  .attr('fill', "#ffffff");

  makeGraph();
  refreshData();
}

// ******** Helper functions for data constancy in makeGraoh and refreshData
function getData(){
  return dataset[curChoice]['data'];
}
function getFill(d){
  if(solarChoice == 'GHI') {
    return colors[Math.floor(+d['data'][time_index][solarChoice] / 5)] // max GHI is 1018, so this scales it down to 0-255 rgb scale
  }
  else {
    return colors[Math.floor(+d['data'][time_index][solarChoice] + 25) * 4]
  }
}

// ******** make the bottom graphs with more info
function makeGraph() {
  $('#textDisplay').remove();
  curData = getData();
  // ******* GENERATE GRAPHS ********
  var yearGraph = svg_info.append("g").attr("id", "yearGraph");
  // ******** X AXIS **********
  // X scale to convert week to coordinate point
  var yearTimeScale = d3.scaleLinear()
  .domain([1, numWeeksYear])
  .range([padding, width / 2])
  var xYearAxis = d3.axisBottom(yearTimeScale).ticks(12);
  yearGraph.append("g")
  .attr("transform", `translate(0, ${height-padding})`)
  .attr("id", "xYearAxis")
  .call(xYearAxis)
  // X AXIS LABEL
  yearGraph.append("text")
  .attr("transform",  `translate(${width / 4}, ${height})`)
  .text('Week of Year')
  .style('text-anchor', 'middle');

  var hourGraph = svg_info
  .append("g").attr("id", "hourGraph")
  .attr("transform", `translate(${width/2}, 0)`);
  // Create x scale for hourly time
  var hourTimeScale = d3.scaleLinear()
  .domain([0, numHoursWeek])
  .range([padding, width / 2]);

  var xHourAxis = d3.axisBottom(hourTimeScale).ticks(4);
  hourGraph.append("g")
  .attr("transform", `translate(0, ${height-padding})`)
  .attr("id", "xHourAxis")
  .call(xHourAxis);

  hourGraph.append("text") // x axis label
  .attr("transform",  `translate(${width / 4}, ${height})`)
  .text('Hour')
  .style('text-anchor', 'middle');

  // initialize first text-info
  var g = svg_info.append("g").append("text").text('GHI (Global Horizontal Irradiance) Throughout the Year (1) and Throughout the Day (2) for Coordinate: (' + dataset[0]['coords'].split('_')[0] + ', ' + dataset[0]['coords'].split('_')[1] + ')')
  .attr("transform", `translate(0, 15)`)
  .attr("id", "textDisplay")

  // ****** GENERATE COORDINATES ********
  var enter = svg.selectAll(".coordinate").data(dataset)
  .enter().append('circle')
  .attr("class", "coordinate")
  .attr("cx", "0")
  .attr("cy", "0")
  .attr("r", "5")
  .attr("transform", function(d) {
    return `translate(${projection([d['coords'].split('_')[1], d['coords'].split('_')[0]])})`;
  })
  .attr('stroke-width', 0.1)
  .style("stroke", "#000000")
  .attr("fill", function(d) {
    return getFill(d);
  })
  .on('mouseover', function(d) {
    d3.select(this).attr('fill', "#03A9F4").transition().duration(1000).attr("r", 10); //pop of blue color
    div.html('Latitude: ' + d['coords'].split('_')[0] + ' -- Longitude: ' + d['coords'].split('_')[1]).style('opacity', 1); //show tooltip
  })
  .on('mouseout', function(d) {
    if(solarChoice == 'GHI') {
      d3.select(this).attr('fill', function(d) {
        return colors[Math.floor(+d['data'][time_index][solarChoice] / 5)]
      }).transition().duration(1000).attr("r", 5);
    }
    else {
      d3.select(this).attr('fill', function(d) {
        return colors[Math.floor(+d['data'][time_index][solarChoice] + 25) * 4]
      }).transition().duration(1000).attr("r", 5);
    }
    div.html('Latitude: -- Longitude: ').style('opacity', 0)
  })
  .on('click', function(d) {
    curData = d['data']
    refreshData()
    $('#textDisplay').remove();
    // Display current values
    var g = svg_info.append("g").append("text").text('GHI (Global Horizontal Irradiance) Throughout the Year (1) and Throughout the Day (2) for Coordinate: (' + d['coords'].split('_')[0] + ', ' + d['coords'].split('_')[1] + ')')
    .attr("transform", `translate(0, 15)`)
    .attr("id", "textDisplay")
  })
}

function refreshData() { //refresh data
  // ******** Draw Graph *********
  $('.axis').remove(); // remove all other info charts
  drawYearGraph();
  drawHourGraph();

  // ******** Generate Coordinates *******
  var update = svg.selectAll(".coordinate").data(dataset);
  update.attr("fill", function(d) {
    return getFill(d);
  });
}
// Draws the graph displaying yearly data at the selected location in the selected hour
function drawYearGraph(){
  var yearGraph = d3.select("#yearGraph");
  // ******* COLLECT DATA TO DISPLAY *********
  var yYearData = [];
  for (var i = 0; i < curData.length; i++) {
    // grabs the yearly data for that point for only that hour!
    if ((i - getHour()) % numHoursWeek == 0) {
      yYearData.push(+curData[i][solarChoice]);
    }
  }

  // ******** Y AXIS **********
  // Y scale to convert selected data to coordinate point
  var yearDataScale = d3.scaleLinear()
  .domain(d3.extent(yYearData))
  .range([height - padding, padding]);
  var yYearAxis = d3.axisLeft(yearDataScale).ticks();

  var y_axis = yearGraph.append("g")
  .attr("transform", `translate(${padding}, 0)`)
  .attr("id", "yWeekAxis")
  .attr("class", "axis")
  .call(yYearAxis)

  yearGraph.append("text") // y axis label
  .attr("transform",  `translate(0, ${height / 2}) rotate(-90) `)
  .attr("class", "axis")
  .text('GHI (watts per square meter)')
  .style('text-anchor', 'middle');

  // ******** X AXIS **********
  // X scale to convert week to coordinate point
  var yearTimeScale = d3.scaleLinear()
  .domain([1, numWeeksYear])
  .range([padding, width / 2])

  var update = d3.select('#yearGraph').selectAll("circle")
  .data(yYearData);

  // ********* UPDATE DATA ********
  update.transition().duration(500)
  .attr("cx", function(d, i){
    return yearTimeScale(i);
  })
  .attr("cy", function(d, i){
    return yearDataScale(d);
  })

  // ******* ENTER DATA ********
  var enter = update
  .enter().append("circle")
  .attr("class", "solarData")
  .attr("r", 2)
  .attr("cx", function(d, i) {
    return yearTimeScale(i);
  })
  .attr("cy", function(d) {
    return yearDataScale(d)
  })
  .style("fill", "black");
}

function drawHourGraph(){
  var hourGraph = d3.select("#hourGraph");

  // ****** COLLECTING DATA TO DISPLAY *******
  yHourData = []; // keeps track of the solarChoice value for the week to calculate range of data
  for (var i = 0; i < numHoursWeek; i++) {
    yHourData.push(+curData[getDataIndex(getWeek(), 1) + i][solarChoice]);
  }

  // ******* Y AXIS *********
  // create y scale
  var hourDataScale = d3.scaleLinear()
  .domain(d3.extent(yHourData))
  .range([height - padding, padding]);

  var yHourAxis = d3.axisLeft(hourDataScale).ticks(10);

  var y_axis = hourGraph.append("g")
  .attr("transform", `translate(${padding}, 0)`)
  .attr("class", "axis")
  .attr("id", "yHourAxis")
  .call(yHourAxis);

  // display y graph label
  hourGraph.append("text") // y axis label
  .attr("class", "axis")
  .attr("transform",  `translate(0, ${height / 2}) rotate(-90) `)
  .text('GHI (watts per square meter)')
  .style('text-anchor', 'middle')

  //  ******** X AXIS ********
  // Create x scale for hourly time
  var hourTimeScale = d3.scaleLinear()
  .domain([0, numHoursWeek])
  .range([padding, width / 2]);

  // ******* UPDATE DATA *******
  var update =  hourGraph.selectAll("circle")
  .data(yHourData);

  update.transition().duration(500)
  .attr("cx", function(d, i) {
    return hourTimeScale(i);
  })
  .attr("cy", function(d, i) {
    return hourDataScale(d);
  })
  // ******* ENTERING DATA *********
  var enter = update.enter().append("circle")
  .attr("class", "solarData")
  .attr("r", 5)
  .attr("cx", function(d, i) {
    return hourTimeScale(i);
  })
  .attr("cy", function(d) {
    return hourDataScale(d)
  })
  .style("fill", "black")
}
