import { View, Text, StyleSheet, Pressable, Switch } from 'react-native'
import { RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useState, useEffect, useContext, useRef } from 'react'
import { TextInput } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler';
import ModalMsg from '../../utils/modalMsg';
import { DeviceEventEmitter } from "react-native"
import { MyUserContext } from "../../../configs/MyContext";
import { MyDispatchContext } from '../../../configs/MyContext';
import { authApis, endpoints } from '../../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomRadioItem = ({ label, value, selected, onPress }) => {
  return (
    <Pressable onPress={() => onPress(value)} style={styles.item}>
      <RadioButton
        value={value}
        status={selected === value ? 'checked' : 'unchecked'}
        onPress={() => onPress(value)}
      />
      <Text>{label}</Text>
    </Pressable>
  );
};

const radioBtnStyles = StyleSheet.create({
    item: {
        flexDirection: "row"
    }
})


const ChooseShippingAddress = ({route}) => {
    const {shippingAddress, currentChoose} = route.params
    const [selected, setSelected] = useState(1)

    const handleChangeSelected = (value) => {
        setSelected(value)
    }

    return (
        <View>
            <View>
                <Text>Địa chỉ</Text>
            </View>
            <View style={styles.addressContainer}>
                <CustomRadioItem label={"Heh"} value={1} selected={selected} onPress={handleChangeSelected}></CustomRadioItem>
            </View>
        </View>
    )
}


export default ChooseShippingAddress

const styles = StyleSheet.create({

})