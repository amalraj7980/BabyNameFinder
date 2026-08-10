import {StyleSheet} from 'react-native';
import {Colors, Fonts} from '../styles';

export const appStackStyles = StyleSheet.create({
  headerIconBtn: {
    marginLeft: 10,
    padding: 4,
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerFilterBtn: {
    marginRight: 25,
  },
  filterTitleWrap: {
    marginLeft: 20,
  },
  filterTitle: {
    color: Colors.WHITE,
    fontSize: 18,
  },
  filterCloseBtn: {
    marginRight: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    marginRight: 10,
    color: Colors.WHITE,
  },
  headerTitleTextSemibold: {
    fontSize: 18,
    marginRight: 10,
    color: Colors.WHITE,
    fontFamily: Fonts.semibold,
  },
  countBadge: {
    height: 18,
    width: 40,
    backgroundColor: Colors.OrangeTint,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: Colors.WHITE,
    fontSize: 11,
  },
  restoreBtn: {
    marginRight: 15,
    padding: 6,
    borderRadius: 20,
    borderColor: Colors.WHITE,
    borderWidth: 1,
  },
  restoreText: {
    color: Colors.WHITE,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 20,
  },
  nameInfoTitle: {
    color: Colors.WHITE,
    fontSize: 18,
  },
  shareBtn: {
    marginRight: 20,
  },
});
