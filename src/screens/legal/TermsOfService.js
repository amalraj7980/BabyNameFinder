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
