function makeSliderInteractive(sliderName) {
  var $slider = $("#slider".concat(sliderName))
  var $fill = $("#bar".concat(sliderName, " #fill", sliderName))
  function setBar() {
    var max = $slider[0]["max"]
    var min = $slider[0]["min"]
    var percentage = ($slider.val() - min) / (max - min) * 100
    $fill.css("width", percentage + "%")
  }
  $slider.on("input", setBar);
  return setBar();
}

// makeSliderInteractive("SizeCLT");
makeSliderInteractive("GammaMixture");
makeSliderInteractive("SizeQDistribution");
makeSliderInteractive("GammaQDistribution");
makeSliderInteractive("SparsityQDistribution");
makeSliderInteractive("Alpha");
makeSliderInteractive("ExplorationPolicyMu1");
makeSliderInteractive("ExplorationPolicyMu2");
makeSliderInteractive("ExplorationPolicySigma1");
makeSliderInteractive("ExplorationPolicySigma2");
// makeSliderInteractive("NextQEpsilonAlpha");
makeSliderInteractive("ExplorationExploitation");
makeSliderInteractive("InflectionEpisode");
makeSliderInteractive("EpisodesGame");
