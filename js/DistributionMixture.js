import {
  randomSkewNormal
} from './rand';

export function graphMixture(distColor, mixtureColor) {
  // Set the parameters for the file
  var m = {top: 5, right: 5, bottom: 5, left: 5}
  , h = parseInt(d3.select(".individual-mixture").style("height")) - m.top - m.bottom
  , w = parseInt(d3.select(".individual-mixture").style("width")) - m.left - m.right
  , gamma = +d3.select("#sliderGammaMixture").attr("value")
  , numBins = 20
  , n = 5000
  , alpha = 5;

  document.querySelector('label[for="barGammaMixture"] span').innerHTML = gamma;

  function sumArray(total, num) {
    return total + num;
  }

  // Function to update the text that outputs gamma and weights
  function updateDensityWeights() {
    var defaultGammaText = "\\color{#696969}{\\gamma^"
    , defaultWeightText = "\\color{#696969}{w_"
    , currentGammaString
    , currentWeightString
    , discountArray = []
    , weightArray = []
    , discount
    , weight
    , texts;

    for (var t = 0; t < 3; t++) {
      discount = Math.round((gamma**t + Number.EPSILON) * 1000) / 1000
      discountArray.push(discount)
      currentGammaString = defaultGammaText + String(t) + "=" + String(discount) + "}"
      texts = document.querySelectorAll('#mixture-label' + String(t+1) + ' d-math')
      texts[0].innerHTML = currentGammaString
    }
    var cumulativeSum = discountArray.reduce(sumArray)
    for (var t = 0; t < 3; t++) {
      weight = Math.round((discountArray[t] / cumulativeSum + Number.EPSILON) * 1000) / 10
      weightArray.push(weight / 100)
      currentWeightString = defaultWeightText + String(t+1) + "=" + String(weight) + "\\%}"
      texts = document.querySelectorAll('#mixture-label' + String(t+1) + ' d-math')
      texts[1].innerHTML = currentWeightString
    }
    return weightArray
  }
  var weights = updateDensityWeights()

  // Function to generate skew distributions
  function generateVariedSkewData(n, mu, sigma, alpha) {
    var data = []
    for (var j = 0; j < n; j++) {
      data.push(randomSkewNormal(mu, sigma, alpha));
    }
    return data;
  }

  // Add the densities to create the mixture distribution
  function addDensities(listOfDensities) {
    var mixture = [];
    var x0, x1, length;
    for (var i = 0; i < listOfDensities[0].length; i++) {
      x0 = listOfDensities[0][i].x0
      x1 = listOfDensities[0][i].x0
      length = 0
      for (var j = 0; j < listOfDensities.length; j++) {
        length += listOfDensities[j][i].length * weights[j]
      }
      mixture.push({
        x0: x0,
        x1: x1,
        length: length
      })
    }
    return mixture
  }

  // Get the three underlying distributions in the figure
  var distribution1 = generateVariedSkewData(n, -2, 1, 5);
  var distribution2 = generateVariedSkewData(n, 0, 1, 0);
  var distribution3 = generateVariedSkewData(n, 2, 1, -5);

  // Get the data ready for plotting
  var xLowerRange = d3.min([d3.min(distribution1), d3.min(distribution2), d3.min(distribution3)])
  var xUpperRange = d3.max([d3.max(distribution1), d3.max(distribution2), d3.max(distribution3)])

  var xDist = d3.scaleLinear().domain([xLowerRange, xUpperRange]).range([0, w]);

  var plottingDataDist1 = d3.histogram().domain(xDist.domain()).thresholds(xDist.ticks(numBins))(distribution1);
  var plottingDataDist2 = d3.histogram().domain(xDist.domain()).thresholds(xDist.ticks(numBins))(distribution2);
  var plottingDataDist3 = d3.histogram().domain(xDist.domain()).thresholds(xDist.ticks(numBins))(distribution3);

  var listOfDensities = [plottingDataDist1, plottingDataDist2, plottingDataDist3]
  var plottingDataMixture = addDensities(listOfDensities)

  var yUpperRange = d3.max([
    d3.max(plottingDataDist1, function(d) { return d.length; }),
    d3.max(plottingDataDist2, function(d) { return d.length; }),
    d3.max(plottingDataDist3, function(d) { return d.length; })
  ])

  // Axes and scales
  var yDist = d3.scaleLinear().domain([0, yUpperRange]).range([h, 0]);
  var yMixture = d3.scaleLinear().domain([0, d3.max(plottingDataMixture, function(d) { return d.length; })]).range([h, 0]);

  // Draw svg
  var svgDist1 = d3.select("#mixture-dist1").append("svg")
            .attr("width", w + m.left + m.right)
            .attr("height", h + m.top + m.bottom)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");
  var svgDist2 = d3.select("#mixture-dist2").append("svg")
            .attr("width", w + m.left + m.right)
            .attr("height", h + m.top + m.bottom)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");
  var svgDist3 = d3.select("#mixture-dist3").append("svg")
            .attr("width", w + m.left + m.right)
            .attr("height", h + m.top + m.bottom)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");
  var svgMixture = d3.select("#mixture").append("svg")
            .attr("width", w + m.left + m.right)
            .attr("height", h + m.top + m.bottom)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");

  // Draw PDF lines
  var guideDist = d3.line()
              .x(function(d){ return xDist(d.x0) })
              .y(function(d){ return yDist(d.length) })
              .curve(d3.curveBasis);
  var guideMixture = d3.line()
              .x(function(d){ return xDist(d.x0) })
              .y(function(d){ return yMixture(d.length) })
              .curve(d3.curveBasis);

  var lineDist1 = svgDist1.append('path')
              .datum(plottingDataDist1)
              .attr('d', guideDist)
              .style('stroke', distColor)
              .style('stroke-width', 2)
              .attr('class', 'line');
  var lineDist2 = svgDist2.append('path')
              .datum(plottingDataDist2)
              .attr('d', guideDist)
              .style('stroke', distColor)
              .style('stroke-width', 2)
              .attr('class', 'line');
  var lineDist3 = svgDist3.append('path')
              .datum(plottingDataDist3)
              .attr('d', guideDist)
              .style('stroke', distColor)
              .style('stroke-width', 2)
              .attr('class', 'line');
  var lineMixture = svgMixture.append('path')
              .datum(plottingDataMixture)
              .attr('d', guideMixture)
              .style('stroke', mixtureColor)
              .style('stroke-width', 2)
              .attr('class', 'line');

  // Function to update the mixture distribution
  function updateMixture() {
    lineMixture.remove()
    yMixture = d3.scaleLinear().domain([0, d3.max(plottingDataMixture, function(d) { return d.length; })]).range([h, 0]);
    lineMixture = svgMixture.append('path')
                .datum(plottingDataMixture)
                .attr('d', guideMixture)
                .style('stroke', mixtureColor)
                .style('stroke-width', 2)
                .attr('class', 'line');
  }

  // Change the mixture weights and mixture distribution given the slider value
  d3.select("#sliderGammaMixture").on("input", function(){
    gamma = +this.value;
    document.querySelector('label[for="barGammaMixture"] span').innerHTML = gamma;
    weights = updateDensityWeights()
    plottingDataMixture = addDensities(listOfDensities)
    updateMixture()
  })
}
