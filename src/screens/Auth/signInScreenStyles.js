import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 20,
    marginBottom: 24,
    marginTop: 24,
    color: Colors.lightGray,
  },

  inputContainer: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: Colors.tintGray,
    backgroundColor: Colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    marginRight: 10, // To add spacing between the key icon and the input
  },
  inputs: {
    flex: 1,
    height: '100%',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: Colors.tintGray,
    backgroundColor: Colors.WHITE,
  },
  button: {
    backgroundColor: Colors.OrangeTint,
    width: '100%',
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.lightGray,
    fontWeight: 'bold',
  },
  forgotText: {
    color: Colors.lightGray,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  socialButtons: {
    flexDirection: 'row',
    padding: 20,
  },
  googleButton: {
    alignItems: 'center',
    height: 60,
    width: 60,
    borderRadius: 7,
    justifyContent: 'center',
    marginRight: 20,
    backgroundColor: Colors.WHITE,
  },
  facebookButton: {
    alignItems: 'center',
    height: 60,
    width: 60,
    borderRadius: 7,
    justifyContent: 'center',
    marginLeft: 20,
    backgroundColor: Colors.navyBlue,
  },
  buttonIcon: {
    width: 28,
    height: 28,
  },
  disabledButton: {
    backgroundColor: '#ccc', // Change the style of the disabled button if needed
  },
  errorText: {
    color: Colors.OrangeTint,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
  },
});
