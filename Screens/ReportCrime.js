import {Alert, ScrollView, View, Text, TextInput,SafeAreaView,TouchableOpacity,Keyboard,TouchableWithoutFeedback, Modal } from 'react-native'
import React  from 'react'
import { db,authentication } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import firestore  from '@react-native-firebase/firestore';
import { collection, doc,setDoc,addDoc, getFirestore, onSnapshot} from "firebase/firestore"; 
import DatePicker from 'react-native-modern-datepicker';
import { MaterialIcons } from '@expo/vector-icons'; 
import { getToday,getFormatedDate } from 'react-native-modern-datepicker';
import MapView from 'react-native-maps';
import { useNavigation } from '@react-navigation/core';
import { getAuth, signOut, onAuthStateChanged  } from '@firebase/auth';
const auth = getAuth();
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});
const ReportCrime =()=>{
  const [userData, setUserData] = useState(null);
  const [name,setName] =useState('')
  const [message,setMessage] =useState('')
  const [wanted,setWanted] =useState('')
  const [complainee,setComplainee] =useState('')
  const [nameError, setNameError]= useState('');
  const [detailsError, setDetailsError]= useState('');
  const [date,setDate]=useState('12/12/2023');
  const [selectedDate, setSelectedDate] = useState('');
  const [open, setOpen]=useState(false);
  const today = new Date();
  const navigation=useNavigation();
  const startDate = getFormatedDate(today.setDate(today.getDate()), 'YYYY/MM/DD')
  useEffect(() => {
    const currentUser = getAuth().currentUser;
    const db = getFirestore();
    const userRef = doc(db, 'User', currentUser.uid);

    const unsubscribe = onSnapshot(userRef, (doc) => {
      const data = doc.data();
      setUserData(data);
    });

    return unsubscribe;
  }, []);

  if (!userData) {
    return <Text>Loading...</Text>;
  }
  
  
  
  
  
  function handleOnPress (){
    setOpen(!open);
  }
  function handleChange (propDate){
    setDate(propDate);
  }
const pressSubmit = async ()=>{
  if(name.length===0){
    setNameError('Name is required');
  }
  else if(message.length===0){
    setDetailsError('Cannot be empty');
  }
  else if(message.length<10){
    setDetailsError('Cannot be less than to 10 characters');
  }
  try{
  const db =getFirestore();
  const userDoc =doc(collection(db,'Reports'));
    await setDoc(userDoc,{
    userId: currentUser.uid,
    name,
    message,
    date,
    wanted,
    complainee,
    });
    Alert.alert('Verification Successful!', 'This user has been verified.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
        style: 'cancel'
      }
    ], { textAlign: 'center' });
  }catch(error){
    console.error('Error adding user:',error);
  }
};
  return (
    <ScrollView>
    <SafeAreaView className="flex-1  bg-white">
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View className="mt-16">
    <Text className="font-bold text-xl mx-auto">File Report Form</Text>
    <Text className="mx-auto italic mb-4 w-44 text-center">To report an incident, Please provide the following information</Text>
    <Text className="ml-5 mb-2 text-sm">Name</Text>
    <TextInput
    className="border-2 w-11/12 px-4 py-3 rounded-lg bg-gray-100 mx-auto mb-2"
    placeholder='Enter your name'
    value={name}
    onChangeText={(name)=>{setName(name)}}
     />
    <Text className="ml-5 mb-2 text-sm">Description</Text>
    <TextInput
    className="border-2 w-11/12 px-4 rounded-lg mb-2 bg-gray-100 mx-auto h-32 text-start"
    placeholder='Details of the incident'
    editable
    multiline
    numberOfLines={6}
    value={message}
    onChangeText={(message)=>{setMessage(message)}}
     />
     <Text className="ml-5 mb-2 text-sm">Was the suspect wanted/have or had any charges against him/her</Text>
     <TextInput
    className="border-2 w-11/12 px-4 py-3 rounded-lg bg-gray-100 mx-auto mb-2"
    placeholder='Yes or No, I dont know'
    value={wanted}
    onChangeText={(wanted)=>{setWanted(wanted)}}
     />
    <Text className="ml-5 mb-2 text-sm">Complainee</Text>
    <TextInput
    className="border-2 w-11/12 px-4 py-3 rounded-lg bg-gray-100 mx-auto mb-2"
    placeholder='Enter the name that is being complained'
    value={complainee}
    onChangeText={(complainee)=>{setComplainee(complainee)}}
    />
    <Text className="ml-5 mb-2 text-sm">Date of the incident</Text>
    <TouchableOpacity className="flex-row justify-center  items-start border-2 w-11/12 px-4 py-3 rounded-lg bg-gray-100 mx-auto mb-2"
    onPress={handleOnPress}>
    <MaterialIcons  name="date-range" size={24} color="black" />
    <Text className="text-center mx-auto text-xl justify-center">{date}</Text>
    </TouchableOpacity>
    <Modal
    animationType='slide'
    transparent={true}
    visible={open}
    >
    <View className="flex w-4/5 mx-auto mt-10 bg-white">
    <DatePicker
    mode='calendar'
    minimumDate={startDate}
    selected={selectedDate}
    onDateChange={handleChange}
    />
    <TouchableOpacity
    onPress={handleOnPress}>
    <Text className="mx-auto font-bold text-xl">Close</Text>
    </TouchableOpacity>
   
    </View>
    </Modal>
    <View>
    <Text>Address</Text>
   
     </View>
    <TouchableOpacity
    className="w-11/12 mt-4 px-4 py-3 rounded-lg bg-red-700 items-center mx-auto mb-4"
    onPress={pressSubmit}
  >
    <Text className="text-white text-lg font-medium mx-auto">Submit</Text>
  </TouchableOpacity>

    </View>
    </TouchableWithoutFeedback>
    </SafeAreaView>
    </ScrollView>
  )
};
export default ReportCrime;