import {
  box_muller
} from './rand';

export function runInflectionPointPaths(n_columns, n_rows, lightColor, mediumColor, darkColor) {
  const gridHeight = parseInt(d3.select("#containerInflectionPointPaths").style("height"))
  , gridWidth = parseInt(d3.select("#containerInflectionPointPaths").style("width"))
  , white_space = 2
  , width = Math.floor((gridWidth - (n_columns-1)*white_space) / n_columns)
  , height = width
  , rect_spacing = width + white_space
  , rect_center = 3
  , max_reward = 50
  , min_reward = -max_reward
  , safeRewardMean = -2
  , dangerRewardMean = -15;

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
    reward: dangerRewardMean,
    click: 0
  }

  var colorScale = d3.scaleLinear()
    .range(["#ff6961", "#eee", "#66cc66"])
    .domain([min_reward, 0, max_reward])

  const selectedStrokeColor = darkColor
  , selectedArrowFillColor = lightColor
  , arrowFillColor = mediumColor;

  const margin = {top: 5, right: 30, bottom: 5, left: 30};

  const arrowBeginningPadding = 20
  , arrowsStartingPoint = rect_spacing * n_columns + arrowBeginningPadding
  , arrowXSpacing = 50
  , arrowYSpacing = 50
  , arrowWidth = width * 0.8;

  var robotStartingPosition = [1,0]

  const actions = ["Up", "Left", "Right", "Down"]
  var QMuSuboptimal = {}
  , QSigmaSuboptimal = {}
  , paths = []
  , n_paths = 10;

  const timeDelayInterval = 1000;

  // Grid
  function getGridData() {
    var data = new Array();
    var xpos = 1;
    var ypos = 1;
    var reward;


    for (var row = 0; row < n_rows; row++) {
      data.push( new Array() );

      for (var column = 0; column < n_columns; column++) {
        if (row == 0) {
          if (column == n_columns - 1) {
            reward = max_reward
          }
          else if (column != 0) {
            reward = min_reward
          }
          else {
            reward = safeRewardMean
          }
        }
        else {
          if ((row >= dangerYStart) && (row < dangerYStart + dangerYRange) &&
              (column >= dangerXStart) && (column < dangerXStart + dangerXRange)) {
            reward = dangerZone.reward
          }
          else {
            reward = safeRewardMean
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

  var gridData = getGridData();

  function getLocation(xPos, yPos) {
    const x = (xPos - 1) / (width + white_space)
    const y = (yPos - 1) / (height + white_space)
    return `(${y}, ${x})`
  }

  var container = d3.select("#containerInflectionPointPaths")
  	.append("svg")
  	.attr("width",`${arrowsStartingPoint + arrowXSpacing * 2 + arrowWidth}`)
  	.attr("height",`${rect_spacing * n_rows}`);

  var grid = container.append("svg")
    .append("svg")
    .attr("width",`${rect_spacing * n_columns}`)
    .attr("height",`${rect_spacing * n_rows}`);

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

  var dangerOutline = grid.append("rect")
    .attr("x", dangerZone.x)
  	.attr("y", dangerZone.y)
  	.attr("width", dangerZone.width)
  	.attr("height", dangerZone.height)
  	.style("fill", 'none')
    .style("stroke", "red")
    .style("stroke-width", 3)
    .style('stroke-dasharray', ('4, 4'))


  // Arrows

  var arrowClick = 0;
  var selectedAction;
  var firstPosition = [2,0];

  const renderArrow = (arrow, x, y, action) => {
    const arrowSVG = container.append(function() {return arrow.documentElement.cloneNode(true);})
      .attr("x", x)
      .attr("y", y)
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
      .attr("class", "paths-arrow")
      .on("mouseover", function() {
            d3.select(this).style("cursor", "pointer")
      })
      .on("mouseout", function() {
            d3.select(this).style("cursor", "default")
      })
      .on("click", function(){
        selectedAction = action;
        arrowClick++;
        d3.selectAll(".paths-arrow")
          .style("stroke", "none")
        d3.selectAll(".paths-arrow path")
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

        if (selectedAction == "Right") {
          firstPosition = [1,1]
        }
        else if (selectedAction == "Down") {
          firstPosition = [2,0]
        }
        d3.selectAll(".agent-path").remove();
        generateAllPathLines(firstPosition, QMuSuboptimal, QSigmaSuboptimal)

        arrowClick--;

        // Bring both of the arrows to the front
        setTimeout(function() {
          d3.selectAll(".paths-arrow").raise()
        }, timeDelayInterval * n_paths);
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

  function renderRobot(robot, robotPosition) {
  	const gridRobot = grid.append(function() {return robot.documentElement.cloneNode(true);})
      .attr("y", robotPosition[0] * rect_spacing + rect_center)
      .attr("x", robotPosition[1] * rect_spacing + rect_center)
      .attr("width", width * 0.9)
      .attr("height", width * 0.9)
  }

  function checkValidAction(currentPosition, action) {
    var valid = true
    if (action == "Up" && currentPosition[0] < 0) {
      valid = false
    }
    else if (action == "Left" && currentPosition[1] < 0) {
      valid = false
    }
    else if (action == "Right" && currentPosition[1] > n_columns - 1) {
      valid  = false
    }
    else if (action == "Down" && currentPosition[0] > n_rows - 1) {
      valid = false
    }
    return valid
  }

  function change_position(currentPosition, QMu, QSigma) {
    const stateKey = `(${currentPosition[0]}, ${currentPosition[1]}) `
    const upQ = box_muller(QMu[stateKey + "Up"], QSigma[stateKey + "Up"])
    const leftQ = box_muller(QMu[stateKey + "Left"], QSigma[stateKey + "Left"])
    const rightQ = box_muller(QMu[stateKey + "Right"], QSigma[stateKey + "Right"])
    const downQ = box_muller(QMu[stateKey + "Down"], QSigma[stateKey + "Down"])

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

    if (checkValidAction(newPosition, action)) {
      return newPosition
    }
    else {
      return currentPosition
    }
  }

  function generatePath(robotStartingPosition, QMu, QSigma) {
    const timeoutLimit = n_columns * n_rows
    var currentPosition = robotStartingPosition;
    var robotPath = [currentPosition];
    var done = false;
    while (!done) {
      if (currentPosition[0] == 0 && currentPosition[1] == n_columns-1) {
        done = true
      }
      else if (currentPosition[0] == 0 && currentPosition[1] != 0) {
        done = true
      }
      else if (robotPath.length == timeoutLimit) {
        done = true
      }
      else {
        currentPosition = change_position(currentPosition, QMu, QSigma)
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

  function generatePathLine(pathData) {
    function pathTween() {
       var interpolate = d3.scaleQuantile()
         .domain([0,1])
         .range(d3.range(1, pathData.length + 1));
       return function(t) {
         return guide(pathData.slice(0, interpolate(t)));
       };
     }
    var line = container.append('path')
                .datum(pathData)
                .attr('d', guide)
                .style('stroke', distColor)
                .style('stroke-width', 10)
                .style('fill', "none")
                .style('opacity', 0.35)
                .attr('class', 'agent-path')
                .transition()
                  .duration(timeDelayInterval)
                  .attrTween('d', pathTween);
  }
  function generateAllPathLines(firstPosition, QMu, QSigma) {
    var timeDelay, path;
    for (var p = 0; p < n_paths; p++) {
      timeDelay = timeDelayInterval * p - timeDelayInterval * 0.1
      setTimeout(function() {
        path = generatePath(firstPosition, QMu, QSigma)
        generatePathLine(path)
      }, timeDelay);
    }
  }

  Promise.all([
    d3.json("data/suboptimal_Qmu.json"),
    d3.json("data/suboptimal_Qsigma.json")
  ]).then(QData => {
      var QMuSuboptimalData = QData[0]
      var QSigmaSuboptimalData = QData[1]
      var current_key;

      for (var col = 0; col < n_columns; col++) {
      	for (var row = 0; row < n_rows; row++) {
      		for (var a of actions) {
            current_key = "(" + row + ", " + col + ") " + a
            QMuSuboptimal[current_key] = QMuSuboptimalData[current_key]
            QSigmaSuboptimal[current_key] = QSigmaSuboptimalData[current_key]
          }
    		}
      }

      Promise.all([
        d3.xml("assets/robot.svg"),
        d3.xml("assets/rightArrow.svg"),
        d3.xml("assets/downArrow.svg")
      ]).then(assets => {
          var robot = assets[0]
          , rightArrow = assets[1]
          , downArrow = assets[2]

          renderRobot(robot, robotStartingPosition)
          renderArrow(rightArrow, width + 2, -130 + height + d3.max([height-33, 0]), "Right")
          renderArrow(downArrow, 4, -130 + height * 2 + d3.max([height-35, 0]), "Down")
      });
    });
}
