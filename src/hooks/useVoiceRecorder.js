import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import {PermissionsAndroid, Platform} from 'react-native';
import {useCallback, useEffect, useState} from 'react';
import base64 from 'base-64';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';

const dirs = RNFetchBlob.fs.dirs;
const audioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 2,
  AVFormatIDKeyIOS: AVEncodingOption.aac,
  OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
};
const path = Platform.select({
  ios: undefined,
  android: `${dirs.CacheDir}/filename.wav`,
});

export default function useVoiceRecorder() {
  const audioRecorderPlayer = new AudioRecorderPlayer();
  const [audioRes, setAudioRes] = useState('hi');

  useEffect(() => {
    audioRecorderPlayer.setSubscriptionDuration(0.1);
  }, []);

  const onStartRecord = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    await audioRecorderPlayer.startRecorder(path, audioSet);
  }, []);

  const convertAudioToText = audioBlob => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Convert blob to audio URL
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();

    recognition.onresult = event => {
      const text = event.results[0][0].transcript;
      console.log('Converted Text: ', text);
    };

    recognition.start();
  };

  const onStopRecord = useCallback(async () => {
    const fileUrl = await audioRecorderPlayer.stopRecorder();

    const urlArray = fileUrl.split('/');
    const fileName = urlArray[urlArray.length - 1];

    const audio = await RNFS.readFile(fileUrl, 'ascii');
    convertAudioToText(fileName, audio);
  }, []);

  return {
    startRecording: onStartRecord,
    stopRecording: onStopRecord,
  };
}
