import { View, Text, StyleSheet, Pressable, Switch, DeviceEventEmitter } from 'react-native'
import { RadioButton } from 'react-native-paper';
import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getWardDistrictCity = (item) => {
    let address = item
    let WardDistrictCity = ""
    for (let i = 3; i > 0; i--) {
        if (i != 3)
            WardDistrictCity += ", "

        WardDistrictCity += address[String(i)]
    }
    console.log("WardDistrictCity ", WardDistrictCity)
    return WardDistrictCity
}

const ItemAddress = ({ item, value }) => {
    return (
        <View style={{ flex: 1 }}>

            <Text style={{ paddingBottom: 4 }}>{item["4"]}</Text>
            <Text>{getWardDistrictCity(item)}</Text>
            {value === "0" && <Text style={{
                borderColor: "#fa5230", borderWidth: 1, padding: 8,
                color: "#fa5230", alignSelf: "flex-start",
                borderRadius: 4, marginTop: 6
            }}>Mặc định</Text>}

        </View>
    )
}

const CustomRadioItem = ({ item, index, selected, handleChangeSelected }) => {
    const navigation = useNavigation()
    const handleOnpressUpdateShippingAddress = (index) => {
        // đi đến trang địa chỉ mới
        //console.log("index gui di ", index)
        if (selected == "0") {
            navigation.navigate("newAddressPage", { showRemoveBtn: true, index: index, selected:selected })
        } else {
            navigation.navigate("newAddressPage", { showRemoveBtn: true, index: index})
        }
    }

    return (
        <View style={radioBtnStyles.item}>
            <Pressable onPress={() => handleChangeSelected(index)} style={radioBtnStyles.left}>
                <RadioButton
                    value={index}
                    status={selected === index ? 'checked' : 'unchecked'}
                    onPress={() => handleChangeSelected(index)}
                    color='#fa5230'
                />
                <ItemAddress item={item} value={index} />
            </Pressable>
            <Pressable style={radioBtnStyles.right} onPress={() => handleOnpressUpdateShippingAddress(index)}>
                <Text style={{ fontSize: 16, color: "#fa5230" }}>Sửa</Text>
            </Pressable>
        </View>

    );
};

const radioBtnStyles = StyleSheet.create({
    item: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomColor: '#eee',
        borderBottomWidth: 0.5,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        gap: 8,
        flex: 1
    },
    right: {
        alignSelf: "stretch",
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center"
    }
})


const ChooseShippingAddress = ({ navigation,route }) => {
    const { currentChoose } = route.params
    const [shippingAddress, setShippingAddress] = useState(route.params?.shippingAddress || {})
    console.log(1, shippingAddress)
    console.log("curr", currentChoose)
    const [selected, setSelected] = useState(currentChoose)

    const handleChangeSelected = (value) => {
        setSelected(value)
        console.log("đổi ĐC qua ", value)
        DeviceEventEmitter.emit('event.changeUserShippingAddress', value)
        setTimeout(() => {
            navigation.goBack()
        }, 1500)
    }

    const handleAddNewAddress = () => {
        console.log("tao them 1 dia chi ")
        if (selected == "0") {
            navigation.navigate("newAddressPage", { autoDefault: (Object.keys(shippingAddress).length == 0), selected:selected }) 
        } else {
            navigation.navigate("newAddressPage", { autoDefault: (Object.keys(shippingAddress).length == 0) }) 
        }
    }

    useEffect(() => {
        const eventListener = DeviceEventEmitter.addListener('event.updateUserShippingAddress',
            (eventData) => {
                // Nhận về dữ liệu địa chỉ mới của người dùng
                setShippingAddress({ ...eventData })
            })

         const listenToHasChangeDefaultSelected = DeviceEventEmitter.addListener('event.hasChangeDefaultSelected',
            (eventData) => {
                // Trường hợp đang chọn vào mặc định thì có thằng thế chỗ mặc định thì chọn qua giá trị bị đổi
                setSelected(eventData)
                DeviceEventEmitter.emit('event.changeUserShippingAddress', eventData)

            })

        return () => {
            eventListener.remove()
        }
    }, [])

    return (
        <View>
            <View style={{ margin: 16 }}>
                <Text>Địa chỉ</Text>
            </View>
            <View style={styles.addressContainer}>
                <RadioButton.Group onValueChange={setSelected} value={selected}>
                    {
                        Object.entries(shippingAddress).map(([key, address]) => (
                            <CustomRadioItem key={key} item={address} index={key} selected={selected} handleChangeSelected={handleChangeSelected}></CustomRadioItem>
                        ))
                    }
                </RadioButton.Group>

            </View>
            <View style={styles.btnAddNewAddress}>
                <Pressable style={{flexDirection: "row", alignItems: "center",gap: 8}} onPress={handleAddNewAddress}>
                    <Icon name="add-circle-outline" size={30} color="#fa5230" />
                    <Text style={{fontSize: 16, color: "#fa5230"}}>Thêm 1 địa chỉ mới</Text>
                </Pressable>
            </View>
        </View>
    )
}


export default ChooseShippingAddress

const styles = StyleSheet.create({
    addressContainer: {
        backgroundColor: "white",
    },
    btnAddNewAddress: {
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        padding: 16
    }
})