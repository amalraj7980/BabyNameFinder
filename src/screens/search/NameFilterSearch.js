import React, {useState, useContext, useEffect, useCallback} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {RadioButton} from 'react-native-paper';
import {styles} from './nameFilterSearchStyles';
import SafeScreen from '../../components/SafeScreen';

const GENDER_OPTIONS = [
  {label: 'All', value: 'all', labelStyle: styles.genderAll},
  {label: 'Boy', value: 'male', labelStyle: styles.genderBoy},
  {label: 'Girl', value: 'female', labelStyle: styles.genderGirl},
  {label: 'Unisex', value: 'unisex', labelStyle: styles.genderUnisex},
];

export default function NameFilterSearch({navigation, route}) {
  const {
    locale: {locale},
    seachfilterData,
    setSeachfilterData,
  } = useContext(AppContext);

  const [focusedInput, setFocusedInput] = useState(null);
  const [value, setValue] = React.useState('first');
  const [isCompoundSwitchOn, setIsCompoundSwitchOn] = useState(false);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleFilterChange = useCallback(
    (field, nextValue) => {
      if (field === 'compoundLetter') {
        setSeachfilterData(prevFilter => ({
          ...prevFilter,
          compoundLetter: nextValue,
        }));
      } else if (field === 'gender') {
        setSeachfilterData(prevFilter => ({
          ...prevFilter,
          gender: nextValue,
        }));
      } else {
        setSeachfilterData(prevFilter => ({
          ...prevFilter,
          [field]: nextValue,
        }));
      }
    },
    [setSeachfilterData],
  );

  const toggleCompoundSwitch = useCallback(() => {
    setIsCompoundSwitchOn(prev => !prev);
    handleFilterChange('compoundLetter', !isCompoundSwitchOn);
  }, [handleFilterChange, isCompoundSwitchOn]);

  const handleRadioChange = useCallback(
    selectedValue => {
      setValue(selectedValue);
      handleFilterChange('gender', selectedValue);
    },
    [handleFilterChange],
  );

  useEffect(() => {
    setIsCompoundSwitchOn(seachfilterData.compoundLetter);
    setValue(seachfilterData.gender);
  }, [seachfilterData]);

  const handleInputFocus = useCallback(field => {
    setFocusedInput(field);
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedInput(null);
  }, []);

  const handleSearch = useCallback(() => {
    setSeachfilterData(prev => ({
      ...prev,
      search: false,
    }));
    navigation.navigate('BabyNames', {
      filter: {
        ...seachfilterData,
        search: false,
      },
    });
  }, [navigation, seachfilterData, setSeachfilterData]);

  const renderGenderOptions = () => {
    const rows = [];
    for (let i = 0; i < GENDER_OPTIONS.length; i += 3) {
      const rowOptions = GENDER_OPTIONS.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.radioButtonRow}>
          {rowOptions.map(option => (
            <View key={option.value} style={styles.radioButtonContainer}>
              <Text style={[styles.label, option.labelStyle]}>
                {option.label}
              </Text>
              <RadioButton
                value={option.value}
                color={Colors.primary}
                status={
                  seachfilterData.gender === option.value
                    ? 'checked'
                    : 'unchecked'
                }
                onPress={() => {
                  handleRadioChange(option.value);
                  handleFilterChange('gender', option.value);
                }}
              />
            </View>
          ))}
        </View>,
      );
    }
    return rows;
  };

  return (
    <SafeScreen backgroundColor={Colors.background || '#F5F5F7'}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  focusedInput === 'firstLetter'
                    ? styles.activeLabel
                    : styles.notActiveLabel,
                ]}>
                Starts with
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputText,
                  focusedInput === 'firstLetter' && styles.activeInput,
                ]}
                value={seachfilterData.firstLetter}
                onChangeText={text => handleFilterChange('firstLetter', text)}
                onFocus={() => handleInputFocus('firstLetter')}
                onBlur={handleInputBlur}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  focusedInput === 'lastLetter'
                    ? styles.activeLabel
                    : styles.notActiveLabel,
                ]}>
                Ends with
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputText,
                  focusedInput === 'lastLetter' && styles.activeInput,
                ]}
                value={seachfilterData.lastLetter}
                onChangeText={text => handleFilterChange('lastLetter', text)}
                onFocus={() => handleInputFocus('lastLetter')}
                onBlur={handleInputBlur}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  focusedInput === 'contains'
                    ? styles.activeLabel
                    : styles.notActiveLabel,
                ]}>
                Contains
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputText,
                  focusedInput === 'contains' && styles.activeInput,
                ]}
                value={seachfilterData.contains}
                onChangeText={text => handleFilterChange('contains', text)}
                onFocus={() => handleInputFocus('contains')}
                onBlur={handleInputBlur}
              />
            </View>
            <View style={[styles.toggleContainer, styles.toggleBorder]}>
              <Text style={[styles.label, styles.toggleLabel]}>
                Compound names only
              </Text>
              <Switch
                trackColor={{false: '#767577', true: Colors.orangeLightTint}}
                thumbColor={isCompoundSwitchOn ? Colors.OrangeTint : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleCompoundSwitch}
                value={isCompoundSwitchOn}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, styles.sectionLabel]}>Gender</Text>
              {renderGenderOptions()}
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>{locale?.ok}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeScreen>
  );
}
