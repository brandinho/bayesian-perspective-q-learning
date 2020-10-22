import {
  norm_pdf
} from './rand';

export function graphConstantAlpha(priorColor, likelihoodColor, posteriorColor) {
  var margin = {top: 50, right: 10, bottom: 50, left: 50}
  , width = 350
  , height = 350
  , innerWidth = width - margin.left - margin.right
  , innerHeight = height - margin.top - margin.bottom
  , alpha = +d3.select("#sliderAlpha").attr("value")
  , likelihood_mu = 1
  , likelihood_sigma = 3
  , initial_prior_mu = 4.5
  , initial_prior_sigma = likelihood_sigma / (1/alpha - 1)
  , bayesian_prior_mu = initial_prior_mu
  , constant_prior_mu = initial_prior_mu
  , bayesian_prior_sigma = initial_prior_sigma
  , constant_prior_sigma = initial_prior_sigma
  , bayesian_posterior_mu
  , constant_posterior_mu
  , bayesian_posterior_sigma
  , constant_posterior_sigma
  , transitionDuration = 2000
  , iteration = 0;

  document.querySelector('label[for="barAlpha"] span').innerHTML = alpha

  // Function to generate the PDF
  function create_dist(mu, sigma){
    var n = [];
    var step_size = (mu+sigma*4 - (mu-sigma*4)) / 200
    for (var i = mu-sigma*4; i < mu+sigma*4; i += step_size) {
        n.push({x: i, y: norm_pdf(i, mu, sigma)})
    }
    return n;
  }

  // Function to get the posterior mu
  function get_posterior_mu(prior_mu, prior_sigma, likelihood_mu, likelihood_sigma) {
    var weighted_likelihood_mu = (prior_sigma / (prior_sigma + likelihood_sigma)) * likelihood_mu
    var weighted_prior_mu = (likelihood_sigma / (prior_sigma + likelihood_sigma)) * prior_mu
    return weighted_likelihood_mu + weighted_prior_mu
  }

  // Function to get the posterior sigma
  function get_posterior_sigma(prior_sigma, likelihood_sigma) {
    return prior_sigma * likelihood_sigma / (prior_sigma + likelihood_sigma)
  }

  // Initialize the distributions
  var priorBayesian = create_dist(bayesian_prior_mu, bayesian_prior_sigma)
  , likelihoodBayesian = create_dist(likelihood_mu, likelihood_sigma)
  , posteriorBayesian
  , priorConstant = create_dist(constant_prior_mu, constant_prior_sigma)
  , likelihoodConstant = create_dist(likelihood_mu, likelihood_sigma)
  , posteriorConstant

  // Draw the SVGs
  var svgBayesian = d3.select("#bayesian-alpha-plot")
      .classed("svg-container", true)
  		.append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${height} ${width}`)
        .classed("svg-content-responsive", true)
  var svgConstant = d3.select("#constant-alpha-plot")
      .classed("svg-container", true)
      .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${height} ${width}`)
        .classed("svg-content-responsive", true)

  // Set up axes and scales
  const xValue = d => d.x;
  const xAxisLabel = "Range";

  const yValue = d => d.y;
  const yAxisLabel = "Density";

  var rangeXBayesianPrior = d3.extent(priorBayesian, xValue)
  , rangeXConstantPrior = d3.extent(priorConstant, xValue)
  , rangeXBayesianLikelihood = d3.extent(likelihoodBayesian, xValue)
  , rangeXConstantLikelihood = d3.extent(likelihoodConstant, xValue)

  var rangeYBayesianPrior = d3.extent(priorBayesian, yValue)
  , rangeYConstantPrior = d3.extent(priorConstant, yValue)
  , rangeYBayesianLikelihood = d3.extent(likelihoodBayesian, yValue)
  , rangeYConstantLikelihood = d3.extent(likelihoodConstant, yValue)

  const xScale = d3.scaleLinear()
    .domain([d3.min([rangeXBayesianPrior[0], rangeXConstantPrior[0],
                     rangeXBayesianLikelihood[0], rangeXConstantLikelihood[0]]),
             d3.max([rangeXBayesianPrior[1], rangeXConstantPrior[1],
                     rangeXBayesianLikelihood[1], rangeXConstantLikelihood[1]])])
    .range([0, innerWidth])
    .nice();

  var yScaleBayesian = d3.scaleLinear()
    .domain([d3.min([rangeYBayesianPrior[0], rangeYBayesianLikelihood[0]]),
             d3.max([rangeYBayesianPrior[1], rangeYBayesianLikelihood[1]])])
    .range([innerHeight, 0])
    .nice();
  var yScaleConstant = d3.scaleLinear()
    .domain([d3.min([rangeYConstantPrior[0], rangeYConstantLikelihood[0]]),
             d3.max([rangeYConstantPrior[1], rangeYConstantLikelihood[1]])])
    .range([innerHeight, 0])
    .nice();

  const gBayesian = svgBayesian.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const gConstant = svgConstant.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickSize(0)
    .tickPadding(20);

  var yAxisBayesian = d3.axisLeft(yScaleBayesian)
    .ticks(6)
    .tickSize(0)
    .tickPadding(10);
  var yAxisConstant = d3.axisLeft(yScaleConstant)
    .ticks(6)
    .tickSize(0)
    .tickPadding(10);

  gBayesian.append('g')
    .attr("class","axis")
    .call(yAxisBayesian);
  gConstant.append('g')
    .attr("class","axis")
    .call(yAxisConstant);

  gBayesian.append('g').call(xAxis)
    .attr('transform', `translate(0,${innerHeight})`);
  gConstant.append('g').call(xAxis)
    .attr('transform', `translate(0,${innerHeight})`);

  gBayesian.append("text")
        .attr("x", (innerWidth / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#696969")
        .text("Regular Bayesian Update");
  gConstant.append("text")
        .attr("x", (innerWidth / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#696969")
        .text("Constant Alpha Update");

  // Draw the lines on the graphs
  const lineGeneratorBayesian = d3.line()
    .x(d => xScale(xValue(d)))
    .y(d => yScaleBayesian(yValue(d)))
    .curve(d3.curveBasis);
  const lineGeneratorConstant = d3.line()
    .x(d => xScale(xValue(d)))
    .y(d => yScaleConstant(yValue(d)))
    .curve(d3.curveBasis);

  const render = (data, color, class_name, group) => {
    const dist_path = group.append('path')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('class', class_name)

    if (class_name.includes("bayesian")) {
      dist_path
        .attr('d', lineGeneratorBayesian(data))
        .transition()
          .duration(transitionDuration)
          .attrTween('d', pathTween);
    }
    else if (class_name.includes("constant")) {
      dist_path
        .attr('d', lineGeneratorConstant(data))
        .transition()
          .duration(transitionDuration)
          .attrTween('d', pathTween);
    }

    function pathTween() {
      var interpolate = d3.scaleQuantile()
        .domain([0,1])
        .range(d3.range(1, data.length + 1));
      return function(t) {
        if (class_name.includes("bayesian")) {
          return lineGeneratorBayesian(data.slice(0, interpolate(t)));
        }
        else if (class_name.includes("constant")) {
          return lineGeneratorConstant(data.slice(0, interpolate(t)));
        }
      };
    }
  };

  // Function to refresh the charts given the user presses a button
  function refreshCharts() {
    d3.select('.bayesian-prior').remove()
    d3.select('.bayesian-likelihood').remove()
    d3.select('.constant-prior').remove()
    d3.select('.constant-likelihood').remove()
    d3.select('.bayesian-posterior').remove()
    d3.select('.constant-posterior').remove()

    initial_prior_sigma = likelihood_sigma / (1/alpha - 1)
    bayesian_prior_mu = initial_prior_mu
    constant_prior_mu = initial_prior_mu
    bayesian_prior_sigma = initial_prior_sigma
    constant_prior_sigma = initial_prior_sigma

    priorBayesian = create_dist(bayesian_prior_mu, bayesian_prior_sigma)
    likelihoodBayesian = create_dist(likelihood_mu, likelihood_sigma)
    priorConstant = create_dist(constant_prior_mu, constant_prior_sigma)
    likelihoodConstant = create_dist(likelihood_mu, likelihood_sigma)

    rangeYBayesianPrior = d3.extent(priorBayesian, yValue)
    rangeYConstantPrior = d3.extent(priorConstant, yValue)

    yScaleBayesian = d3.scaleLinear()
      .domain([d3.min([rangeYBayesianPrior[0], rangeYBayesianLikelihood[0]]),
               d3.max([rangeYBayesianPrior[1], rangeYBayesianLikelihood[1]])])
      .range([innerHeight, 0])
      .nice();
    yScaleConstant = d3.scaleLinear()
      .domain([d3.min([rangeYConstantPrior[0], rangeYConstantLikelihood[0]]),
               d3.max([rangeYConstantPrior[1], rangeYConstantLikelihood[1]])])
      .range([innerHeight, 0])
      .nice();

    yAxisBayesian = d3.axisLeft(yScaleBayesian)
      .ticks(6)
      .tickSize(0)
      .tickPadding(10);
    yAxisConstant = d3.axisLeft(yScaleConstant)
      .ticks(6)
      .tickSize(0)
      .tickPadding(10);

    gBayesian.select('.axis')
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePoly)
      .call(yAxisBayesian);
    gConstant.select('.axis')
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePoly)
      .call(yAxisConstant);

    render(priorBayesian, priorColor, 'bayesian-prior', gBayesian)
    render(likelihoodBayesian, likelihoodColor, 'bayesian-likelihood', gBayesian)
    render(priorConstant, priorColor, 'constant-prior', gConstant)
    render(likelihoodConstant, likelihoodColor, 'constant-likelihood', gConstant)

    iteration = 0
  }

  refreshCharts()

  // Load in the SVGs for the buttons
  Promise.all([
    d3.xml("assets/next.svg"),
    d3.xml("assets/refresh.svg")
  ]).then(buttons => {
      var buttonWidth = 60
      var textHeight = 30
      var verticalShift = 10

      var nextButtonSVG = d3.select("#next-button")
      		.append("svg")
      		.attr("width", buttonWidth)
      		.attr("height", buttonWidth + textHeight)
      nextButtonSVG
          .append(function() {return buttons[0].documentElement.cloneNode(true);})
            .attr("width", buttonWidth)
            .attr("y", -verticalShift)
            .attr("class", "probability-buttons")
            .on("mouseover", function(d){
              d3.select(this)
                .style("cursor", "pointer")
            })
            .on("mousedown", function(){
              nextButtonSVG.selectAll("path")
                .style("fill-opacity", 0.7)
            })
            .on("mouseup", function(){
              nextButtonSVG.selectAll("path")
                .style("fill-opacity", 1)
            })
            .on("click", function(){
              if (iteration != 0) {
                d3.select('.bayesian-prior').remove()
                var bayesian_posterior_path = d3.select('.bayesian-posterior').transition();

                bayesian_prior_mu = bayesian_posterior_mu
                bayesian_prior_sigma = bayesian_posterior_sigma
                priorBayesian = create_dist(bayesian_prior_mu, bayesian_prior_sigma)
                bayesian_posterior_path
                  .duration(1000)
                  .attr('stroke', priorColor)
                  .attr('class', 'bayesian-prior')

                d3.select('.constant-prior').remove()
                var constant_posterior_path = d3.select('.constant-posterior').transition();

                constant_prior_mu = constant_posterior_mu
                constant_prior_sigma = constant_posterior_sigma + constant_prior_sigma * alpha
                priorConstant = create_dist(constant_prior_mu, constant_prior_sigma)
                constant_posterior_path
                  .duration(1000)
                  .attr('stroke', priorColor)
                  .attr('class', 'constant-prior')
                  .attr('d', lineGeneratorConstant(priorConstant))
              }

              bayesian_posterior_mu = get_posterior_mu(bayesian_prior_mu, bayesian_prior_sigma, likelihood_mu, likelihood_sigma)
              bayesian_posterior_sigma = get_posterior_sigma(bayesian_prior_sigma, likelihood_sigma)
              constant_posterior_mu = get_posterior_mu(constant_prior_mu, constant_prior_sigma, likelihood_mu, likelihood_sigma)
              constant_posterior_sigma = get_posterior_sigma(constant_prior_sigma, likelihood_sigma)

              posteriorBayesian = create_dist(bayesian_posterior_mu, bayesian_posterior_sigma)
              posteriorConstant = create_dist(constant_posterior_mu, constant_posterior_sigma)

              var posteriorRangeYBayesian = d3.extent(posteriorBayesian, yValue)
              var posteriorRangeYConstant = d3.extent(posteriorConstant, yValue)

              yScaleBayesian = d3.scaleLinear()
                .domain([d3.min([rangeYBayesianPrior[0], rangeYBayesianLikelihood[0]]), posteriorRangeYBayesian[1]])
                .range([innerHeight, 0])
                .nice();
              yScaleConstant = d3.scaleLinear()
                .domain([d3.min([rangeYConstantPrior[0], rangeYConstantLikelihood[0]]), posteriorRangeYConstant[1]])
                .range([innerHeight, 0])
                .nice();

              yAxisBayesian = d3.axisLeft(yScaleBayesian)
                .ticks(6)
                .tickSize(0)
                .tickPadding(10)
              yAxisConstant = d3.axisLeft(yScaleConstant)
                .ticks(6)
                .tickSize(0)
                .tickPadding(10)

              gBayesian.select('.axis')
                .transition()
                .duration(transitionDuration)
                .ease(d3.easePoly)
                .call(yAxisBayesian);
              gConstant.select('.axis')
                .transition()
                .duration(transitionDuration)
                .ease(d3.easePoly)
                .call(yAxisConstant);

              if (iteration != 0) {
                bayesian_posterior_path
                  .duration(transitionDuration)
                  .attr("d", lineGeneratorBayesian(priorBayesian))
                constant_posterior_path
                  .duration(transitionDuration)
                  .attr("d", lineGeneratorConstant(priorConstant))
              }
              else {
                d3.select(".bayesian-prior").transition()
                  .duration(transitionDuration)
                  .attr("d", lineGeneratorBayesian(priorBayesian))
                d3.select(".constant-prior").transition()
                  .duration(transitionDuration)
                  .attr("d", lineGeneratorConstant(priorConstant))
              }
              d3.select(".bayesian-likelihood").transition()
                .duration(transitionDuration)
                .attr("d", lineGeneratorBayesian(likelihoodBayesian))
              d3.select(".constant-likelihood").transition()
                .duration(transitionDuration)
                .attr("d", lineGeneratorConstant(likelihoodConstant))

              render(posteriorBayesian, posteriorColor, 'bayesian-posterior', gBayesian)
              render(posteriorConstant, posteriorColor, 'constant-posterior', gConstant)

              iteration++
            });

      var refreshButtonSVG = d3.select("#refresh-button")
      		.append("svg")
      		.attr("width", buttonWidth)
      		.attr("height", buttonWidth + textHeight)
      refreshButtonSVG
          .append(function() {return buttons[1].documentElement.cloneNode(true);})
            .attr("width", buttonWidth)
            .attr("y", -verticalShift)
            .attr("class", "probability-buttons")
            .on("mouseover", function(d){
              d3.select(this)
                .style("cursor", "pointer")
            })
            .on("mousedown", function(){
              refreshButtonSVG.selectAll("path")
                .style("fill-opacity", 0.7)
            })
            .on("mouseup", function(){
              refreshButtonSVG.selectAll("path")
                .style("fill-opacity", 1)
            })
            .on("click", function(){
              refreshCharts()
            });

      // Change Colors
      const buttonColor = "#56ddd2"
      nextButtonSVG.select("path:nth-child(1)")
        .style("fill", buttonColor)
      nextButtonSVG.select("path:nth-child(2)")
        .style("fill", buttonColor)

      refreshButtonSVG.selectAll("path:nth-child(1)")
        .style("fill", buttonColor)
      refreshButtonSVG.selectAll("path:nth-child(2)")
        .style("fill", buttonColor)

      // Append Text
      const textFont = "bold 10pt arial"
      nextButtonSVG.append("text")
        .text("Posterior")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonWidth + textHeight - verticalShift)
        .style("font", textFont)
        .attr("alignment-baseline","middle")
        .style("text-anchor", "middle");
      refreshButtonSVG.append("text")
        .text("Refresh")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonWidth + textHeight - verticalShift)
        .style("font", textFont)
        .attr("alignment-baseline","middle")
        .style("text-anchor", "middle");

      // Add Legend
      const legend_X_pos = 20
      , legend_X_spacing = 100
      , legend_Y_pos = 12
      , legend_text_spacing = 20;

      var legend = d3.select("#constantAlphaLegend").append("svg")
        .attr("width", legend_X_pos + 280)
      legend.append("circle")
        .attr("cx", legend_X_pos)
        .attr("cy", legend_Y_pos)
        .attr("r", 6)
        .style("fill", priorColor)
      legend.append("circle")
        .attr("cx", legend_X_pos + 75)
        .attr("cy", legend_Y_pos)
        .attr("r", 6)
        .style("fill", likelihoodColor)
      legend.append("circle")
        .attr("cx", legend_X_pos + 190)
        .attr("cy", legend_Y_pos)
        .attr("r", 6)
        .style("fill", posteriorColor)

      const textColor = "#4C4845"
      legend.append("text")
        .attr("x", legend_X_pos + legend_text_spacing)
        .attr("y", legend_Y_pos)
        .text("Prior")
        .style("font-size", "16px")
        .style("fill", textColor)
        .attr("alignment-baseline","middle")
      legend.append("text")
        .attr("x", legend_X_pos + 75 + legend_text_spacing)
        .attr("y", legend_Y_pos)
        .text("Likelihood")
        .style("font-size", "16px")
        .style("fill", textColor)
        .attr("alignment-baseline","middle")
      legend.append("text")
        .attr("x", legend_X_pos + 190 + legend_text_spacing)
        .attr("y", legend_Y_pos)
        .text("Posterior")
        .style("font-size", "16px")
        .style("fill", textColor)
        .attr("alignment-baseline","middle")
  });

  // Refresh the charts when the user changes the starting alpha
  d3.select("#sliderAlpha").on("change", function(){
    alpha = +this.value
    document.querySelector('label[for="barAlpha"] span').innerHTML = alpha
    refreshCharts()
  })
}
