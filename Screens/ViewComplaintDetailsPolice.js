import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { ScrollView } from 'react-native-gesture-handler';
import { getFirestore, deleteDoc, doc, collection, query, where, getDocs, updateDoc,getDoc,setDoc,addDoc } from '@firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig, { db } from '../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const mapCustomStyle = [ { "elementType": "geometry", "stylers": [ { "color": "#242f3e" } ] }, { "elementType": "labels.text.fill", "stylers": [ { "color": "#746855" } ] }, { "elementType": "labels.text.stroke", "stylers": [ { "color": "#242f3e" } ] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "color": "#263c3f" } ] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [ { "color": "#6b9a76" } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "color": "#38414e" } ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#212a37" } ] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "color": "#9ca5b3" } ] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [ { "color": "#746855" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [ { "color": "#1f2835" } ] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [ { "color": "#f3d19c" } ] }, { "featureType": "transit", "elementType": "geometry", "stylers": [ { "color": "#2f3948" } ] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [ { "color": "#d59563" } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [ { "color": "#17263c" } ] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [ { "color": "#515c6d" } ] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [ { "color": "#17263c" } ] } ]

const ViewComplaintDetailsPolice = ({ route }) => {
  const { complaint } = route.params;
  const complaintId = complaint.id;
  const navigation = useNavigation();
  const [feedback, setFeedback] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapLayout, setMapLayout] = useState(false);
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [complaintColor, setComplaintColor] = useState('black')
  useEffect(() => {
    if (newStatus === 'Pending') {
      setComplaintColor('orange');
    } else if (newStatus === 'Ongoing') {
      setComplaintColor('#08BAE1');
    } else if (newStatus === 'Completed') {
      setComplaintColor('green');
    } else if (newStatus === 'Cancelled') {
      setComplaintColor('red');
    } else {
      setComplaintColor('black');
    }
  }, [newStatus, complaint.status]);
  const handleMapLayout = () => {
    setMapLayout(true);
  };
  const onMapReady = () => {
    setMapReady(true);
  };

  useEffect(() => {
    if (mapLayout && mapRef.current) {
      mapRef.current.fitToElements(true);
    }
  }, [mapLayout]);

  useEffect(() => {
  }, []);
  const handleSaveFeedback = async () => {
    try {
      setLoading(true); // Show loading indicator while sending feedback

      const firestore = getFirestore();
      const querySnapshot = await getDocs(
        collection(firestore, 'Complaints'),
        where('transactionCompId', '==', complaint.transactionCompId)
      );

      if (!querySnapshot.empty) {
        const complaintDoc = querySnapshot.docs[0];
        const complaintRef = doc(firestore, 'Complaints', complaintDoc.id);

        await updateDoc(complaintRef, { PoliceFeedback: feedback }, { merge: true });

        console.log('Complaint feedback successfully sent');


        complaint.PoliceFeedback = feedback;
        Alert.alert('Feedback Sent', 'Your feedback has been submitted successfully.');
        setFeedback('');
      } else {
        console.log('Document with transactionRepId does not exist');
      }
    } catch (error) {
      console.log('Error updating complaint status:', error);

     
      Alert.alert('Error', 'An error occurred while sending feedback.');
    } finally {
      setLoading(false); 
    }
  };
  const changeStatus = async () => {
    try {
      const firestore = getFirestore();
  
      const querySnapshot = await getDocs(
        collection(firestore, 'Complaints'),
        where('transactionCompId', '==', complaint.transactionCompId)
      );
  
      if (!querySnapshot.empty) {
        const complaintDoc = querySnapshot.docs[0];
        const complaintRef = doc(firestore, 'Complaints', complaintDoc.id);
  
        await updateDoc(complaintRef, { status: newStatus });
  
        console.log('Complaint status updated successfully');
        Alert.alert('Successful', 'Status Changed');
        setModalVisible(false);
        setNewStatus(newStatus);

        complaint.status = newStatus;
      } else {
        console.log('Document with transactionCompId does not exist');
        Alert.alert('Failed', 'Document does not exist');
      }
    } catch (error) {
      console.log('Error updating complaint status:', error);
      Alert.alert('error', 'Error updating complaint status');
    }
  };
  return (
    <ScrollView style={styles.flexContainer}>
    <View style={styles.flexContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.boldText}>Complaint filed By: </Text>
        <Text style={styles.normalText}>{complaint.name}</Text>
        <Text style={styles.boldText}>Date filed : </Text>
        <Text style={styles.normalText}>{complaint.date}</Text>
        <Text style={styles.boldText}>Complainee: </Text>
        <Text style={styles.normalText}>{complaint.complainee}</Text>
        <Text style={styles.boldText}>Wanted or not? </Text>
        <Text style={styles.normalText}>{complaint.wanted}</Text>
        <Text style={styles.boldText}>Details: </Text>
        <Text style={styles.normalText}>{complaint.message}</Text>
        <Text style={styles.boldText}>Complaint Transaction ID: </Text>
        <Text style={styles.largeText}>#{complaint.transactionCompId}</Text>
        <Text style={styles.boldText}>Status:</Text>
        <View
        style={[
          styles.statusContainer,
          { backgroundColor: complaintColor }, 
        ]}
      >
        <Text style={styles.statusText}>{newStatus}</Text>
        </View>

        <View>
          <View style={styles.separator} />
          <Text style={styles.largeText}>Address Information</Text>
          <View style={styles.separator} />
        </View>
        <Text style={styles.normalText}>{complaint.barangay}, {complaint.street}</Text>
      </View>
      {complaint.location && (
        <MapView
        customMapStyle= {mapCustomStyle}
          style={{ flex:1,  height: Dimensions.get('window').height * 0.3,
          marginLeft: 20,
          marginRight: 20,
          marginTop: 20,}}
          initialRegion={{
            latitude: complaint.location.latitude,
            longitude: complaint.location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker coordinate={complaint.location} title={complaint.name} />
          {/* Add more Marker components for additional markers */}
        </MapView>
      )}
      <View>
          <View style={styles.separator} />
          <Text style={styles.largeText}>Police Feedbacks</Text>
          <View style={styles.separator} />
          {complaint.PoliceFeedback ? (
            <Text>Your Feedback: {complaint.PoliceFeedback}</Text>
          ) : (
            <Text>No Police Feedback available</Text>
          )}
          <View style={styles.separator} />
    
          {/* Add TextInput for feedback */}
          <TextInput
            style={styles.textInput}
            placeholder="Enter your feed back"
            value={feedback}
            onChangeText={setFeedback}
          />
    
      
          <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveFeedback}
          disabled={loading} 
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" /> // Show loading indicator when loading is true
          ) : (
            <Text style={styles.saveButtonText}>Save Feedback</Text>
          )}
        </TouchableOpacity>
        </View>
        </View>
      <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(true)}>
      <Text style={styles.modalButtonText}>Change Status</Text>
    </TouchableOpacity>
    <Modal visible={modalVisible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
          <Ionicons name="ios-close-outline" size={24} color="black" />
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => setNewStatus('Pending')}>
          <Text
            style={[
              styles.statusOption,
              newStatus === 'Pending' && styles.selectedStatusOption,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => setNewStatus('Ongoing')}>
          <Text
            style={[
              styles.statusOption,
              newStatus === 'Ongoing' && styles.selectedStatusOption,
            ]}
          >
            Ongoing
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => setNewStatus('Completed')}>
          <Text
            style={[
              styles.statusOption,
              newStatus === 'Completed' && styles.selectedStatusOption,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => setNewStatus('Cancelled')}>
          <Text
            style={[
              styles.statusOption,
              newStatus === 'Cancelled' && styles.selectedStatusOption,
            ]}
          >
            Cancel
          </Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={changeStatus} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
  
    </ScrollView>
     );
};
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    margin: 5,
  },
  // Define other styles as needed
  boldText: {
    fontWeight: 'bold',
  },
  normalText: {
    fontWeight: 'normal',
  },
  separator: {
    borderBottomColor: 'black',
    borderBottomWidth: 0.5,
    marginTop: 10,
    marginBottom: 5,
    color: '#808080',
  },
   textInput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    height: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 10,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 10,
    width: '82%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  statusContainer: {
    backgroundColor: 'black',
    padding: 2,
    borderRadius: 5,
    marginTop: 2,
    width: 90,
  },
  
  statusText: {
    color: 'white',
    justifyContent: 'center',
    textAlign: 'center',
    padding:1,
  },
  largeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statusOption: {
    fontSize: 18,
    marginVertical: 10,
  },
  selectedStatusOption: {
    backgroundColor: 'lightgray',
    borderRadius: 5,
    padding:5,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    padding: 10,
    width: '80%',
    alignSelf: 'center',
    marginTop: 25,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    padding: 10,
    width: '80%',
    alignSelf: 'center', // Center horizontally within the parent view
    marginBottom: 10,
    justifyContent: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
export default ViewComplaintDetailsPolice;