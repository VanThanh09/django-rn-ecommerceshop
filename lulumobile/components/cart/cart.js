import { View, Text, StyleSheet, Pressable, TouchableWithoutFeedback, Keyboard, RefreshControl } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ActivityIndicator, IconButton } from "react-native-paper";
import { useState, useContext, useLayoutEffect, useEffect, useCallback } from "react";
import { CartContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import CartStore from "./cartStore";
import { ScrollView } from "react-native-gesture-handler";
import CheckBox from "react-native-check-box";
import { Cart_Action_Type } from "../../reducers/CartReducer";
import ToastMessage from "../ui/productDetail/ToastMessage";

export const HeaderCartLeft = ({ navigation, routeParams }) => {
    const handleGoBack = () => {
        //Lấy prevScreen từ route param được truyền qua Cart page
        const { prevScreen } = routeParams || {}

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
            navigation.goBack()
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
            flex: 1,
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
    const [cartProductsBasic, setCartProductsBasic] = useState(null)
    const [fixBtnPressed, setFixBtnPressed] = useState(false)
    const [toastVisible, setToastVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false)

    // API to get cart products
    const getCartProducts = async () => {
        try {
            setLoading(true)
            const token = await AsyncStorage.getItem('token')
            let res = await authApis(token).get(endpoints['cart'])
            //console.log("cart products data ", res.data)
            setCartProducts(res.data)
        }
        catch (err) {
            //console.log("Fail to load cart products", err)
            throw err
        }
        finally {
            setLoading(false)
        }
    }

    const getTotalAmount = () => {
        return Array.from(tickCarts).reduce((totalAmount, cartDetailId) => {
            return totalAmount += cartProductsBasic[cartDetailId].totalAmount
        }, 0)

    }

    const handleTickAllCartToggle = () => {
        var newSet = null
        if (isCheckTickAll()) {
            // Nếu đã tick all
            newSet = new Set()
        }
        else {
            newSet = new Set(Object.keys(cartProductsBasic))
        }
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

    const isCheckCartStore = (listCartDetail) => {
        let currentTickCarts = Array.from(tickCarts)
        return listCartDetail.every(c => currentTickCarts.includes(c)) && listCartDetail.length != 0
    }

    const isCheckCartProduct = (cartDetailId) => {
        return tickCarts.has(String(cartDetailId))
    }

    const isCheckTickAll = () => {
        if (tickCarts.size != 0 && cartProductsBasic)
            return tickCarts.size === Object.keys(cartProductsBasic).length
        return false
    }

    // Fucntion to put all cart detal of store in tickcarts
    const tickAllCartDetailOfAStore = (listCartDetail) => {
        let currentTickCarts = Array.from(tickCarts)
        // Nếu cart store đã được tick thì remove 
        if (isCheckCartStore(listCartDetail)) {
            currentTickCarts = currentTickCarts.filter(c => !listCartDetail.includes(c))
        }
        else {
            // Nếu chưa được tick
            currentTickCarts = [...currentTickCarts, ...listCartDetail]
        }
        const newSet = new Set(currentTickCarts)
        setTickCarts(newSet)
    }

    const handleDeleteCarts = async () => {
        try {
            let currentTickCarts = Array.from(tickCarts).map(Number)
            if (currentTickCarts.length > 0) {
                const token = await AsyncStorage.getItem('token')
                let res = await authApis(token).delete(endpoints['cartDetailBulkDelete'], {
                    data: currentTickCarts
                })
                let updateCart = await authApis(token).get(endpoints.cart_basic_info);
                cartDispatch({ type: Cart_Action_Type.UPDATE_CART, payload: updateCart.data })
                setCartProducts(res.data)
                setTickCarts(new Set())
            }
        }
        catch (err) {
            console.log("Fail to delete carts ", err)
        }
    }

    // handleRemoveTickCartDetail
    const handleRemoveCartDetail = (cartDetailId) => {
        const newSet = new Set(tickCarts)
        if (newSet.has(cartDetailId)) {
            newSet.delete(cartDetailId)
        }
        setTickCarts(newSet)
    }

    const handleAddTickCart = (cartDetailId) => {
        if (!tickCarts.has(cartDetailId)) {
            const newSet = new Set(tickCarts)
            newSet.add(cartDetailId)
            setTickCarts(newSet)
        }
    }

    const getListOfVariantId = () => {
        return Object.keys(cartProductsBasic).reduce((listVariantId, cartDetail) => {
            if (tickCarts.has(cartDetail)) {
                listVariantId.push(cartProductsBasic[cartDetail].variantId)
            }
            //console.log("list variant id ", listVariantId)
            return listVariantId
        }, [])
    }

    const handleOnpressBtnBuy = () => {
        
        if (tickCarts.size === 0) {
            setToastVisible(true)
        }
        else {
            let dataToCheckout = {
                list_product_variant: getListOfVariantId(),
                list_cart_detail: Array.from(tickCarts).map(Number)
            }
           // console.log("data to check out from cart ", dataToCheckout)
            navigation.navigate("checkoutPage", {dataToCheckout, type: "cart"})
        }
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        const fetchData = async () => {
            try {
                await getCartProducts();
            }
            catch (err) {
                console.log("Failed to refresh cart products", err);
            }
        }

        fetchData().finally(() => setRefreshing(false))
    }, [])

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
            let cartProductsBasic = cartProducts.reduce((acc, store) => {
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

            // Kiểm tra xem có tick cart (cart detail nòa có bị remove)
            let currentTickCarts = Array.from(tickCarts)
            let listCartDetail = Object.keys(cartProductsBasic)
            currentTickCarts = currentTickCarts.filter(c => listCartDetail.includes(c))
            setTickCarts(new Set(currentTickCarts))
            setCartProductsBasic(cartProductsBasic)
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

    if (loading || cartProducts === null) {
        return (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={"#fa5230"} />
        </View>
        )
    }

    if (cartProducts?.length === 0) {
        return (
            <View style={{ alignItems: "center", marginTop: 50 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "rgba(0,0,0,0.7)" }}>"Hổng" có gì trong giỏ hết</Text>
                <Text style={{ marginTop: 10 }}>Lướt LuLuShop, lựa hàng ngay đi</Text>
                <Pressable style={{ marginTop: 20, borderWidth: 1, borderColor: "#fa5230", padding: 10 }} onPress={() => { navigation.navigate("index") }}>
                    <Text style={{ fontSize: 16, color: "#fa5230" }}>Mua sắm ngay!</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={styles.mainContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {
                        cartProducts.map(cartStore => <CartStore key={cartStore.store.id} cartStore={cartStore} toggleTickCart={toggleTickCart} isCheckCartStore={isCheckCartStore}
                            isCheckCartProduct={isCheckCartProduct} handleSetCartProducts={handleSetCartProducts}
                            tickAllCartDetailOfAStore={tickAllCartDetailOfAStore} handleRemoveCartDetail={handleRemoveCartDetail} handleAddTickCart={handleAddTickCart} />)
                    }

                </ScrollView>

            </TouchableWithoutFeedback>

            <View style={styles.bottomContainer}>
                <View style={styles.bottomLeft}>
                    <CheckBox
                        isChecked={isCheckTickAll() }
                        onClick={() => handleTickAllCartToggle()}
                        checkedCheckBoxColor="#fa5230"
                        uncheckedCheckBoxColor="#ccc"
                        style={styles.checkbox}
                    />
                    <Text>Tất cả</Text>
                </View>
                {
                    fixBtnPressed ? (<View style={styles.bottomRight}>
                        <Pressable style={styles.btnDeleteProduct} onPress={handleDeleteCarts}>
                            <Text style={{ color: "#fa5230", fontSize: 15 }}>Xóa</Text>
                        </Pressable>
                    </View>) :
                        (<View style={styles.bottomRight}>
                            <Text>Tổng tiền <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 700 }}>
                                <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                                {getTotalAmount().toLocaleString("vi-VN")}
                            </Text>
                            </Text>

                            <Pressable style={styles.btnBuy} onPress={() => {handleOnpressBtnBuy()}}>
                                <Text style={{ color: "#fff", fontSize: 15 }}>Mua hàng ({tickCarts.size})</Text>
                            </Pressable>
                        </View>)
                }
            </View>

            <ToastMessage
                message="Bạn chưa chọn sản phẩm nào để mua"
                iconName={"exclamation-circle"}
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
            />
        </View>
    )

}

export default Cart

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    mainContent: {
        flex: 1
    },
    bottomContainer: {
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "white",
        padding: 8,
        paddingBottom: 45,
    },
    bottomLeft: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center"
    },
    bottomRight: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center"
    },
    btnBuy: {
        backgroundColor: "#fa5230",
        paddingHorizontal: 18,
        paddingVertical: 15,
        borderRadius: 4
    },
    btnDeleteProduct: {
        borderWidth: 1,
        borderColor: "#fa5230",
        borderRadius: 6,
        backgroundColor: "white",
        paddingHorizontal: 18,
        paddingVertical: 14
    },
    checkbox: {
        width: 30,
        height: 30,
        marginRight: 0,
    },
})

// To do next: Chờ load hết rồi hiện, kiểu chờ hết cart product xuất hiện rồi cùng nhau xuất hiện, cấu hình on refresh,
// Code tiếp trang thanh toán

