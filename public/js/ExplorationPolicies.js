import {
  norm_pdf,
  box_muller
} from './rand';

export function graphExplorationPolicies(action1Color, action2Color, buttonColor) {
  var margin = {top: 50, right: 10, bottom: 50, left: 50}
  , width = 350
  , height = 350
  , mu1 = +d3.select("#sliderExplorationPolicyMu1").attr("value")
  , mu2 = +d3.select("#sliderExplorationPolicyMu2").attr("value")
  , sigma1 = +d3.select("#sliderExplorationPolicySigma1").attr("value")
  , sigma2 = +d3.select("#sliderExplorationPolicySigma2").attr("value")
  , epsilon = 0.1;

  var value_to_label = {
    "epsilon-greedy": "Epsilon-Greedy",
    "upper-confidence-bound": "Bayes-UCB",
    "thompson-sampling": "Q-Value Sampling",
    "myopic-vpi": "Myopic-VPI"
  }

  var selection_one = document.getElementById('exploration-policy-one-dropdown')
  , selection_two = document.getElementById('exploration-policy-two-dropdown')
  , exploration_policy_one = selection_one.options[selection_one.selectedIndex].value
  , exploration_policy_two = selection_two.options[selection_two.selectedIndex].value;

  document.querySelector('label[for="barExplorationPolicyMu1"] span').innerHTML = mu1
  document.querySelector('label[for="barExplorationPolicyMu2"] span').innerHTML = mu2
  document.querySelector('label[for="barExplorationPolicySigma1"] span').innerHTML = sigma1
  document.querySelector('label[for="barExplorationPolicySigma2"] span').innerHTML = sigma2

  // Add Option to dropdown
  function addOptionToDropdown(dropdown_id, option_label, option_value) {
    var sel = document.getElementById(dropdown_id);
    var opt = document.createElement('option');
    opt.appendChild( document.createTextNode(option_label) );
    opt.value = option_value;
    sel.appendChild(opt);
  }

  // Remove options in Dropdown by id
  function removeOptionFromDropdown(dropdown_id, value_to_remove) {
    var sel = document.getElementById(dropdown_id);
    for (var opt_idx = 0; opt_idx < sel.length; opt_idx++) {
      if (sel.options[opt_idx].value == value_to_remove) {
          sel.remove(opt_idx)
      }
    }
  }

  function erf(y) {
    var sign = (y >= 0) ? 1 : -1;
    y = Math.abs(y);

    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;

    var t = 1.0/(1.0 + p*y);
    var z = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-y * y);

    return sign * z;
  }

  function phi(x, mu, sigma) {
    return (1 + erf((x - mu) / sigma / Math.sqrt(2))) / 2
  }

  function phi_inverse(p) {
      var a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
      var a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
      var b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
      var b4 = 66.8013118877197, b5 = -13.2806815528857, c1 = -7.78489400243029E-03;
      var c2 = -0.322396458041136, c3 = -2.40075827716184, c4 = -2.54973253934373;
      var c5 = 4.37466414146497, c6 = 2.93816398269878, d1 = 7.78469570904146E-03;
      var d2 = 0.32246712907004, d3 = 2.445134137143, d4 = 3.75440866190742;
      var p_low = 0.02425, p_high = 1 - p_low;
      var q, r;
      var retVal;

      if ((p < 0) || (p > 1)) {
          alert("NormSInv: Argument out of range.");
          retVal = 0;
      }
      else if (p < p_low) {
          q = Math.sqrt(-2 * Math.log(p));
          retVal = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
      }
      else if (p <= p_high) {
          q = p - 0.5;
          r = q * q;
          retVal = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
      }
      else {
          q = Math.sqrt(-2 * Math.log(1 - p));
          retVal = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
      }
      return retVal;
  }

  function lower_phi(y) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-Math.pow(y,2)/2)
  }

  function expected_value(mu, sigma, upper_bound, lower_bound) {
    var alpha, direction;
    if (upper_bound != null) {
      alpha = 1 - phi(upper_bound, mu, sigma)
      direction = -1
    }
    else if (lower_bound != null) {
      alpha = phi(lower_bound, mu, sigma)
      direction = 1
    }

    if (alpha == 1) {
      return 0
    }
    else if (alpha == 0) {
      return mu
    }
    else {
      return (mu + direction * sigma * ((lower_phi(phi_inverse(alpha))) / (1 - alpha))) * (1 - alpha)
    }
  }

  function get_action_selection_criteria(exploration_policy, mu, sigma, action) {
    var selection_criteria;
    if (exploration_policy == "epsilon-greedy") {
      selection_criteria = mu
    }
    else if (exploration_policy == "thompson-sampling") {
      selection_criteria = box_muller(mu, sigma)
    }
    else if (exploration_policy == "upper-confidence-bound") {
      selection_criteria = mu + sigma * 2
    }
    else if (exploration_policy == "myopic-vpi") {
      var probability_of_gain, expected_better_value, vpi;
      if (action == "One") {
        if (mu1 >= mu2) {
          probability_of_gain = phi(mu2, mu1, sigma1)
          expected_better_value = expected_value(mu1, sigma1, mu2, null)
          vpi = mu2 * probability_of_gain - expected_better_value
        }
        else {
          probability_of_gain = 1 - phi(mu2, mu1, sigma1)
          expected_better_value = expected_value(mu1, sigma1, null, mu2)
          vpi = expected_better_value - mu2 * probability_of_gain
        }
      }
      else if (action == "Two") {
        if (mu2 >= mu1) {
          probability_of_gain = phi(mu1, mu2, sigma2)
          expected_better_value = expected_value(mu2, sigma2, mu1, null)
          vpi = mu1 * probability_of_gain - expected_better_value
        }
        else {
          probability_of_gain = 1 - phi(mu1, mu2, sigma2)
          expected_better_value = expected_value(mu2, sigma2, null, mu1)
          vpi = expected_better_value - mu1 * probability_of_gain
        }
      }
      selection_criteria = mu + vpi
    }
    return selection_criteria
  }

  function create_dist(mu, sigma){
    var n = [];
    var step_size = (mu+sigma*4 - (mu-sigma*4)) / 200
    for (var i = mu-sigma*4; i < mu+sigma*4; i += step_size) {
        n.push({x: i, y: norm_pdf(i, mu, sigma)})
    }
    return n;
  }

  var dist1 = create_dist(mu1, sigma1)
  var dist2 = create_dist(mu2, sigma2)

  var svg1 = d3.select("#exploration-policy-one-plot")
      .classed("svg-container", true)
  		.append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${height} ${width}`)
        .classed("svg-content-responsive", true)
  var svg2 = d3.select("#exploration-policy-two-plot")
      .classed("svg-container", true)
      .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${height} ${width}`)
        .classed("svg-content-responsive", true)

  const xValue = d => d.x;
  const xAxisLabel = "Range";

  const yValue = d => d.y;
  const yAxisLabel = "Density";

  // const margin = {top: 60, right: 40, bottom: 88, left:80};
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  var rangeX1 = d3.extent(dist1, xValue)
  , rangeX2 = d3.extent(dist2, xValue)
  , rangeY1 = d3.extent(dist1, yValue)
  , rangeY2 = d3.extent(dist2, yValue)

  var xScale = d3.scaleLinear()
    .domain([-25, 25])
    .range([0, innerWidth])
    .nice();

  var yScale = d3.scaleLinear()
    .domain([0, 0.4])
    .range([innerHeight, 0])
    .nice();

  const g1 = svg1.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const g2 = svg2.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  var xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickSize(0)
    .tickPadding(20);

  var yAxis = d3.axisLeft(yScale)
    .ticks(6)
    .tickSize(0)
    .tickPadding(10);

  g1.append('g')
    .attr("class","y-axis")
    .call(yAxis);
  g2.append('g')
    .attr("class","y-axis")
    .call(yAxis);

  g1.append('g').call(xAxis)
    .attr("class","x-axis")
    .attr('transform', `translate(0,${innerHeight})`);
  g2.append('g').call(xAxis)
    .attr("class","x-axis")
    .attr('transform', `translate(0,${innerHeight})`);

  g1.append("text")
        .attr("class", "chart-title")
        .attr("x", (innerWidth / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#696969")
        .text(value_to_label[exploration_policy_one]);
  g2.append("text")
        .attr("class", "chart-title")
        .attr("x", (innerWidth / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#696969")
        .text(value_to_label[exploration_policy_two]);


  const lineGenerator = d3.line()
    .x(d => xScale(xValue(d)))
    .y(d => yScale(yValue(d)))
    .curve(d3.curveBasis);

  function renderVerticalLine(exploration_policy, g) {
    if (exploration_policy == "epsilon-greedy" && Math.random() < epsilon) {
      var max_range_value = 10
      var action1 = Math.random() * max_range_value * 2 - max_range_value
      var action2 = Math.random() * max_range_value * 2 - max_range_value
    }
    else {
      var action1 = get_action_selection_criteria(exploration_policy, mu1, sigma1, "One")
      var action2 = get_action_selection_criteria(exploration_policy, mu2, sigma2, "Two")
    }

    g.append("circle")
        .attr("class", 'action-circle')
        .attr("cx", xScale(action1))
        .attr("cy", yScale(0))
        .attr("r", 5)
        .style("fill", action1Color);
    g.append("circle")
        .attr("class", 'action-circle')
        .attr("cx", xScale(action2))
        .attr("cy", yScale(0))
        .attr("r", 5)
        .style("fill", action2Color);
  }

  const render = (data, color, class_name, group) => {
    group.append('path')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('class', class_name)
      .attr('d', lineGenerator(data))
  };

  function updateModelParameters() {
    d3.select('.plot1-dist1').remove()
    d3.select('.plot1-dist2').remove()
    d3.select('.plot2-dist1').remove()
    d3.select('.plot2-dist2').remove()
    // d3.selectAll('.vertical-line').remove()
    d3.selectAll('.action-circle').remove()

    dist1 = create_dist(mu1, sigma1)
    dist2 = create_dist(mu2, sigma2)

    render(dist1, action1Color, 'plot1-dist1', g1)
    render(dist2, action2Color, 'plot1-dist2', g1)
    render(dist1, action1Color, 'plot2-dist1', g2)
    render(dist2, action2Color, 'plot2-dist2', g2)
    renderVerticalLine(exploration_policy_one, g1)
    renderVerticalLine(exploration_policy_two, g2)
  }
  updateModelParameters()

  d3.select("#sliderExplorationPolicyMu1").on("input", function(){
    mu1 = +this.value
    document.querySelector('label[for="barExplorationPolicyMu1"] span').innerHTML = mu1
    updateModelParameters()
  })
  d3.select("#sliderExplorationPolicyMu2").on("input", function(){
    mu2 = +this.value
    document.querySelector('label[for="barExplorationPolicyMu2"] span').innerHTML = mu2
    updateModelParameters()
  })
  d3.select("#sliderExplorationPolicySigma1").on("input", function(){
    sigma1 = +this.value
    document.querySelector('label[for="barExplorationPolicySigma1"] span').innerHTML = sigma1
    updateModelParameters()
  })
  d3.select("#sliderExplorationPolicySigma2").on("input", function(){
    sigma2 = +this.value
    document.querySelector('label[for="barExplorationPolicySigma2"] span').innerHTML = sigma2
    updateModelParameters()
  })



  d3.select("#exploration-policy-one-dropdown").on("change", function(){
    addOptionToDropdown('exploration-policy-two-dropdown', value_to_label[exploration_policy_one], exploration_policy_one)
    exploration_policy_one = this.value
    removeOptionFromDropdown('exploration-policy-two-dropdown', exploration_policy_one)
    g1.select(".chart-title").text(value_to_label[exploration_policy_one])
    updateModelParameters()

    if (exploration_policy_one == 'epsilon-greedy' || exploration_policy_one == 'thompson-sampling' ||
        exploration_policy_two == 'epsilon-greedy' || exploration_policy_two == 'thompson-sampling') {
      sampleButton.style('display', 'block')
    }
    else {
      sampleButton.style('display', 'none')
    }
  })
  d3.select("#exploration-policy-two-dropdown").on("change", function(){
    addOptionToDropdown('exploration-policy-one-dropdown', value_to_label[exploration_policy_two], exploration_policy_two)
    exploration_policy_two = this.value
    removeOptionFromDropdown('exploration-policy-one-dropdown', exploration_policy_two)
    g2.select(".chart-title").text(value_to_label[exploration_policy_two])
    updateModelParameters()

    if (exploration_policy_one == 'epsilon-greedy' || exploration_policy_one == 'thompson-sampling' ||
        exploration_policy_two == 'epsilon-greedy' || exploration_policy_two == 'thompson-sampling') {
      sampleButton.style('display', 'block')
    }
    else {
      sampleButton.style('display', 'none')
    }
  })

  const playButtonWidth = 80
  var sampleButton = d3.select("#sampleButton")
    .append("svg")
      .attr('width', `${playButtonWidth}`)
      .attr('height', `${playButtonWidth/2}`)

  function loadSampleButton() {
    sampleButton
      .append("rect")
        .attr("fill", buttonColor)
        .attr("width", `${playButtonWidth}`)
        .attr("height", `${playButtonWidth/2}`)
        .attr("rx", 10)
        .on("click", function() {
          updateModelParameters()
        });

    sampleButton.append("text")
      .text("Sample")
      .attr("class", "button-text")
      .attr("x", `${playButtonWidth/2}`)
      .attr("y", `${playButtonWidth/4}`)
      .on("click", function() {
        updateModelParameters()
      });
  }
  loadSampleButton()

}
