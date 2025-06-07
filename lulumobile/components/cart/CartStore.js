import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useState, useEffect } from "react";
import CheckBox from "react-native-check-box";
import Icon from 'react-native-vector-icons/MaterialIcons';
import CartProduct from "./CartProduct";

const CartStore = ({ cartStore, toggleTickCart, handleSetCartProducts, tickAllCartDetailOfAStore,
    isCheckCartStore, isCheckCartProduct, handleRemoveCartDetail, handleAddTickCart }) => {
    const [isFixButtonPressed, setIsFixButtonPressed] = useState(false)
    const [listCartDetail, setListCartDetail] = useState(handleProcessAllListCartDetail())


    // console.log(isCheckCartStore(listCartDetait))

    const handleOnpressEditBtn = () => {
        setIsFixButtonPressed(!isFixButtonPressed)
    }

    function handleProcessAllListCartDetail() {
        return cartStore.product_variants.reduce((acc, cartDetail) => {
            if (cartDetail.active) {
                //acc = [...acc, cartDetail.cart_detail]
                acc.push(String(cartDetail.cart_detail))
            }
            return acc
        }, [])
    }
    const handleTickAllToggle = () => {
        tickAllCartDetailOfAStore(listCartDetail)
    }

    // Update when cartStore change
    useEffect(() => {
        setListCartDetail(handleProcessAllListCartDetail())
    }, [cartStore])

    return (
        <View style={styles.cartStoreContainer}>
            <View style={styles.headerCartStoreContainer}>
                <View style={styles.leftHeader}>
                    <CheckBox
                        isChecked={isCheckCartStore(listCartDetail)}
                        onClick={() => { handleTickAllToggle() }}
                        checkedCheckBoxColor="#fa5230"
                        uncheckedCheckBoxColor="#ccc"
                        style={styles.checkbox}
                    />
                </View>
                <View style={{ alignItems: "center", paddingBottom: 5, flexDirection: "row", flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => console.log("go to shop")}>
                            <Text style={styles.headerText}>{cartStore.store.name}</Text>
                        </TouchableOpacity>
                        <Icon name="chevron-right" size={20} color="#999" />
                    </View>
                    <TouchableOpacity style={{ marginLeft: "auto" }} onPress={handleOnpressEditBtn}>
                        <Text>{isFixButtonPressed ? "Xong" : "Sửa"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {
                cartStore.product_variants.map(cartDetail => (<CartProduct key={cartDetail.cart_detail} isFixButtonPressed={isFixButtonPressed}
                    toggleTickCart={toggleTickCart} handleSetCartProducts={handleSetCartProducts} cartProduct={cartDetail}
                    isCheckCartProduct={isCheckCartProduct} handleRemoveCartDetail={handleRemoveCartDetail} handleAddTickCart={handleAddTickCart} />))
            }
        </View>
    )
}

export default CartStore

const styles = StyleSheet.create({
    cartStoreContainer: {
        marginHorizontal: 8,
        marginTop: 8,
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