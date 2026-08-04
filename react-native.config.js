// module.exports = {
//   dependencies: {
//     'react-native-vector-icons': {
//       platforms: {
//         android: null, // disable Android platform, other platforms will still autolink if provided
//       },
//     },
//   },
// };

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assects/fonts/'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
  },
};
