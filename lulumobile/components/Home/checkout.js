import { View, Text, Image, StyleSheet, Pressable, RefreshControl, Alert } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from "react-native-paper";
import { useState, useContext, useLayoutEffect, useEffect, useRef } from "react";
import { ScrollView } from "react-native-gesture-handler";
import MomoIcon from "../utils/momoIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { CartContext, MyUserContext } from "../../configs/MyContext";
import { Cart_Action_Type } from "../../reducers/CartReducer";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Linking } from 'react-native';
import ModalMsg from "../utils/modalMsg";
import { DeviceEventEmitter } from "react-native";
import ToastMessage from "../ui/productDetail/ToastMessage";

const HeaderCartLeft = ({ navigation }) => {
    const handleGoBack = () => {
        navigation.goBack()
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

const StoreItem = ({ item }) => {

    const getAttributes = (attributes) => {
        return attributes.reduce((str, attr, index) => {
            if (index != 0) {
                str += ", "
            }
            return str += attr.value
        }, "")
    }
    return (
        <View style={storeItemStyles.container}>
            <View style={storeItemStyles.left}>
                <Image source={{ uri: item.product_variant.logo }} style={storeItemStyles.variantImage} />
            </View>
            <View style={storeItemStyles.right}>
                <View>
                    <Text style={{ fontSize: 14, color: "#2b2b2b" }}>{item.product_variant.product_name}</Text>
                    <Text style={{ fontSize: 12, paddingVertical: 4, color: "#4a4a4a" }}>{getAttributes(item.product_variant.attributes)}</Text>
                </View>
                <View style={storeItemStyles.bottomRight}>
                    <Text style={{ color: "#1a1a1a" }}>
                        <Text style={{ fontSize: 14, textDecorationLine: 'underline' }}>đ</Text>
                        {item.product_variant.price.toLocaleString("vi-VN")}
                    </Text>
                    <Text style={{ fontSize: 12, alignSelf: "flex-end", color: "#2b2b2b" }}>x{item.quantity}</Text>
                </View>
            </View>
        </View>
    )
}

const storeItemStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginHorizontal: 12,
        marginBottom: 16,
        gap: 10,
    },
    variantImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    right: {
        justifyContent: "space-between",
        flex: 1,
    },
    bottomRight: {
        flexDirection: "row",
        justifyContent: "space-between"
    }
})

const StoreItemsCard = ({ cartStoreItem }) => {
    //console.log("cart item ", cartStoreItem)
    return (
        <View style={storeItemCardStyles.container}>
            <Text style={{ fontSize: 14, fontWeight: "500", paddingVertical: 16, paddingHorizontal: 12 }}>{cartStoreItem.store.name}</Text>
            {
                cartStoreItem.product_variants.map(item => <StoreItem key={item.product_variant.id} item={item} />)
            }

            <View style={storeItemCardStyles.bottom}>
                <Text style={{ fontSize: 14, color: "#1a1a1a" }}>Tổng số tiền ({cartStoreItem.total_quantity} sản phẩm)</Text>
                <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 14 }}>
                    <Text style={{ textDecorationLine: 'underline' }}>đ</Text>
                    {cartStoreItem.total_price.toLocaleString("vi-VN")}
                </Text>
            </View>
        </View>
    )
}

const storeItemCardStyles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        marginBottom: 12,
        backgroundColor: "white",
        borderRadius: 8,
    },
    bottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderTopColor: "rgba(0,0,0,0.3)",
        borderTopWidth: 0.5
    }
})

const PaymentMethod = ({ methodChoose, changeMethodChoose }) => {
    return (
        <View style={paymentMethodStyles.container}>
            <Text style={{ fontSize: 14, fontWeight: "500" }}>Phương thức thanh toán</Text>
            <Pressable style={paymentMethodStyles.row} onPress={() => changeMethodChoose("cash")}>
                <MaterialCommunityIcons name="cash" size={30} color="#fa5230" />
                <Text>Thanh toán khi nhận hàng</Text>
                {
                    methodChoose == "cash" && (
                        <View style={paymentMethodStyles.check}>
                            <Icon name="check" size={24} color="#fa5230" />
                        </View>
                    )
                }
            </Pressable>
            <Pressable style={paymentMethodStyles.row} onPress={() => changeMethodChoose("momo")}>
                <View style={{ marginLeft: 3 }}>
                    <MomoIcon width={24} height={24}></MomoIcon>
                </View>
                <Text style={{ alignSelf: "flex-end" }}>Thanh toán với momo</Text>
                {
                    methodChoose == "momo" && (
                        <View style={paymentMethodStyles.check}>
                            <Icon name="check" size={24} color="#fa5230" />
                        </View>
                    )
                }
            </Pressable>
        </View>
    )
}

const paymentMethodStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        backgroundColor: "white",
        borderRadius: 8,
        marginBottom: 12
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
    },
    check: {
        marginLeft: "auto"
    }
})

const DetailCheckout = ({ totalFinalQuantity, totalFinalPrice }) => {
    return (
        <View style={detailCheckoutStyles.container}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 10 }}>Chi tiết thanh toán</Text>
            <View style={[detailCheckoutStyles.row, { paddingBottom: 10 }]}>
                <Text style={detailCheckoutStyles.text}>Tổng số sản phẩm</Text>
                <Text style={detailCheckoutStyles.text}>{totalFinalQuantity}</Text>
            </View>
            <View style={[detailCheckoutStyles.row, { paddingTop: 16, borderTopColor: "rgba(0,0,0,0.3)", borderTopWidth: 0.2 }]}>
                <Text style={{ color: "#333333" }}>Tổng thanh toán</Text>
                <Text style={{ color: "#1a1a1a", fontWeight: "600", fontSize: 14 }}>
                    <Text style={{ textDecorationLine: 'underline' }}>đ</Text>
                    {totalFinalPrice.toLocaleString("vi-VN")}
                </Text>
            </View>
        </View>
    )
}

const detailCheckoutStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        backgroundColor: "white",
        borderRadius: 8
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    text: {
        color: "#555555"
    }
})


