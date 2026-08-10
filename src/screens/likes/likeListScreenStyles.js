import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#454545',
  },
  itemSeparator: {
    height: 0.6,
    backgroundColor: 'lightgray', // Change the color of the divider line as needed
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  CompactlikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 30,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: 10,
    height: 80,
  },
  CompactdislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.WHITE,
    backgroundColor: Colors.dotGray,
    width: 45,
    height: 30,
    borderRadius: 15,
  },
  name: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
    top: 1,
  },
  emptyStateText: {
    color: Colors.tintGray,
    fontSize: 18,
  },
  listMargin: {
    margin: 0,
  },
});
