// App.js

import React, {useEffect} from 'react';
import Navigation from './src/routes/Navigation';
import {initConnection} from 'react-native-iap';

const App = () => {
  useEffect(() => {
    const initializeIAPConnection = async () => {
      try {
        await initConnection(); // Initialize IAP
        console.log('Successfully initialized IAP connection');
      } catch (err) {
        console.error('Failed to initialize IAP connection', err);
      }
    };

    initializeIAPConnection();
  }, []);
  //return <Navigation />;
  return (
    // <AuthContextProvider>
    //   <AppContextProvider>
    <Navigation />
    //   {/* </AppContextProvider>
    // </AuthContextProvider> */}
  );
};

export default App;

// import React, {useRef, useState} from 'react';
// import {
//     FlatList,
//     Image,
//     SafeAreaView,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     Button,
//     View,
// } from 'react-native';
// import RNFS from 'react-native-fs'; // Import the react-native-fs library
// import ImagePicker from 'react-native-image-picker'; // Import the Image Picker library

// import {
//     AdenCompat,
//     _1977Compat,
//     BrannanCompat,
//     BrooklynCompat,
//     ClarendonCompat,
//     EarlybirdCompat,
//     GinghamCompat,
//     HudsonCompat,
//     InkwellCompat,
//     KelvinCompat,
//     LarkCompat,
//     LofiCompat,
//     MavenCompat,
//     MayfairCompat,
//     MoonCompat,
//     NashvilleCompat,
//     PerpetuaCompat,
//     ReyesCompat,
//     RiseCompat,
//     SlumberCompat,
//     StinsonCompat,
//     ToasterCompat,
//     ValenciaCompat,
//     WaldenCompat,
//     WillowCompat,
//     Xpro2Compat,
//   } from 'react-native-image-filter-kit';
//   const FILTERS = [
//     {
//       title: 'Normal',
//       filterComponent: AdenCompat,
//     },
//     {
//       title: 'Maven',
//       filterComponent: MavenCompat,
//     },
//     {
//       title: 'Mayfair',
//       filterComponent: MayfairCompat,
//     },
//     {
//       title: 'Moon',
//       filterComponent: MoonCompat,
//     },
//     {
//       title: 'Perpetua',
//       filterComponent: PerpetuaCompat,
//     },
//     {
//       title: 'Reyes',
//       filterComponent: ReyesCompat,
//     },
//     {
//       title: 'Rise',
//       filterComponent: RiseCompat,
//     },
//     {
//       title: 'Slumber',
//       filterComponent: SlumberCompat,
//     },
//     {
//       title: 'Stinson',
//       filterComponent: StinsonCompat,
//     },
//     {
//       title: 'Brooklyn',
//       filterComponent: BrooklynCompat,
//     },
//     {
//       title: 'Earlybird',
//       filterComponent: EarlybirdCompat,
//     },
//     {
//       title: 'Clarendon',
//       filterComponent: ClarendonCompat,
//     },
//     {
//       title: 'Gingham',
//       filterComponent: GinghamCompat,
//     },
//     {
//       title: 'Hudson',
//       filterComponent: HudsonCompat,
//     },
//     {
//       title: 'Inkwell',
//       filterComponent: InkwellCompat,
//     },
//     {
//       title: 'Kelvin',
//       filterComponent: KelvinCompat,
//     },
//     {
//       title: 'Lark',
//       filterComponent: LarkCompat,
//     },
//     {
//       title: 'Lofi',
//       filterComponent: LofiCompat,
//     },
//     {
//       title: 'Toaster',
//       filterComponent: ToasterCompat,
//     },
//     {
//       title: 'Valencia',
//       filterComponent: ValenciaCompat,
//     },
//     {
//       title: 'Walden',
//       filterComponent: WaldenCompat,
//     },
//     {
//       title: 'Willow',
//       filterComponent: WillowCompat,
//     },
//     {
//       title: 'Xpro2',
//       filterComponent: Xpro2Compat,
//     },
//     {
//       title: 'Aden',
//       filterComponent: AdenCompat,
//     },
//     {
//       title: '_1977',
//       filterComponent: _1977Compat,
//     },
//     {
//       title: 'Brannan',
//       filterComponent: BrannanCompat,
//     },
//   ];

//   const App = () => {
//     const [originalImage, setOriginalImage] = useState(null);
//     const [selectedFilterIndex, setIndex] = useState(0);
//     const [filteredImage, setFilteredImage] = useState(null);
//     const [extractedUri, setExtractedUri] = useState(null);

//     const handleSelectImage = () => {
//       const options = {
//         mediaType: 'photo',
//         includeBase64: false,
//       };

//       ImagePicker.launchImageLibrary(options, (response) => {
//         if (!response.didCancel && !response.error) {
//           setOriginalImage(response.uri);
//           setFilteredImage(response.uri);
//           console.log("file----->",response.uri)
//           setExtractedUri(null); // Reset extractedUri when a new image is selected
//         } else if (response.error) {
//           console.log('ImagePicker Error:', response.error);
//           // Handle the error
//         } else {
//           console.log('ImagePicker Cancelled');
//           // Handle the cancellation
//         }
//       });
//     };

//     const onExtractImage = ({ nativeEvent }) => {
//       setExtractedUri(nativeEvent.uri);
//       console.log(nativeEvent.uri)
//     };

//     const onSelectFilter = (selectedIndex) => {
//       setIndex(selectedIndex);
//     };

