import {
  norm_pdf
} from './rand';

export function plotInflectionPoint(downDistColor, barFillColor, rightDistColor) {
  function getTextWidth(text, font) {
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
  }

  //Set dimensions
  const textFont = "bold 12pt arial"
  , probAboveText = "Probability Above"
  , probAboveTextWidth = getTextWidth(probAboveText, textFont)
  , probJointText = "Joint Density"
  , probJointTextWidth = getTextWidth(probJointText, textFont)
  , maxProbTextWidth = d3.max([probAboveTextWidth, probJointTextWidth])
  , textWidthDiff = maxProbTextWidth - d3.min([probAboveTextWidth, probJointTextWidth])

  var m = {top: 50, right: 5, bottom: 50, left: 60}
  , leftMargin = 20
  , chartHeight = 350 - m.top - m.bottom
  , chartWidth = 350 - m.left - m.right
  , probBarHeight = parseInt(d3.select(".probability-bar").style("height"))
  , probBarWidth = parseInt(d3.select(".probability-bar").style("width")) - leftMargin - maxProbTextWidth - m.right
  , episode = +d3.select("#sliderInflectionEpisode").attr("value") - 1
  , episodeMax = +d3.select("#sliderInflectionEpisode").attr("max") - 1
  , upper_range = 50
  , lower_range = -upper_range
  , upper_bound = upper_range
  , lower_bound = lower_range
  , barRangeY = 10;

  document.querySelector('label[for="barInflectionEpisode"] span').innerHTML = episode + 1;

  function generate_norm_pdf_curve(mu, sigma) {
    var normal_distribution = []
    for (var i = mu - sigma * 4; i < mu + sigma * 4; i += 0.05) {
      normal_distribution.push({
          mu: i,
          density: norm_pdf(i, mu, sigma)
      })
    }
    return normal_distribution
  }

  function makeVerticalLine(barLevel) {
    const barLevelData = []
    for (var i = 0; i <= barRangeY; i++) {
      barLevelData.push({
        x: barLevel,
        y: i,
      })
    }
    return barLevelData
  }

  function getProgressData(tradeoff) {
    var progressData = []
    // for (var i = 0; i < Object.keys(tradeoff).length; i++) {
    for (var i = 0; i < 500; i++) {
      progressData.push({
        e: i,
        mu_down: tradeoff[i].mu_down,
        sigma_down: tradeoff[i].sigma_down,
        mu_right: tradeoff[i].mu_right,
        sigma_right: tradeoff[i].sigma_right,
      })
    }
    return progressData;
  }

  Promise.all([
    d3.json("data/optimal_exploration_exploitation.json"),
    d3.json("data/suboptimal_exploration_exploitation.json")
  ]).then(exploration_exploitation => {
    const optimal_exploration_exploitation = exploration_exploitation[0]
    const suboptimal_exploration_exploitation = exploration_exploitation[1]

    var progressDataOptimal = getProgressData(optimal_exploration_exploitation);
    var progressDataSuboptimal = getProgressData(suboptimal_exploration_exploitation);

    var tradeoff, progressData;
    var optimal_suboptimal = d3.selectAll("input[name = 'inflection-point']").attr("value")
    if (optimal_suboptimal == "optimal") {
      tradeoff = optimal_exploration_exploitation
      progressData = progressDataOptimal
    }
    else if (optimal_suboptimal == "suboptimal") {
      tradeoff = suboptimal_exploration_exploitation
      progressData = progressDataSuboptimal
    }

    // Generate Data
    var down_mu = tradeoff[`${episode}`].mu_down
    , down_sigma = tradeoff[`${episode}`].sigma_down
    , right_mu = tradeoff[`${episode}`].mu_right
    , right_sigma = tradeoff[`${episode}`].sigma_right
    , down_norm_dist = generate_norm_pdf_curve(down_mu, down_sigma)
    , right_norm_dist = generate_norm_pdf_curve(right_mu, right_sigma);

    var barLevelAbove = tradeoff[`${episode}`].probability_above
    , barLevelOverlap = tradeoff[`${episode}`].probability_overlap
    , barLevelAboveData = makeVerticalLine(barLevelAbove)
    , barLevelOverlapData = makeVerticalLine(barLevelOverlap)

    // Axes and scales
    var xPDF = d3.scaleLinear().domain([lower_bound, upper_bound]).range([0, chartWidth]).nice();
    var xProgress = d3.scaleLinear().domain([0, episodeMax]).range([0, chartWidth]).nice();
    var xBar = d3.scaleLinear().domain([0, 1]).range([0, probBarWidth]);

    var yPDF = d3.scaleLinear().domain([0, 0.1]).range([chartHeight, 0]).nice();
    var yProgress = d3.scaleLinear().domain([-50, 50]).range([chartHeight, 0]).nice();
    var yBar = d3.scaleLinear().domain([0, 1]).range([probBarHeight, 0]);

    var xAxisPDF = d3.axisBottom(xPDF)
      .ticks(5)
      .tickSize(0)
      .tickPadding(15);
    var xAxisProgress = d3.axisBottom(xProgress)
      .ticks(5)
      .tickSize(0)
      .tickPadding(15)
      .tickFormat(function (d) {
        if ((d / 1000) >= 1) {
          d = d / 1000 + "K";
        }
        return d;
      });
    var xAxisBar = d3.axisBottom(xBar);

    var yAxisPDF = d3.axisLeft(yPDF)
      .ticks(6)
      .tickSize(0)
      .tickPadding(15);
    var yAxisProgress = d3.axisLeft(yProgress)
      .ticks(6)
      .tickSize(0)
      .tickPadding(15);
    var yAxisBar = d3.axisLeft(yBar);


    //Draw svg
    var svgDistributions = d3.select("#distributionsInflectionPoint")
          .classed("svg-container", true)
          .append("svg")
              .attr("preserveAspectRatio", "xMinYMin meet")
              .attr("viewBox", `0 0 ${chartHeight + m.top + m.bottom} ${chartWidth + m.left + m.right}`)
              .classed("svg-content-responsive", true)
              .append("g")
              .attr("transform", "translate(" + m.left + "," + m.top + ")");
    svgDistributions.append("clipPath")
      .attr("id", "rect-clip")
      .append("rect")
      .attr("height", chartHeight)
      .attr("width", chartWidth);

    var svgProgress = d3.select("#progressInflectionPoint")
          .classed("svg-container", true)
          .append("svg")
              .attr("preserveAspectRatio", "xMinYMin meet")
              .attr("viewBox", `0 0 ${chartHeight + m.top + m.bottom} ${chartWidth + m.left + m.right}`)
              .classed("svg-content-responsive", true)
              .append("g")
              .attr("transform", "translate(" + m.left + "," + m.top + ")");

    var svgProbAbove = d3.select("#probAboveInflectionPoint").append("svg")
              .attr("width", probBarWidth + leftMargin + maxProbTextWidth + m.right)
              .attr("height", probBarHeight)
              .append("g")
              .attr("transform", `translate(${leftMargin + maxProbTextWidth},${0})`);

    svgProbAbove.append("g")
      .append("text")
      .attr("transform", `translate(${-leftMargin - maxProbTextWidth},${0})`)
      .attr("y", probBarHeight * 0.75)
      .style("font", textFont)
      .style("text-anchor", "start")
      .text(probAboveText)

    var rectProbAbove = svgProbAbove.append("rect")
              .attr("width", probBarWidth)
              .attr("height", probBarHeight)
              .style("fill", "none")
              .style("stroke", "grey")
              .style("stroke-width", "2px")

    var svgProbJoint = d3.select("#probJointInflectionPoint").append("svg")
              .attr("width", probBarWidth + leftMargin + maxProbTextWidth + m.right)
              .attr("height", probBarHeight)
              .append("g")
              .attr("transform", `translate(${leftMargin + maxProbTextWidth},${0})`);

    svgProbJoint.append("g")
      .append("text")
      .attr("transform", `translate(${-leftMargin - maxProbTextWidth},${0})`)
      .attr("y", probBarHeight * 0.75)
      .style("font", textFont)
      .style("text-anchor", "start")
      .text(probJointText)

    var rectProbJoint = svgProbJoint.append("rect")
              .attr("width", probBarWidth)
              .attr("height", probBarHeight)
              .style("fill", "none")
              .style("stroke", "grey")
              .style("stroke-width", "2px")


    //Draw CDF line
    var guidePDF = d3.line()
                .x(function(d){ return xPDF(d.mu) })
                .y(function(d){ return yPDF(d.density) })
                .curve(d3.curveBasis);

    var areaProgressDown = d3.area()
                .x(function(d){ return xProgress(d.e) })
                .y0(function(d){ return yProgress(d3.max([lower_range, d.mu_down - d.sigma_down])) })
                .y1(function(d){ return yProgress(d3.min([upper_range, d.mu_down + d.sigma_down])) })
                .curve(d3.curveBasis);
    var areaProgressRight = d3.area()
                .x(function(d){ return xProgress(d.e) })
                .y0(function(d){ return yProgress(d3.max([lower_range, d.mu_right - d.sigma_right])) })
                .y1(function(d){ return yProgress(d3.min([upper_range, d.mu_right + d.sigma_right])) })
                .curve(d3.curveBasis);

    var largeAreaProgressDown = d3.area()
                .x(function(d){ return xProgress(d.e) })
                .y0(function(d){ return yProgress(d3.max([lower_range, d.mu_down - 2 * d.sigma_down])) })
                .y1(function(d){ return yProgress(d3.min([upper_range, d.mu_down + 2 * d.sigma_down])) })
                .curve(d3.curveBasis);
    var largeAreaProgressRight = d3.area()
                .x(function(d){ return xProgress(d.e) })
                .y0(function(d){ return yProgress(d3.max([lower_range, d.mu_right - 2 * d.sigma_right])) })
                .y1(function(d){ return yProgress(d3.min([upper_range, d.mu_right + 2 * d.sigma_right])) })
                .curve(d3.curveBasis);

    var guideProgressDown = d3.line()
                .x(function(d){ return xProgress(d.e) })
                .y(function(d){ return yProgress(d.mu_down) })
                .curve(d3.curveBasis);
    var guideProgressRight = d3.line()
                .x(function(d){ return xProgress(d.e) })
                .y(function(d){ return yProgress(d.mu_right) })
                .curve(d3.curveBasis);

    var guideBarArea = d3.area()
                .x0(0)
                .x1(function(d){ return xBar(d.x) })
                .y(function(d){ return yBar(d.y) })
                .curve(d3.curveBasis);
    var guideBarLine = d3.line()
                .x(function(d){ return xBar(d.x) })
                .y(function(d){ return yBar(d.y) })
                .curve(d3.curveBasis);

    var downPDF = svgDistributions.append('path')
                .datum(down_norm_dist)
                .attr('d', guidePDF)
                .attr("clip-path", "url(#rect-clip)")
                .style('stroke', downDistColor)
                .style('fill', downDistColor)
                .style('fill-opacity', 0.3)
                .attr('class', 'line');
    var rightPDF = svgDistributions.append('path')
                .datum(right_norm_dist)
                .attr('d', guidePDF)
                .attr("clip-path", "url(#rect-clip)")
                .style('stroke', rightDistColor)
                .style('fill', rightDistColor)
                .style('fill-opacity', 0.3)
                .attr('class', 'line');

    var progressDownArea = svgProgress.append('path')
                .datum(progressData)
                .attr('d', areaProgressDown)
                .style('stroke', 'none')
                .style('fill', downDistColor)
                .style('fill-opacity', 0.15);
    var progressRightArea = svgProgress.append('path')
                .datum(progressData)
                .attr('d', areaProgressRight)
                .style('stroke', 'none')
                .style('fill', rightDistColor)
                .style('fill-opacity', 0.15);

    var progressDownLargeArea = svgProgress.append('path')
                .datum(progressData)
                .attr('d', largeAreaProgressDown)
                .style('stroke', 'none')
                .style('fill', downDistColor)
                .style('fill-opacity', 0.15);
    var progressRightLargeArea = svgProgress.append('path')
                .datum(progressData)
                .attr('d', largeAreaProgressRight)
                .style('stroke', 'none')
                .style('fill', rightDistColor)
                .style('fill-opacity', 0.15);

    var progressDownLine = svgProgress.append('path')
                .datum(progressData)
                .attr('d', guideProgressDown)
                .style('stroke', downDistColor)
                .style('stroke-width', 1.5)
                .attr('class', 'line');
    var progressRightLine = svgProgress.append('path')
                .datum(progressData)
                .attr('d', guideProgressRight)
                .style('stroke', rightDistColor)
                .style('stroke-width', 1.5)
                .attr('class', 'line');
    var verticalLine = svgProgress.append("line")
                .attr("x1", xProgress(episode))
                .attr("y1", 0)
                .attr("x2", xProgress(episode))
                .attr("y2", chartHeight)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .style("class", 'line');

    var barAboveArea = svgProbAbove.append('path')
                .datum(barLevelAboveData)
                .attr('d', guideBarArea)
                .style('fill', barFillColor)
                .style('fill-opacity', 0.5);
    var barAboveLine = svgProbAbove.append('path')
                .datum(barLevelAboveData)
                .attr('d', guideBarLine)
                .style('stroke', barFillColor)
                .style('stroke-width', 4)
                .attr('class', 'line');
    var barOverlapArea = svgProbJoint.append('path')
                .datum(barLevelOverlapData)
                .attr('d', guideBarArea)
                .style('fill', barFillColor)
                .style('fill-opacity', 0.5);
    var barOverlapLine = svgProbJoint.append('path')
                .datum(barLevelOverlapData)
                .attr('d', guideBarLine)
                .style('stroke', barFillColor)
                .style('stroke-width', 4)
                .attr('class', 'line');

    function updateCharts() {
      down_mu = tradeoff[`${episode}`].mu_down
      down_sigma = tradeoff[`${episode}`].sigma_down
      right_mu = tradeoff[`${episode}`].mu_right
      right_sigma = tradeoff[`${episode}`].sigma_right
      down_norm_dist = generate_norm_pdf_curve(down_mu, down_sigma);
      right_norm_dist = generate_norm_pdf_curve(right_mu, right_sigma);

      barLevelAbove = tradeoff[`${episode}`].probability_above
      barLevelOverlap = tradeoff[`${episode}`].probability_overlap
      barLevelAboveData = makeVerticalLine(barLevelAbove)
      barLevelOverlapData = makeVerticalLine(barLevelOverlap)

      downPDF.remove()
      rightPDF.remove()

      barAboveArea.remove()
      barAboveLine.remove()
      barOverlapArea.remove()
      barOverlapLine.remove()

      progressDownArea.remove()
      progressRightArea.remove()
      progressDownLargeArea.remove()
      progressRightLargeArea.remove()
      progressDownLine.remove()
      progressRightLine.remove()
      verticalLine.remove()
      downPDF = svgDistributions.append('path')
                  .datum(down_norm_dist)
                  .attr('d', guidePDF)
                  .attr("clip-path", "url(#rect-clip)")
                  .style('stroke', downDistColor)
                  .style('fill', downDistColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');
      rightPDF = svgDistributions.append('path')
                  .datum(right_norm_dist)
                  .attr('d', guidePDF)
                  .attr("clip-path", "url(#rect-clip)")
                  .style('stroke', rightDistColor)
                  .style('fill', rightDistColor)
                  .style('fill-opacity', 0.3)
                  .attr('class', 'line');

      progressDownArea = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', areaProgressDown)
                  .style('stroke', 'none')
                  .style('fill', downDistColor)
                  .style('fill-opacity', 0.15);
      progressRightArea = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', areaProgressRight)
                  .style('stroke', 'none')
                  .style('fill', rightDistColor)
                  .style('fill-opacity', 0.15);

      progressDownLargeArea = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', largeAreaProgressDown)
                  .style('stroke', 'none')
                  .style('fill', downDistColor)
                  .style('fill-opacity', 0.15);
      progressRightLargeArea = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', largeAreaProgressRight)
                  .style('stroke', 'none')
                  .style('fill', rightDistColor)
                  .style('fill-opacity', 0.15);

      progressDownLine = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', guideProgressDown)
                  .style('stroke', downDistColor)
                  .style('stroke-width', 1.5)
                  .attr('class', 'line');
      progressRightLine = svgProgress.append('path')
                  .datum(progressData)
                  .attr('d', guideProgressRight)
                  .style('stroke', rightDistColor)
                  .style('stroke-width', 1.5)
                  .attr('class', 'line');
      verticalLine = svgProgress.append("line")
                  .attr("x1", xProgress(episode))
                  .attr("y1", 0)
                  .attr("x2", xProgress(episode))
                  .attr("y2", chartHeight)
                  .style("stroke", "black")
                  .style("stroke-width", 2)
                  .style("class", 'line');

      barAboveArea = svgProbAbove.append('path')
                  .datum(barLevelAboveData)
                  .attr('d', guideBarArea)
                  .style('fill', barFillColor)
                  .style('fill-opacity', 0.5);
      barAboveLine = svgProbAbove.append('path')
                  .datum(barLevelAboveData)
                  .attr('d', guideBarLine)
                  .style('stroke', barFillColor)
                  .style('stroke-width', 4)
                  .attr('class', 'line');
      barOverlapArea = svgProbJoint.append('path')
                  .datum(barLevelOverlapData)
                  .attr('d', guideBarArea)
                  .style('fill', barFillColor)
                  .style('fill-opacity', 0.5);
      barOverlapLine = svgProbJoint.append('path')
                  .datum(barLevelOverlapData)
                  .attr('d', guideBarLine)
                  .style('stroke', barFillColor)
                  .style('stroke-width', 4)
                  .attr('class', 'line');
    }

    d3.select("#sliderInflectionEpisode").on("input", function(){
      episode = +this.value - 1
      document.querySelector('label[for="barInflectionEpisode"] span').innerHTML = episode + 1;
      updateCharts()
    })

    d3.selectAll("input[name = 'inflection-point']").on("change", function(){
      optimal_suboptimal = this.value
      console.log(optimal_suboptimal)
      if (optimal_suboptimal == "optimal") {
        tradeoff = optimal_exploration_exploitation
        progressData = progressDataOptimal
      }
      else if (optimal_suboptimal == "suboptimal") {
        tradeoff = suboptimal_exploration_exploitation
        progressData = progressDataSuboptimal
      }
      updateCharts()
    })

    // Draw Legend
    const legend_X_pos = 20
    , legend_X_spacing = 100
    , legend_Y_pos = 12
    , legend_text_spacing = 20;

    var legend = d3.select("#inflectionLegend").append("svg")
      .attr("width", legend_X_pos + legend_X_spacing + 70)
    legend.append("circle")
      .attr("cx", legend_X_pos)
      .attr("cy", legend_Y_pos)
      .attr("r", 6)
      .style("fill", downDistColor)
    legend.append("circle")
      .attr("cx", legend_X_pos + legend_X_spacing)
      .attr("cy", legend_Y_pos)
      .attr("r", 6)
      .style("fill", rightDistColor)

    const textColor = "#4C4845"
    legend.append("text")
      .attr("x", legend_X_pos + legend_text_spacing)
      .attr("y", legend_Y_pos)
      .text("Down")
      .style("font-size", "16px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    legend.append("text")
      .attr("x", legend_X_pos + legend_X_spacing + legend_text_spacing)
      .attr("y", legend_Y_pos)
      .text("Right")
      .style("font-size", "16px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")

    const chartXLabelPadding = 45
  	const chartYLabelPadding = 35

    //Draw axes
    svgDistributions.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(xAxisPDF)
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', chartXLabelPadding)
        .attr('x', chartWidth / 2)
        .attr('fill', 'black')
        .text("Q-Value");
    svgProgress.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(xAxisProgress)
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', chartXLabelPadding)
        .attr('x', chartWidth / 2)
        .attr('fill', 'black')
        .text("Episodes");

    svgDistributions.append("g")
      .attr("class", "y axis")
      .call(yAxisPDF)
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', -(chartYLabelPadding + 10))
        .attr('x', -chartHeight / 2)
        .attr('fill', 'black')
        .attr('transform', `rotate(-90)`)
        .attr('text-anchor', 'middle')
        .text("Density");
    svgProgress.append("g")
      .attr("class", "y axis")
      .call(yAxisProgress)
      .append('text')
        .attr('class', 'axis-label')
        .attr('y', -chartYLabelPadding)
        .attr('x', -chartHeight / 2)
        .attr('fill', 'black')
        .attr('transform', `rotate(-90)`)
        .attr('text-anchor', 'middle')
        .text("Q-Value");
  });
}
