// import { generateSkewData } from './rand';

export function graphQDistribution(underlyding_data, starIcon, distColor, distMeansColor, darkColor) {
  //Set dimensions
  var m = {top: 10, right: 10, bottom: 50, left: 50}
  , h = 350 - m.top - m.bottom
  , w = 350 - m.left - m.right
  , numBins = 40
  , gamma = +d3.select("#sliderGammaQDistribution").attr("value")
  , maxGamma = +d3.select("#sliderGammaQDistribution").attr("max")
  , sampleSize = +d3.select("#sliderSizeQDistribution").attr("value")
  , maxSampleSize = +d3.select("#sliderSizeQDistribution").attr("max")
  , sparsity = +d3.select("#sliderSparsityQDistribution").attr("value")
  , maxMeanIterations = 500
  , n = maxSampleSize * maxMeanIterations
  , alpha = 5
  , arrowWidth = 5;

  document.querySelector('label[for="barGammaQDistribution"] span').innerHTML = gamma;
  document.querySelector('label[for="barSizeQDistribution"] span').innerHTML = sampleSize;
  document.querySelector('label[for="barSparsityQDistribution"] span').innerHTML = sparsity - 1;

  var skew_or_bernoulli = d3.selectAll('input[name="distribution-type"]:checked').property('value')

  function makeDataSparse(data, sparsity) {
    var sparse_data = []
    for (var i = 0; i < maxMeanIterations; i++) {
      for (var j = -(sparsity - 1); j < sampleSize - (sparsity - 1); j++) {
        if (j % sparsity != 0) {
          sparse_data.push(0)
        }
        else {
          sparse_data.push(data[i*maxSampleSize + j])
        }
      }
    }
    return sparse_data
  }

  function calculateReturn(data, gamma, divisor) {
    return data.reduce((total, next, idx) => total + (gamma**idx) * next, 0) / divisor;
  }

  function totalReturnCalculation(fullDistribution, gamma, N) {
    var totalReturns = []
    , i = 0;
    while (totalReturns.length < maxMeanIterations) {
      totalReturns.push(calculateReturn(fullDistribution.slice(i,i+sampleSize), gamma, N));
      i += sampleSize
    }
    return totalReturns
  }

  function getCumulativeSamples(gamma) {
    var cumulativeSamples = [];
    var sampleWeight;
    for (var i = 0; i <= maxSampleSize; i++) {
      sampleWeight = gamma**i
      if (i == 0) {
        cumulativeSamples.push({
          x: i,
          y: sampleWeight
        })
      }
      else {
        cumulativeSamples.push({
          x: i,
          y: cumulativeSamples[cumulativeSamples.length-1].y + sampleWeight
        })
      }
    }
    return cumulativeSamples;
  }

  const lowerBound = getCumulativeSamples(0);
  const upperBound = getCumulativeSamples(1);
  const bounds = []
  for (var i = 0; i <= maxSampleSize; i++) {
    bounds.push({
      x: lowerBound[i].x,
      lower: lowerBound[i].y,
      upper: upperBound[i].y
    })
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  //Generate random numbers
  var cumulativeSamples = getCumulativeSamples(gamma);
  var maxCumulativeSamples = getCumulativeSamples(maxGamma);

  var distribution = underlyding_data[capitalizeFirstLetter(skew_or_bernoulli) + " Data"]
  var sparse_distribution = makeDataSparse(distribution, sparsity)
  var meansDistribution = totalReturnCalculation(sparse_distribution, gamma, cumulativeSamples[sampleSize-1].y);
  var meansMaxDistribution = totalReturnCalculation(sparse_distribution, maxGamma, maxCumulativeSamples[maxCumulativeSamples.length-1].y);

  //Axes and scales
  var xPDF = d3.scaleLinear().domain(d3.extent(sparse_distribution)).range([0, w]);
  var xSampleSize = d3.scaleLinear().domain([0, cumulativeSamples.length]).range([0, w]);

  function adjustBinHeight(histData, samples) {
    for (var i = 0; i < histData.length; i++) {
      histData[i].y = histData[i].length / samples
    }
  }

  var plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(sparse_distribution);
  var plottingDataMeans = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansDistribution);
  var plottingDataMeansMax = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansMaxDistribution);

  adjustBinHeight(plottingData, sparse_distribution.length)
  adjustBinHeight(plottingDataMeans, meansDistribution.length)
  adjustBinHeight(plottingDataMeansMax, meansMaxDistribution.length)

  var yPDF = d3.scaleLinear().domain([0, d3.max(plottingDataMeansMax, function(d) { return d.y; })]).range([h, 0]).nice();
  var ySampleSize = d3.scaleLinear().domain([0, maxSampleSize]).range([h, 0]);

  var xAxisPDF = d3.axisBottom(xPDF);
  var xAxisSampleSize = d3.axisBottom(xSampleSize);

  var yAxisPDF = d3.axisLeft(yPDF).ticks(7);
  var yAxisSampleSize = d3.axisLeft(ySampleSize);

  //Draw svg
  var svgPDF = d3.select("#QDistribution")
        .classed("svg-container", true)
        .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${h + m.top + m.bottom} ${w + m.left + m.right}`)
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");
  svgPDF
    .append('defs')
    .append('marker')
      .attr('id', 'arrow-underlying')
      .attr('viewBox', [0, 0, arrowWidth, arrowWidth])
      .attr('refX', arrowWidth/2)
      .attr('refY', arrowWidth/2)
      .attr('markerWidth', arrowWidth)
      .attr('markerHeight', arrowWidth)
      .attr('orient', 'auto-start-reverse')
    .append('path')
      .attr('d', d3.line()([[0, 0], [0, arrowWidth], [arrowWidth, arrowWidth/2]]))
      .attr('fill', distColor);
  svgPDF
    .append('defs')
    .append('marker')
      .attr('id', 'arrow-means')
      .attr('viewBox', [0, 0, arrowWidth, arrowWidth])
      .attr('refX', arrowWidth/2)
      .attr('refY', arrowWidth/2)
      .attr('markerWidth', arrowWidth)
      .attr('markerHeight', arrowWidth)
      .attr('orient', 'auto-start-reverse')
    .append('path')
      .attr('d', d3.line()([[0, 0], [0, arrowWidth], [arrowWidth, arrowWidth/2]]))
      .attr('fill', distMeansColor);
  var svgSampleSize = d3.select("#EffectiveSampleSize")
        .classed("svg-container", true)
        .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${h + m.top + m.bottom} ${w + m.left + m.right}`)
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + m.left + "," + m.top + ")");


  //Draw CDF line
  var guidePDF = d3.area()
              .x(function(d){ return xPDF(d.x0) })
              .y0(h)
              .y1(function(d){ return yPDF(d.y) })
              .curve(d3.curveBasis);
  var guideSampleSize = d3.line()
              .x(function(d){ return xSampleSize(d.x) })
              .y(function(d){ return ySampleSize(d.y) })
              .curve(d3.curveBasis);
  var areaSampleSize = d3.area()
              .x( function(d) { return xSampleSize(d.x) } )
              .y0( function(d) { return ySampleSize(d.lower) } )
              .y1(  function(d) { return ySampleSize(d.upper) } )
              .curve(d3.curveCardinal);;

  var linePDF = svgPDF.append('path')
              .datum(plottingData)
              .attr('d', guidePDF)
              .style('stroke', distColor)
              .style('fill', distColor)
              .style('fill-opacity', 0.3)
              .attr('class', 'line');
  var lineMeansPDF = svgPDF.append('path')
              .datum(plottingDataMeans)
              .attr('d', guidePDF)
              .style('stroke', distMeansColor)
              .style('fill', distMeansColor)
              .style('fill-opacity', 0.3)
              .attr('class', 'line');

  var lowerLine = svgSampleSize.append('path')
              .datum(lowerBound)
              .attr('d', guideSampleSize)
              .style('stroke', distMeansColor)
              .style('stroke-dasharray', ('3, 3'))
              .attr('class', 'line');
  var upperLine = svgSampleSize.append('path')
              .datum(upperBound)
              .attr('d', guideSampleSize)
              .style('stroke', distMeansColor)
              .style('stroke-dasharray', ('3, 3'))
              .attr('class', 'line');
  var verticalLine = svgSampleSize.append("line")
              .attr("x1", xSampleSize(sampleSize))
              .attr("y1", 0)
              .attr("x2", xSampleSize(sampleSize))
              .attr("y2", h)
              .style("stroke", darkColor)
              .style("stroke-width", 2)
              .style("class", 'line');
  var filledArea = svgSampleSize.append('path')
              .datum(bounds)
              .attr('d', areaSampleSize)
              .style('fill', distMeansColor)
              .style('opacity', 0.1)
  var line = svgSampleSize.append('path')
              .datum(cumulativeSamples)
              .attr('d', guideSampleSize)
              .style('stroke', darkColor)
              .attr('class', 'line');

  function effectiveTimestepsFunction(x) {
    var slope = (cumulativeSamples[sampleSize].y * (1 - 1 / sparsity)) / sampleSize
    var intercept = cumulativeSamples[sampleSize].y / sparsity
    return slope * x + intercept
  }
  function getEffectiveTimesteps() {
    var effectiveTimesteps = []
    for (var i = 0; i <= sampleSize; i++) {
      effectiveTimesteps.push({
        x: i,
        y: effectiveTimestepsFunction(i),
      })
    }
    return effectiveTimesteps
  }
  var effectiveTimesteps = getEffectiveTimesteps()

  var effectiveTimestepsLine = svgSampleSize.append('path')
              .datum(effectiveTimesteps)
              .attr('d', guideSampleSize)
              .style('stroke-dasharray', ('5, 5'))
              .style('stroke', 'orange')
              .attr('class', 'line');
  const gridStarSize = 15
  const gridStarOffset = gridStarSize / 2
  var gridStar = svgSampleSize.append(function() {return starIcon.documentElement.cloneNode(true);})
              .attr("y", ySampleSize(cumulativeSamples[sampleSize].y / sparsity) - gridStarOffset)
              .attr("x", xSampleSize(0) - gridStarOffset)
              .attr("width", gridStarSize)
              .attr("height", gridStarSize)
  gridStar.select("path")
              .style("fill", "orange")


  function updateCharts() {
    cumulativeSamples = getCumulativeSamples(gamma);
    effectiveTimesteps = getEffectiveTimesteps();
    meansDistribution = totalReturnCalculation(sparse_distribution, gamma, cumulativeSamples[sampleSize-1].y);

    plottingDataMeans = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansDistribution);
    adjustBinHeight(plottingDataMeans, meansDistribution.length);

    lineMeansPDF.remove()
    line.remove()
    verticalLine.remove()
    effectiveTimestepsLine.remove()

    var allBins = [];
    for (var b=0; b < plottingDataMeans.length; b++) {
      if (plottingDataMeans[b].length > 0) {
        allBins.push(plottingDataMeans[b].x0)
      }
    }

    if (allBins.length > 1) {
      lineMeansPDF = svgPDF.append('path')
                  .datum(plottingDataMeans)
                  .attr('d', guidePDF)
                  .style('stroke', distMeansColor)
                  .style('fill', distMeansColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');
    }
    else {
      lineMeansPDF = svgPDF.append("line")
                  .attr("x1", xPDF(allBins[0]))
                  .attr("y1", 0)
                  .attr("x2", xPDF(allBins[0]))
                  .attr("y2", h)
                  .attr('marker-start', 'url(#arrow-means)')
                  .style("stroke", distMeansColor)
                  .style("stroke-width", 2)
                  .style("class", 'line');
    }

    verticalLine = svgSampleSize.append("line")
                .attr("x1", xSampleSize(sampleSize))
                .attr("y1", 0)
                .attr("x2", xSampleSize(sampleSize))
                .attr("y2", h)
                .style("stroke", darkColor)
                .style("stroke-width", 2)
                .style("class", 'line');
    line = svgSampleSize.append('path')
                .datum(cumulativeSamples)
                .attr('d', guideSampleSize)
                .style('stroke', darkColor)
                .attr('class', 'line');
    effectiveTimestepsLine = svgSampleSize.append('path')
                .datum(effectiveTimesteps)
                .attr('d', guideSampleSize)
                .style('stroke-dasharray', ('5, 5'))
                .style('stroke', 'orange')
                .attr('class', 'line');
    gridStar.attr("y", ySampleSize(cumulativeSamples[sampleSize].y / sparsity) - gridStarOffset)
    gridStar.raise()
  }

  d3.select("#sliderSizeQDistribution").on("input", function(d){
    sampleSize = +this.value
    document.querySelector('label[for="barSizeQDistribution"] span').innerHTML = sampleSize;
    sparse_distribution = makeDataSparse(distribution, sparsity)
    plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(sparse_distribution);
    adjustBinHeight(plottingData, sparse_distribution.length);
    linePDF.remove()

    var allBins = [];
    for (var b=0; b < plottingData.length; b++) {
      if (plottingData[b].length > 0) {
        allBins.push(plottingData[b].x0)
      }
    }

    if (allBins.length > 1) {
      linePDF = svgPDF.append('path')
                  .datum(plottingData)
                  .attr('d', guidePDF)
                  .style('stroke', distColor)
                  .style('fill', distColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');
    }
    else {
      linePDF = svgPDF.append("line")
                  .attr("x1", xPDF(allBins[0]))
                  .attr("y1", 0)
                  .attr("x2", xPDF(allBins[0]))
                  .attr("y2", h)
                  .attr('marker-start', 'url(#arrow-underlying)')
                  .style("stroke", distColor)
                  .style("stroke-width", 2)
                  .style("class", 'line');
    }
    updateCharts()
  })
  d3.select("#sliderGammaQDistribution").on("input", function(d){
    gamma = +this.value
    document.querySelector('label[for="barGammaQDistribution"] span').innerHTML = gamma;
    updateCharts()
  })
  d3.select("#sliderSparsityQDistribution").on("input", function(d){
    sparsity = +this.value
    document.querySelector('label[for="barSparsityQDistribution"] span').innerHTML = sparsity - 1;
    sparse_distribution = makeDataSparse(distribution, sparsity)
    plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(sparse_distribution);
    adjustBinHeight(plottingData, sparse_distribution.length);
    linePDF.remove()

    var allBins = [];
    for (var b=0; b < plottingData.length; b++) {
      if (plottingData[b].length > 0) {
        allBins.push(plottingData[b].x0)
      }
    }

    if (allBins.length > 1) {
      linePDF = svgPDF.append('path')
                  .datum(plottingData)
                  .attr('d', guidePDF)
                  .style('stroke', distColor)
                  .style('fill', distColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');
    }
    else {
      linePDF = svgPDF.append("line")
                  .attr("x1", xPDF(allBins[0]))
                  .attr("y1", 0)
                  .attr("x2", xPDF(allBins[0]))
                  .attr("y2", h)
                  .attr('marker-start', 'url(#arrow-underlying)')
                  .style("stroke", distColor)
                  .style("stroke-width", 2)
                  .style("class", 'line');
    }
    updateCharts()
  })
  d3.selectAll('input[name="distribution-type"]').on("change", function(){
    skew_or_bernoulli = this.value
    if (skew_or_bernoulli == "skew") {
      var x_buffer = 0
    }
    else if (skew_or_bernoulli == "bernoulli") {
      var x_buffer = 0.5
    }

    distribution = underlyding_data[capitalizeFirstLetter(skew_or_bernoulli) + " Data"]
    sparse_distribution = makeDataSparse(distribution, sparsity)
    meansMaxDistribution = totalReturnCalculation(sparse_distribution, maxGamma, maxCumulativeSamples[maxCumulativeSamples.length-1].y);

    xPDF = d3.scaleLinear().domain([d3.min(distribution) - x_buffer, d3.max(distribution) + x_buffer]).range([0, w]);
    xAxisPDF = d3.axisBottom(xPDF);

    plottingData = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(sparse_distribution);
    plottingDataMeansMax = d3.histogram().domain(xPDF.domain()).thresholds(xPDF.ticks(numBins))(meansMaxDistribution);
    adjustBinHeight(plottingData, sparse_distribution.length);
    adjustBinHeight(plottingDataMeansMax, meansMaxDistribution.length);

    yPDF = d3.scaleLinear().domain([0, d3.max(plottingDataMeansMax, function(d) { return d.y; })]).range([h, 0]).nice();
    yAxisPDF = d3.axisLeft(yPDF).ticks(7);

    svgPDF.select('.x')
      .transition()
      .duration(2000)
      .ease(d3.easePoly)
      .call(xAxisPDF);
    svgPDF.select('.y')
      .transition()
      .duration(2000)
      .ease(d3.easePoly)
      .call(yAxisPDF);

    linePDF.remove()
    var allBins = [];
    for (var b=0; b < plottingData.length; b++) {
      if (plottingData[b].length > 0) {
        allBins.push(plottingData[b].x0)
      }
    }

    if (allBins.length > 1) {
      linePDF = svgPDF.append('path')
                  .datum(plottingData)
                  .attr('d', guidePDF)
                  .style('stroke', distColor)
                  .style('fill', distColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');
    }
    else {
      linePDF = svgPDF.append("line")
                  .attr("x1", xPDF(allBins[0]))
                  .attr("y1", 0)
                  .attr("x2", xPDF(allBins[0]))
                  .attr("y2", h)
                  .attr('marker-start', 'url(#arrow-underlying)')
                  .style("stroke", distColor)
                  .style("stroke-width", 2)
                  .style("class", 'line');
    }
    updateCharts()
  })


  const divHeight = parseInt(d3.select("#QDistributionLegend").style("height"))
  var qDistributionLegend = d3.select("#QDistributionLegend")
    .append('svg')
    .attr('width', 450)

  const textColor = "#4C4845"
  , icon_size = 15
  , y_pos_circle = 12
  , x_pos1 = 10
  , x_pos2 = 155

  if (divHeight == 30) {
    var y_pos_star = 4
    , y_pos_circle_text = y_pos_star + 9
    , y_pos_star_text = y_pos_circle_text
    , x_pos3 = 290
  }
  else {
    var y_pos_star = 34
    , y_pos_circle_text = 13
    , y_pos_star_text = y_pos_circle_text + 30
    , x_pos3 = 2
  }

  qDistributionLegend.append('circle')
    .attr("cx", x_pos1)
    .attr("cy", y_pos_circle)
    .attr("r", 6)
    .style("fill", distColor)
  qDistributionLegend.append('circle')
    .attr("cx", x_pos2)
    .attr("cy", y_pos_circle)
    .attr("r", 6)
    .style("fill", distMeansColor)
  var legendStar = qDistributionLegend.append(function() {return starIcon.documentElement.cloneNode(true);})
    .attr('x', x_pos3)
    .attr('y', y_pos_star)
    .attr('width', icon_size)
    .attr('height', icon_size);
  legendStar.select("path")
    .style("fill", "orange")

  const legend_text_spacing = 13

  qDistributionLegend.append("text")
    .attr("x", x_pos1 + legend_text_spacing)
    .attr("y", y_pos_circle_text)
    .text("Underlying Reward")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
  qDistributionLegend.append("text")
    .attr("x", x_pos2 + legend_text_spacing)
    .attr("y", y_pos_circle_text)
    .text("Q-Value Distribution")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
  qDistributionLegend.append("text")
    .attr("x", x_pos3 + legend_text_spacing + 10)
    .attr("y", y_pos_star_text)
    .text("Effective Timesteps")
    .style("font-size", "12px")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")

  const chartXLabelPadding = 40
	const chartYLabelPadding = 35

  //Draw axes
  svgPDF.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + h + ")")
    .call(xAxisPDF)
    .append('text')
      .attr('class', 'axis-label')
      .attr('y', chartXLabelPadding)
      .attr('x', w / 2)
      .attr('fill', 'black')
      .text("Q-Value");
  svgSampleSize.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(${0},${h})`)
    .call(xAxisSampleSize)
    .append('text')
      .attr('class', 'axis-label')
      .attr('y', chartXLabelPadding)
      .attr('x', w / 2)
      .attr('fill', 'black')
      .text("Timesteps");

  svgPDF.append("g")
    .attr("class", "y axis")
    .call(yAxisPDF)
    .append('text')
      .attr('class', 'axis-label')
      .attr('y', -chartYLabelPadding)
      .attr('x', -h / 2)
      .attr('fill', 'black')
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text("Density");
  svgSampleSize.append("g")
    .attr("class", "y axis")
    .call(yAxisSampleSize)
    .append('text')
      .attr('class', 'axis-label')
      .attr('y', -chartYLabelPadding)
      .attr('x', -h / 2)
      .attr('fill', 'black')
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text("Effective Timesteps");

    gridStar.raise()
}
