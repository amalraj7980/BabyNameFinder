import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  customPagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  activeDot: {
    backgroundColor: Colors.Boy,
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 3,
  },

  wrapper: {},
  pagination: {
    bottom: 10, // Adjust this value as needed
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 30,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Gilda Light Italic',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  image: {
    paddingTop: 50,
    paddingBottom: 50,
    width: '80%',
    height: 350,
    resizeMode: 'center',
  },

  slideText: {
    textAlign: 'center',
    color: '#FFFFFF',
  },
  slideText3: {
    textAlign: 'center',
    color: '#FFFFFF',
    marginRight: 0,
    marginLeft: -12,
  },
  slide3: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    paddingRight: 15,
  },
  startButton: {
    height: 35,
    width: 65,
    backgroundColor: Colors.OrangeTint,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  startButtonText: {
    color: '#FFFFFF',
  },
});
