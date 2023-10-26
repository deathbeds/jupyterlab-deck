let rules = [];

const WITH_JS_COV = !!JSON.parse((process.env.WITH_JS_COV || '0').toLowerCase());

if (WITH_JS_COV) {
  console.error('Building with coverage');
  rules.push({ test: /\.js$/, use: ['@ephesoft/webpack.istanbul.loader'] });
}

module.exports = {
  output: { clean: true },
  devtool: 'source-map',
  module: { rules },
};
