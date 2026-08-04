import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  card: {
    backgroundColor: 'white',
    paddingTop: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: '95%',
    elevation: 3,
  },
  radioButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 10,
  },
  radioButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    paddingLeft: 10,
  },
  activeLabel: {
    color: Colors.primary, // Active label color
  },
  notActiveLabel: {
    color: 'black', // Not active label color
  },
  input: {
    width: '100%',
    height: 40,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingHorizontal: 8,
  },
  activeInput: {
    borderColor: Colors.unlockGreen, // Active bottom line color
  },
  searchButton: {
    backgroundColor: Colors.OrangeTint,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '90%',
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
