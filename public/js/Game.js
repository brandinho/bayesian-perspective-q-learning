import { box_muller } from './rand';

export function runGame(QHistorical, actions, n_columns, n_rows, buttonColor, buttonPressedColor) {
  const gridHeight = parseInt(d3.select("#containerGame").style("height"))
  , gridWidth = parseInt(d3.select("#containerGame").style("width"))
  , white_space = 2
  , width = Math.floor((gridWidth - (n_columns-1)*white_space) / n_columns)
  , height = width
  , rect_spacing = width + white_space
  , rect_center = 3
  , grid_top_buffer = 1
  , max_reward = 50
  , min_reward = -max_reward
  , safeRewardMean = -2
  , safeRewardSigma = 2
  , dangerRewardMean = -15
  , dangerRewardSigma = 15;

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

  var colors = ["#ff6961", "#eee", "#66cc66"]
  var colorScale = d3.scaleLinear()
    .range(colors)
    .domain([min_reward, 0, max_reward])

  var explore_or_exploit = d3.selectAll('input[name="game-explore-exploit"]:checked').property('value')
  , color_states_scheme = d3.selectAll('input[name="game-color-scenarios"]:checked').property('value')
  , episode = +d3.select("#sliderEpisodesGame").attr("value") - 1
  , gameEndBool = true;

  document.querySelector('label[for="barEpisodesGame"] span').innerHTML = episode + 1;

  function getGridData(start_or_update, currentPosition, q_values = undefined) {
  	var data = new Array()
  	, xpos = 1
  	, ypos = 1 + grid_top_buffer
    , reward
    , update_qvalue_state;

    if (color_states_scheme == "qvalues") {
      var upQ = q_values[0]
      , leftQ = q_values[1]
      , rightQ = q_values[2]
      , downQ = q_values[3]
    }

  	for (var row = 0; row < n_rows; row++) {
  		data.push( new Array() );
  		for (var column = 0; column < n_columns; column++) {
        if (start_or_update == "update" && color_states_scheme == "qvalues") {
          if (row == currentPosition[0] - 1 && column  == currentPosition[1]) {
            reward = upQ
          }
          else if (row == currentPosition[0] && column  == currentPosition[1] - 1) {
            reward = leftQ
          }
          else if (row == currentPosition[0] && column  == currentPosition[1] + 1) {
            reward = rightQ
          }
          else if (row == currentPosition[0] + 1 && column  == currentPosition[1]) {
            reward = downQ
          }
          else {
            reward = 0
          }
        }
        else {
          if (row == 0) {
    				if (column == n_columns - 1) {
    					reward = max_reward
    				}
    				else if (column != 0) {
    					reward = min_reward
    				}
    				else {
              if (start_or_update == "start") {
                reward = safeRewardMean
              }
              else if (start_or_update == "update") {
                  reward = box_muller(safeRewardMean, safeRewardSigma)
              }
    				}
    			}
    			else {
            if ((row >= dangerYStart) && (row < dangerYStart + dangerYRange) &&
                (column >= dangerXStart) && (column < dangerXStart + dangerXRange)) {
              if (start_or_update == "start") {
                reward = dangerZone.reward
              }
              else if (start_or_update == "update") {
                  reward = box_muller(dangerRewardMean, dangerRewardSigma)
              }
            }
            else {
              if (start_or_update == "start") {
                reward = safeRewardMean
              }
              else if (start_or_update == "update") {
                  reward = box_muller(safeRewardMean, safeRewardSigma)
              }
            }
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

  var startingPosition = [0, 0]
  var gridData = getGridData("start", startingPosition, []);

  const upWall = gridData[0][0].y;
  const leftWall = gridData[0][0].x;
  const rightWall = gridData[0][n_columns-1].x;
  const downWall = gridData[n_rows-1][0].y;

  const playButtonWidth = width * 2 //80
  const playButtonSpacing = 20

  var grid = d3.select("#containerGame")
    .append("svg")
    // .attr("width", `${(width + white_space) * n_columns + playButtonWidth + playButtonSpacing}px`)
    .attr("width", `${(width + white_space) * n_columns}px`)
    .attr("height", `${(height + white_space) * n_rows}px`);

  // Add the Color Legend
  const textColor = "#4C4845"
  var colorLegend = d3.select("#gameLegendColor")
    .append('svg')
    .attr('width', `${(width + white_space) * n_columns}px`)
    .attr('height', 30);
  var colorLegendGradient = colorLegend.append('defs')
    .append('linearGradient')
    .attr('id', 'colorLegendGradient')
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '0%');
  colorLegendGradient.selectAll('stop')
    .data(colors)
    .enter()
    .append('stop')
    .style('stop-color', function(d){ return d; })
    .attr('offset', function(d,i){
      return 100 * (i / (colors.length - 1)) + '%';
    })
  colorLegend.append('rect')
    .attr('x', `${(width + white_space) * n_columns / 4}px`)
    .attr('y', 10)
    .attr('width', `${(width + white_space) * n_columns / 2}px`)
    .attr('height', 15)
    .style('fill', 'url(#colorLegendGradient)');

  var colorLegendText = "\\text{Q-Values} \\sim \\mathcal{N}(\\mu_{s,a}, \\sigma_{s,a}^2)"
  const mathText = document.querySelectorAll('#gameLegendColorLabel d-math')
  mathText[0].innerHTML = colorLegendText

  colorLegend.append("text")
    .attr("x", `${(width + white_space) * n_columns / 4 - 5}px`)
    .attr("y", 18)
    .text("-50")
    .style("font-size", "14px")
    .style("font-weight", "500")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
    .attr("text-anchor", "end")
  colorLegend.append("text")
    .attr("x", `${(width + white_space) * n_columns * 3 / 4 + 5}px`)
    .attr("y", 18)
    .text("+50")
    .style("font-size", "14px")
    .style("font-weight", "500")
    .style("fill", textColor)
    .attr("alignment-baseline","middle")
    .attr("text-anchor", "start")

  var rewardLegend = d3.select("#gameLegendBottom")
    .append('svg')
    .attr('width', 300)

  const y_pos = 5
  , x_pos1 = 5
  , x_pos2 = 105
  , x_pos3 = 205
  rewardLegend.append('rect')
    .attr('x', x_pos1)
    .attr('y', y_pos)
    .attr('width', 15)
    .attr('height', 15)
    .style("fill", 'none')
    .style("stroke", "green")
    .style("stroke-width", 2);
  rewardLegend.append('rect')
    .attr('x', x_pos2)
    .attr('y', y_pos)
    .attr('width', 15)
    .attr('height', 15)
    .style("fill", 'none')
    .style("stroke", "red")
    .style("stroke-width", 2);
  rewardLegend.append('rect')
    .attr('x', x_pos3)
    .attr('y', y_pos)
    .attr('width', 15)
    .attr('height', 15)
    .style("fill", 'none')
    .style("stroke", "red")
    .style("stroke-width", 2)
    .style('stroke-dasharray', ('4, 4'))

    const legend_text_spacing = 22
    , y_pos_text = 13
    rewardLegend.append("text")
      .attr("x", x_pos1 + legend_text_spacing)
      .attr("y", y_pos_text)
      .text("Goal (Win)")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    rewardLegend.append("text")
      .attr("x", x_pos2 + legend_text_spacing)
      .attr("y", y_pos_text)
      .text("Cliff (Lose)")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    rewardLegend.append("text")
      .attr("x", x_pos3 + legend_text_spacing)
      .attr("y", y_pos_text)
      .text("Danger Zone")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")


  function createGrid(gridData) {
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


    var dangerOutline = grid.append("rect")
      .attr("x", dangerZone.x)
      .attr("y", dangerZone.y + grid_top_buffer)
      .attr("width", dangerZone.width)
      .attr("height", dangerZone.height)
      .style("fill", 'none')
      .style("stroke", "red")
      .style("stroke-width", 2)
      .style('stroke-dasharray', ('4, 4'))
    var cliffOutline = grid.append("rect")
      .attr("x", rect_spacing)
      .attr("y", grid_top_buffer)
      .attr("width", rect_spacing * 8)
      .attr("height", rect_spacing)
      .style("fill", 'none')
      .style("stroke", "red")
      .style("stroke-width", 2)
    var goalOutline = grid.append("rect")
      .attr("x", rect_spacing * (n_columns - 1))
      .attr("y", grid_top_buffer)
      .attr("width", rect_spacing)
      .attr("height", rect_spacing)
      .style("fill", 'none')
      .style("stroke", "green")
      .style("stroke-width", 2)
  }
  createGrid(gridData)

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

  function getQValues(stateKey, QHistorical) {
    if (explore_or_exploit == "explore") {
      var upQ = box_muller(QHistorical[stateKey + "Up"][episode].mu, QHistorical[stateKey + "Up"][episode].sigma)
      , leftQ = box_muller(QHistorical[stateKey + "Left"][episode].mu, QHistorical[stateKey + "Left"][episode].sigma)
      , rightQ = box_muller(QHistorical[stateKey + "Right"][episode].mu, QHistorical[stateKey + "Right"][episode].sigma)
      , downQ = box_muller(QHistorical[stateKey + "Down"][episode].mu, QHistorical[stateKey + "Down"][episode].sigma)
    }
    else if (explore_or_exploit == "exploit") {
      var upQ = QHistorical[stateKey + "Up"][episode].mu
      , leftQ = QHistorical[stateKey + "Left"][episode].mu
      , rightQ = QHistorical[stateKey + "Right"][episode].mu
      , downQ = QHistorical[stateKey + "Down"][episode].mu
    }
    return [upQ, leftQ, rightQ, downQ]
  }

  function change_position(currentPosition, QHistorical) {
    const stateKey = `(${currentPosition[0]}, ${currentPosition[1]}) `
    var q_values = getQValues(stateKey, QHistorical)
    var upQ = q_values[0]
    , leftQ = q_values[1]
    , rightQ = q_values[2]
    , downQ = q_values[3]

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
      return [newPosition, q_values]
    }
    else {
      return [currentPosition, q_values]
    }
  }

  function generatePath(QHistorical) {
    const timeoutLimit = n_columns * n_rows
    var currentPosition = startingPosition
    , robotPath = [currentPosition]
    , qValuesList = new Array()
    , done = false
    , gameEndText
    , positionInfo;

    while (!done) {
      if (currentPosition[0] == 0 && currentPosition[1] == n_columns-1) {
        done = true
        gameEndText = "You Win!!"
      }
      else if (currentPosition[0] == 0 && currentPosition[1] != 0) {
        done = true
        gameEndText = "You Lose..."
      }
      else if (robotPath.length == timeoutLimit) {
        done = true
        gameEndText = "You Timed Out!"
      }
      else {
        positionInfo = change_position(currentPosition, QHistorical)
        currentPosition = positionInfo[0]
        robotPath.push(currentPosition)
        qValuesList.push(positionInfo[1])
      }
    }
    return [robotPath, qValuesList, gameEndText]
  }


  const render = (robot, QHistorical) => {
    const robotSVG = robot.documentElement.cloneNode(true);
  	var gridRobot = grid.append(function() {return robotSVG;})
      .attr("y", startingPosition[0] * rect_spacing + rect_center)
      .attr("x", startingPosition[1] * rect_spacing + rect_center)
      .attr("width", width * 0.9)
      .attr("height", width * 0.9)

    var gameOutput = generatePath(QHistorical)
    var robotPath = gameOutput[0]
    , qValuesList = gameOutput[1]
    , gameEndText = gameOutput[2]

  	var i = 0
  	const moveRobot = function() {
  		i++
  		if (i < robotPath.length) {
        grid.remove()
        grid = d3.select("#containerGame")
          .append("svg")
          .attr("width", `${(width + white_space) * n_columns + playButtonWidth + playButtonSpacing}px`)
          .attr("height", `${(height + white_space) * n_rows}px`);
        gridData = getGridData("update", robotPath[i-1], qValuesList[i-1])
        createGrid(gridData)
        gridRobot = grid.append(function() {return robotSVG;})
          .attr("y", robotPath[i-1][0] * rect_spacing + rect_center)
          .attr("x", robotPath[i-1][1] * rect_spacing + rect_center)
          .attr("width", width * 0.9)
          .attr("height", width * 0.9)
  			gridRobot
  				.transition().duration(500)
            .attr("y", robotPath[i][0] * rect_spacing + rect_center)
  					.attr("x", robotPath[i][1] * rect_spacing + rect_center)
  					.on("end", moveRobot)
  		}
      else {
        updatePlayButton()
        gridRobot.remove()
        grid.append("text")
          .attr("class", "game-end-text")
          .attr("x", ((width + white_space) * n_columns) / 2)
          .attr("y", ((height + white_space) * n_rows) / 2)
        grid.selectAll(".game-end-text")
          .text(gameEndText)
        gameEndBool = true
        // Allow the user to click on the other radio buttons again
        var radioButtons = document.getElementsByClassName('option-input radio');
        for(var r = 0; r < radioButtons.length; r++) {
            radioButtons[r].disabled = false;
        }
      }
  	}
  	moveRobot()
  }

  function updatePlayButton() {
    playButton.select("rect")
      .attr("fill", buttonColor)
    playButton.select("text")
      .text("Play")
  }

  d3.select("#sliderEpisodesGame").on("input", function(d){
    episode = +this.value-1;
    document.querySelector('label[for="barEpisodesGame"] span').innerHTML = episode + 1;
  })

  d3.selectAll('input[name="game-explore-exploit"]').on('change', function(){
    explore_or_exploit = this.value;
    if (color_states_scheme == "qvalues") {
      if (explore_or_exploit == "explore") {
        colorLegendText = "\\text{Q-Values} \\sim \\mathcal{N}(\\mu_{s,a}, \\sigma_{s,a}^2)"
      }
      else if (explore_or_exploit == "exploit") {
        colorLegendText = "\\text{Q-Values} = \\mu_{s,a}"
      }
    }
    else if (color_states_scheme == "rewards") {
      colorLegendText = "\\text{Rewards}"
    }
    mathText[0].innerHTML = colorLegendText
  })

  d3.selectAll('input[name="game-color-scenarios"]').on('change', function(){
    color_states_scheme = this.value;
    if (color_states_scheme == "qvalues") {
      if (explore_or_exploit == "explore") {
        colorLegendText = "\\text{Q-Values} \\sim \\mathcal{N}(\\mu_{s,a}, \\sigma_{s,a}^2)"
      }
      else if (explore_or_exploit == "exploit") {
        colorLegendText = "\\text{Q-Values} = \\mu_{s,a}"
      }
    }
    else if (color_states_scheme == "rewards") {
      colorLegendText = "\\text{Rewards}"
    }
    mathText[0].innerHTML = colorLegendText
  })

  var playButton = d3.select("#playButton")
    .append("svg")

  function loadPlayButton() {
    playButton
      .append("rect")
        .attr("fill", buttonColor)
        .attr("width", `${playButtonWidth}`)
        .attr("height", `${playButtonWidth/2}`)
        .attr("rx", 10)
        .on("click", function() {
          grid.selectAll(".game-end-text").remove()
          d3.select(this)
            .attr("fill", buttonPressedColor)
          playButton.select("text")
            .text("Playing...")
          playGame()
        });

    playButton.append("text")
      .text("Play")
      .attr("class", "button-text")
      .attr("x", `${playButtonWidth/2}`)
      .attr("y", `${playButtonWidth/4}`)
      .on("click", function() {
        grid.selectAll(".game-end-text").remove()
        playButton.select("rect")
          .attr("fill", buttonPressedColor)
        playButton.select("text")
          .text("Playing...")
        playGame()
      });
  }
  loadPlayButton()

  function playGame() {
    if (gameEndBool) {
      d3.xml("assets/robot.svg")
        .then(robot => {
          gameEndBool = false
          d3.selectAll('input[name="game-explore-exploit"]').attr("disabled", true);
          render(robot, QHistorical)
        });
    }
  }
}
