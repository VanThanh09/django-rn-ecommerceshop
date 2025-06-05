import { View, Text, Image, StyleSheet, Pressable, TouchableWithoutFeedback, Keyboard, RefreshControl } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator } from "react-native-paper";
import { useState, useContext, useLayoutEffect, useEffect } from "react";
import { ScrollView } from "react-native-gesture-handler";
import MomoIcon from "../utils/momoIcon";
import CheckBox from "react-native-check-box";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { RadioButton } from 'react-native-paper';

const HeaderCartLeft = ({ navigation, routeParams }) => {
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
            <Text style={{ fontSize: 14, fontWeight: "500"}}>Phương thức thanh toán</Text>
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
    const { dataToCheckout, type } = route.params || {}
    const [checkoutData, setCheckoutData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [methodChoose, setMethodChoose] = useState("cash")

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
            console.log("checkout data", res.data)
            setCheckoutData(res.data)
        } catch (err) {
            console.log("Fail to load check out data ", err)
            throw err
        }
    }

    const getWardDistrictCity = () => {
        let address = checkoutData.user.address
        let WardDistrictCity = ""
        for (let i = 3; i > 0; i--) {
            if (i != 3)
                WardDistrictCity += ", "

            WardDistrictCity += address[String(i)]
        }
        return WardDistrictCity
    }

    const changeMethodChoose = (value) => {
        setMethodChoose(value)
    }
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
            headerLeft: () => (<HeaderCartLeft navigation={navigation} routeParams={route.params} />),
        });
    }, [navigation, route])

    if (loading || checkoutData === null) {
        return (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={"#fa5230"} />
        </View>
        )
    }

    return (
        <View style={styles.checkoutContainer}>
            <ScrollView style={styles.scrollView} stickyHeaderIndices={[0]}>
                <Pressable style={styles.userInfo} onPress={() => { console.log("Change infor user address") }}>
                    <View>
                        <Icon name="location-on" size={20} color="#FF5722" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6 }}>{checkoutData.user.fullname}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ marginBottom: 3 }}>{checkoutData.user.address["4"]}</Text>
                            <Icon name="chevron-right" size={24} color="#aaa" />
                        </View>
                        <Text>{getWardDistrictCity()}</Text>
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
                <Pressable style={styles.btnOrder}>
                    <Text style={{ color: "white" }}>Đặt hàng</Text>
                </Pressable>
            </View>
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