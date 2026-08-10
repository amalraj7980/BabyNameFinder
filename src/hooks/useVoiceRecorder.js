import {PermissionsAndroid, Platform} from 'react-native';
import {useCallback} from 'react';

/**
 * See VoiceRecorder.js — audio-recorder-player removed for RN 0.83 / New Arch.
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
