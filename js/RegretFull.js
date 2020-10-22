export function graphRegret(color1, color2, color3, color4, color5, color6, color7, color8) {
	const margin = {top: 10, right: 0, bottom: 10, left: 55};

	const chartXLabelPadding = 50
	, chartYLabelPadding = 40
	, chartWidth = parseInt(d3.select("#Regret").style("width")) - chartYLabelPadding
	, chartHeight = parseInt(d3.select("#Regret").style("height")) - chartXLabelPadding
	, innerWidth = chartWidth - margin.left - margin.right
	, innerHeight = chartHeight - margin.top - margin.bottom;

	const yAxisLimit = 150000;

	const epsilonGreedyColor = color1
	, epsilonGreedyDecayColor = color2
	, ucbColor = color3
	, ucbEnhancedColor = color4
	, thompsonColor = color5
	, thompsonEnhancedColor = color6
	, myopicVPIColor = color7
	, myopicVPIEnhancedColor = color8


	var epsilonGreedyToggle = 0
	, epsilonGreedyDecayToggle = 0
	, ucbToggle = 0
	, ucbEnhancedToggle = 0
	, thompsonToggle = 0
	, thompsonEnhancedToggle = 0
	, myopicVPIToggle = 0
	, myopicVPIEnhancedToggle = 0

	var yAxis
	, yAxisG
	, yScale
	, yScale1
	, yScale2
	, xScale;

	var epsilonGreedyLineGenerator
	, epsilonGreedyDecayLineGenerator
  , ucbLineGenerator
	, ucbEnhancedLineGenerator
	, thompsonLineGenerator
	, thompsonEnhancedLineGenerator
	, myopicVPILineGenerator
	, myopicVPIEnhancedLineGenerator;

	var rangeToggle = 0
	var transitionDuration = 1000

	var median_or_range = d3.selectAll('input[name="regret"]:checked').property('value')

	var container = d3.select("#Regret")
		.append("svg")
		.attr("width",`${chartWidth + chartYLabelPadding}`)
		.attr("height",`${chartHeight + chartXLabelPadding}`);

	const g = container.append('g')
		.attr('class', 'regret')
		.attr('transform', `translate(${margin.left},${margin.top})`);
	container.append("clipPath")
		.attr("id", "rect-clip-regret")
		.append("rect")
		.attr("height", chartHeight)
		.attr("width", chartWidth);

	const xValue = d => d.x;

	const epsilonGreedyValue = d => d.epsilonGreedyMedian
  , epsilonGreedyDecayValue = d => d.epsilonGreedyDecayMedian
	, ucbValue = d => d.ucbMedian
	, ucbEnhancedValue = d => d.ucbEnhancedMedian
  , thompsonValue = d => d.thompsonMedian
  , thompsonEnhancedValue = d => d.thompsonEnhancedMedian
	, myopicVPIValue = d => d.myopicVPIMedian
	, myopicVPIEnhancedValue = d => d.myopicVPIEnhancedMedian
	, epsilonGreedyMinValue = d => d.epsilonGreedyMin
  , epsilonGreedyDecayMinValue = d => d.epsilonGreedyDecayMin
	, ucbMinValue = d => d.ucbMin
	, ucbEnhancedMinValue = d => d.ucbEnhancedMin
  , thompsonMinValue = d => d.thompsonMin
  , thompsonEnhancedMinValue = d => d.thompsonEnhancedMin
	, myopicVPIMinValue = d => d.myopicVPIMin
	, myopicVPIEnhancedMinValue = d => d.myopicVPIEnhancedMin
	, epsilonGreedyMaxValue = d => d.epsilonGreedyMax
  , epsilonGreedyDecayMaxValue = d => d.epsilonGreedyDecayMax
	, ucbMaxValue = d => d.ucbMax
	, ucbEnhancedMaxValue = d => d.ucbEnhancedMax
  , thompsonMaxValue = d => d.thompsonMax
  , thompsonEnhancedMaxValue = d => d.thompsonEnhancedMax
	, myopicVPIMaxValue = d => d.myopicVPIMax
	, myopicVPIEnhancedMaxValue = d => d.myopicVPIEnhancedMax;

	const renderLineChart = lineData => {
	  const xAxisLabel = "Episodes";
	  const yAxisLabel = "Cumulative Regret";

		var minY1 = d3.min(lineData, epsilonGreedyValue)
		, minY2 = d3.min(lineData, epsilonGreedyDecayValue)
		, minY3 = d3.min(lineData, ucbValue)
		, minY4 = d3.min(lineData, thompsonValue)
		, minY5 = d3.min(lineData, thompsonEnhancedValue)
		, minY6 = d3.min(lineData, myopicVPIValue)
		, minY7 = d3.min(lineData, myopicVPIEnhancedValue)
		, minY8 = d3.min(lineData, ucbEnhancedValue)

		var maxY1 = d3.max(lineData, epsilonGreedyValue)
		, maxY2 = d3.max(lineData, epsilonGreedyDecayValue)
		, maxY3 = d3.max(lineData, ucbValue)
		, maxY4 = d3.max(lineData, thompsonValue)
		, maxY5 = d3.max(lineData, thompsonEnhancedValue)
		, maxY6 = d3.max(lineData, myopicVPIValue)
		, maxY7 = d3.max(lineData, myopicVPIEnhancedValue)
		, maxY8 = d3.max(lineData, ucbEnhancedValue)

		yScale1 = d3.scaleLinear()
			.domain([d3.min([minY1, minY2, minY3, minY4, minY5, minY6, minY7, minY8]),
							 d3.min([d3.max([maxY1, maxY2, maxY3, maxY4, maxY5, maxY6, maxY7, maxY8]), yAxisLimit])])
			.range([innerHeight, 0])
			.nice();

		yScale = yScale1

		epsilonGreedyLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(epsilonGreedyValue(d)))
			.curve(d3.curveBasis);

		epsilonGreedyDecayLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(epsilonGreedyDecayValue(d)))
			.curve(d3.curveBasis);

		ucbLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(ucbValue(d)))
			.curve(d3.curveBasis);

		ucbEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(ucbEnhancedValue(d)))
			.curve(d3.curveBasis);

		thompsonLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(thompsonValue(d)))
			.curve(d3.curveBasis);

		thompsonEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(thompsonEnhancedValue(d)))
			.curve(d3.curveBasis);

		myopicVPILineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(myopicVPIValue(d)))
			.curve(d3.curveBasis);

		myopicVPIEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(myopicVPIEnhancedValue(d)))
			.curve(d3.curveBasis);

	  const xAxis = d3.axisBottom(xScale)
	    .ticks(4)
	    .tickSize(-innerHeight)
	    .tickPadding(15)
			.tickFormat(function (d) {
	      if ((d / 1000) >= 1) {
	        d = d / 1000 + "K";
	      }
	      return d;
	    });

	  yAxis = d3.axisLeft(yScale)
	    .ticks(4)
	    .tickSize(-innerWidth)
	    .tickPadding(10)
	    .tickFormat(function (d) {
	      if ((d / 1000) >= 1) {
	        d = d / 1000 + "K";
	      }
	      return d;
	    });

	  yAxisG = g.append('g').call(yAxis);

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

	  g.append('path')
	    .attr('class', 'line-path epsilon-greedy')
	    .style('stroke', epsilonGreedyColor)
	    .attr('d', epsilonGreedyLineGenerator(lineData));

	  g.append('path')
	    .attr('class', 'line-path epsilon-greedy-decay')
	    .style('stroke', epsilonGreedyDecayColor)
	    .attr('d', epsilonGreedyDecayLineGenerator(lineData));

		g.append('path')
	    .attr('class', 'line-path ucb-basic')
	    .style('stroke', ucbColor)
	    .attr('d', ucbLineGenerator(lineData));

			g.append('path')
		    .attr('class', 'line-path ucb-enhanced')
		    .style('stroke', ucbEnhancedColor)
		    .attr('d', ucbEnhancedLineGenerator(lineData));

	  g.append('path')
	    .attr('class', 'line-path thompson-basic')
	    .style('stroke', thompsonColor)
	    .attr('d', thompsonLineGenerator(lineData));

	  g.append('path')
	    .attr('class', 'line-path thompson-enhanced')
	    .style('stroke', thompsonEnhancedColor)
	    .attr('d', thompsonEnhancedLineGenerator(lineData));

		g.append('path')
	    .attr('class', 'line-path myopic-vpi-basic')
	    .style('stroke', myopicVPIColor)
	    .attr('d', myopicVPILineGenerator(lineData));

	  g.append('path')
	    .attr('class', 'line-path myopic-vpi-enhanced')
	    .style('stroke', myopicVPIEnhancedColor)
	    .attr('d', myopicVPIEnhancedLineGenerator(lineData));


			const legend_X_pos = 10
	    , legend_extra_X_spacing = 5
	    , legend_X_spacing = 160
	    , legend_Y_pos = 20
	    , legend_Y_spacing = 30
	    , legend_text_spacing = 15;

	    const divHeight = parseInt(d3.select("#regretLegend").style("height"))
	    , pos1_Y = legend_Y_pos

			if (divHeight == 130) {
				const additional_X_margin = 10
				var pos1_X = legend_X_pos + additional_X_margin
				, pos2_X = legend_X_pos + 160
				, pos2_Y = legend_Y_pos
				, pos3_X = legend_X_pos + additional_X_margin
				, pos3_Y = legend_Y_pos + legend_Y_spacing
				, pos4_X = legend_X_pos + additional_X_margin
				, pos4_Y = legend_Y_pos + legend_Y_spacing * 2
				, pos5_X = legend_X_pos + additional_X_margin
				, pos5_Y = legend_Y_pos  + legend_Y_spacing * 3
				, pos6_X = legend_X_pos + 160
				, pos6_Y = legend_Y_pos + legend_Y_spacing
				, pos7_X = legend_X_pos + 160
				, pos7_Y = legend_Y_pos + legend_Y_spacing * 2
				, pos8_X = legend_X_pos + 160
				, pos8_Y = legend_Y_pos + legend_Y_spacing * 3

				var legend = d3.select("#regretLegend").append("svg")
					.attr("width", legend_X_pos + legend_X_spacing * 2)
			}
			else {
				var pos1_X = legend_X_pos
				, pos2_X = legend_X_pos + 150
				, pos2_Y = legend_Y_pos
				, pos3_X = legend_X_pos + 315
				, pos3_Y = legend_Y_pos
				, pos4_X = legend_X_pos
				, pos4_Y = legend_Y_pos + legend_Y_spacing
				, pos5_X = legend_X_pos + 150
				, pos5_Y = legend_Y_pos + legend_Y_spacing
				, pos6_X = legend_X_pos + 315
				, pos6_Y = legend_Y_pos + legend_Y_spacing
				, pos7_X = legend_X_pos
				, pos7_Y = legend_Y_pos + legend_Y_spacing * 2
				, pos8_X = legend_X_pos + 150
				, pos8_Y = legend_Y_pos + legend_Y_spacing * 2
				var legend = d3.select("#regretLegend").append("svg")
					.attr("width", (legend_X_pos + legend_X_spacing) * 2 + 120)
			}

			function createLegendElement(className, text, color, posX, posY, toggle) {
				var legendClassName = "legend-" + className
				legend.append("circle")
					.attr("cx", posX)
					.attr("cy", posY)
					.attr("class", legendClassName)
					.attr("r", 6)
					.style("fill", color)
					.on("mouseover", function() {
						d3.select(this).style("cursor", "pointer")
					})
					.on("mouseout", function() {
						d3.select(this).style("cursor", "default")
					})

				const textColor = "#4C4845"
				, clickedTextColor = "#dbdbdb"

				legend.append("text")
					.attr("x", posX + legend_text_spacing)
					.attr("y", posY)
					.attr("class", legendClassName)
					.text(text)
					.style("font-size", "12px")
					.style("fill", textColor)
					.attr("alignment-baseline","middle")
					.on("mouseover", function() {
						d3.select(this).style("cursor", "pointer")
					})
					.on("mouseout", function() {
						d3.select(this).style("cursor", "default")
					})

				legend.selectAll("." + legendClassName)
					.on("click", function() {
						var legendElements = legend.selectAll("." + legendClassName).nodes()
						if (toggle % 2 == 0){
							d3.selectAll("." + className).style("opacity", 0)
							d3.select(legendElements[0]).style("opacity", 0.3)
							d3.select(legendElements[1]).style("fill", clickedTextColor)
						}
						else if (toggle % 2 == 1) {
							d3.selectAll("." + className).style("opacity", 1)
							d3.select(legendElements[0]).style("opacity", 1)
							d3.select(legendElements[1]).style("fill", textColor)
						}
						toggle += 1
					})
			}

			createLegendElement("epsilon-greedy", "Epsilon Greedy", epsilonGreedyColor, pos1_X, pos1_Y, epsilonGreedyToggle)
			createLegendElement("epsilon-greedy-decay", "Epsilon Greedy (Decay)", epsilonGreedyDecayColor, pos2_X, pos2_Y, epsilonGreedyDecayToggle)
			createLegendElement("ucb-basic", "Bayes-UCB", ucbColor, pos3_X, pos3_Y, ucbToggle)
			createLegendElement("thompson-basic", "Q-Value Sampling", thompsonColor, pos4_X, pos4_Y, thompsonToggle)
			createLegendElement("myopic-vpi-basic", "Myopic-VPI", myopicVPIColor, pos5_X, pos5_Y, myopicVPIToggle)
			createLegendElement("ucb-enhanced", "Bayes-UCB +", ucbEnhancedColor, pos6_X, pos6_Y, ucbEnhancedToggle)
			createLegendElement("thompson-enhanced", "Q-Value Sampling +", thompsonEnhancedColor, pos7_X, pos7_Y, thompsonEnhancedToggle)
			createLegendElement("myopic-vpi-enhanced", "Myopic-VPI +", myopicVPIEnhancedColor, pos8_X, pos8_Y, myopicVPIEnhancedToggle)
	};

	function addRange(lineData) {
		var minY1 = d3.min(lineData, epsilonGreedyMinValue)
		, minY2 = d3.min(lineData, epsilonGreedyDecayMinValue)
		, minY3 = d3.min(lineData, ucbMinValue)
		, minY4 = d3.min(lineData, thompsonMinValue)
		, minY5 = d3.min(lineData, thompsonEnhancedMinValue)
		, minY6 = d3.min(lineData, myopicVPIMinValue)
		, minY7 = d3.min(lineData, myopicVPIEnhancedMinValue)
		, minY8 = d3.min(lineData, ucbEnhancedMinValue)

		var maxY1 = d3.max(lineData, epsilonGreedyMaxValue)
		, maxY2 = d3.max(lineData, epsilonGreedyDecayMaxValue)
		, maxY3 = d3.max(lineData, ucbMaxValue)
		, maxY4 = d3.max(lineData, thompsonMaxValue)
		, maxY5 = d3.max(lineData, thompsonEnhancedMaxValue)
		, maxY6 = d3.max(lineData, myopicVPIMaxValue)
		, maxY7 = d3.max(lineData, myopicVPIEnhancedMaxValue)
		, maxY8 = d3.max(lineData, ucbEnhancedMaxValue)

		yScale2 = d3.scaleLinear()
	    .domain([d3.min([minY1, minY2, minY3, minY4, minY5, minY6, minY7, minY8]),
	             d3.min([d3.max([maxY1, maxY2, maxY3, maxY4, maxY5, maxY6, maxY7, maxY8]), yAxisLimit])])
	    .range([innerHeight, 0])
	    .nice();

		yScale = yScale2

		const epsilonGreedyAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(epsilonGreedyMinValue(d)))
			.y1(d => yScale(epsilonGreedyMaxValue(d)))
			.curve(d3.curveBasis);

		const epsilonGreedyDecayAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(epsilonGreedyDecayMinValue(d)))
			.y1(d => yScale(epsilonGreedyDecayMaxValue(d)))
			.curve(d3.curveBasis);

		const ucbAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(ucbMinValue(d)))
			.y1(d => yScale(ucbMaxValue(d)))
			.curve(d3.curveBasis);

		const ucbEnhancedAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(ucbEnhancedMinValue(d)))
			.y1(d => yScale(ucbEnhancedMaxValue(d)))
			.curve(d3.curveBasis);

		const thompsonAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(thompsonMinValue(d)))
			.y1(d => yScale(thompsonMaxValue(d)))
			.curve(d3.curveBasis);

		const thompsonEnhancedAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(thompsonEnhancedMinValue(d)))
			.y1(d => yScale(thompsonEnhancedMaxValue(d)))
			.curve(d3.curveBasis);

		const myopicVPIAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(myopicVPIMinValue(d)))
			.y1(d => yScale(myopicVPIMaxValue(d)))
			.curve(d3.curveBasis);

		const myopicVPIEnhancedAreaGenerator = d3.area()
			.x(d => xScale(xValue(d)))
			.y0(d => yScale(myopicVPIEnhancedMinValue(d)))
			.y1(d => yScale(myopicVPIEnhancedMaxValue(d)))
			.curve(d3.curveBasis);

		const opacity = 0.2
		g.append('path')
			.attr('class', 'area-path epsilon-greedy')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', epsilonGreedyColor)
			.style('fill-opacity', opacity)
			.attr('d', epsilonGreedyAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path epsilon-greedy-decay')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', epsilonGreedyDecayColor)
			.style('fill-opacity', opacity)
			.attr('d', epsilonGreedyDecayAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path ucb-basic')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', ucbColor)
			.style('fill-opacity', opacity)
			.attr('d', ucbAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path ucb-enhanced')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', ucbEnhancedColor)
			.style('fill-opacity', opacity)
			.attr('d', ucbEnhancedAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path thompson-basic')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', thompsonColor)
			.style('fill-opacity', opacity)
			.attr('d', thompsonAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path thompson-enhanced')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', thompsonEnhancedColor)
			.style('fill-opacity', opacity)
			.attr('d', thompsonEnhancedAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path myopic-vpi-basic')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', myopicVPIColor)
			.style('fill-opacity', opacity)
			.attr('d', myopicVPIAreaGenerator(lineData));

		g.append('path')
			.attr('class', 'area-path myopic-vpi-enhanced')
			.attr("clip-path", "url(#rect-clip-regret)")
			.style('fill', myopicVPIEnhancedColor)
			.style('fill-opacity', opacity)
			.attr('d', myopicVPIEnhancedAreaGenerator(lineData));

		rangeToggle += 1
	}

	function rescaleY(lineData, range) {
		if (range) {
			yScale = yScale2
		}
		else {
			yScale = yScale1
		}
		yAxis = d3.axisLeft(yScale)
			.ticks(4)
			.tickSize(-innerWidth)
			.tickPadding(10)
			.tickFormat(function (d) {
				if ((d / 1000) >= 1) {
					d = d / 1000 + "K";
				}
				return d;
			});

		yAxisG
			.transition()
			.duration(transitionDuration)
			.ease(d3.easePoly)
			.call(yAxis);

		epsilonGreedyLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(epsilonGreedyValue(d)))
			.curve(d3.curveBasis);

		epsilonGreedyDecayLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(epsilonGreedyDecayValue(d)))
			.curve(d3.curveBasis);

		ucbLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(ucbValue(d)))
			.curve(d3.curveBasis);

		ucbEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(ucbEnhancedValue(d)))
			.curve(d3.curveBasis);

		thompsonLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(thompsonValue(d)))
			.curve(d3.curveBasis);

		thompsonEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(thompsonEnhancedValue(d)))
			.curve(d3.curveBasis);

		myopicVPILineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(myopicVPIValue(d)))
			.curve(d3.curveBasis);

		myopicVPIEnhancedLineGenerator = d3.line()
			.x(d => xScale(xValue(d)))
			.y(d => yScale(myopicVPIEnhancedValue(d)))
			.curve(d3.curveBasis);

		transitionLine('.line-path.epsilon-greedy')
	  transitionLine('.line-path.epsilon-greedy-decay')
		transitionLine('.line-path.ucb-basic')
		transitionLine('.line-path.ucb-enhanced')
	  transitionLine('.line-path.thompson-basic')
		transitionLine('.line-path.thompson-enhanced')
		transitionLine('.line-path.myopic-vpi-basic')
		transitionLine('.line-path.myopic-vpi-enhanced')

		function transitionLine(class_name) {
			var lineFunction;
			if (class_name == '.line-path.epsilon-greedy') {
				lineFunction = epsilonGreedyLineGenerator
			}
			else if (class_name == '.line-path.epsilon-greedy-decay') {
				lineFunction = epsilonGreedyDecayLineGenerator
			}
			else if (class_name == '.line-path.ucb-basic') {
				lineFunction = ucbLineGenerator
			}
			else if (class_name == '.line-path.ucb-enhanced') {
				lineFunction = ucbEnhancedLineGenerator
			}
			else if (class_name == '.line-path.thompson-basic') {
				lineFunction = thompsonLineGenerator
			}
			else if (class_name == '.line-path.thompson-enhanced') {
				lineFunction = thompsonEnhancedLineGenerator
			}
			else if (class_name == '.line-path.myopic-vpi-basic') {
				lineFunction = myopicVPILineGenerator
			}
			else if (class_name == '.line-path.myopic-vpi-enhanced') {
				lineFunction = myopicVPIEnhancedLineGenerator
			}

			g.selectAll(class_name)
				.transition()
					.duration(transitionDuration)
					.attr('d', lineFunction(lineData));
		}
	}

	const approaches = ["Epsilon Greedy", "Epsilon Greedy Decay", "Upper Confidence Bound", "Upper Confidence Bound Enhanced",
											"Thompson", "Thompson Enhanced", "Myopic-VPI", "Myopic-VPI Enhanced"]
	var regret = [];

	Promise.all([
	  d3.json("data/regret_distribution.json")
	]).then(regretData => {
	    var cumulativeRegret = regretData[0]
	    for (var idx = 0; idx < cumulativeRegret[approaches[0] + " median"].length; idx++) {
	      regret.push(
	        {
	          x: idx,
	          epsilonGreedyMedian: cumulativeRegret[approaches[0] + " median"][idx],
	          epsilonGreedyDecayMedian: cumulativeRegret[approaches[1] + " median"][idx],
						ucbMedian: cumulativeRegret[approaches[2] + " median"][idx],
						ucbEnhancedMedian: cumulativeRegret[approaches[3] + " median"][idx],
	          thompsonMedian: cumulativeRegret[approaches[4] + " median"][idx],
	          thompsonEnhancedMedian: cumulativeRegret[approaches[5] + " median"][idx],
						myopicVPIMedian: cumulativeRegret[approaches[6] + " median"][idx],
	          myopicVPIEnhancedMedian: cumulativeRegret[approaches[7] + " median"][idx],

						epsilonGreedyMax: cumulativeRegret[approaches[0] + " max"][idx],
	          epsilonGreedyDecayMax: cumulativeRegret[approaches[1] + " max"][idx],
						ucbMax: cumulativeRegret[approaches[2] + " max"][idx],
						ucbEnhancedMax: cumulativeRegret[approaches[3] + " max"][idx],
	          thompsonMax: cumulativeRegret[approaches[4] + " max"][idx],
	          thompsonEnhancedMax: cumulativeRegret[approaches[5] + " max"][idx],
						myopicVPIMax: cumulativeRegret[approaches[6] + " max"][idx],
	          myopicVPIEnhancedMax: cumulativeRegret[approaches[7] + " max"][idx],

						epsilonGreedyMin: cumulativeRegret[approaches[0] + " min"][idx],
	          epsilonGreedyDecayMin: cumulativeRegret[approaches[1] + " min"][idx],
						ucbMin: cumulativeRegret[approaches[2] + " min"][idx],
						ucbEnhancedMin: cumulativeRegret[approaches[3] + " min"][idx],
	          thompsonMin: cumulativeRegret[approaches[4] + " min"][idx],
	          thompsonEnhancedMin: cumulativeRegret[approaches[5] + " min"][idx],
						myopicVPIMin: cumulativeRegret[approaches[6] + " min"][idx],
						myopicVPIEnhancedMin: cumulativeRegret[approaches[7] + " min"][idx],
	        }
	      )
	    }

			xScale = d3.scaleLinear()
				.domain(d3.extent(regret, xValue))
				.range([0, innerWidth])
				.nice();

	    renderLineChart(regret);
			addRange(regret);
			d3.selectAll(".area-path").style("display", "none")
	});

	d3.selectAll('input[name="regret"]').on('change', function(){
		median_or_range = this.value;
		if (median_or_range == "range") {
			rescaleY(regret, true)
			setTimeout(function() { d3.selectAll(".area-path").style("display", "block") }, transitionDuration)
			d3.selectAll(".line-path").raise()
		}
		else if (median_or_range == "median"){
			rescaleY(regret, false)
			d3.selectAll(".area-path").style("display", "none")
		}
	})
}
