// import React, {useState, useEffect} from 'react';
// import {StyleSheet, View, ActivityIndicator} from 'react-native';
// import {WebView} from 'react-native-webview';
// import {Colors} from '../../styles';

// const TermsOfService = () => {
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoading(false);
//     }, 4000);

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <WebView
//         source={{
//           uri: 'https://riafy.me/wellness/terms.php?apptitle=Baby%20Names%20App',
//         }}
//         onLoadStart={() => setIsLoading(true)}
//         onLoad={() => setIsLoading(true)}
//         onLoadEnd={() => setIsLoading(false)} // Set isLoading to false when the WebView finishes loading
//       />
//       {isLoading && (
//         <View style={styles.loader}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loader: {
//     ...StyleSheet.absoluteFill,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Colors.background,
//   },
// });

// export default TermsOfService;

// import React, {useState, useEffect} from 'react';
// import {StyleSheet, View, ActivityIndicator} from 'react-native';
// import {WebView} from 'react-native-webview';
// import {Colors} from '../../styles';

// const TermsOfService = () => {
//   const [isLoading, setIsLoading] = useState(true);

//   return (
//     <View style={styles.container}>
//       <WebView
//         source={{
//           uri: 'https://riafy.me/wellness/terms.php?apptitle=Baby%20Names%20App',
//         }}
//         onLoadStart={() => setIsLoading(true)}
//         onLoad={() => setIsLoading(false)} // Removed the extra setIsLoading(true) here
//         onLoadEnd={() => setIsLoading(false)}
//         onShouldStartLoadWithRequest={request => {
//           // Always allow the WebView to load any link inside itself
//           return true;
//         }}
//         startInLoadingState={true}
//       />
//       {isLoading && (
//         <View style={styles.loader}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loader: {
//     ...StyleSheet.absoluteFill,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Colors.background,
//   },
// });

// export default TermsOfService;

import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, ActivityIndicator, BackHandler} from 'react-native';
import {WebView} from 'react-native-webview';
import {Colors} from '../../styles';
import SafeScreen from '../../components/SafeScreen';
import {TERMS_OF_USE_URL} from '../../constants/appInfo';
import {styles} from './termsOfServiceStyles';


const TermsOfService = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false); // To track WebView navigation
  const webViewRef = useRef(null);

  useEffect(() => {
    // Add event listener for hardware back button press on Android
    // const backAction = () => {
    //   if (canGoBack) {
    //     webViewRef.current.goBack();
    //     return true; // Prevent default behavior (exiting the app)
    //   }
    //   return false;
    // };

    const backAction = () => {
      console.log('Back button pressed');
      if (canGoBack) {
        console.log('Navigating back in WebView');
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove(); // Cleanup on component unmount
  }, [canGoBack]);

  return (
    <SafeScreen backgroundColor={Colors.background || Colors.WHITE}>
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{
            uri: TERMS_OF_USE_URL,
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onLoadEnd={() => setIsLoading(false)}
          onShouldStartLoadWithRequest={request => true}
          onNavigationStateChange={navState => {
            setCanGoBack(navState.canGoBack);
          }}
          startInLoadingState={true}
        />
        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </SafeScreen>
  );
};


export default TermsOfService;
