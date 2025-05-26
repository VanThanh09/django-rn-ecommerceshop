import { StyleSheet, Text, View, SafeAreaView, Touchable } from "react-native"
import MyStyles from "../../../styles/MyStyles"
import { IconButton, Searchbar } from "react-native-paper"
import { useContext } from "react"
import { MyUserContext, CartContext } from "../../../configs/MyContext"
import { useNavigation } from "@react-navigation/native"

const HeaderHome = ({ value, onChangeText, showBackButton = false, showHomeButton = false }) => {
    // State store the current quantity
    nav = useNavigation()
    user = useContext(MyUserContext)
    const { cart } = useContext(CartContext)


    return (
        <SafeAreaView>
            <View style={MyStyles.bgPrimaryColor}>
                <View style={styles.containerRow}>
                    <View style={[styles.left]}>
                        {
                            showBackButton ? (
                                <View style={{ marginLeft: -10, width: '10%', marginRight: 8 }}>
                                    <IconButton icon="chevron-left" size={25} iconColor="#fff" onPress={() => nav.goBack()} />
                                </View>) : <></>
                        }
                        <Searchbar
                            placeholder="Search"
                            style={styles.searchbar}
                            inputStyle={styles.input}
                            iconColor="#888"
                            onChangeText={onChangeText}
                            value={value}
                        />
                    </View>
                    <View style={styles.right}>
                        <View style={styles.cartContainer}>
                            <IconButton
                                icon="cart-outline"
                                size={25}
                                iconColor="#fff"
                            />
                            {cart.total_quantity > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{cart.total_quantity}</Text>
                                </View>
                            )}
                        </View>
                        {
                            showHomeButton ? (<View>
                                <IconButton icon="home-outline" size={25} onPress={() => nav.navigate("index")} iconColor="#fff"/>
                            </View>) : <View><IconButton
                                icon="chat-processing-outline"
                                size={25}
                                onPress={() => console.log('Pressed')}
                                iconColor="#fff"
                            /></View>
                        }
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default HeaderHome;

const styles = StyleSheet.create({
    containerRow: {
        flexDirection: "row",
        justifyContent: 'space-between',
    },
    left: {
        flexDirection: "row",
        flex: 1,
    },
    right: {
        flexDirection: "row",
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#fff'
    },
    buttonText: {
        color: '#fff',
    },
    searchbar: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginVertical: 8,
        marginLeft: 10,
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        height: 40,
    },

    input: {
        fontSize: 14,
        marginTop: -8,
    },
    cartContainer: {
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    badge: {
        position: "absolute",
        right: 3,
        top: 3.75,
        backgroundColor: "#fff",
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    badgeText: {
        color: "#ee4d2d",
        fontSize: 11,
        fontWeight: "bold",
    },
    backButton: {

    }
})