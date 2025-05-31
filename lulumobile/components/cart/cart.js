import { View, Text, StyleSheet, Pressable, TouchableWithoutFeedback, Keyboard } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconButton } from "react-native-paper";
import { useState, useContext, useLayoutEffect, useRef, useEffect } from "react";
import { CartContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import CartStore from "./cartStore";

export const HeaderCartLeft = ({ navigation, routeParams }) => {
    const handleGoBack = () => {
        // Lấy prevScreen từ route param được truyền qua Cart page
        const { prevScreen } = routeParams

        if (prevScreen) {
            if (prevScreen.nestedScreen) {
                navigation.navigate(prevScreen.nestedScreen, {
                    screen: prevScreen.previousRoute,
                    params: {
                        ...prevScreen.prevRouteParams
                    }
                })
            }
            else {
                navigation.navigate(prevScreen.previousRoute, { ...prevScreen.prevRouteParams })
            }
        }
        else {
            navigation.navigate("index")
        }
    }

    return (
        <View style={{
            alignItems: 'flex-start', 
            width: 95
        }}>
            <Pressable onPress={handleGoBack}>
                <Icon name="arrow-back" size={25} color="#fa5230" />
            </Pressable>
        </View>
    )
}

export const HeaderCartTitile = ({ totalQuantity }) => {
    return (
        <View style={{
            flex:1,
            justifyContent: "center",
            alignItems: "center"
        }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>
                Giỏ hàng
                <Text style={{ fontWeight: "500", fontSize: 14 }}>({totalQuantity})</Text>
            </Text>
        </View>
    )
}

export const HeaderCartRight = ({ onpressFixBtn, fixBtnPressed }) => {
    return (
        <View style={headerCartStyles.right}>
            <Pressable onPress={onpressFixBtn}>
                {
                    fixBtnPressed ? <Text>Xong</Text> : <Text>Sửa</Text>
                }
            </Pressable>
            <IconButton
                icon="chat-processing-outline"
                size={25}
                onPress={() => console.log('Pressed')}
                iconColor="#fa5230"
                style={{ padding: 0, margin: 0 }}
            />
        </View>
    )
}

const headerCartStyles = StyleSheet.create({
    right: {
        width: 95,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "flex-end",
        gap: 8,
        marginRight: -8,
    }
})

const Cart = ({ navigation, route }) => {
    const { cart, cartDispatch } = useContext(CartContext)
    const [loading, setLoading] = useState(false)
    const [cartProducts, setCartProducts] = useState(null)
    const [tickCarts, setTickCarts] = useState(new Set())
    const [tickAll, setTickAll] = useState(false)
    const cartProductsBasic = useRef(null)
    const [fixBtnPressed, setFixBtnPressed] = useState(false)

    // API to get cart products
    const getCartProducts = async () => {
        try {
            setLoading(true)
            const token = await AsyncStorage.getItem('token')
            let res = await authApis(token).get(endpoints['cart'])
            console.log("cart products data ", res.data)
            setCartProducts(res.data)
        }
        catch (err) {
            console.log("Fail to load cart products", err)
            throw err
        }
        finally {
            setLoading(false)
        }
    }

    const getTotalAmount = () => {
        return Array.from(tickCarts).reduce((totalAmount, cartDetailId) => {
            totalAmount += cartProductsBasic.current[cartDetailId].totalAmount
        }, 0)
    }

    const handleTickAllCart = () => {
        const newSet = new Set(Object.keys(cartProductsBasic))
        setTickCarts(newSet)
    }

    const handleOnpressFixBtn = () => {
        setFixBtnPressed(!fixBtnPressed)
    }

    const handleSetCartProducts = (newValue) => {
        setCartProducts(newValue)
    }

    const toggleTickCart = (cartDetailId) => {
        const newSet = new Set(tickCarts)
        if (newSet.has(cartDetailId)) {
            newSet.delete(cartDetailId)
        }
        else {
            newSet.add(cartDetailId)
        }

        setTickCarts(newSet)
    }

    // Thay đổi header right

    // getCartProducts
    useEffect(() => {
        try {
            getCartProducts()
        }
        catch (err) {
            console.log(err)
        }
    }, [navigation])

    // build cart basic
    useEffect(() => {
        if (cartProducts) {
            cartProductsBasic.current = cartProducts.reduce((acc, store) => {
                store.product_variants.forEach(cartDetail => {
                    if (cartDetail.active) {
                        acc[cartDetail.cart_detail] = {
                            variantId: cartDetail.product_variant.id,
                            totalAmount: cartDetail.total_price
                        }
                    }
                })
                return acc;
            }, {})

            console.log("cart basic", cartProductsBasic.current)
        }
    }, [cartProducts])

    useLayoutEffect(() => {
        if (cart) {
            navigation.setOptions({
                headerRight: () => (
                    <HeaderCartRight onpressFixBtn={handleOnpressFixBtn} fixBtnPressed={fixBtnPressed} />
                ),
                headerTitle: () => <HeaderCartTitile totalQuantity={cart.total_quantity} />,
                headerLeft: () => (<HeaderCartLeft navigation={navigation} routeParams={route.params} />),
            });
        }
    }, [navigation, fixBtnPressed, route.params, cart])

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
            <CartStore></CartStore>
        </View>
        </TouchableWithoutFeedback>
    )
}

export default Cart

const styles = StyleSheet.create({

})

