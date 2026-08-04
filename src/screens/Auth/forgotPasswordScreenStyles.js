import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    color: Colors.primary,
  },
  description: {
    fontSize: 16,
    paddingBottom: 10,
    marginBottom: 20,
    color: '#666666',
  },
  input: {
    width: '100%',
    height: 40,
    borderBottomColor: Colors.lightGray,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  resetButton: {
    width: '100%',
    height: 40,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc', // Change the style of the disabled button if needed
  },
});
