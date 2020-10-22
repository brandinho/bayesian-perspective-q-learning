import {
  generateNormalData,
  generateSkewData,
  generateSkewDataStrong
} from './rand';

export function graphCLT(distColor, distMeansMaxColor, distMeansColor) {
  //Set the main parameters for this file
  var m = {top: 50, right: 25, bottom: 30, left: 35}
  , h = 350 - m.top - m.bottom
  , w = 350 - m.left - m.right
  , numBins = 20
  , meanSampleSize = +d3.select("#sliderSizeCLT").attr("value")
  , maxSampleSize = +d3.select("#sliderSizeCLT").attr("max")
  , maxMeanIterations = 500
  , n = maxSampleSize * maxMeanIterations
  , alpha = 5;

  document.querySelector('label[for="barSizeCLT"] span').innerHTML = meanSampleSize

  // Get the distribution of sample means
  function sample_mean_distribution(fullDistribution, sampleSize) {
    var sample_mean = []
    var i = 0
    while (sample_mean.length < maxMeanIterations) {
      sample_mean.push(d3.mean(fullDistribution.slice(i,i+sampleSize)))
      i += maxSampleSize
    }
    return sample_mean
  }

  // Generate random parameters for a skew normal distribution
  function generateSkewParameters(sampleSize) {
    var muMax = 3
    , muMin = 0
    , sigmaMax = 1.5
    , sigmaMin = 0.5
    , alphaMax = 6
    , alphaMin = 2
    var mus = [], sigmas = [], alphas = []
    for (var j = 0; j < sampleSize; j++) {
      mus.push(Math.random() * (muMax - muMin) + muMin);
      sigmas.push(Math.random() * (sigmaMax - sigmaMin) + sigmaMin);
      alphas.push(Math.random() * (alphaMax - alphaMin) + alphaMin);
    }
    return [mus, sigmas, alphas];
  }

  var skewParameters = generateSkewParameters(maxSampleSize)
  var mus = skewParameters[0]
  var sigmas = skewParameters[1]
  var alphas = skewParameters[2]

  function generateDistribution(whichScenario) {
    var distribution;
    if (whichScenario == 'weak') {
      distribution = generateSkewData(n, alpha);
    }
    else if (whichScenario == 'strong') {
      distribution = generateSkewDataStrong(n, maxSampleSize, mus, sigmas, alphas);
    }
    return distribution
  }

  // Function to get a subset of the full distribution
  function subsetDistribution(fullDistribution, sampleSize) {
    var subset = []
    var i = 0
    while (i < fullDistribution.length) {
      subset.push(...fullDistribution.slice(i,i+sampleSize))
      i += maxSampleSize
    }
    return subset
  }

  var dataGenerationScenario = d3.selectAll('input[name="CLT-scenarios"]:checked').property('value')
  var allDistributionData = generateDistribution(dataGenerationScenario)
  var distribution;

  // Weak refers to Scenario 1 and Strong refers to Scenario 2
  if (dataGenerationScenario == 'weak') {
    distribution = allDistributionData;
  }
  else if (dataGenerationScenario == 'strong') {
    distribution = subsetDistribution(allDistributionData, meanSampleSize);
  }

  // Get the data ready for plotting
  var meansDistribution = sample_mean_distribution(allDistributionData, meanSampleSize);
  var meansMaxDistribution = generateNormalData(n, d3.mean(distribution), d3.deviation(distribution) / Math.sqrt(maxSampleSize));

  var xPDF = d3.scaleLinear().domain(d3.extent(allDistributionData)).range([0, w]);
  var xCDF = d3.scaleLinear().domain(d3.extent(allDistributionData)).range([0, w]);

  var plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(distribution);
  var plottingDataMeans = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansDistribution);
  var plottingDataMeansMax = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansMaxDistribution);

  //Calculative CDF
  function updateCDF(data, N) {
    var last = 0;
    for (var k=0; k < data.length; k++) {
      data[k].y = data[k].length / N;
      data[k]['cum'] = last + data[k].y;
      last = data[k]['cum'];
      data[k]['cum'] = data[k]['cum'];
    }
  }

  updateCDF(plottingData, distribution.length);
  updateCDF(plottingDataMeans, meansDistribution.length);
  updateCDF(plottingDataMeansMax, meansMaxDistribution.length);

  // Axes and scales
  var yPDF = d3.scaleLinear().domain([0, d3.max(plottingDataMeansMax, function(d) { return d.y; })]).range([h, 0]);
  var yCDF = d3.scaleLinear().domain([0, 1]).range([h, 0]);

  var xAxisPDF = d3.axisBottom(xPDF)
    .ticks(4)
    .tickSize(0)
    .tickPadding(15);
  var xAxisCDF = d3.axisBottom(xCDF)
    .ticks(4)
    .tickSize(0)
    .tickPadding(15);

  var yAxisPDF = d3.axisLeft(yPDF)
    .ticks(4)
    .tickSize(0)
    .tickPadding(15);
  var yAxisCDF = d3.axisLeft(yCDF)
    .ticks(4)
    .tickSize(0)
    .tickPadding(15);

  // Draw svg
  var svgPDF = d3.select("#PDF")
        .classed("svg-container", true)
        .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${h + m.top + m.bottom} ${w + m.left + m.right}`)
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");
  var svgCDF = d3.select("#CDF")
        .classed("svg-container", true)
        .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${h + m.top + m.bottom} ${w + m.left + m.right}`)
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");

  // Draw PDF and CDF lines
  var guidePDF = d3.area()
              .x(function(d){ return xPDF(d.x0) })
              .y0(h)
              .y1(function(d){ return yPDF(d.y) })
              .curve(d3.curveBasis);
  var guideCDF = d3.line()
              .x(function(d){ return xCDF(d.x0) })
              .y(function(d){ return yCDF(d.cum) })
              .curve(d3.curveBasis);

  var linePDF = svgPDF.append('path')
              .datum(plottingData)
              .attr('d', guidePDF)
              .style('stroke', distColor)
              .style('fill', distColor)
              .style('fill-opacity', 0.3)
              .attr('class', 'line');
  var lineMeansMaxPDF = svgPDF.append('path')
              .datum(plottingDataMeansMax)
              .attr('d', guidePDF)
              .style('stroke', distMeansMaxColor)
              .style('fill', distMeansMaxColor)
              .style('fill-opacity', 0.3)
              .attr('class', 'line');
  var lineMeansPDF = svgPDF.append('path')
              .datum(plottingDataMeans)
              .attr('d', guidePDF)
              .style('stroke', distMeansColor)
              .attr('class', 'line');

  var lineCDF = svgCDF.append('path')
              .datum(plottingData)
              .attr('d', guideCDF)
              .style('stroke', distColor)
              .attr('class', 'line');
  var lineMeansMaxCDF = svgCDF.append('path')
              .datum(plottingDataMeansMax)
              .attr('d', guideCDF)
              .style('stroke', distMeansMaxColor)
              .attr('class', 'line');
  var lineMeansCDF = svgCDF.append('path')
              .datum(plottingDataMeans)
              .attr('d', guideCDF)
              .style('stroke', distMeansColor)
              .attr('class', 'line');

  // Function to update the charts as the input (sample size) changes
  function updateCharts() {
    meansDistribution = sample_mean_distribution(allDistributionData, meanSampleSize);
    plottingDataMeans = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansDistribution);

    lineMeansPDF.remove()
    lineMeansCDF.remove()

    updateCDF(plottingDataMeans, meansDistribution.length);
    lineMeansPDF = svgPDF.append('path')
                  .datum(plottingDataMeans)
                  .attr('d', guidePDF)
                  .style('stroke', distMeansColor)
                  .attr('class', 'line');
    lineMeansCDF = svgCDF.append('path')
                .datum(plottingDataMeans)
                .attr('d', guideCDF)
                .style('stroke', distMeansColor)
                .attr('class', 'line');
  }

  // Function to update the charts when you switch scenarios
  function updateScenarioCharts() {
    if (dataGenerationScenario == 'weak') {
      distribution = allDistributionData;
    }
    else if (dataGenerationScenario == 'strong') {
      distribution = subsetDistribution(allDistributionData, meanSampleSize);
    }
    meansMaxDistribution = generateNormalData(n, d3.mean(distribution), d3.deviation(distribution) / Math.sqrt(maxSampleSize));

    plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(distribution);
    plottingDataMeansMax = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansMaxDistribution);
    updateCDF(plottingData, distribution.length);
    updateCDF(plottingDataMeansMax, meansMaxDistribution.length);

    linePDF.remove()
    lineMeansMaxPDF.remove()
    lineCDF.remove()
    lineMeansMaxCDF.remove()

    linePDF = svgPDF.append('path')
                .datum(plottingData)
                .attr('d', guidePDF)
                .style('stroke', distColor)
                .style('fill', distColor)
                .style('fill-opacity', 0.3)
                .attr('class', 'line');
    lineMeansMaxPDF = svgPDF.append('path')
                .datum(plottingDataMeansMax)
                .attr('d', guidePDF)
                .style('stroke', distMeansMaxColor)
                .style('fill', distMeansMaxColor)
                .style('fill-opacity', 0.3)
                .attr('class', 'line');

    lineCDF = svgCDF.append('path')
                .datum(plottingData)
                .attr('d', guideCDF)
                .style('stroke', distColor)
                .attr('class', 'line');
    lineMeansMaxCDF = svgCDF.append('path')
                .datum(plottingDataMeansMax)
                .attr('d', guideCDF)
                .style('stroke', distMeansMaxColor)
                .attr('class', 'line');
  }

  // Monitor the sample size slider and update charts when it changes
  d3.select("#sliderSizeCLT").on("input", function(){
    meanSampleSize = +this.value;
    document.querySelector('label[for="barSizeCLT"] span').innerHTML = meanSampleSize;
    if (dataGenerationScenario == 'strong') {
      updateScenarioCharts();
    }
    updateCharts();
  })

  // Monitor the scenarios radio buttons and update charts when it changes
  d3.selectAll('input[name="CLT-scenarios"]').on('change', function(){
    dataGenerationScenario = this.value;
    allDistributionData = generateDistribution(dataGenerationScenario);
    xPDF = d3.scaleLinear().domain(d3.extent(allDistributionData)).range([0, w]);
    xCDF = d3.scaleLinear().domain(d3.extent(allDistributionData)).range([0, w]);
    xAxisPDF = d3.axisBottom(xPDF);
    xAxisCDF = d3.axisBottom(xCDF);
    svgPDF.select('.xPDF')
      .call(xAxisPDF);
    svgCDF.select('.xCDF')
      .call(xAxisCDF);
    updateScenarioCharts();
    updateCharts();
  })

  // Draw the legend
  const legend_X_pos = 20
  , legend_extra_X_spacing = 20
  , legend_X_spacing = 160
  , legend_Y_pos = 20
  , legend_Y_spacing = 30
  , legend_text_spacing = 20;

  const divHeight = parseInt(d3.select("#cltLegend").style("height"))
  , pos1_Y = legend_Y_pos

  if (divHeight == 80) {
    const additional_X_margin = -10
    var pos1_X = legend_X_pos + additional_X_margin
    , pos2_X = legend_X_pos + legend_X_spacing + legend_extra_X_spacing - 25
    , pos2_Y = legend_Y_pos
    , pos3_X = legend_X_pos + additional_X_margin
    , pos3_Y = legend_Y_pos + legend_Y_spacing
    var legend = d3.select("#cltLegend").append("svg")
      .attr("width", legend_X_pos + legend_X_spacing + 120)
  }
  else {
    var pos1_X = legend_X_pos
    , pos2_X = legend_X_pos + legend_X_spacing + legend_extra_X_spacing
    , pos2_Y = legend_Y_pos
    , pos3_X = legend_X_pos + legend_X_spacing * 2 + legend_extra_X_spacing
    , pos3_Y = legend_Y_pos
    var legend = d3.select("#cltLegend").append("svg")
      .attr("width", (legend_X_pos + legend_X_spacing) * 2 + 120)
  }

  legend.append("circle")
    .attr("cx", pos1_X)
    .attr("cy", pos1_Y)
    .attr("r", 6)
    .style("fill", distColor)
  legend.append("circle")
    .attr("cx", pos2_X)
    .attr("cy", pos2_Y)
    .attr("r", 6)
    .style("fill", distMeansMaxColor)
  legend.append("circle")
    .attr("cx", pos3_X)
    .attr("cy", pos3_Y)
    .attr("r", 6)
    .style("fill", distMeansColor)

  const textColor = "#4C4845"
  legend.append("text")
    .attr("x", pos1_X + legend_text_spacing)
    .attr("y", pos1_Y)
    .text("Underlying Distribution")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
  legend.append("text")
    .attr("x", pos2_X + legend_text_spacing)
    .attr("y", pos2_Y)
    .text("Normal Distribution")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
  legend.append("text")
    .attr("x", pos3_X + legend_text_spacing)
    .attr("y", pos3_Y)
    .text("Means Distribution")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")

  // Draw axes
  svgPDF.append("g")
    .attr("class", "xPDF axis")
    .attr("transform", "translate(0," + h + ")")
    .call(xAxisPDF);
  svgCDF.append("g")
    .attr("class", "xCDF axis")
    .attr("transform", `translate(${0},${h})`)
    .call(xAxisCDF);

  svgPDF.append("g")
    .attr("class", "yPDF axis")
    .call(yAxisPDF)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Count (Histogram)");
  svgCDF.append("g")
    .attr("class", "yCDF axis")
    .call(yAxisCDF)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("CDF");
}
