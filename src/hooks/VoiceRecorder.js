import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import {PermissionsAndroid, Platform} from 'react-native';
import {useCallback, useEffect, useState} from 'react';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
//import { audioUrl } from './ChatService.js';

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

  const convertAudioToText = async (fileName, blob) => {
    console.log({blob});
    const formData = new FormData();
    formData.append('audio_data', blob, fileName);
    formData.append('Content-Type', 'audio/wav');
    formData.append('Content-Disposition', 'form-data');
    formData.append('filename', fileName);

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    };

    // try {
    //   const response = await fetch(audioUrl, requestOptions);
    //   const json = await response.text();
    //   console.log(json);
    // } catch (err) {
    //   console.log('Error========>', err);
    //   console.error('Error========>', err);
    // }
  };

  const onStopRecord = useCallback(async () => {
    const fileUrl = await audioRecorderPlayer.stopRecorder();

    const urlArray = fileUrl.split('/');
    const fileName = urlArray[urlArray.length - 1];

    const audio = await RNFS.readFile(fileUrl, 'base64');
    convertAudioToText(fileName, audio);
  }, []);

  return {
    startRecording: onStartRecord,
    stopRecording: onStopRecord,
  };
}
