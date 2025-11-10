const path = require('path');

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-dotenv', {
        path: path.resolve(__dirname, '.env'),
        systemvars: true
      }]
    ],
  };
};

