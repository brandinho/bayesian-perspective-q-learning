export function plotGameOutline(n_columns, n_rows) {
  const gridHeight = parseInt(d3.select("#gameOutline").style("height"))
  , gridWidth = parseInt(d3.select("#gameOutline").style("width"))
  , white_space = 2
  , width = Math.floor((gridWidth - (n_columns-1)*white_space) / n_columns)
  , height = width
  , rect_spacing = width + white_space
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

  var gameEndBool = true;

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
      .attr("y", dangerZone.y)
      .attr("width", dangerZone.width)
      .attr("height", dangerZone.height)
      .style("fill", 'none')
      .style("stroke", "red")
      .style("stroke-width", 3)
      .style('stroke-dasharray', ('4, 4'))
  }

  function addGridIcons(grid, startIcon, dangerIcon, goalIcon, cliffIcon) {
    const iconPadding = 2
    var xpos = 1;
    var ypos = 1;
    for (var row = 0; row < n_rows; row++) {
      for (var column = 0; column < n_columns; column++) {
        if (row == 0) {
          if (column == n_columns - 1) {
            const gridGoal = grid.append(function() {return goalIcon.documentElement.cloneNode(true);})
              .attr("y", ypos + iconPadding)
              .attr("x", xpos + iconPadding)
              .attr("width", width * 0.9)
              .attr("height", width * 0.9)
          }
          else if (column == 0) {
            const gridStart = grid.append(function() {return startIcon.documentElement.cloneNode(true);})
              .attr("y", ypos + iconPadding)
              .attr("x", xpos + iconPadding)
              .attr("width", width * 0.9)
              .attr("height", width * 0.9)
          }
          else {
            const gridCliff = grid.append(function() {return cliffIcon.documentElement.cloneNode(true);})
              .attr("y", ypos + iconPadding)
              .attr("x", xpos + iconPadding)
              .attr("width", width * 0.9)
              .attr("height", width * 0.9)
          }
        }
        else {
          if ((row >= dangerYStart) && (row < dangerYStart + dangerYRange) &&
              (column >= dangerXStart) && (column < dangerXStart + dangerXRange)) {
            const gridDanger = grid.append(function() {return dangerIcon.documentElement.cloneNode(true);})
              .attr("y", ypos + iconPadding)
              .attr("x", xpos + iconPadding)
              .attr("width", width * 0.9)
              .attr("height", width * 0.9)
          }
        }
        xpos += width + white_space;
      }
      xpos = 1;
      ypos += height + white_space;
    }
  }

  var grid = d3.select("#gameOutline")
  	.append("svg")
    .attr("width", `${gridWidth}px`)
    .attr("height", `${gridHeight}px`);

  function addGridLegend(dangerIcon, goalIcon, cliffIcon) {
    var rewardLegend = d3.select("#gameOutlineLegend")
      .append('svg')
      .attr('width', 300)

    const textColor = "#4C4845"
    , icon_size = 20
    , y_pos1 = 5
    , y_pos2 = 45
    , x_pos1 = 5
    , x_pos2 = 110
    rewardLegend.append(function() {return goalIcon.documentElement.cloneNode(true);})
      .attr('x', x_pos1)
      .attr('y', y_pos1)
      .attr('width', icon_size)
      .attr('height', icon_size);
    rewardLegend.append(function() {return cliffIcon.documentElement.cloneNode(true);})
      .attr('x', x_pos1)
      .attr('y', y_pos2)
      .attr('width', icon_size)
      .attr('height', icon_size);
    rewardLegend.append(function() {return dangerIcon.documentElement.cloneNode(true);})
      .attr('x', x_pos2)
      .attr('y', y_pos1)
      .attr('width', icon_size)
      .attr('height', icon_size);
    rewardLegend.append('rect')
      .attr('x', x_pos2)
      .attr('y', y_pos2)
      .attr('width', icon_size)
      .attr('height', icon_size)
      .style("fill", 'rgb(230,225,224)')

    const legend_text_spacing = 30
    , y_pos1_text = y_pos1 + 11
    , y_pos2_text = y_pos2 + 11
    rewardLegend.append("text")
      .attr("x", x_pos1 + legend_text_spacing)
      .attr("y", y_pos1_text)
      .text("Goal: r = 50")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    rewardLegend.append("text")
      .attr("x", x_pos1 + legend_text_spacing)
      .attr("y", y_pos2_text)
      .text("Cliff: r = -50")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    rewardLegend.append("text")
      .attr("x", x_pos2 + legend_text_spacing)
      .attr("y", y_pos1_text)
      .text("Danger Zone: r ~ N(-15, 15²)")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
    rewardLegend.append("text")
      .attr("x", x_pos2 + legend_text_spacing)
      .attr("y", y_pos2_text)
      .text("Roaming States: r ~ N(-2, 2²)")
      .style("font-size", "12px")
      .style("fill", textColor)
      .attr("alignment-baseline","middle")
  }

  var gridData
  Promise.all([
    d3.xml("assets/start.svg"),
    d3.xml("assets/danger.svg"),
    d3.xml("assets/goal.svg"),
    d3.xml("assets/cliff.svg")
  ]).then(assets => {
      var startIcon = assets[0]
      , dangerIcon = assets[1]
      , goalIcon = assets[2]
      , cliffIcon = assets[3]

      gridData = getGridData()
      createGrid(gridData)
      addGridIcons(grid, startIcon, dangerIcon, goalIcon, cliffIcon)
      addGridLegend(dangerIcon, goalIcon, cliffIcon)
  });
}
