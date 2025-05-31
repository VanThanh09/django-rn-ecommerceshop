import { View, Text, StyleSheet, Pressable, TouchableOpacity, Image, TextInput } from "react-native"
import { useState, useContext, useLayoutEffect, useRef, useEffect } from "react";
import CheckBox from "react-native-check-box";
import Icon from 'react-native-vector-icons/MaterialIcons';

const CartProduct = () => {
    const [checked, setChecked] = useState(false);

    return (
        <View style={cartProdutStyles.cartProductContainer}>
            <View style={{ justifyContent: "center", alignItems: "center" }}>
                <CheckBox
                    isChecked={checked}
                    onClick={() => setChecked(!checked)}
                    checkedCheckBoxColor="#fa5230"
                    uncheckedCheckBoxColor="#ccc"
                    style={styles.checkbox}
                />
            </View>
            <View style={cartProdutStyles.imageContainer}>
                <Pressable onPress={() => console.log("go to shop page")}>
                    <Image source={{ uri: "https://res.cloudinary.com/drzc4fmxb/image/upload/v1746635818/azjjnq3htn09td8sz0iu.webp" }} style={cartProdutStyles.variantImage} />
                </Pressable>
            </View>
            <View style={{ justifyContent: "space-between", borderColor: "black", borderWidth: 1, flex: 1 }}>
                <View>
                    <Pressable onPress={() => console.log("go to shop page")}>
                        <Text style={{ fontSize: 12 }}>Giày bóng đá VIC 6 TF (có khâu đế)</Text>
                    </Pressable>
                    <Pressable style={[cartProdutStyles.btnChangeVariant, { marginTop: 4 }]}>
                        <Text style={{ fontSize: 12 }}>Xanh biển, 40</Text>
                        <Icon name="arrow-drop-down" size={16} color="#555" />
                    </Pressable>
                </View>
                <View style={cartProdutStyles.priceAndQuantityBox}>
                    <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 700 }}>
                        <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                        {"430000".toLocaleString("vi-VN")}
                    </Text>

                    <View style={[cartProdutStyles.quantityBox]}>
                        <TouchableOpacity
                            style={[cartProdutStyles.decreaseBtn]}
                            onPress={() => { console.log("decrease") }}
                        >
                            <Text>-</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={cartProdutStyles.textInput}
                            value={"1"}
                            keyboardType="numeric"
                            onChangeText={() => console.log("text input")}
                            maxLength={10}
                        />
                        <TouchableOpacity
                            style={[cartProdutStyles.increaseBtn]}
                            onPress={() => console.log("increase")}
                        >
                            <Text>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </View>
    )
}

const cartProdutStyles = StyleSheet.create({
    cartProductContainer: {
        flexDirection: "row",
        marginVertical: 10,
    },
    variantImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    imageContainer: {
        marginRight: 10
    },
    btnChangeVariant: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 6,
        borderRadius: 5,
        flexWrap: 'nowrap',
        alignSelf: "flex-start" // ensure that it just have it just take space of it own content
    },
    priceAndQuantityBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end"
    },
    quantityBox: {
        flexDirection: "row",
        justifyContent: "center",
        borderColor: "rgba(0,0,0,0.3)",
        borderWidth: 0.5,
        borderRadius: 2
    },
    decreaseBtn: {
        paddingHorizontal: 6,
        alignSelf: "center",
        borderRightColor: "rgba(0,0,0,0.3)",
        borderRightWidth: 1
    },
    increaseBtn: {
        paddingHorizontal: 6,
        alignSelf: "center",
        borderLeftColor: "rgba(0,0,0,0.3)",
        borderLeftWidth: 1
    },
    textInput: {
        paddingHorizontal: 6,
        fontSize: 12,
        textAlign: 'center',
        color: "#fa5230"
    },
})

const CartStore = () => {
    const [checked, setChecked] = useState(false);
    return (
        <View style={styles.cartStoreContainer}>
            <View style={styles.headerCartStoreContainer}>
                <View style={styles.leftHeader}>
                    <CheckBox
                        isChecked={checked}
                        onClick={() => setChecked(!checked)}
                        checkedCheckBoxColor="#fa5230"
                        uncheckedCheckBoxColor="#ccc"
                        style={styles.checkbox}
                    />
                </View>
                <View style={{ alignItems: "center", paddingBottom: 5, flexDirection: "row", flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => console.log("go to shop")}>
                            <Text style={styles.headerText}>Phủi HT Store </Text>
                        </TouchableOpacity>
                        <Icon name="chevron-right" size={20} color="#999" />
                    </View>
                    <Pressable style={{ marginLeft: "auto" }}>
                        <Text>Sửa</Text>
                    </Pressable>
                </View>
            </View>
            <CartProduct></CartProduct>
        </View>
    )
}

export default CartStore
const styles = StyleSheet.create({
    cartStoreContainer: {
        margin: 8,
        backgroundColor: "white",
        borderRadius: 5,
        padding: 8
    },
    checkbox: {
        width: 30,
        height: 30,
        marginRight: 0,
    },
    headerCartStoreContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    editBtn: {
        marginLeft: "auto"
    }
})


// To do next cart store, indiviual cart product 