import {PermissionsAndroid, Platform} from 'react-native';
import {useCallback} from 'react';

/**
 * Recording helper used by AiAssistant.
 * react-native-audio-recorder-player was removed in the RN 0.83 upgrade
 * (incompatible with New Architecture); Voice (@react-native-voice/voice)
 * remains the speech-recognition path.
 */
export default function useVoiceRecorder() {
  const onStartRecord = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
      } catch (err) {
        console.warn(err);
      }
    }
  }, []);

  const onStopRecord = useCallback(async () => {
    return null;
  }, []);

  return {
    startRecording: onStartRecord,
    stopRecording: onStopRecord,
  };
}
