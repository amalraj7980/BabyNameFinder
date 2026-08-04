import {StyleSheet, Dimensions} from 'react-native';
import {Colors} from '../../styles';

const {width, height} = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingBottom: 20,
    //padding: 16,
  },
  transparentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    //padding: 10,
  },
  buttonText: {
    color: 'blue', // You can set your own color
  },
  noMoreCardsText: {color: Colors.OrangeTint},

  viewModeOptions: {
    flexDirection: 'row',
    paddingLeft: 16,
    // justifyContent: 'space-between',
    // marginBottom: 16,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  viewModeOption: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedText: {
    color: Colors.OrangeTint,
  },
  unselectedText: {
    color: Colors.dotGray,
  },
  itemSeparator: {
    height: 0.5,
    backgroundColor: 'lightgray', // Change the color of the divider line as needed
  },
  likeText: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: 'green',
    fontSize: 18,
  },
  dislikeText: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'red',
    fontSize: 18,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 80,
    padding: 16,
    backgroundColor: '#454545',
  },
  CompactlikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    borderColor: Colors.WHITE,
    backgroundColor: Colors.primary,
    width: 45,
    height: 30,
    borderRadius: 15,
  },
  CompactdislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.WHITE,
    backgroundColor: Colors.secondary,
    width: 45,
    height: 30,
    borderRadius: 15,
  },
  gridCard: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    borderRadius: 8,
    padding: 5,
    height: 150,
    marginTop: 8,
    marginBottom: 8,
    margin: 16,
  },
  verticalRectangle: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  CompactRectangle: {
    width: 20,
    height: 6,
    borderWidth: 1,
    borderColor: Colors.dotGray,
    backgroundColor: Colors.background,
    marginVertical: 1,
  },
  GridRectangle: {
    width: 20,
    height: 8,
    borderWidth: 1,
    borderColor: Colors.dotGray,
    backgroundColor: Colors.background,
    marginVertical: 1,
  },
  SwiperRectangle: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: Colors.dotGray,
    backgroundColor: Colors.background,
    marginVertical: 1,
  },
  selectedRectangle: {
    borderColor: Colors.OrangeTint, // Replace 'blue' with your desired color
    borderWidth: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.WHITE,
  },
  details: {
    fontSize: 16,
    color: Colors.WHITE,
  },

  Swipercontainer: {
    flex: 1,
    // backgroundColor:Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainerCarosal: {
    position: 'absolute',
    top: height * 0.39, // Adjust the vertical position as needed
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    height: '70%',
  },
  card: {
    width: width * 0.95, // 80% of the screen width
    height: height * 0.78, // 80% of the screen height
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 30,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    //backgroundColor:Colors.primary,
    elevation: 5,
  },
  cardText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dislikeCardBg: {
    backgroundColor: 'red',
  },
  likeCardBg: {
    backgroundColor: 'green',
  },
});
