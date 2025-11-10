const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Configure resolver to exclude react-native-maps for web (backup in case platform-specific files don't work)
const defaultResolver = config.resolver.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Exclude react-native-maps for web platform
    if (platform === 'web' && moduleName === 'react-native-maps') {
      return {
        type: 'empty',
      };
    }
    // Use default resolver for all other modules
    if (defaultResolver) {
      return defaultResolver(context, moduleName, platform);
    }
    // Fallback to context's resolveRequest
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

