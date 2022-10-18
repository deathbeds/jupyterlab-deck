
module.exports = {
  output: {
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: ['@ephesoft/webpack.istanbul.loader'],
      }
    ],
  },
};
