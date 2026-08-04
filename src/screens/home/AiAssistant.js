// import React, {useEffect, useRef, useState} from 'react';
// import {StyleSheet, View, ActivityIndicator, BackHandler} from 'react-native';
// import {WebView} from 'react-native-webview';
// import {Colors} from '../../styles';
// // import Voice from '@react-native-community/voice';

// import Voice from '@react-native-voice/voice';
// import RNFS from 'react-native-fs';
// import useVoiceRecorder from '../../hooks/VoiceRecorder';
// const AiAssistant = ({navigation}) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const webViewRef = useRef(null);
//   const [error, setError] = useState(null);
//   const {startRecording, stopRecording, convertedText} = useVoiceRecorder();

//   useEffect(() => {
//     const backHandler = BackHandler.addEventListener(
//       'hardwareBackPress',
//       () => {
//         navigation.navigate('BabyNames');
//         return true;
//       },
//     );

//     return () => {
//       backHandler.remove();
//     };
//   }, [navigation]);
//   useEffect(() => {}, [
//     console.log('convertedText-------->', convertedText, 'cccc'),
//   ]);

//   // useEffect(() => {
//   //   Voice.onSpeechError = onSpeechError;
//   //   Voice.onSpeechResults = onSpeechResults;

//   //   const initVoice = async () => {
//   //     try {
//   //       await Voice.init({
//   //         'en-US': 'Google',
//   //       });
//   //       console.log('Voice initialized successfully');
//   //     } catch (e) {
//   //       setError('Failed to initialize Voice');
//   //       console.log('Failed to initialize Voice', e);
//   //     }
//   //   };

//   //   initVoice();

//   //   return () => {
//   //     Voice.destroy().then(Voice.removeAllListeners);
//   //   };
//   // }, []);
//   useEffect(() => {
//     Voice.onSpeechError = onSpeechError;
//     Voice.onSpeechResults = onSpeechResults;

//     const initVoice = async () => {
//       try {
//         await Voice.isAvailable();
//         console.log('Voice is available');
//       } catch (e) {
//         setError('Voice not available');
//         console.log('Voice not available', e);
//       }
//     };

//     initVoice();

//     return () => {
//       Voice.destroy().then(Voice.removeAllListeners);
//     };
//   }, []);

//   const onSpeechError = e => {
//     setError(`Error: ${e.error.message}`);
//     console.log(`Error in Voice Recognition: ${e.error.message}`);
//   };

//   // const onSpeechResults = e => {
//   //   const voiceText = e.value[0];
//   //   console.log('onSpeechResults voiceText:', voiceText);
//   //   webViewRef.current.injectJavaScript(`askQuestion('${voiceText}')`);
//   // };
//   const onSpeechResults = async e => {
//     const voiceText = e.value[0];
//     console.log('onSpeechResults voiceText:---->', voiceText);

//     // Save to text file and send
//     const path = `${RNFS.DocumentDirectoryPath}/voiceText.txt`;
//     await RNFS.writeFile(path, voiceText, 'utf8');
//     console.log(`File written to ${path}`);

//     // TODO: Send this file to some location

//     webViewRef.current.injectJavaScript(`askQuestion('${voiceText}')`);
//   };

//   // const startVoiceRecognition = async () => {
//   //   setError(null); // Reset the error if any
//   //   try {
//   //     await Voice.start('en-US');
//   //     console.log('Voice recognition started');
//   //   } catch (e) {
//   //     setError(`Could not start voice recognition: ${e.message}`);
//   //     console.log(`Could not start voice recognition: ${e.message}`);
//   //   }
//   // };
//   const startVoiceRecognition = async () => {
//     try {
//       let a = await Voice.start('en-US');

//       console.log('Voice recognition started', a);

//       // Stop voice recognition after 5 seconds
//       setTimeout(() => {
//         Voice.stop().catch(err => {
//           console.log('Error in Voice.stop:', err);
//         });
//       }, 5000);
//     } catch (e) {
//       console.log(`Could not start voice recognition: ${e.message}`);
//     }
//   };

//   const onShouldStartLoadWithRequestHandler = event => {
//     const url = event.url;
//     console.log('WebView URL:', url);

