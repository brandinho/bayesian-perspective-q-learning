export function graphEpsilonAlpha(epsilonColor, alphaColor) {
	const margin = {top: 10, right: 10, bottom: 20, left: 55}
	, chartXLabelPadding = 50
	, chartYLabelPadding = 40
	, chartWidth = parseInt(d3.select("#EpsilonAlphaCorrelation").style("width"))
	, chartHeight = parseInt(d3.select("#EpsilonAlphaCorrelation").style("height")) - chartXLabelPadding
	, innerWidth = chartWidth - margin.left - margin.right
	, innerHeight = chartHeight - margin.top - margin.bottom;

	var analysisType = d3.selectAll('input[name="EpsilonAlpha-scenarios"]:checked').property('value')
	, nextQValue = parseInt(d3.select("#sliderNextQEpsilonAlpha").attr("value"))
	, defaultStringStart = "\\text{Update Rule:} \\,\\, \\alpha(r_{t+1} + \\gamma \\color{"
	, defaultStringEnd = "}q(s^\\prime,a^\\prime)\\color{black}) + (1 - \\alpha) q(s,a)"
	, textToUpdate
	, currentUpdateText

	document.querySelector('label[for="barNextQEpsilonAlpha"] span').innerHTML = nextQValue;

	// Draw the SVG
	var container = d3.select("#EpsilonAlphaCorrelation")
		.append("svg")
		.attr("width",`${chartWidth + chartYLabelPadding}`)
		.attr("height",`${chartHeight + chartXLabelPadding}`);

	// Function to render the line chart
	const renderLineChart = lineData => {
		// Set up the scales and axes
	  const xValue = d => d.x;
	  const xAxisLabel = "Episodes";

	  const epsilonValue = d => d.epsilon;
	  const alphaValue = d => d.alpha;
	  const yAxisLabel = "Epsilon/Alpha";

	  const xScale = d3.scaleLinear()
	    .domain(d3.extent(lineData, xValue))
	    .range([0, innerWidth])

	  var rangeY1 = d3.extent(lineData, epsilonValue)
	  var rangeY2 = d3.extent(lineData, alphaValue)
	  const yScale = d3.scaleLinear()
	    .domain([d3.min([rangeY1[0], rangeY2[0]]), d3.max([rangeY1[1], rangeY2[1]])])
	    .range([innerHeight, 0])
	    .nice();

	  const g = container.append('g')
	    .attr('class', 'epsilon-alpha')
	    .attr('transform', `translate(${margin.left},${margin.top})`);

	  const xAxis = d3.axisBottom(xScale)
	    .ticks(4)
	    .tickSize(-innerHeight)
	    .tickPadding(15);

	  const yAxis = d3.axisLeft(yScale)
	    .ticks(4)
	    .tickSize(-innerWidth)
	    .tickPadding(10);

	  const yAxisG = g.append('g').call(yAxis);

	  yAxisG.append('text')
	    .attr('class', 'axis-label')
	    .attr('y', -chartYLabelPadding)
	    .attr('x', -innerHeight / 2)
	    .attr('fill', 'black')
	    .attr('transform', `rotate(-90)`)
	    .attr('text-anchor', 'middle')
	    .text(yAxisLabel);

	  const xAxisG = g.append('g').call(xAxis)
	    .attr('transform', `translate(0,${innerHeight})`);

	  xAxisG.append('text')
	    .attr('class', 'axis-label')
	    .attr('y', chartXLabelPadding)
	    .attr('x', innerWidth / 2)
	    .attr('fill', 'black')
	    .text(xAxisLabel);

		// Draw the lines
	  const epsilonLineGenerator = d3.line()
	    .x(d => xScale(xValue(d)))
	    .y(d => yScale(epsilonValue(d)))
	    .curve(d3.curveBasis);

	  const alphaLineGenerator = d3.line()
	    .x(d => xScale(xValue(d)))
	    .y(d => yScale(alphaValue(d)))
	    .curve(d3.curveBasis);

	  g.append('path')
	    .attr('class', 'line-path epsilon')
	    .style('stroke', epsilonColor)
	    .attr('d', epsilonLineGenerator(lineData));

	  g.append('path')
	    .attr('class', 'line-path alpha')
	    .style('stroke', alphaColor)
	    .attr('d', alphaLineGenerator(lineData));

		container.selectAll("circle").raise()
		container.selectAll("text").raise()
	};


	// Add Legend
	const legend_X_pos = 20
	, legend_X_spacing = 100
	, legend_Y_pos = 12
	, legend_text_spacing = 20;

	var legend = d3.select("#epsilonAlphaLegend").append("svg")
		.attr("width", legend_X_pos + legend_X_spacing + 70)
  legend.append("circle")
    .attr("cx", legend_X_pos)
    .attr("cy", legend_Y_pos)
    .attr("r", 6)
    .style("fill", epsilonColor)
  legend.append("circle")
    .attr("cx", legend_X_pos + legend_X_spacing)
    .attr("cy", legend_Y_pos)
    .attr("r", 6)
    .style("fill", alphaColor)

  legend.append("text")
    .attr("x", legend_X_pos + legend_text_spacing)
    .attr("y", legend_Y_pos)
    .text("Epsilon")
    .style("font-size", "16px")
    .style("fill", "#4C4845")
    .attr("alignment-baseline","middle")
  legend.append("text")
    .attr("x", legend_X_pos + legend_X_spacing + legend_text_spacing)
    .attr("y", legend_Y_pos)
    .text("Alpha")
    .style("font-size", "16px")
    .style("fill", "#4C4845")
    .attr("alignment-baseline","middle")

	// Set up the variables and functions to change the text color for our update rule
	var colors = ["red", "#ddd", "#00c700"]
  , min_value = +d3.select("#sliderNextQEpsilonAlpha").attr("min")
  , max_value = +d3.select("#sliderNextQEpsilonAlpha").attr("max")
  var colorScale = d3.scaleLinear()
    .range(colors)
    .domain([min_value, 0, max_value])

  function RGBToHex(r,g,b) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;

    return "#" + r + g + b;
  }

	// Update the text color and line chart when the next Q value slider changes
	d3.select("#sliderNextQEpsilonAlpha").on("input", function(){
		nextQValue = +this.value;
		document.querySelector('label[for="barNextQEpsilonAlpha"] span').innerHTML = nextQValue;

		var split_rgb = colorScale(nextQValue).split(",")
		, r = +split_rgb[0].slice(4)
		, g = +split_rgb[1].slice(1)
		, b = +split_rgb[2].slice(1,-1)

		currentUpdateText = defaultStringStart + RGBToHex(r,g,b) + defaultStringEnd
		textToUpdate = document.querySelectorAll('#epsilon-alpha-math' + ' d-math')
		textToUpdate[0].innerHTML = currentUpdateText

		d3.select(".epsilon-alpha").remove();
		renderLineChart(EpsilonAlpha[analysisType + " " + nextQValue]);
	});

	d3.selectAll('input[name="EpsilonAlpha-scenarios"]').on('change', function(){
		analysisType = this.value;
		d3.select(".epsilon-alpha").remove();
		renderLineChart(EpsilonAlpha[analysisType + " " + nextQValue]);
	});

	var EpsilonAlpha = {};
	var nextQList = [];
	for (var i = -8; i <= 8; i++) {
	    nextQList.push(i);
	}

	// Get the data from the JSON files (created with python code)
	Promise.all([
	  d3.json("data/epsilon_alpha.json"),
		d3.json("data/epsilon_alpha_noise.json")
	]).then(epsilon_alpha_data => {
	    var epsilon_alpha_no_noise = epsilon_alpha_data[0]
			var epsilon_alpha_noise = epsilon_alpha_data[1]
			var nextQ;

			for (var nextQidx = 0; nextQidx < nextQList.length; nextQidx++) {
				nextQ = nextQList[nextQidx]
				EpsilonAlpha["No Noise " + nextQ] = []
				EpsilonAlpha["Noise " + nextQ] = []
				for (var idx = 0; idx < epsilon_alpha_no_noise[nextQ]["epsilon"].length; idx++) {
					EpsilonAlpha["No Noise " + nextQ].push(
						{
							x: idx,
							epsilon: epsilon_alpha_no_noise[nextQ]["epsilon"][idx],
							alpha: epsilon_alpha_no_noise[nextQ]["alpha"][idx],
						}
					)
					EpsilonAlpha["Noise " + nextQ].push(
						{
							x: idx,
							epsilon: epsilon_alpha_noise[nextQ]["epsilon"][idx],
							alpha: epsilon_alpha_noise[nextQ]["alpha"][idx]
						}
					)
				}
			}
	    renderLineChart(EpsilonAlpha[analysisType + " " + nextQValue]);
	});
}