//     // const saveImage = async () => {
//     //   if (filteredImage) {
//     //     const destPath = RNFS.DocumentDirectoryPath + '/editedImage.jpg';
//     //     try {
//     //       await RNFS.copyFile(filteredImage, destPath);
//     //       console.log('Image saved to:', destPath);
//     //       // Show a success message or perform other actions on successful image save
//     //     } catch (error) {
//     //       console.log('Error saving image:', error);
//     //       // Handle the error
//     //     }
//     //   }
//     // };

//     const applyFilter = async () => {
//         if (originalImage) {
//           const selectedFilter = FILTERS[selectedFilterIndex].filterComponent;
//           console.log("selectedFilter:", selectedFilter);

//           try {
//             const filterComponent = new selectedFilter();
//             const filteredUri = await filterComponent.process({
//               uri: originalImage,
//               format: 'JPEG',
//               name: 'image.jpg',
//             });

//             console.log("filteredImage in apply filter function-->", filteredImage);
//             setFilteredImage(filteredUri);
//           } catch (error) {
//             console.log('Error applying filter:', error);
//             // Handle the error
//           }
//         }
//       };

// //  const saveImage = async () => {
// //     if (filteredImage) {
// //       const destPath = `${RNFS.DocumentDirectoryPath}/image_editor/editedImage.jpg`;
// //       try {
// //         // Create the "image_editor" folder if it doesn't exist
// //         await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/image_editor`);

// //         // Move the edited image to the "image_editor" folder
// //         await RNFS.moveFile(filteredImage, destPath);
// //         console.log('Image saved to:', destPath);
// //         // Show a success message or perform other actions on successful image save
// //       } catch (error) {
// //         console.log('Error saving image:', error);
// //         // Handle the error
// //       }
// //     } else {
// //       console.log('No filtered image to save.');
// //       console.log("err--->",filteredImage)
// //     }
// //   };
// const saveImage = async () => {
//     const filteredUri = await applyFilter();
//     if (filteredUri) {
//       const destPath = `${RNFS.DocumentDirectoryPath}/image_editor/editedImage.jpg`;
//       try {
//         // Create the "image_editor" folder if it doesn't exist
//         await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/image_editor`);

//         // Move the edited image to the "image_editor" folder
//         await RNFS.moveFile(filteredUri, destPath);
//         console.log('Image saved to:', destPath);
//         // Show a success message or perform other actions on successful image save
//       } catch (error) {
//         console.log('Error saving image:', error);
//         // Handle the error
//       }
//     } else {
//       console.log('No filtered image to save.');
//       console.log("err--->", filteredUri);
//     }
//   };

//     const renderFilterComponent = ({ item, index }) => {
//       const FilterComponent = item.filterComponent;
//       const image = originalImage ? (
//         <Image
//           style={styles.filterSelector}
//           source={{ uri: originalImage }}
//           resizeMode={'contain'}
//         />
//       ) : (<>
//         {/* <Image
//           style={styles.image}
//           source={require('../assets/images/GoogleLogo.png')}
//           resizeMode={'contain'}
//         /> */}

//         </>
//       );

//       return (
//         <TouchableOpacity onPress={() => onSelectFilter(index)}>
//           <Text style={styles.filterTitle}>{item.title}</Text>
//           <FilterComponent
//             onExtractImage={onExtractImage}
//             extractImageEnabled={true}
//             image={image}
//             style={styles.filterSelector} // Pass the style to the FilterComponent

//           />
//         </TouchableOpacity>
//       );
//     };
//     const SelectedFilterComponent = FILTERS[selectedFilterIndex].filterComponent;

//     return (
//       <>
//         <SafeAreaView />
//         {originalImage && (
//           <>
//           {selectedFilterIndex === 0 ? (
//         <Image
//           style={styles.image}
//           source={{ uri: originalImage }}
//           resizeMode={'contain'}
//         />
//       ) : (
//          <SelectedFilterComponent
//           onExtractImage={onExtractImage}
//           extractImageEnabled={true}
//           image={
//             <Image
//               style={styles.image}
//               source={{ uri: originalImage }}
//               resizeMode={'contain'}
//             />
//           }
//         /> )}
//             <FlatList
//               data={FILTERS}
//               keyExtractor={(item) => item.title}
//               horizontal={true}
//               renderItem={renderFilterComponent}
//             />
//             {/* <Button title="Apply Filter" onPress={applyFilter} /> */}
//            {/* <Button title="Apply Filter" onPress={applyFilter} /> */}
//           {extractedUri && <Button title="Save Image" onPress={saveImage} />}
//           </>
//         )}
//         {!originalImage && (
//             <View style={{flex:1,alignItems:"center",justifyContent:"center"}}>
//           <Button title="Select Image" onPress={handleSelectImage} />

//             </View>
//         )}

//       </>
//     );
//   };

//   const styles = StyleSheet.create({
//     image: {
//       width: 520,
//       height: 520,
//       marginVertical: 10,
//       alignSelf: 'center',
//     },
//     filterTitle: {
//       fontSize: 12,
//       textAlign: 'center',
//     },
//     filterSelector: {
//         width: 100,
//         height: 100,
//         margin: 5,
//       },
//       filterComponentImage: {
//         width: 520,
//         height: 520,
//         marginVertical: 10,
//         alignSelf: 'center',
//       },
//   });

//   export default App;
