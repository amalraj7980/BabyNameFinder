import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
  },
  productContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
  },
  productTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  productDescription: {
    marginBottom: 10,
  },
  productPrice: {
    fontWeight: 'bold',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.textGray,
  },
  itemDescription: {
    color: Colors.textGray,
  },
  itemImage: {
    width: 40,
    height: 40,
  },
  bottomButtons: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  lifetimeaccess: {
    backgroundColor: Colors.unisex,
    paddingVertical: 13,
    paddingHorizontal: 10,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderRadius: 25,
    margin: 10,
  },
  monthlyaccess: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderRadius: 25,
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  purchasePopup: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    zIndex: 1000,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  popupDescription: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