const Checkout = ({ navigation, route }) => {
    const { cart, cartDispatch } = useContext(CartContext)
    const { dataToCheckout, type } = route.params || {}
    const [checkoutData, setCheckoutData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [methodChoose, setMethodChoose] = useState("cash")
    const cartBasic = useRef(null)
    const [orderId, setOrderId] = useState(null)
    const [openModalMsg, setOpenModalMsg] = useState(false)
    //const user = useContext(MyUserContext)
    const [userShippingAddress, setUserShippingAddress] = useState(null)
    const [currentChooseAddress, setCurrentChooseAddress] = useState("0")
    const [toastVisible, setToastVisible] = useState(false);

    const getCheckoutData = async (type) => {
        try {
            const token = await AsyncStorage.getItem("token")
            let res;
            if (type === "cart") {
                res = await authApis(token).post(endpoints["checkout"], dataToCheckout)
            } else {
                // buy now
                res = await authApis(token).post(endpoints["checkoutForBuyNow"], dataToCheckout)
            }
            //console.log("checkout data", res.data)
            setCheckoutData(res.data)
            setUserShippingAddress(res.data.user.address)
        } catch (err) {
            console.log("Fail to load check out data ", err)
            throw err
        }
    }

    const getWardDistrictCity = () => {
        let address = userShippingAddress[currentChooseAddress]
        let WardDistrictCity = ""
        for (let i = 3; i > 0; i--) {
            if (i != 3)
                WardDistrictCity += ", "

            WardDistrictCity += address[String(i)]
        }
        console.log("WardDistrictCity ", WardDistrictCity)
        return WardDistrictCity
    }

    const changeMethodChoose = (value) => {
        setMethodChoose(value)
    }

    const buildCartDetailListForOrder = () => {
        if (type == "cart") {
            return dataToCheckout.list_cart_detail
        }
        else
            return []
    }

    const buildProductsForOrder = () => {
        if (type == "cart") {
            let listProductVariant = dataToCheckout.list_product_variant
            // Lấy ra quantity của variantId tương ứng
            let products = listProductVariant.reduce((pros, variantId) => {
                pros.push({
                    product_variant_id: variantId,
                    quantity: cartBasic.current[variantId]
                })
                return pros
            }, [])
            return products
        } else {
            return [{
                product_variant_id: dataToCheckout.product_variant,
                quantity: dataToCheckout.quantity
            }]
        }
    }

    const buildStoresForOrder = () => {
        if (type == "cart") {
            return checkoutData.cart_items.reduce((stores, cartItem) => {
                stores.push(cartItem.store.id)
                return stores
            }, [])
        }
        else {
            return [dataToCheckout.store]
        }
    }

    const handleOrderOffMethod = async () => {
        try {
            let dataToCreateOrder = {
                paid: false,
                payment_method: {
                    method: "OF"
                },
                shipping_address: userShippingAddress[currentChooseAddress],
                total_price: checkoutData.total_final_price,
                products: buildProductsForOrder(),
                stores: buildStoresForOrder(),
                cart_detail_list: buildCartDetailListForOrder()
            }

            const token = await AsyncStorage.getItem("token")
            let res = await authApis(token).post(endpoints['createOrder'], dataToCreateOrder)
            console.log("res from create order ", res.data)
            // Nếu tạo đơn hàng thành công thì update cart
            if (res.data.result) {
                let updateCart = await authApis(token).get(endpoints.cart_basic_info);
                cartDispatch({ type: Cart_Action_Type.UPDATE_CART, payload: updateCart.data })
                //console.log("order oFF here we goooo")

                // Navigate qua trang đơn hàng người dùng là xong
                setToastVisible(true)
                await new Promise(resolve => setTimeout(resolve, 1000));
                navigation.replace('index')
            }
            else {
                Alert.alert("Xảy ra lỗi!", "Tạo đơn hàng thất bại")
            }
        }
        catch (err) {
            console.log("Fail to create order ", err)
            throw err
        }
    }

    const handleOrderOnMethod = async () => {
        try {
            let orderId = uuidv4()
            setOrderId(orderId)
            let dataToCreateOrder = {
                paid: false,
                payment_method: {
                    method: "ON",
                    portal: "MOMO"
                },
                shipping_address: userShippingAddress[currentChooseAddress],
                order_payment_id: orderId,
                total_price: checkoutData.total_final_price,
                products: buildProductsForOrder(),
                stores: buildStoresForOrder(),
                cart_detail_list: buildCartDetailListForOrder()
            }

            const token = await AsyncStorage.getItem("token")
            let res = await authApis(token).post(endpoints['createOrder'], dataToCreateOrder)
            console.log("res from create order ", res.data)
            // Nếu tạo đơn hàng thành công thì update cart
            if (res.data.result_code == 0) {
                console.log("deeelink ", res.data.deeplink)
                const canOpenMoMo = await Linking.canOpenURL("momo://");
                await Linking.openURL(res.data.deeplink)
                // if (canOpenMoMo) {

                // } else {
                //     Linking.openURL("https://momo.vn")
                // }
            }
        }
        catch (err) {
            console.log("Fail to create order on", err)
            throw err
        }
    }

    const handleOnpressBtnOrder = () => {
        try {
            if (Object.keys(userShippingAddress).length > 0) {
                if (methodChoose == "cash") {
                    console.log("process create off order ...")
                    handleOrderOffMethod()
                }
                else {
                    console.log("process create on order ...")
                    handleOrderOnMethod()
                }
            } else {
                setOpenModalMsg(true)
            }
        }
        catch (err) {
            console.log("Fail to create order ", err)
        }
    }

    const handleChangeUserShippingAddress = () => {
        console.log("go to shipping address page")
        if (Object.keys(userShippingAddress).length > 0) {
            navigation.navigate("chooseShippingAddressPage", { shippingAddress: userShippingAddress, currentChoose: currentChooseAddress })
        } else {
            setOpenModalMsg(true)
        }
    }

    const handleEventUpdateUserShippingAddress = (eventData) => {
        try {
            setLoading(true)
            getCheckoutData(type)
        }
        catch (err) {
            console.log("Fail to load check out data ", err)
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        cartBasic.current = cart.product_variants.reduce((acc, variant) => {
            acc[variant.variant_id] = variant.quantity
            return acc
        }, {})

    }, [cart])

    // Loading checkoutdata for render
    useEffect(() => {
        try {
            setLoading(true)
            getCheckoutData(type)
        }
        catch (err) {
            console.log("Fail to load check out data ", err)
        }
        finally {
            setLoading(false)
        }
    }, [navigation, route])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (<Text style={{ fontSize: 16, fontWeight: "700" }}>Thanh toán</Text>),
            headerLeft: () => (<HeaderCartLeft navigation={navigation} />),
        });
    }, [navigation, route])

    const verifyIsPaid = async (orderId) => {
        try {
            let maxCall = 5
            let paid = false
            const token = await AsyncStorage.getItem("token")
            let res = null

            for (let i = 0; i < maxCall; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                res = await authApis(token).post(endpoints['verifyIsPaidOrderId'], { order_id: orderId })
                paid = res.data.paid
                if (paid) {
                    return true
                }
            }
            return false
        }
        catch (err) {
            console.log("Fail to verify orderId ", err)
        }
    }

    // Xử lý thanh toán deep link từ momo quay về
    useEffect(() => {
        const handleDeepLink = (event) => {
            const url = event.url || event;
            //console.log('Deep Link URL:', url);
            // Đã quay về => gọi API tới backend kiểm tra

            if (orderId && url.includes("orderId")) {
                setLoading(true)
                setTimeout(() => {
                    verifyIsPaid(orderId).then(paid => {
                        if (paid) {
                            //console.log("Thanh toan thanh cong hehehehe")
                            setLoading(false)
                            navigation.replace("index")
                        }
                        else {
                            console.log("Thanh toan co loi ~~")
                        }
                    })
                }, 3000)
            }
        };

        // Đăng ký lắng nghe sự kiện xem có deep link nào mở app của mình hay ko
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Kiểm tra nếu app được mở từ Deep Link (khi app ở trạng thái killed)
        Linking.getInitialURL().then(handleDeepLink);

        // Cleanup: Hủy lắng nghe khi component unmount
        return () => {
            subscription.remove();
        };
    }, [orderId]);

    // Xử lý event emitter
    useEffect(() => {
        // Add the event listener communicate between 2 screen
        const eventListener = DeviceEventEmitter.addListener(
            "event.updateUserShippingAddress",
            (eventData) => {
                // Handle the event data
                console.log("envent data ", eventData)
                handleEventUpdateUserShippingAddress(eventData);
            }
        );

        const listenToEventChangeUserShippingAddress = DeviceEventEmitter.addListener(
            'event.changeUserShippingAddress',
            // event data is the data is emitted from the event (this case is new index of address)
            (eventData) => {
                setCurrentChooseAddress(eventData)
            }
        )

        return () => {
            eventListener.remove(); // Clean up the listener
            listenToEventChangeUserShippingAddress.remove()
        };
    }, []);

    // Xử lý hiện thông báo thanh toán thành công và quay về trang chủ
    // useEffect(() => {
    //     if (toastVisible) { // Only run when toastVisible becomes true
    //         const timer = setTimeout(() => {
    //             navigation.replace("index");
    //         }, 1000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [toastVisible])

    if (loading || checkoutData === null) {
        return (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={"#fa5230"} />
        </View>
        )
    }

    return (
        <View style={styles.checkoutContainer}>
            <ScrollView style={styles.scrollView} stickyHeaderIndices={[0]}>
                <Pressable style={styles.userInfo} onPress={handleChangeUserShippingAddress}>
                    <View>
                        <Icon name="location-on" size={20} color="#FF5722" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6 }}>{checkoutData.user.fullname}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            {
                                Object.keys(userShippingAddress).length > 0 ? <Text style={{ marginBottom: 3 }}>{userShippingAddress[currentChooseAddress]["4"]}</Text> :
                                    <Text style={{ color: "#fa5230" }}>Chọn địa chỉ</Text>
                            }
                            <Icon name="chevron-right" size={24} color="#aaa" />
                        </View>
                        {Object.keys(userShippingAddress).length > 0 && <Text>{getWardDistrictCity()}</Text>}
                    </View>
                </Pressable>
                {
                    checkoutData.cart_items.map(cartItem => <StoreItemsCard key={cartItem.store.id} cartStoreItem={cartItem} />)
                }
                <PaymentMethod methodChoose={methodChoose} changeMethodChoose={changeMethodChoose} />
                <DetailCheckout totalFinalPrice={checkoutData.total_final_price} totalFinalQuantity={checkoutData.total_final_quantity} />
            </ScrollView>
            <View style={styles.bottomContainer}>
                <View style={{ flex: 1 }}></View>
                <Text>Tổng cộng  <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 700 }}>
                    <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                    {checkoutData.total_final_price.toLocaleString("vi-VN")}
                </Text>
                </Text>
                <Pressable style={styles.btnOrder} onPress={handleOnpressBtnOrder}>
                    <Text style={{ color: "white" }}>Đặt hàng</Text>
                </Pressable>
            </View>
            <ModalMsg visible={openModalMsg} message={"Bạn chưa có địa chỉ vui lòng thêm địa chỉ"}
                handleCloseModalMsg={() => setOpenModalMsg(false)}
                handleOnpressConfirm={() => { navigation.navigate("newAddressPage", { autoDefault: true }) }} />
            <ToastMessage
                message="Thanh toán thành công"
                iconName={"check"}
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
            />
        </View>
    )
}



export default Checkout

const styles = StyleSheet.create({
    checkoutContainer: {
        flex: 1
    },
    scrollView: {
        marginHorizontal: 8,
        marginVertical: 12
    },
    userInfo: {
        paddingHorizontal: 10,
        paddingVertical: 16,
        backgroundColor: "white",
        borderRadius: 8,
        gap: 8,
        marginBottom: 12
    },
    namePhoneNumber: {
        flexDirection: "row"
    },
    bottomContainer: {
        marginTop: 0,
        flexDirection: "row",
        backgroundColor: "white",
        padding: 8,
        paddingBottom: 45,
        alignItems: "center",
        gap: 14
    },
    btnOrder: {
        backgroundColor: "#fa5230",
        paddingHorizontal: 18,
        paddingVertical: 15,
        borderRadius: 4,
        marginLeft: "auto"
    }
})


// Done thanh toán

// Next: Địa chỉ here we goooo