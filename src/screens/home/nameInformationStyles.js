import {StyleSheet} from 'react-native';
import {Colors} from '../../styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background || '#F6F7FB',
  },
  card: {
    backgroundColor: Colors.WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    color: Colors.nameDetails || Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    color: Colors.textGray || Colors.drawerTextGray,
    lineHeight: 22,
  },
});
