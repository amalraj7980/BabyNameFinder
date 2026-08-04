import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent black overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden', // Clip content within the rounded corners
  },
  modalContent: {
    padding: 20,
  },
});
