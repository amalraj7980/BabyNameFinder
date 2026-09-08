import React, {useState, useEffect} from 'react';
import {
  View,
  ActivityIndicator
} from 'react-native';
import {WebView} from 'react-native-webview';
import {Colors} from '../../styles';
import SafeScreen from '../../components/SafeScreen';
import {PRIVACY_POLICY_URL} from '../../constants/appInfo';
import {styles} from './privacyPolicyStyles';


const PrivacyPolicy = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeScreen backgroundColor={Colors.background || Colors.WHITE}>
      <View style={styles.container}>
        <WebView
          source={{
            uri: PRIVACY_POLICY_URL,
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(true)} 
          onLoadEnd={() => setIsLoading(false)} // Set isLoading to false when the WebView finishes loading
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


export default PrivacyPolicy;
