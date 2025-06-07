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
    const showRemoveBtn = useRef(route.params?.showRemoveBtn ?? false).current;
    const { index, selected } = route.params || {};

    const [streetText, setStreetText] = useState('')
    const [isDefault, setIsDefault] = useState(autoDefault || index == "0")
    const [address, setAddress] = useState({})
    const [openModalMsg, setOpenModalMsg] = useState(false)
    const msg = useRef('')
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
        if (autoDefault || index == "0") {
            // Mac dinh 
            setOpenModalMsg(true)
            msg.current = index == "0" ? "Để thay đổi mặc định địa chỉ này vui lòng chọn địa chỉ khác làm mặc định" : 
            "Địa chỉ đầu tiên sẽ được đặt mặc định"
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
            // LOGIC CREATE/UPDATE ADDRESS DỰA VÀO CÓ TRUYỀN INDEX xuống không (instance)
            let currentUserAddress = user.address
            let newKey = index
            // có index => update

            newKey = newKey === undefined ? Object.keys(user.address).length : index
            const newAddress = {
                [newKey]: address
            }
            // merge old address and new address
            let newUserAddress = { ...currentUserAddress, ...newAddress }

            // set địa chỉ vừa tạo thành địa chỉ mặc định
            if (isDefault) {
                newUserAddress = swapKeys(newUserAddress, "0", newKey.toString())
                if (selected) {
                    DeviceEventEmitter.emit('event.hasChangeDefaultSelected', newKey.toString())
                }
                console.log("new address after swap key ", newUserAddress)
            }
            // update địa chỉ cho user
            const dataToPatch = {
                address: newUserAddress
            }
            console.log("data to patch from update", dataToPatch)
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

    const handleOnpressRemoveShippingAddress = async () => {
        try {
            // LOGIC REMOVE ADDRESS
            let currentUserAddress = user.address
            // destructuring giá trị mới sau khi bỏ sẽ lưu vào newUserAddress
            if (index != "0") {
                const { [index]: _, ...newUserAddress } = currentUserAddress

                // update địa chỉ cho user
                const dataToPatch = {
                    address: newUserAddress
                }
                console.log("data to patch from remove address ", dataToPatch)
                const token = await AsyncStorage.getItem("token")
                let res = await authApis(token).patch(endpoints["updateUserInfo"], dataToPatch)
                console.log("res from new address remove dia chi", res.data)
                let userInfo = res.data;
                // update user info

                dispatch({
                    "type": "updateAddress",
                    "payload": userInfo
                })

                DeviceEventEmitter.emit("event.updateUserShippingAddress", newUserAddress)
                navigation.goBack();
            } else {
                setOpenModalMsg(true)
                msg.current = "Bạn không thể xóa địa chỉ mặc định"
            }
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

    useEffect(() => {
        if (showRemoveBtn) {
            // set up data sẵn có với cái địa chỉ được chọn
            console.log("index nhan duoc ", index)
            setAddress({ ...user.address[index] })
            // Lấy ra thông tin đường
            setStreetText(user.address[index]["4"])
        }
    }, [showRemoveBtn, route])

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
                        trackColor={{ false: '#ccc', true: '#fa5230' }} // green track color when on
                        thumbColor="#fff" // white circle
                        ios_backgroundColor="#ccc"
                    />
                </View>
            </ScrollView>
            <View style={styles.bottomContainer}>
                {
                    showRemoveBtn && (<Pressable onPress={handleOnpressRemoveShippingAddress} style={[styles.btnRemove, !validateAddress() && { backgroundColor: "rgba(0,0,0,0.5)", opacity: 0.4 }]} disabled={!validateAddress()}>
                        <Text style={{ fontSize: 16, color: "#fa5230", textAlign: "center" }}>Xóa địa chỉ</Text>
                    </Pressable>)
                }
                <Pressable onPress={handleOnpressUpdateAddressUser} style={[styles.btnSave, !validateAddress() && { backgroundColor: "rgba(0,0,0,0.5)", opacity: 0.4 }]} disabled={!validateAddress()}>
                    <Text style={{ fontSize: 16, color: "#fff", textAlign: "center" }}>Hoàn thành</Text>
                </Pressable>
            </View>
            <ModalMsg visible={openModalMsg} message={msg.current}
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
        flexDirection: "row",
        //justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: 8,
        paddingBottom: 45,
        gap: 10
    },
    btnSave: {
        backgroundColor: "#fa5230",
        flex: 1,
        padding: 14,
        borderRadius: 6
    },
    btnRemove: {
        borderColor: "#fa5230",
        borderWidth: 1,
        flex: 1,
        padding: 14,
        borderRadius: 6
    }
})


// Code tiếp xử lý thêm địa chỉ cho nguwoif dùng khi người dùng muốn chuyển qua 1 địa chỉ khác