import {
  Text,
  View,
  Share
} from 'react-native';
import React, {useContext, useState, useEffect} from 'react';
import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {styles} from './nameInformationStyles';


const NameInformation = props => {
  const {
    locale: {locale, code},
  } = useContext(AppContext);
  const nameInfo = props.route.params.item;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Gender</Text>
        <Text style={styles.content}>{nameInfo.gender}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Origin</Text>
        <Text style={styles.content}>{nameInfo.origin}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Meaning</Text>
        <Text style={styles.content}>{nameInfo.meaning}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Syllabes</Text>
        <Text style={styles.content}>
          {nameInfo.syllables} ({nameInfo.syllableCount})
        </Text>
      </View>
    </View>
  );
};

export default NameInformation;
