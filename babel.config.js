module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
    env: {
      test: {
        plugins: ['require-context-hook'],
      },
    },
  };
};
