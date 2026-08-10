import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

/** Shared layout for Filter / Search form screens */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background || '#F5F5F7',
  },
  card: {
    backgroundColor: Colors.WHITE,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  radioButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 10,
    flexWrap: 'wrap',
  },
  radioButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 12,
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    paddingLeft: 12,
    fontWeight: '500',
  },
  activeLabel: {
    color: Colors.primary,
  },
  notActiveLabel: {
    color: Colors.textGray || '#333',
  },
  input: {
    width: '100%',
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.lightGray || '#ccc',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputText: {
    color: 'black',
    backgroundColor: 'white',
  },
  activeInput: {
    borderColor: Colors.primary,
    borderBottomWidth: 1.5,
  },
  toggleBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  toggleLabel: {
    color: Colors.BLACK,
    marginBottom: 0,
  },
  sectionLabel: {
    color: Colors.BLACK,
    marginTop: 10,
  },
  genderAll: {
    color: 'black',
  },
  genderBoy: {
    color: Colors.Boy,
  },
  genderGirl: {
    color: Colors.secondary,
  },
  genderUnisex: {
    color: Colors.unisex,
  },
  searchButton: {
    backgroundColor: Colors.OrangeTint || Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 48,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
