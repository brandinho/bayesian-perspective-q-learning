import { plotGameOutline } from './GameOutline'
// import { graphCLT } from './CentralLimitTheorem'
import { graphMixture } from './DistributionMixture'
import { graphQDistribution } from './QDistribution'
import { graphConstantAlpha } from './ConstantAlpha'
import { graphExplorationPolicies } from './ExplorationPolicies'
// import { graphEpsilonAlpha } from './EpsilonAlpha'
import { graphRegret } from './Regret'
import { plotGridDistributions } from './GridDistributions'
import { plotLearningProgress } from './LearningProgress'
import { plotStateVisitation } from './StateVisitation'
import { plotExplorationExploitation } from './ExplorationExploitation'
import { plotInflectionPoint } from './LearningInflectionPoint'
import { runInflectionPointPaths } from './InflectionPointPaths'
import { runGame } from './Game'

window.onload = function() {
  const colorPalette = [
    "#156760",
    "#1D8D84",
    "#24B3A8",
    "#30D5C8",
    "#56DDD2",
    "#7CE4DC",
    "#A2ECE6"
  ]

  const arrowColor = "#1c7871"

  const regretColorPalette = [
    "#f7c88e", //Light Orange
    "#ed648e", //Pink
    "#737af6", //Purple
    "#71bdf0", // Light Blue
    "#71f093", // Light Green
    "#bb6aeb", // Light purple
    "#e04c4c", // red
    "#4bd1c6" // teal
  ]

  // graphCLT(colorPalette[6], colorPalette[2], colorPalette[1])
  graphMixture(colorPalette[5], colorPalette[1])
  graphConstantAlpha(colorPalette[6], colorPalette[2], colorPalette[0])
  graphExplorationPolicies(colorPalette[2], "#f29d5c", colorPalette[3])
  // graphEpsilonAlpha(colorPalette[5], colorPalette[1])
  graphRegret(regretColorPalette[0], regretColorPalette[1], regretColorPalette[2], regretColorPalette[3],
              regretColorPalette[4], regretColorPalette[5], regretColorPalette[6], regretColorPalette[7])

  Promise.all([
    d3.json("data/qvalue_distribution_data.json"),
    d3.xml("assets/star.svg")
  ]).then(normality_data => {
    var underlyding_data = normality_data[0]
    var starIcon = normality_data[1]
    graphQDistribution(underlyding_data, starIcon, colorPalette[5], colorPalette[2], colorPalette[1])
  })

  const actions = ["Up", "Left", "Right", "Down"]
  , n_columns = 10
  , n_rows = 6

  plotGameOutline(n_columns, n_rows)
  plotGridDistributions(n_columns, n_rows, colorPalette[6])
  plotStateVisitation(n_columns, n_rows)
  plotExplorationExploitation(colorPalette[4], colorPalette[2], colorPalette[1])
  plotInflectionPoint(colorPalette[4], colorPalette[2], colorPalette[1])
  runInflectionPointPaths(n_columns, n_rows, colorPalette[5], colorPalette[2], colorPalette[0])

  var QHistorical = {};
  Promise.all([
    d3.json("data/Qmu_historical.json"),
    d3.json("data/Qsigma_historical.json"),
    d3.json("data/Qmu_true.json"),
    d3.json("data/Qsigma_true.json")
  ]).then(QData => {
      var QMuData = QData[0];
      var QSigmaData = QData[1];
      var QTrueMuData = QData[2]
      var QTrueSigmaData = QData[3]
      var current_key;

      for (var col = 0; col < n_columns; col++) {
        for (var row = 0; row < n_rows; row++) {
          for (var a of actions) {
            current_key = "(" + row + ", " + col + ") " + a
            QHistorical[current_key] = []
            for (var idx = 0; idx < QMuData[current_key].length; idx++) {
              QHistorical[current_key].push(
                {
                  x: QMuData[current_key][idx].x,
                  mu: QMuData[current_key][idx].y,
                  sigma: QSigmaData[current_key][idx].y,
                  true_mu: QTrueMuData[current_key],
                  true_sigma: QTrueSigmaData[current_key]
                }
              )
            }
          }
        }
      }
      plotLearningProgress(QHistorical, actions, n_columns, n_rows, colorPalette[6], colorPalette[2], arrowColor)
      runGame(QHistorical, actions, n_columns, n_rows, colorPalette[3], colorPalette[6])
  });
}
