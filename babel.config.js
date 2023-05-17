module.exports = function (api) {
  api.cache(true);
  return {
    comments: false,
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 14,
            browsers: ['> 0.2%', 'not ie 11', 'not op_mini all']
          }
        }
      ]
    ]
  };
};
