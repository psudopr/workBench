//regeneratorRuntime issues :: https://github.com/facebook/react-native/issues/21052

module.exports = {
  presets: ["@babel/preset-env"],
  plugins: [
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-runtime", //fixes the god damn async problems
    "@babel/plugin-proposal-object-rest-spread"
  ]
};
