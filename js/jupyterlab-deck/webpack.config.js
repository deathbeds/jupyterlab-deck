module.exports = {
  output: {
    clean: true,
  },
  module: {
    rules: !process.env.WITH_JS_COV
      ? []
      : [{ test: /\.js$/, use: ['@ephesoft/webpack.istanbul.loader'] }],
  },
};
