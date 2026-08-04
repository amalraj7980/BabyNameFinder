import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import {Colors} from '../styles';
import {AppContext} from '../context/AppContext';
import {Svg, Path} from 'react-native-svg';

const AppTour = ({
  isVisible,
  onClose,
  title,
  message,
  cancelText,
  onCancel,
  style,
}) => {
  const {
    locale: {locale},
  } = useContext(AppContext);
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={[styles.popupContainer, style]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'space-evenly',
              flexDirection: 'row',
            }}>
            {cancelText && (
              <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                <Text style={[styles.buttonText, {color: Colors.BLACK}]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>{locale.ok}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  popupContainer: {
    backgroundColor: Colors.OrangeTint,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: Colors.WHITE,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AppTour;
