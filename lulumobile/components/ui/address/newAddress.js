import { View, Text, StyleSheet, Pressable, Switch } from 'react-native'
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

function swapKeys(obj, key1, key2) {
    [obj[key1], obj[key2]] = [obj[key2], obj[key1]];
    return obj;
}

const NewAddress = ({ navigation, route }) => {

    const autoDefault = useRef(route.params?.autoDefault ?? false).current;
    const [streetText, setStreetText] = useState('')
    const [isDefault, setIsDefault] = useState(autoDefault)
    const [address, setAddress] = useState({})
    const [openModalMsg, setOpenModalMsg] = useState(false)
    const user = useContext(MyUserContext)
    const dispatch = useContext(MyDispatchContext);

    const setAddressWithValue = (index, value) => {
        setAddress(address => ({ ...address, [index]: value }))
    }

    const handleEventSelectedCityDistrictWard = (eventData) => {
        setAddress({ ...address, ...eventData })
        console.log("merge", { ...address, ...eventData })
    }

    const handleOntextChange = (newText) => {
        setStreetText(newText)
        setAddressWithValue("4", newText)
    }

    const handleOnvalueChange = () => {
        if (autoDefault) {
            // Mac dinh 
            setOpenModalMsg(true)
        }
        else {
            setIsDefault(!isDefault)
        }
    }

    const handleGotoCreatAddressPage = () => {
        navigation.navigate("createAddressPage")
    }


    const handleOnpressUpdateAddressUser = async () => {
        try {
            let currentUserAddress = user.address
            let newKey = Object.keys(user.address).length
            const newAddress = {
                [newKey]: address
            }

            let newUserAddress = { ...currentUserAddress, ...newAddress }
            // set địa chỉ vừa tạo thành địa chỉ mặc định
            if (isDefault) {
                newUserAddress = swapKeys(newUserAddress, "0", newKey.toString())
                console.log("new address after swap key ", newUserAddress)
            }
            // update địa chỉ cho user
            const dataToPatch = {
                address: newUserAddress
            }
            console.log("data to patch ", dataToPatch)
            const token = await AsyncStorage.getItem("token")
            let res = await authApis(token).patch(endpoints["updateUserInfo"], dataToPatch)
            console.log("res from new address ", res.data)
            let userInfo = res.data;
            // update user info

            dispatch({
                "type": "updateAddress",
                "payload": userInfo
            })

            DeviceEventEmitter.emit("event.updateUserShippingAddress", newUserAddress)
            navigation.goBack();
            
        }
        catch (err) {
            console.log("Fail to update user data", err)
        }
    }

    const validateAddress = () => {
        const indexs = ["1", "2", "3", "4"]
        //console.log(Object.keys(address).every(index => indexs.includes(index)))
        //console.log("validated ",address)
        return indexs.every(index => index in address && address[index] != "") && Object.keys(address).length > 0
    }

    useEffect(() => {
        // Add the event listener communicate between 2 screen
        const eventListener = DeviceEventEmitter.addListener(
            "event.selectedCityDistrictWard",
            (eventData) => {
                // Handle the event data
                handleEventSelectedCityDistrictWard(eventData);
            }
        );

        return () => {
            eventListener.remove(); // Clean up the listener
        };
    }, [address]);

    return (
        <View style={styles.container}>
            <ScrollView style={{ flex: 1, margin: 8, }}>
                <View style={styles.addressContainer}>
                    <Text style={{ fontSize: 16 }}>Địa chỉ</Text>
                    <Pressable style={styles.cityContainer} onPress={handleGotoCreatAddressPage}>
                        <Text style={styles.text}>Tỉnh/Thành phố, Quận/Huyện, Phường/Xã</Text>
                        <Icon name="chevron-right" size={24} color="#aaa" />

                    </Pressable>
                    <View style={styles.cityDataContainer}>
                        {
                            Object.entries(address).map(([key, value]) => {
                                if (key != "4") {
                                    return (<Text key={key} style={{ marginBottom: 5 }}>{value}</Text>)
                                }
                            })
                        }
                    </View>
                    <View style={{ marginVertical: 10 }}>
                        <TextInput
                            label="Tên đường, Tòa nhà, Số nhà."
                            value={streetText}
                            onChangeText={handleOntextChange}
                            mode="flat" // or 'flat'
                            cursorColor="#5d6d75"
                            activeOutlineColor="#151515"
                            activeUnderlineColor="#151515"
                            underlineStyle={{ borderBottomWidth: 0.5 }}
                            style={styles.text}
                        />
                    </View>
                </View>
                <View style={styles.secondContainer}>
                    <Text>Đặt làm địa chỉ mặc định</Text>
                    <Switch
                        value={isDefault}
                        onValueChange={handleOnvalueChange}
                        trackColor={{ false: '#ccc', true: '#90D7B8' }} // green track color when on
                        thumbColor="#fff" // white circle
                        ios_backgroundColor="#ccc"
                    />
                </View>
            </ScrollView>
            <View style={styles.bottomContainer}>
                <Pressable onPress={handleOnpressUpdateAddressUser} style={[styles.btnSave, !validateAddress() && { backgroundColor: "rgba(0,0,0,0.5)", opacity: 0.4 }]} disabled={!validateAddress()}>
                    <Text style={{ fontSize: 16, color: "#fff", textAlign: "center" }}>Hoàn thành</Text>
                </Pressable>
            </View>
            <ModalMsg visible={openModalMsg} message={"Địa chỉ đầu tiên sẽ được đặt mặc định"}
                handleCloseModalMsg={() => setOpenModalMsg(false)}
                handleOnpressConfirm={() => { setOpenModalMsg(false) }}
                showBtnNo={false} />
        </View>
    )
}

export default NewAddress

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    addressContainer: {
        paddingHorizontal: 12,
        paddingVertical: 14,
        backgroundColor: "white",
        borderRadius: 8,
    },
    cityContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 10
    },
    cityDataContainer: {
        borderBottomColor: "#rgba(0,0,0,0.3)",
        borderBottomWidth: 0.5,

    },
    text: {
        backgroundColor: "white",
        fontSize: 14,
        fontColor: "#ccc"
    },
    secondContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: "white",
    },
    bottomContainer: {
        marginTop: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: 8,
        paddingBottom: 45,

    },
    btnSave: {
        backgroundColor: "#fa5230",
        width: "90%",
        padding: 14,
        borderRadius: 6
    }
})


// Code tiếp xử lý thêm địa chỉ cho nguwoif dùng khi người dùng muốn chuyển qua 1 địa chỉ khác