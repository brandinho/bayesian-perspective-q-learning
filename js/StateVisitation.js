export function plotStateVisitation(n_columns, n_rows) {
  const gridHeight = parseInt(d3.select(".state-visitations").style("height"))
  , gridWidth = parseInt(d3.select(".state-visitations").style("width"))
  , white_space = 2
  , width = Math.floor((gridWidth - (n_columns-1)*white_space) / n_columns)
  , height = width
  , rect_spacing = width + white_space
  , rect_center = 3
  , max_reward = 50
  , min_reward = -max_reward
  , time_punishment = -2;

  // FIX THE COLOR SCALE
  var colorScale = d3.scaleLinear()
    .range(["white", "#66cc66"])
    .domain([0, 10000])
  var colorScale2 = d3.scaleLinear()
    .range(["white", "#ff6961"])
    .domain([0, 10000])

  const selectedStateRX = 5;

  // Grid
  var selectedState = "(1, 0)";

  function getGridData(visitations) {
  	var data = new Array();
  	var xpos = 1;
  	var ypos = 1;
    var current_key;

  	for (var row = 0; row < n_rows; row++) {
  		data.push( new Array() );
  		for (var column = 0; column < n_columns; column++) {
        current_key = "(" + row + ", " + column + ")"
  			data[row].push({
  				x: xpos,
  				y: ypos,
  				width: width,
  				height: height,
  				optimal_visitations: visitations[current_key].optimal_visitations,
          suboptimal_visitations: visitations[current_key].suboptimal_visitations
  			})
  			xpos += width + white_space;
  		}
  		xpos = 1;
  		ypos += height + white_space;
  	}
  	return data;
  }

  function addStarIcon(grid, starIcon) {
    const iconPadding = 2;
    var xpos = 1;
    var ypos = 1;

    for (var row = 0; row < n_rows; row++) {
      for (var column = 0; column < n_columns; column++) {
        if (row == 1 && column == 1) {
          const gridStar = grid.append(function() {return starIcon.documentElement.cloneNode(true);})
            .attr("y", ypos + iconPadding)
            .attr("x", xpos + iconPadding)
            .attr("width", width * 0.9)
            .attr("height", width * 0.9)
        }
      }
      xpos = 1;
      ypos += height + white_space;
    }
  }

  // function addReturnText(grid, total_return) {
  //   grid.append('text')
  //     .attr('class', 'axis-label')
	//     .attr('y', height * 2.5)
	//     .attr('x', gridWidth / 2)
	//     .attr('fill', 'black')
	//     .attr('text-anchor', 'middle')
	//     .text(`Expected Value = ${total_return}`);
  // }

  function getLocation(xPos, yPos) {
    const x = (xPos - 1) / (width + white_space)
    const y = (yPos - 1) / (height + white_space)
    return `(${y}, ${x})`
  }

  function renderGridPaths(gridData, starIcon, visitations_key, total_return) {
    var divID;
    if (visitations_key == "optimal_visitations") {
      divID = "#optimalStateVisitations"
    }
    else if (visitations_key == "suboptimal_visitations") {
      divID = "#suboptimalStateVisitations"
    }
    var grid = d3.select(divID)
      .append("svg")
      .attr("width",`${rect_spacing * n_columns}`)
      .attr("height",`${rect_spacing * n_rows}`)

    var colorFunction;
    var title;
    if (visitations_key == "optimal_visitations") {
      colorFunction = colorScale
      title = "Optimal (Expected Value = 18)"
    }
    else if (visitations_key == "suboptimal_visitations") {
      colorFunction = colorScale2
      title = "Suboptimal (Expected Value = 4)"
      grid
        .attr('x', `${gridWidth}`);
    }

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
    	.style("fill", function(d) { return colorFunction(d[visitations_key]); })
      .style("stroke", "none")
      .style("rx", function(d) {
          if (getLocation(d.x, d.y) == selectedState) {
            return selectedStateRX
          }
          else {
            return 0
          }
      })
      .style("stroke-width", 2)

    const dangerX = 1 * rect_spacing
    , dangerY = 1 * rect_spacing
    , dangerWidth = 2
    , dangerHeight = 3

    var dangerZone = {
      x: dangerX,
      y: dangerY,
      width: (width + white_space) * dangerWidth,
      height: (height + white_space) * dangerHeight,
      reward: -15,
      click: 0
    }
    var dangerOutline = grid.append("rect")
      .attr("x", dangerZone.x)
    	.attr("y", dangerZone.y)
    	.attr("width", dangerZone.width)
    	.attr("height", dangerZone.height)
    	.style("fill", 'none')
      .style("stroke", "red")
      .style("stroke-width", 3)
      .style('stroke-dasharray', ('4, 4'))

    addStarIcon(grid, starIcon)
    // addReturnText(grid, total_return)

    grid.append('text')
      .attr('class', 'axis-label')
      .attr('y', height / 2)
      .attr('x', gridWidth / 2)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text(title);
  }

  var state_visitations = {};
  Promise.all([
    d3.json("data/optimal_policy_state_visitations.json"),
    d3.json("data/suboptimal_policy_state_visitations.json"),
    d3.xml("assets/star.svg")
  ]).then(visitations => {
      var optimal_visitations = visitations[0];
      var suboptimal_visitations = visitations[1];
      var starIcon = visitations[2];
      var current_key;

      for (var col = 0; col < n_columns; col++) {
      	for (var row = 0; row < n_rows; row++) {
          current_key = "(" + row + ", " + col + ")"
          state_visitations[current_key] = {
              optimal_visitations: optimal_visitations[current_key].visitations,
              suboptimal_visitations: suboptimal_visitations[current_key].visitations
            }
        }
      }
      var gridData = getGridData(state_visitations);
      renderGridPaths(gridData, starIcon, "optimal_visitations", 18);
      renderGridPaths(gridData, starIcon, "suboptimal_visitations", 4);
  });
}
