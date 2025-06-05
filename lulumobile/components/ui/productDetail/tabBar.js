import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native"
import { IconButton } from "react-native-paper"
import { useParentRoute } from "../../utils/RouteProvider";
import { useNavigation } from '@react-navigation/native';
import { useContext} from "react"
import { MyUserContext } from "../../../configs/MyContext";

const TabBarProduct = ({ price, openModalCart, openModalBuyNow}) => {
    const user = useContext(MyUserContext)
    const navigation = useNavigation();
    const route = useParentRoute();

    // Khi người dùng chưa đăng nhập
    const parentNav = navigation.getParent()
    const nestedScreen = parentNav?.getState()?.routeNames[parentNav?.getState().index];

    const handleChatPress = () => {
        if (user === null) {
            navigation.navigate('account', {
                screen: 'login', params: {
                prevScreen: {
                    nestedScreen: nestedScreen, previousRoute: route.name,
                    prevRouteParams: route.params
                },
                // Màn hình muốn chuyển tới sau login
                screenAfterLogin: {
                    nestedScreen: "home",
                    route: "productDetail",
                    // Params để quay trở về
                    params: {
                        ...route.params
                    }
                }
            }
            })
        }
        else {
            console.log("chat")
        }
    }

    const handleAddToCart = () => {
        if (user === null) {
            navigation.navigate('account', {
                screen: 'login', params: {
                prevScreen: {
                    nestedScreen: nestedScreen, previousRoute: route.name,
                    prevRouteParams: route.params
                },
                // Màn hình muốn chuyển tới sau login
                screenAfterLogin: {
                    nestedScreen: "home",
                    route: "productDetail",
                    // Params để quay trở về
                    params: {
                        ...route.params
                    }
                }
            }
            })
        }
        else {
            openModalCart()
        }
    }

    const handleBuyNow = () => {
        if (user === null) {
            navigation.navigate('account', {
                screen: 'login', params: {
                prevScreen: {
                    nestedScreen: nestedScreen, previousRoute: route.name,
                    prevRouteParams: route.params
                },
                // Màn hình muốn chuyển tới sau login
                screenAfterLogin: {
                    nestedScreen: "home",
                    route: "productDetail",
                    // Params để quay trở về
                    params: {
                        ...route.params
                    }
                }
            }
            })
        }
        else {
            openModalBuyNow()
        }
    }

    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.chatAddCartContainer}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", borderRightColor: 'rgba(0,0,0,0.3)', borderRightWidth: 1, marginVertical: 8 }}>
                    <IconButton
                        icon="chat-processing-outline"
                        size={25}
                        onPress={handleChatPress}
                        iconColor="#fff"
                        style={styles.icon}
                    />
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <IconButton
                        icon="cart-plus"
                        size={24}
                        onPress={handleAddToCart}
                        iconColor="#fff"
                        style={styles.icon}
                    />
                </View>
            </View>
            <View style={styles.btnBuyContainer}>
                <TouchableOpacity style={styles.btn} onPress={handleBuyNow}>
                    <View>
                        <Text style={styles.text}>Mua ngay với</Text>
                        <Text style={[styles.text, { fontWeight: "600" }]}>
                            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600", textDecorationLine: 'underline' }}>đ</Text>
                            {price.toLocaleString("vi-VN")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default TabBarProduct

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: "row",
        flex: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    chatAddCartContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#5fb3b3",
        alignItems: "center"
    },
    icon: {
        width: '100%',
        padding: 0,
        margin: 0
    },
    btnBuyContainer: {
        flex: 1,
        backgroundColor: "#fa5230",
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 18,
        color: "#fff",
        textAlign: "center"
    },
    btn: {
        width: "100%"
    }
})