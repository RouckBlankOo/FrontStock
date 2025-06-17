const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolution for jsbarcode modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  './EAN8.js': `${__dirname}/node_modules/jsbarcode/src/barcodes/EAN_UPC/EAN8.js`,
};

// Allow importing .js files with ESM exports
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;