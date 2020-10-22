/* Implementation of the Box-Muller transform to produce a sample from a random normal*/

export function box_muller(mu, sigma) {
  var x, y, r, v = 0;
  do {
    x = 2*Math.random() - 1;
    y = 2*Math.random() - 1;
    r = x*x + y*y;
  }
  while (r >= 1);

  var co = Math.sqrt( -2 * Math.log(r) / r);
  var v = x*co;
  return v*sigma + mu;
}

/* Generate an exponential distribution using inverse CDF */

export function generate_exp( lambda ){
  var ex, u = 0;

  u = Math.random();
  ex = -( 1 / lambda ) * Math.log(1 - u);
  return ex;
}

/* Generate a logistic distribution using inverse CDF */

export function generate_logistic( mu, sigma ){
  var lgstc, u = 0;

  u = Math.random();
  lgstc = mu + sigma*Math.log(u/(1-u));
  return lgstc;
}

/* Generate PDFs for the same distributions as above */

export function norm_pdf(x, mu, sigma){
  return Math.exp(-Math.pow((x-mu),2)/(2*Math.pow(sigma,2)))/(sigma*Math.sqrt(2*Math.PI));
}

export function exp_pdf(x, lambda){
  return (x < 0) ? 0 : lambda*Math.exp(-lambda*x);
}

export function log_pdf(x, mu, sigma){
  power = -(x-mu)/sigma;
  numerator = Math.exp(power);
  denominator = sigma * Math.pow((1 + Math.exp(power)),2);
  return numerator / denominator;
}

export function pareto_pdf(x, x_m, alpha){
  numerator = alpha*Math.pow(x_m,alpha);
  denominator =  Math.pow(x,alpha+1);
  return (x < x_m) ? 0 : numerator/denominator;
}

export function gamma_pdf(x, beta, alpha){
  var gamma = 1;
  for (var i = alpha-1 ; i > 0 ;i --){
    gamma = gamma * i;
  }
  return Math.pow(beta,alpha)*Math.pow(x,alpha-1)*Math.exp(-beta*x) / gamma;
}

export function randomNormals(rng) {
  let u1 = 0, u2 = 0;
  //Convert [0,1) to (0,1)
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  const R = Math.sqrt(-2.0 * Math.log(u1));
  const Θ = 2.0 * Math.PI * u2;
  return [R * Math.cos(Θ), R * Math.sin(Θ)];
};

export function randomSkewNormal(ξ, ω, α = 0) {
  const [u0, v] = randomNormals(Math.random);
  if (α === 0) {
      return ξ + ω * u0;
  }
  const 𝛿 = α / Math.sqrt(1 + α * α);
  const u1 = 𝛿 * u0 + Math.sqrt(1 - 𝛿 * 𝛿) * v;
  const z = u0 >= 0 ? u1 : -u1;
  return ξ + ω * z;
};

export function generateNormalData(n, loc, scale) {
  var data = []
  for (var j = 0; j < n; j++) {
    data.push(randomNormals(Math.random)[0] * scale + loc);
  }
  return data;
}

export function generateSkewData(n, alpha) {
  var data = []
  for (var j = 0; j < n; j++) {
    data.push(randomSkewNormal(0, 1, alpha));
  }
  return data;
}

export function generateSkewDataStrong(n, maxSampleSize, mus, sigmas, alphas) {
  var data = [];
  var idx;
  for (var j = 0; j < n; j++) {
    idx = j % maxSampleSize
    data.push(randomSkewNormal(mus[idx], sigmas[idx], alphas[idx]));
  }
  return data;
}
