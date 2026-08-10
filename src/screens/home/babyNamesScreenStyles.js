import {StyleSheet, Dimensions} from 'react-native';
import {Colors} from '../../styles';

const {width, height} = Dimensions.get('window');

export const CARD_WIDTH = width * 0.9;
export const CARD_HEIGHT = Math.min(height * 0.58, 520);
export const CARD_H_MARGIN = (width * 0.1) / 2;

export const SWIPER_CONTAINER_STYLE = {
  flex: 1,
  backgroundColor: 'transparent',
};

export const SWIPER_CARD_STYLE = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
};

export const SWIPER_OVERLAY_LABELS = {
  left: {
    title: 'NOPE',
    style: {
      label: {
        backgroundColor: 'transparent',
        borderColor: '#FF3B30',
        color: '#FF3B30',
        borderWidth: 3,
        fontSize: 28,
        fontWeight: '800',
      },
      wrapper: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        marginTop: 30,
        marginLeft: -20,
      },
    },
  },
  right: {
    title: 'LIKE',
    style: {
      label: {
        backgroundColor: 'transparent',
        borderColor: '#34C759',
        color: '#34C759',
        borderWidth: 3,
        fontSize: 28,
        fontWeight: '800',
      },
      wrapper: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginTop: 30,
        marginLeft: 20,
      },
    },
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  clearFilterChip: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderColor: Colors.OrangeTint,
    borderWidth: 1.5,
    borderRadius: 6,
  },
  clearFilterText: {
    color: Colors.tintGray,
    fontSize: 13,
    fontWeight: '600',
  },
  transparentButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiFabImage: {
    height: 135,
    width: 110,
    marginRight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 200,
  },
  emptyStateText: {
    color: Colors.tintGray,
    fontSize: 18,
  },
  listContent: {
    flexGrow: 1,
  },
  popupWidth: {
    width: '80%',
  },
  viewModeOptions: {
    flexDirection: 'row',
    paddingLeft: 12,
    alignItems: 'center',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  viewModeOption: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  viewModeIconWrap: {
    height: 20,
    width: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.lightGray || 'lightgray',
  },
  likeText: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: '#34C759',
    fontSize: 18,
    fontWeight: '800',
    zIndex: 2,
  },
  dislikeText: {
    position: 'absolute',
    top: 16,
    left: 16,
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '800',
    zIndex: 2,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 80,
    paddingHorizontal: 16,
    backgroundColor: '#454545',
  },
  compactNameHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  compactNameText: {
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 10,
    padding: 8,
    height: 150,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  gridNameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gridActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    borderColor: Colors.OrangeTint,
    borderWidth: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.WHITE,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cardCentered: {
    alignSelf: 'center',
  },
  cardNameWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeroName: {
    fontSize: 44,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0,
    color: Colors.WHITE,
  },
  Swipercontainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 8,
  },
  cardActionBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  undoLabel: {
    color: 'red',
    fontSize: 18,
    marginLeft: 4,
  },
  hitSlop12: {
    top: 12,
    bottom: 12,
    left: 12,
    right: 12,
  },
});
