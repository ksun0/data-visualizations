// ******* Initialize constants and global values *******
var dataset = []

var cluster_colors = {0: '#1b9e77', 1: '#d95f02', 2: '#7570b3', 3: '#e7298a', 4: '#66a61e'}

var cluster_names = {0: 'Sci Policy/Env Sci: trump, climate, states',
1: 'Neuroscience: brain, imaging, neurons',
2: 'Artificial Intelligence: ai, machine, data',
3: 'Pharmaceuticals: biotechs, dugs',
4: 'Immunology: cell, cancer, gene, immune, tumors, protein, parient, disease'
}

function mapActualCategoryToColorIndex(category) { // map actual categories from scraping to the cluster colors
  if (category.includes('science policy') || category.includes('environmental science')) {
    return 0
  }
  if (category.includes('neuroscience')) {
    return 1
  }
  if (category.includes('artificial intelligence') || category.includes('physics') || category.includes('machine learning')) {
    return 2
  }
  if (category.includes('pharmaceuticals') || category.includes('medicine') || category.includes('bioengineering')) {
    return 3
  }
  if (category.includes('immunology') || category.includes('molecular biology') || category.includes('genetics') || category.includes('cancer') || category.includes('infectious diseases')) {
    return 4
  }
  return -1
}

var svg, div, width, height, incorrect_count = 0, words; // global D3/SVG elements
const padding = 30;

// ******* Load in Data *******
d3.csv("data/mds_df.csv", function(error, data) {
  d3.csv("data/word_cloud.csv", function(error, w) {
    dataset = data // initialize ma_json so it can be used elsewhere
    words = w
    document.getElementById("loader").remove(); // remove the loader before drawing the svg
    main();
  })
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
  .style("opacity", 0)
  .html("-") // occupy tooltip space;

  // Define Scales - scales map an input domain with an output range
  var xScale = d3.scaleLinear()
  .domain(d3.extent(dataset.map(function(d) { return +d['x']; }))) // get the input domain as first column of array
  .range([padding, width - padding])  // set the output range

  var yScale = d3.scaleLinear()
  .domain(d3.extent(dataset.map(function(d) { return +d['y']; }))) // gets the input domain as the second column of array
  .range([height - padding, padding])  // set the output range

  console.log(dataset)
  console.log(d3.extent(dataset.map(function(d) { return +d['x']; })))

  svg.selectAll(".article").data(dataset)
  .enter()
  .append('circle')
  .attr("class", "article")
  .attr("x", function(d) {
    return xScale(+d['x']);  // Location of x
  })
  .attr("y", function(d) {
    return yScale(+d['y']);  // Location of y
  })
  .attr("cx", function(d) {
    return xScale(+d['x'])
  })
  .attr("cy", function(d) {
    return yScale(+d['y'])
  })
  .attr("r", "4")
  .attr("fill", function(d) {
    return cluster_colors[+(d['cluster'])]
  })
  .on('mouseover', function(d) {
    d3.select(this).transition().duration(1000).attr("r", 10); //pop of blue color
    div.html("<p>Categories scraped from website: " + d['categories'] + "</p><p>Cluster: " + d['cluster'] + "</p><p><a target='_blank' href='" + d['url'] + "'>" + d['url'] + "</a></p>").style('opacity', 1); //show tooltip
  })
  .on('mouseout', function(d) {
    d3.select(this).transition().duration(1000).attr("r", 4);
  })

  svg.selectAll("text").data(dataset)
  .enter()
  .append('text')
  .attr("x", function(d){
    return xScale(+d['x'])
  })
  .attr("y", function(d) {
    return yScale(+d['y']);  // Location of y
  })
  .text(function(d){
    if(+d['cluster'] == mapActualCategoryToColorIndex(d['categories'])) {
      return ""
    }
    else {
      incorrect_count += 1;
      return "X";
    }
  })
  .attr("font-size", "8px")
  .style("opacity", 0)


}

function check() { // show the incorrectly categorized articles
  checkbox = document.getElementById("slider-switch");
  if (checkbox.checked) // true means it is checked (slider to right)
  {
    svg.selectAll("text").style("opacity", 1)
    div.html("Incorrectly Categorized articles: " + incorrect_count + "/" + dataset.length + " articles.").style('opacity', 1); //show tooltip
  }
  else {
    svg.selectAll("text").style("opacity", 0)
    div.html(" - ").style('opacity', 0); //show tooltip
  }

}
