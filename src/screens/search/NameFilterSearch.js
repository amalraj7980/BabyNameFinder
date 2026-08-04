import React, {useState, useContext, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import {Colors} from '../../styles';
import {AppContext} from '../../context/AppContext';
import {RadioButton} from 'react-native-paper';
import {styles} from './nameFilterSearchStyles';

import RangeSlider from 'react-native-range-slider'; // Import the range slider component

export default function NameFilterSearch({navigation, route}) {
  const {
    locale: {locale, code},
    seachfilterData, // Access filterData from AppContext
    setSeachfilterData, // Access setFilterData from AppContext
  } = useContext(AppContext);
  const genderOptions = [
    {label: 'All', value: 'all'},
    {label: 'Boy', value: 'male'},
    {label: 'Girl', value: 'female'},
    {label: 'Unisex', value: 'unisex'},
  ];

  const [focusedInput, setFocusedInput] = useState(null);
  const [value, setValue] = React.useState('first');
  const [isCompoundSwitchOn, setIsCompoundSwitchOn] = useState(false); // Changed variable name here
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  const toggleCompoundSwitch = () => {
    setIsCompoundSwitchOn(!isCompoundSwitchOn); // Toggle the switch state
    // Update compoundLetter based on switch state
    handleFilterChange('compoundLetter', isCompoundSwitchOn ? false : true);
  };

  const handleRadioChange = selectedValue => {
    setValue(selectedValue);
    handleFilterChange('gender', selectedValue); // Update the gender field

    // Handle the selected value here, e.g., call handleFilterChange('gender', selectedValue)
  };
  const handleFilterChange = (field, value) => {
    if (field === 'compoundLetter') {
      setSeachfilterData(prevFilter => ({
        ...prevFilter,
        compoundLetter: value, // Update compoundLetter based on user input
      }));
    } else if (field === 'gender') {
      setSeachfilterData(prevFilter => ({
        ...prevFilter,
        gender: value, // Set gender based on user input
      }));
    } else {
      setSeachfilterData(prevFilter => ({
        ...prevFilter,
        [field]: value,
      }));
    }
  };
  useEffect(() => {
    // Update initial values from context when component mounts
    setIsCompoundSwitchOn(seachfilterData.compoundLetter);
    setValue(seachfilterData.gender);
  }, [seachfilterData]);

  const handleInputFocus = field => {
    setFocusedInput(field);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  const handleSearch = () => {
    // Perform filtering logic based on the filter state
    let item = 20;
    //    navigation.navigate("BabyNames", { filterParams: item })
    // navigation.navigate('BabyNames', { filteredData: filter });
    route.params.onFilterApplied(seachfilterData);
    // Go back to BabyNamesScreen
    navigation.navigate('BabyNames', {filter: seachfilterData});
    // navigation.goBack();
  };

  const getLabelColor = label => {
    if (label === 'All') {
      return 'black';
    } else if (label === 'Boy') {
      return Colors.Boy;
    } else if (label === 'Girl') {
      return Colors.secondary;
    } else {
      return Colors.unisex;
    }

    return 'black'; // Default color
  };

  const renderGenderOptions = () => {
    const rows = [];
    for (let i = 0; i < genderOptions.length; i += 3) {
      const rowOptions = genderOptions.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.radioButtonRow}>
          {rowOptions.map(option => (
            <View key={option.value} style={styles.radioButtonContainer}>
              <Text
                style={[styles.label, {color: getLabelColor(option.label)}]}>
                {option.label}
              </Text>
              <RadioButton
                value={option.value}
                color={Colors.primary} // Set the color of the checked icon
                status={
                  seachfilterData.gender === option.value
                    ? 'checked'
                    : 'unchecked'
                } // Check if the filter.gender matches the option's value                // onPress={() => handleRadioChange(option.value)}
                onPress={() => {
                  handleRadioChange(option.value); // Call handleRadioChange
                  handleFilterChange('gender', option.value); // Update the gender field
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
                {color: 'black', backgroundColor: 'white'},
                focusedInput === 'firstLetter' && styles.activeInput,
              ]}
              value={seachfilterData.firstLetter}
              onChangeText={value => handleFilterChange('firstLetter', value)}
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
              {' '}
              Ends with
            </Text>
            <TextInput
              style={[
                styles.input,
                {color: 'black', backgroundColor: 'white'},
                focusedInput === 'lastLetter' && styles.activeInput,
              ]}
              value={seachfilterData.lastLetter}
              onChangeText={value => handleFilterChange('lastLetter', value)}
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
              {' '}
              Contains{' '}
            </Text>
            <TextInput
              style={[
                styles.input,
                {color: 'black', backgroundColor: 'white'},
                focusedInput === 'contains' && styles.activeInput,
              ]}
              value={seachfilterData.contains}
              onChangeText={value => handleFilterChange('contains', value)}
              onFocus={() => handleInputFocus('contains')}
              onBlur={handleInputBlur}
            />
          </View>
          <View
            style={[
              styles.toggleContainer,
              {borderBottomWidth: 0.5, borderColor: '#ccc'},
            ]}>
            <Text style={[styles.label, {color: Colors.BLACK}]}>
              {' '}
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
            <Text style={[styles.label, {color: Colors.BLACK, marginTop: 10}]}>
              Gender
            </Text>
            {renderGenderOptions()}
          </View>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>{locale?.ok}</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

