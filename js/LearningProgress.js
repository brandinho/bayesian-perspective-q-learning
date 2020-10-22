export function plotLearningProgress(QHistorical, actions, n_columns, n_rows, lightColor, mediumColor, arrowColor) {
  const figureHeight = parseInt(d3.select(".learning-progress").style("height"))
  , totalGridWidth = parseInt(d3.select("#gridLearningProgress").style("width"))
  , white_space = 2
  , width = Math.floor((totalGridWidth - (n_columns-1)*white_space) / n_columns)
  , height = width
  , rect_spacing = width + white_space
  , rect_center = 3
  , max_reward = 50
  , min_reward = -max_reward
  , time_punishment = -2

  const dangerXStart = 1
  , dangerYStart = 1
  , dangerX = dangerXStart * rect_spacing
  , dangerY = dangerYStart * rect_spacing
  , dangerXRange = 2
  , dangerYRange = 3

  var dangerZone = {
    x: dangerX,
    y: dangerY,
    width: (width + white_space) * dangerXRange,
    height: (height + white_space) * dangerYRange,
    reward: -15,
    click: 0
  }

  var colorScale = d3.scaleLinear()
    .range(["#ff6961", "#eee", "#66cc66"])
    .domain([min_reward, 0, max_reward])

  const selectedStrokeColor = mediumColor
  , selectedArrowFillColor = lightColor
  , arrowFillColor = arrowColor
  , selectedStateRX = 5

  const margin = {top: 5, right: 20, bottom: 35, left: 20};

  const chartWidth = parseInt(d3.select("#chartLearningProgress").style("width"))
  , chartXLabelPadding = 10
  , chartYLabelPadding = 35
  , innerWidth = chartWidth - margin.left - margin.right
  , innerHeight = figureHeight - margin.top - margin.bottom - chartXLabelPadding - 5
  , totalChartWidth = chartWidth + chartYLabelPadding;

  const allArrowsWidth = parseInt(d3.select("#actionsLearningProgress").style("width"))
  , allArrowsHeight = parseInt(d3.select("#actionsLearningProgress").style("height"))
  , arrowBeginningPadding = 20
  , arrowXSpacing = 50
  , arrowYSpacing = 50
  , arrowWidth = 50;


  // Grid
  var selectedState = "(0, 0)";

  function gridData() {
  	var data = new Array();
  	var xpos = 1;
  	var ypos = 1;

  	for (var row = 0; row < n_rows; row++) {
  		data.push( new Array() );

  		for (var column = 0; column < n_columns; column++) {
  			if (row == 0) {
  				if (column == n_columns - 1) {
  					var reward = max_reward
  				}
  				else if (column != 0) {
  					var reward = min_reward
  				}
  				else {
  					var reward = time_punishment
  				}
  			}
  			else {
          if ((row >= dangerYStart) && (row < dangerYStart + dangerYRange) &&
              (column >= dangerXStart) && (column < dangerXStart + dangerXRange)) {
            var reward = dangerZone.reward
          }
          else {
            var reward = time_punishment
          }
  			}
  			data[row].push({
  				x: xpos,
  				y: ypos,
  				width: width,
  				height: height,
  				reward: reward,
          click: 0
  			})
  			xpos += width + white_space;
  		}
  		xpos = 1;
  		ypos += height + white_space;
  	}
  	return data;
  }

  var gridData = gridData();

  function getLocation(xPos, yPos) {
    const x = (xPos - 1) / (width + white_space)
    const y = (yPos - 1) / (height + white_space)
    return `(${y}, ${x})`
  }

  var grid = d3.select("#gridLearningProgress").append("svg")
    .attr("width",`${totalGridWidth}px`)
    .attr("height",`${figureHeight}px`);
  var progressChart = d3.select("#chartLearningProgress").append("svg")
    .attr("width",`${totalChartWidth}px`)
    .attr("height",`${figureHeight}px`)
  var actionArrows = d3.select("#actionsLearningProgress").append("svg")
    .attr("width",`${allArrowsWidth}px`)
    .attr("height",`${allArrowsHeight}px`);

  var row = grid.selectAll(".row")
  	.data(gridData)
  	.enter().append("g")
  	.attr("class", "row");

  var column = row.selectAll(".square")
  	.data(function(d) { return d; })
  	.enter().append("rect")
  	.attr("class","square")
  	.attr("x", function(d) { return d.x; })
  	.attr("y", function(d) { return d.y; })
  	.attr("width", function(d) { return d.width; })
  	.attr("height", function(d) { return d.height; })
  	.style("fill", function(d) { return colorScale(d.reward); })
    .style("stroke", function(d) {
        if (getLocation(d.x, d.y) == selectedState) {
          return selectedStrokeColor
        }
        else {
          return "none"
        }
    })
    .style("rx", function(d) {
        if (getLocation(d.x, d.y) == selectedState) {
          return selectedStateRX
        }
        else {
          return 0
        }
    })
    .style("stroke-width", 3)
    .on("mouseover", function() {
          d3.select(this).style("cursor", "pointer")
    })
    .on("mouseout", function() {
          d3.select(this).style("cursor", "default")
    })
    .on("click", function(d){
      selectedState = getLocation(d.x, d.y);
      d.click++;
      d3.selectAll(".square")
        .style("stroke", "none")
        .style("rx", 0)
      if (d.click%2 == 0) {
        d3.select(this)
          .style("stroke", "none")
          .style("rx", 0)
      }
      else if (d.click%2 == 1) {
        d3.select(this)
          .style("stroke", selectedStrokeColor)
          .style("rx", selectedStateRX)
      }
      d3.select(".QProgress").remove();
      renderLineChart(QHistorical[`${selectedState} ${selectedAction}`]);
      d.click--;
    });

  var dangerOutline = grid.append("rect")
    .attr("x", dangerZone.x)
  	.attr("y", dangerZone.y)
  	.attr("width", dangerZone.width)
  	.attr("height", dangerZone.height)
  	.style("fill", 'none')
    .style("stroke", "red")
    .style("stroke-width", 3)
    .style('stroke-dasharray', ('4, 4'))


  // Draw the exploitation path on the grid

  function change_position(currentPosition) {
    const stateKey = `(${currentPosition[0]}, ${currentPosition[1]}) `
    const finalEpisode = 4999
    const upQ = QHistorical[stateKey + "Up"][finalEpisode].mu
    const leftQ = QHistorical[stateKey + "Left"][finalEpisode].mu
    const rightQ = QHistorical[stateKey + "Right"][finalEpisode].mu
    const downQ = QHistorical[stateKey + "Down"][finalEpisode].mu

    var newPosition, action;
    const maxQ = d3.max([upQ, leftQ, rightQ, downQ])

    if (upQ == maxQ) {
      newPosition = [currentPosition[0] - 1, currentPosition[1]]
      action = "Up"
    }
    else if (leftQ == maxQ) {
      newPosition = [currentPosition[0], currentPosition[1] - 1]
      action = "Left"
    }
    else if (rightQ == maxQ) {
      newPosition = [currentPosition[0], currentPosition[1] + 1]
      action = "Right"
    }
    else if (downQ == maxQ) {
      newPosition = [currentPosition[0] + 1, currentPosition[1]]
      action = "Down"
    }
    return newPosition
  }

  function generatePath() {
    var currentPosition = [0,0];
    var robotPath = [currentPosition];
    var done = false;
    while (!done) {
      if (currentPosition[0] == 0 && currentPosition[1] == n_columns-1) {
        done = true
      }
      else if (currentPosition[0] == 0 && currentPosition[1] != 0) {
        done = true
      }
      else {
        currentPosition = change_position(currentPosition)
        robotPath.push(currentPosition)
      }
    }
    return robotPath
  }

  var xPath = d3.scaleLinear().domain([0, n_columns]).range([0, rect_spacing * n_columns]);
  var yPath = d3.scaleLinear().domain([n_rows, 0]).range([rect_spacing * n_rows, 0]);
  const distColor = lightColor

  var guide = d3.line()
              .x(function(d){ return xPath(d[1] + 0.5) })
              .y(function(d){ return yPath(d[0] + 0.5) })
              .curve(d3.curveBasis);
  const arrowTipWidth = 2
  grid
    .append('defs')
    .append('marker')
      .attr('id', 'arrow-path-end')
      .attr('viewBox', [0, 0, arrowTipWidth, arrowTipWidth])
      .attr('refX', arrowTipWidth/2)
      .attr('refY', arrowTipWidth/2)
      .attr('markerWidth', arrowTipWidth)
      .attr('markerHeight', arrowTipWidth)
      .attr('orient', 'auto-start-reverse')
    .append('path')
      .attr('d', d3.line()([[0, 0], [0, arrowTipWidth], [arrowTipWidth, arrowTipWidth/2]]))
      .attr('fill', distColor)
      .style('opacity', 1);
  var pathData = generatePath()
  var explorationLine = grid.append('path')
              .datum(pathData)
              .attr('d', guide)
              .style('stroke', distColor)
              .style('stroke-width', 10)
              .style('fill', "none")
              .style('opacity', 0.65)
              .attr('class', 'exploitation-path')
              .attr('marker-end', 'url(#arrow-path-end)')



  // Arrows
  var arrowClick = 0;
  var selectedAction = "Down";

  const renderArrow = (arrow, x, y, action) => {
    const arrowSVG = actionArrows.append(function() {return arrow.documentElement.cloneNode(true);})
      .attr("x", x + 10)
      .attr("y", y - allArrowsHeight / 2)
      .attr("width", arrowWidth)
      .style("stroke-width", 8)
      .style("stroke", function(d) {
          if (action == selectedAction) {
            return selectedStrokeColor
          }
          else {
            return "none"
          }
      })
      .attr("class", "arrows")
      .on("mouseover", function() {
            d3.select(this).style("cursor", "pointer")
      })
      .on("mouseout", function() {
            d3.select(this).style("cursor", "default")
      })
      .on("click", function(){
        selectedAction = action;
        arrowClick++;
        d3.selectAll(".arrows")
          .style("stroke", "none")
        d3.selectAll(".arrows path")
          .style("fill", arrowFillColor)
        if (arrowClick%2 == 0) {
          d3.select(this)
            .style("stroke", "none")
        }
        else if (arrowClick%2 == 1) {
          d3.select(this)
            .style("stroke", selectedStrokeColor)
          d3.select(this).selectAll("path")
            .style("fill", selectedArrowFillColor)
        }
        d3.select(".QProgress").remove();
        renderLineChart(QHistorical[`${selectedState} ${selectedAction}`]);
        arrowClick--;
      });

      arrowSVG.selectAll("path")
        .style("fill", function(d) {
            if (action == selectedAction) {
              return selectedArrowFillColor
            }
            else {
              return arrowFillColor
            }
        });
  }

  Promise.all([
    d3.xml("assets/upArrow.svg"),
    d3.xml("assets/leftArrow.svg"),
    d3.xml("assets/rightArrow.svg"),
    d3.xml("assets/downArrow.svg")
  ]).then(arrows => {
      const upArrow = arrows[0]
      , leftArrow = arrows[1]
      , rightArrow = arrows[2]
      , downArrow = arrows[3]

      renderArrow(upArrow, arrowXSpacing, -arrowYSpacing, "Up")
      renderArrow(leftArrow, 0, 0, "Left")
      renderArrow(rightArrow, arrowXSpacing * 2, 0, "Right")
      renderArrow(downArrow, arrowXSpacing, arrowYSpacing, "Down")
  });

  const renderLineChart = lineData => {
    const xValue = d => d.x;
    const xAxisLabel = "Episodes";

    const muValue = d => d.mu;
    const upperValue = d => d.mu + d.sigma;
    const lowerValue = d => d.mu - d.sigma;

    const trueMuValue = d => d.true_mu;
    const trueUpperValue = d => d.true_mu + d.true_sigma;
    const trueLowerValue = d => d.true_mu - d.true_sigma;
    const yAxisLabel = "Q-Value";

    const xScale = d3.scaleLinear()
      .domain(d3.extent(lineData, xValue))
      .range([0, innerWidth])
      .nice();

    var rangeY1 = d3.extent(lineData, upperValue)
    var rangeY2 = d3.extent(lineData, lowerValue)
    var trueRangeY1 = d3.extent(lineData, trueUpperValue)
    var trueRangeY2 = d3.extent(lineData, trueLowerValue)
    const yScale = d3.scaleLinear()
      .domain([d3.min([rangeY2[0], trueRangeY2[0]]), d3.max([rangeY1[1], trueRangeY1[1]])])
      .range([innerHeight, 0])
      .nice();

    const g = progressChart.append('g')
      .attr('class', 'QProgress')
      .attr("transform", `translate(${margin.left + chartYLabelPadding}, ${margin.top})`);

    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickSize(-innerHeight)
      .tickPadding(15)
      .tickFormat(function (d) {
        if ((d / 1000) >= 1) {
          d = d / 1000 + "K";
        }
        return d;
      });

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
	    .attr('y', chartXLabelPadding + 35)
	    .attr('x', innerWidth / 2)
	    .attr('fill', 'black')
	    .text(xAxisLabel);

    if (selectedState[1] != 0 || selectedState[4] == 0) {
      const lineGenerator = d3.line()
        .x(d => xScale(xValue(d)))
        .y(d => yScale(muValue(d)))
        .curve(d3.curveBasis);

      const areaGenerator = d3.area()
        .x(d => xScale(xValue(d)))
        .y0(d => yScale(lowerValue(d)))
        .y1(d => yScale(upperValue(d)))
        .curve(d3.curveBasis);

      g.append('path')
        .attr('class', 'area-path')
        .style('fill', mediumColor)
        .style('fill-opacity', 0.3)
        .attr('d', areaGenerator(lineData));

      g.append('path')
        .attr('class', 'line-path')
        .style('stroke-width', 2)
        .style('stroke', mediumColor)
        .attr('d', lineGenerator(lineData));
    }
  };

  renderLineChart(QHistorical[`${selectedState} ${selectedAction}`])
}