//     if (url) {
//       // startVoiceRecognition();
//       startRecording();

//       // Introduce a 3-second delay before calling stopRecording
//       setTimeout(() => {
//         stopRecording();
//         console.log('Blocking navigation to:', url);
//       }, 3000); // 3000 milliseconds = 3 seconds

//       return false; // Block the navigation
//     }
//     console.log('Allowing navigation to:', url);
//     return true; // Allow the navigation
//   };

//   // const onShouldStartLoadWithRequestHandler = event => {
//   //   const url = event.url;

//   //   if (url) {
//   //     startVoiceRecognition();
//   //   }
//   //    // Test if the URL actually includes these substrings
//   // if (url.includes('voice-button-press-in')) {
//   //   console.log('Voice button press in detected');
//   //   startVoiceRecognition().catch(err => {
//   //     console.log('Error in startVoiceRecognition:', err);
//   //   });
//   // }

//   // if (url.includes('voice-button-press-out')) {
//   //   console.log('Voice button press out detected');
//   //   Voice.stop().catch(err => {
//   //     console.log('Error in Voice.stop:', err);
//   //   });
//   // }

//   //   console.log('WebView URL:', url);
//   //   return true;
//   // };
//   return (
//     <View style={styles.container}>
//       <WebView
//         ref={webViewRef}
//         source={{
//           uri: 'https://lily.ria.rocks/today/bots/ketoOrNot/genesisAI.php?assesment=1&assistantName=R10-Baby%20Names%20Crafter&iOS&android',
//         }}
//         onLoadStart={() => setIsLoading(true)}
//         onLoadEnd={() => setIsLoading(false)}
//         onShouldStartLoadWithRequest={onShouldStartLoadWithRequestHandler}
//         // onLoadProgress={({nativeEvent}) =>
//         //   console.log('WebView progress:', nativeEvent)
//         // }
//         renderLoading={() => (
//           <View style={styles.loader}>
//             <ActivityIndicator size="large" color={Colors.primary} />
//           </View>
//         )}
//         startInLoadingState={true}
//       />
//       {isLoading && (
//         <View style={styles.loader}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//         </View>
//       )}
//       {/* {error && (
//         <View style={styles.error}>
//           <Text>{error}</Text>
//         </View>
//       )} */}
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
//     backgroundColor: 'white',
//   },
//   error: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'red',
//     padding: 10,
//   },
// });

// export default AiAssistant;

import React, {useEffect, useState} from 'react';
import {Button, Text, View, TouchableOpacity} from 'react-native';
import Voice from '@react-native-voice/voice';
import useVoiceRecorder from '../../hooks/VoiceRecorder';

const AiAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const {startRecording, stopRecording} = useVoiceRecorder();
  useEffect(() => {
    // Set up event listeners for voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    return () => {
      // Clean up event listeners when component unmounts
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = e => {
    // Called when speech recognition starts
    setIsRecording(true);
  };

  const onSpeechRecognized = e => {
    // Called when speech is recognized
    console.log('Speech recognized');
  };

  const onSpeechEnd = e => {
    // Called when speech recognition ends
    setIsRecording(false);
  };

  const onSpeechError = e => {
    // Called when an error occurs during speech recognition
    console.error('Speech error:', e.error);
  };

  const onSpeechResults = e => {
    // Called when speech recognition returns final results
    const recognizedText = e.value[0];
    setRecognizedText(recognizedText);
  };

  const onSpeechPartialResults = e => {
    // Called when speech recognition returns partial results
    const recognizedText = e.value[0];
    setRecognizedText(recognizedText);
  };

  const onSpeechVolumeChanged = e => {
    // Called when the speaker's volume changes during speech recognition
    console.log('Volume changed:', e.value);
  };

  const startRecord = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  };

  const stopRecord = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Failed to stop recording:', e);
    }
  };

  return (
    <View>
      <Text>AiAssistant</Text>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecord : startRecord}
      />

      <Text>Recognized Text: {recognizedText}</Text>

      <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording}>
        <Text style={{color: 'red'}}>START RC</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AiAssistant;
