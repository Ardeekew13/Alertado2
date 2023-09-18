import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Button, Image, Text, TextInput  } from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { collection, onSnapshot, doc, setDoc,getDocs, getDoc, getFirestore, updateDoc, query, where, addDoc} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig, { db } from '../firebaseConfig';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getAuth, onAuthStateChanged } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomMarker = ({ coordinate, zoomLevel }) => {
  const defaultMarkerSize = 30; // Increase the marker size value
  const maxZoom = 20;

  const calculateMarkerSize = (zoom) => {
    const baseSize = defaultMarkerSize * (1 + (1 - zoom / maxZoom));
    const aspectRatio = originalImageWidth / originalImageHeight;
    let width, height;

    if (baseSize / aspectRatio > defaultMarkerSize) {
      width = baseSize;
      height = baseSize / aspectRatio;
    } else {
      width = defaultMarkerSize * aspectRatio;
      height = defaultMarkerSize;
    }

    return { width, height };
  };

  const originalImageWidth = 860; // Replace with the actual width of your image
  const originalImageHeight = 1060; // Replace with the actual height of your image

  const markerSize = calculateMarkerSize(zoomLevel);

  const submitPoliceFeedback = () => {
    const transactionSosId = '12345'; // Replace with the actual transactionSosId
    const feedbackText = 'This is the police feedback text.'; // Replace with the actual feedback text

    // Call the function to update police feedback
    updatePoliceFeedback(transactionSosId, feedbackText);
  };
  const updatePoliceFeedback = async (transactionSosId, feedback) => {
    try {
      const db = getFirestore();
      const emergencyRef = doc(db, 'Emergencies', transactionSosId);

      // Update the 'policeFeedback' field with the provided feedback
      await updateDoc(emergencyRef, {
        policeFeedback: feedback,
        // Add any other fields you want to update here if needed
      });

      console.log('Police feedback updated successfully');
    } catch (error) {
      console.error('Error updating police feedback:', error);
    }
  };
  return (
    <Marker coordinate={coordinate}>
      <Image
        source={require('./images/SosPIN.png')}
        style={markerSize}
        resizeMode="contain" // This ensures the image maintains its aspect ratio and doesn't crop
      />
    </Marker>
  );
};

