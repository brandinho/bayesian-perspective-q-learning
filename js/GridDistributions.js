export function plotGridDistributions(n_columns, n_rows, lightColor) {
  const gridHeight = parseInt(d3.select("#containerGridDistributions").style("height"))
  , gridWidth = parseInt(d3.select("#containerGridDistributions").style("width"))
  , white_space = 2
  , width = Math.floor((gridWidth - (n_columns-1)*white_space) / n_columns)
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
  				reward: reward
  			})
  			xpos += width + white_space;
  		}
  		xpos = 1;
  		ypos += height + white_space;
  	}
  	return data;
  }

  var gridData = gridData();

  const upWall = gridData[0][0].y;
  const leftWall = gridData[0][0].x;
  const rightWall = gridData[0][n_columns-1].x;
  const downWall = gridData[n_rows-1][0].y;


  const tooltip = d3.select("body")
    .append("g")
    .attr("class", "mytooltip");

  var tooltipRobot = tooltip.append("svg")
    .attr("class", "tooltipRobot");


  const actions = ["Up", "Left", "Right", "Down"]

  var QMu = {};
  var QSigma = {};

  Promise.all([
    d3.json("data/Qmu.json"),
    d3.json("data/Qsigma.json")
  ]).then(QData => {
      var QMuData = QData[0];
      var QSigmaData = QData[1];
      var current_key;

      for (var col = 0; col < n_columns; col++) {
      	for (var row = 0; row < n_rows; row++) {
      		for (var a of actions) {
            current_key = "(" + row + ", " + col + ") " + a
          	QMu[current_key] = QMuData[current_key]
            QSigma[current_key] = QSigmaData[current_key]
      		}
        }
      }
      makeExploitationPath()
  });

  // MAKING THE NORMAL DISTRIBUTION
  var x_lim_positive = 50;
  var x_lim_negative = -x_lim_positive;
  var space_around_mu = 30;
  var colorScaleDist = d3.scaleLinear()
    .range(["red", "#F4C2C2", "white", "#B2EC5D", "green"])
    .domain([x_lim_negative, -1, 0, 1, x_lim_positive])

  function norm_pdf(x, mu, sigma){
    return Math.exp(-Math.pow((x-mu),2)/(2*Math.pow(sigma,2)))/(sigma*Math.sqrt(2*Math.PI));
  }
  function create_dist(mu, sigma){
  	var n = []
    const dist_x_min = mu - space_around_mu;
    const dist_x_max = mu + space_around_mu;
    for (var i = dist_x_min; i < dist_x_max; i += 0.5) {
        n.push({x: i, y: norm_pdf(i, mu, sigma)})
    }
    return n;
  }

  const dist_svg = d3.select(".tooltipRobot");
  const distHeight = 200;//+svg.attr('height');
  const distWidth = 200;//+svg.attr('width');


  const renderDistribution = function(xPos, yPos) {
    const xValue = d => d.x;
    const yValue = d => d.y;

    const margin = {top: 5, right: 5, bottom: 5, left: 5};
    const innerWidth = distWidth/4;
    const innerHeight = distHeight/4;
    const gridCenter = 75;
    const gridMiddle = 75;

    function getScale(data, x_or_y) {
      var valueMapping;
      var rangeArray;

      if (x_or_y == "x") {
          valueMapping = xValue
          rangeArray = [0, innerWidth]
      }
      else if (x_or_y == "y") {
        valueMapping = yValue
        rangeArray = [innerHeight, 0]
      }
      return d3.scaleLinear()
        .domain(d3.extent(data, valueMapping))
        .range(rangeArray)
        .nice();
    }

    const xScaleLimits = d3.scaleLinear()
      .domain([x_lim_negative, x_lim_positive])
      .range([0, innerWidth])
      .nice();

    function distGradient(group, dataMin, dataMax, gradientID) {
      group.append("linearGradient")
        .attr("id", gradientID)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")

        .selectAll("stop")
        .data([{
          offset: "0%",
    			color: colorScaleDist(dataMin)
        }, {
          offset: "50%",
    			color: colorScaleDist((dataMax-dataMin)/2),
        }, {
          offset: "100%",
    			color: colorScaleDist(dataMax)
        }])
        .enter().append("stop")
        .attr("offset", function(d) {
          return d.offset;
        })
        .attr("stop-color", function(d) {
          return d.color;
        });
    }

    function createPath(group, data, pathName) {
      const xScale = getScale(data, "x")
      const yScale = getScale(data, "y")

      const lineGenerator = d3.line()
        .x(d => xScale(xValue(d)))
        .y(d => yScale(yValue(d)))
        .curve(d3.curveBasis);

      const gradientID = "distribution-gradient-" + pathName
      d3.select(`#${gradientID}`).remove()
      distGradient(group, d3.min(data, d => d.x), d3.max(data, d => d.x), gradientID)
      return group.append('path')
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('class', 'normal-distribution')
        .attr('d', lineGenerator(data))
    		.attr('stroke', `url(#${gradientID})`);
    }

    dist_svg.selectAll(".normal-distribution").remove()

    function getKey(xPos, yPos, action) {
      const x = (xPos - 1) / (width + white_space)
      const y = (yPos - 1) / (height + white_space)
      return "(" + y + ", " + x + ") " + action
    }

    if ((yPos == upWall && xPos != leftWall) == false) {
      if (yPos != upWall) {
          const upKey = getKey(xPos, yPos, "Up");
          const upQDist = create_dist(QMu[upKey], QSigma[upKey]);
          const gUp = dist_svg.append('g')
            .attr('transform', `translate(${gridCenter},${margin.top})`);
          const upQDistPath = createPath(gUp, upQDist, "up");
      }

      if (xPos != leftWall) {
        const leftKey = getKey(xPos, yPos, "Left");
        const leftQDist = create_dist(QMu[leftKey], QSigma[leftKey]);
        const gLeft = dist_svg.append('g')
          .attr('transform', `translate(${margin.left},${gridMiddle})`);
        const leftQDistPath = createPath(gLeft, leftQDist, "left");
      }

      if (xPos != rightWall) {
        const rightKey = getKey(xPos, yPos, "Right");
        const rightQDist = create_dist(QMu[rightKey], QSigma[rightKey]);
        const gRight = dist_svg.append('g')
          .attr('transform', `translate(${150-margin.right},${gridMiddle})`);
        const rightQDistPath = createPath(gRight, rightQDist, "right");
      }

      if (yPos != downWall) {
        const downKey = getKey(xPos, yPos, "Down");
        const downQDist = create_dist(QMu[downKey], QSigma[downKey]);
        const gDown = dist_svg.append('g')
          .attr('transform', `translate(${gridCenter},${150-margin.bottom})`);
        const downQDistPath = createPath(gDown, downQDist, "down");
      }
    }

  };

  var grid = d3.select("#containerGridDistributions")
  	.append("svg")
    .attr("width", `${gridWidth}px`)
    .attr("height", `${gridHeight}px`);

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
  	.style("stroke", "none")
    .style("stroke-width", 3)
    .on("mouseover", function(d){
      renderDistribution(d.x, d.y);
      d3.select(this)
        .style("stroke", "#24B3A8")
        .style("rx", 5)
        .style("cursor", "pointer")
      tooltip
        .style("visibility", "visible")
    })
    .on("mouseout", function(d){
      d3.select(this)
        .style("stroke", "none")
        .style("rx", 0)
      tooltip
        .style("visibility", "hidden")
    })
    .on("mousemove", function(d){
      if (d.y > rect_spacing*n_rows/2) {
        var yOffset = -230

      }
      else {
        var yOffset = 20
      }
      var xOffset = -110
      tooltip
        .style("top", (event.pageY + yOffset)+"px").style("left",(event.pageX + xOffset)+"px")
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

  const placeRobotCenter = robot => {
    const tooltipRobot = d3.select(".tooltipRobot")
      .append(function() {return robot.documentElement.cloneNode(true);})
    		.attr("x", 60)
    		.attr("y", 60);
  }

  function makeExploitationPath() {
    function change_position(currentPosition) {
      const stateKey = `(${currentPosition[0]}, ${currentPosition[1]}) `
      const upQ = QMu[stateKey + "Up"]
      const leftQ = QMu[stateKey + "Left"]
      const rightQ = QMu[stateKey + "Right"]
      const downQ = QMu[stateKey + "Down"]

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

    var guide = d3.line()
                .x(function(d){ return xPath(d[1] + 0.5) })
                .y(function(d){ return yPath(d[0] + 0.5) })
                .curve(d3.curveBasis);
    const arrowTipWidth = 2
    grid
      .append('defs')
      .append('marker')
        .attr('id', 'arrow-path-end-dist')
        .attr('viewBox', [0, 0, arrowTipWidth, arrowTipWidth])
        .attr('refX', arrowTipWidth/2)
        .attr('refY', arrowTipWidth/2)
        .attr('markerWidth', arrowTipWidth)
        .attr('markerHeight', arrowTipWidth)
        .attr('orient', 'auto-start-reverse')
      .append('path')
        .attr('d', d3.line()([[0, 0], [0, arrowTipWidth], [arrowTipWidth, arrowTipWidth/2]]))
        .attr('fill', lightColor)
        .style('opacity', 1);
    var pathData = generatePath()
    var explorationLine = grid.append('path')
                .datum(pathData)
                .attr('d', guide)
                .style('stroke', lightColor)
                .style('stroke-width', 10)
                .style('fill', "none")
                .style('opacity', 0.65)
                .attr('class', 'exploitation-path')
                .attr('marker-end', 'url(#arrow-path-end-dist)')
  }

  d3.xml("assets/robotWithArrows.svg")
    .then(robot => {
      placeRobotCenter(robot)
  });
}