const PoliceAccept = ({ route }) => {
  const [policeLocation, setPoliceLocation] = useState(null);
  const [sosLocation, setSosLocation] = useState(null);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const { userSosLocation, transactionSosId, policeAssignedID, emergency } = route.params;
  const [originalUserSosLocation, setOriginalUserSosLocation] = useState(null);
  const [citizenLocation, setCitizenLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [policeFeedback, setPoliceFeedback] = useState('');
  const mapRef = useRef(null);
  const [policeLocationUpdated, setPoliceLocationUpdated] = useState(false);

  const [directionsFetched, setDirectionsFetched] = useState(false);

  const [directionData, setDirectionData] = useState(null);

  
  useEffect(() => {
    const fetchOngoingEmergencyData = async () => {
      if (emergency.status === 'Ongoing') {
        try {
          const firestore = getFirestore();
          const emergenciesRef = collection(firestore, 'Emergencies');
  
          // Query for the document with a specific transactionSosId
          const querySnapshot = await getDocs(
            query(emergenciesRef, where('transactionSosId', '==', emergency.transactionSosId))
          );
  
          if (!querySnapshot.empty) {
            // Document exists, extract the data
            const emergencyDoc = querySnapshot.docs[0].data();
            setSosLocation(emergencyDoc.citizenLocation);
            console.log(sosLocation);
            // Check if routeCoordinates, policeLocation, and citizenLocation exist in the document
            if (emergencyDoc.routeCoordinates && emergencyDoc.policeLocation) {
              // Extract the data
              const { routeCoordinates, policeLocation } = emergencyDoc;
  
              // Update the state variables with the fetched data
              setRouteCoordinates(routeCoordinates);
              setPoliceLocation(policeLocation);
  
              console.log(emergencyDoc.citizenLocation, policeLocation);
              // Set directionsFetched to true since routeCoordinates exist
              setDirectionsFetched(true);
            } else {
              console.log('Route coordinates, police location, or citizen location not found in document.');
            }
          } else {
            console.log('Emergency document does not exist.');
          }
        } catch (error) {
          console.error('Error fetching ongoing emergency data:', error);
        }
      }
    };
  
    const fetchInitialLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Fetch the current location of the police
          const location = await Location.getCurrentPositionAsync({});
          if (location) {
            setPoliceLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching initial location:', error);
      }
    };
  
    // Call both functions to fetch ongoing emergency data and initialLocation
    fetchOngoingEmergencyData();
    fetchInitialLocation();
  }, []);
  
  const savePoliceLocationToFirestore = async () => {
    console.log('Attempting to save police location to Firestore...');
    // Check if the "Submit" button is pressed and police location is available
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (user || user.uid === emergency.policeAssignedID) {
        console.log('Attempting to save police location to Firestore...');
        try {
          const db = getFirestore();
          const emergenciesRef = collection(db, 'Emergencies');
  
          // Query for the document with a specific transactionSosId
          const querySnapshot = await getDocs(
            query(emergenciesRef, where('transactionSosId', '==', emergency.transactionSosId))
          );
          console.log('Police Loc',transactionSosId)
          if (!querySnapshot.empty) {
            // Document exists, update it
            const emergencyDocRef = querySnapshot.docs[0].ref;
            await updateDoc(emergencyDocRef, {
              policeLocation: {
                latitude: policeLocation.latitude,
                longitude: policeLocation.longitude,
                
              },  
              
            });
         
            console.log('Police location updated in Emergencies collection.');
          } else {
            console.log('Emergency document does not exist.');
          }
        } catch (error) {
          console.error('Error updating police location:', error);
        }
      } else {
        console.log('User is not authorized to update the police location.');
      }
    
  };
  const handlePoliceMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoliceLocation({ latitude, longitude });

  };
  const handleSendFeedback = async () => {
    try {
      const firestore = getFirestore();
      const emergencyDocRef = doc(firestore, 'Emergencies', emergency.transactionSosId);

      // Update the "policeFeedback" field in the Firestore document
      await updateDoc(emergencyDocRef, { policeFeedback });

      console.log('Sent');
    } catch (error) {
      // Handle unexpected errors
      console.error('Error sending feedback:', error);
      // Display an error message to the user or handle the error accordingly
    }
  };
  const handleComplete = async () => {
    try {
      const firestore = getFirestore();
      const emergencyDocRef = doc(firestore, 'Emergencies', emergency.transactionSosId);

      // Update the "status" field to "Completed" in the Firestore document
      await updateDoc(emergencyDocRef, { status: 'Completed' });

      console.log('completed');
    } catch (error) {
      // Handle unexpected errors
      console.error('Error updating status to Completed:', error);
      // Display an error message to the user or handle the error accordingly
    }
  };
  const handleCancel = async () => {
    try {
      const firestore = getFirestore();
      const emergencyDocRef = doc(firestore, 'Emergencies', emergency.transactionSosId);

      // Update the "status" field to "Cancelled" in the Firestore document
      await updateDoc(emergencyDocRef, { status: 'Cancelled' });

      console.log('completed');
    } catch (error) {
      // Handle unexpected errors
      console.error('Error updating status to Completed:', error);
      // Display an error message to the user or handle the error accordingly
    }
  };

  const fetchDirectionsGeoapify = async () => {
    if (!policeLocation || !userSosLocation) return;
  
    try {
      // Check if direction data is already fetched
      if (directionsFetched && directionData) {
        setRouteCoordinates(directionData.routeCoordinates);
        setDirectionsFetched(true);
      } else {
        const apiKey = 'ab9f834b500a40bf9c3ed196ee1a0ead';
        const origin = `${policeLocation.latitude},${policeLocation.longitude}`;
        const destination = `${userSosLocation.latitude},${userSosLocation.longitude}`;
        const response = await fetch(
          `https://api.geoapify.com/v1/routing?waypoints=${origin}|${destination}&mode=drive&apiKey=${apiKey}`
        );
  
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
          const route = data.features[0].geometry.coordinates;
          const routeCoordinate = route[0].map((coordinate) => ({
            latitude: coordinate[1],
            longitude: coordinate[0],
          }));
          setRouteCoordinates(routeCoordinate);
          setDirectionsFetched(true);
  
          // Store direction data in state
          setDirectionData({ routeCoordinates: routeCoordinate });
  
          // Update Firestore with direction data based on user ID
          const db = getFirestore();
          const user = getAuth().currentUser;
          console.log('Current User UID:', user ? user.uid : 'Not logged in');
          if (user || user.uid === emergency.policeAssignedID) {
            try {
              const emergenciesRef = collection(db, 'Emergencies');
  
              // Query for the document with a specific transactionSosId
              const querySnapshot = await getDocs(
                query(emergenciesRef, where('transactionSosId', '==', emergency.transactionSosId))
              );
  
              if (!querySnapshot.empty) {
                // Document exists, update it
                const emergencyDocRef = querySnapshot.docs[0].ref;
                await updateDoc(emergencyDocRef, { routeCoordinates: routeCoordinate });
                console.log('Direction data updated in Firestore');
                savePoliceLocationToFirestore();
              } else {
                console.log('Emergency document does not exist.');
              }
            } catch (error) {
              console.error('Error updating direction data:', error);
            }
          } else {
            console.log('User is not authorized to update the direction data.');
          }
        } else {
          console.log('No route found.');
        }
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };
  return (
    <View style={{ flex: 1 }}>
    {directionsFetched ? (
      <View style={{ flex: 1 }}>
      <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        // Set the initial region for the new MapView here
        latitude: (routeCoordinates[0] && routeCoordinates[0].latitude) || 0,
        longitude: (routeCoordinates[0] && routeCoordinates[0].longitude) || 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* Render the Polyline */}
      {routeCoordinates && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="blue"
          strokeWidth={4}
        />
      )}
  
      {/* Render a marker for policeLocation */}
      {policeLocation && (
        <Marker
          coordinate={policeLocation}
          title="Police"
        />
      )}
  
      {/* Render a custom marker for citizenLocation (or sosLocation) */}
      {sosLocation && (
        <CustomMarker
          coordinate={sosLocation}
          zoomLevel={zoomLevel} // If needed, adjust the zoom level
        />
      )}
      {sosLocation && (
        <Circle
          center={sosLocation}
          radius={500}
          fillColor="rgba(0, 128, 255, 0.2)"
          strokeColor="rgba(0, 128, 255, 0.5)"
        />
      )}
  
    </MapView>

  </View>
    ) : (
      
      // Render the original MapView while directions are not fetched
      <MapView
    ref={mapRef}
    style={styles.map}
    initialRegion={{
      latitude: userSosLocation ? userSosLocation.latitude : 9.8500,
      longitude: userSosLocation ? userSosLocation.longitude : 124.1430,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }}
    onRegionChange={(region) => {
      const calculatedZoomLevel = 1 / region.latitudeDelta;
      setZoomLevel(calculatedZoomLevel);
    }}
  >
    {policeLocation && (
      <Marker
        coordinate={policeLocation}
        title="Police"
        draggable
        onDragEnd={handlePoliceMarkerDragEnd}
      />
    )}
    {sosLocation && (
      <Circle
        center={sosLocation}
        radius={500}
        fillColor="rgba(0, 128, 255, 0.2)"
        strokeColor="rgba(0, 128, 255, 0.5)"
      />
    )}
    {sosLocation && (
      <CustomMarker
        coordinate={sosLocation}
        zoomLevel={zoomLevel}
      />
    )}
    
    {routeCoordinates && (
      <Polyline
        coordinates={routeCoordinates}
        strokeColor="blue"
        strokeWidth={4}
      />
    )}
  </MapView>
    )}
    {!directionsFetched ? (
      <Button
        title="Submit"
        onPress={async () => {
          console.log('Submit button clicked.');
          setIsSubmitPressed(true);
          await savePoliceLocationToFirestore(); 
          fetchDirectionsGeoapify();
        }}
      />
    ) : (
      <View style={styles.directionsContainer}>
        <Text style={styles.helpText}>Help is on the way</Text>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Enter police feedback"
          onChangeText={(text) => setPoliceFeedback(text)}
          value={policeFeedback}
        />
        <TouchableOpacity onPress={handleSendFeedback}>
          <Text>Send Feedback</Text>
        </TouchableOpacity>
        <View style={styles.directionsButtonsContainer}>
          <View style={styles.directionsButton}>
            <Button title="Complete" onPress={handleComplete} color="green" />
          </View>
          <View style={styles.directionsButton}>
            <Button title="Cancel" onPress={handleCancel} color="red" />
          </View>
        </View>
      </View>
    )}
  </View>
);
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  directionsContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align the content at the top
    height: 50,
  },
  directionsButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  directionsButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  helpText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  feedbackInputContainer: {
    alignItems: 'flex-start', // Align input container content at the top
    margin: 16,
  },
  feedbackInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedbackInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 16,
    paddingHorizontal: 8,
    height: 100,
    marginTop: 5,
  },
});

export default PoliceAccept;