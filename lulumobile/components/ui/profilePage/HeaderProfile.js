import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MyStyles from "../../../styles/MyStyles"
import { Button, Icon, IconButton } from "react-native-paper"
import { useContext } from "react"
import { MyUserContext } from "../../../configs/MyContext"
import { useNavigation } from "@react-navigation/native"

const HeaderProfile = ({ onLoginPress, onRegisterPress, onLogoutPress }) => {
    const user = useContext(MyUserContext);
    const nav = useNavigation();

    return (
        <View style={MyStyles.bgPrimaryColor}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <View style={styles.right}>
                    <IconButton
                        icon="cog"
                        size={25}
                        onPress={() => console.log('Pressed')}
                        iconColor="#fff"
                    />
                    <IconButton
                        icon="cart-outline"
                        size={25}
                        onPress={() => console.log('Pressed')}
                        iconColor="#fff"
                    />
                    <IconButton
                        icon="chat-processing-outline"
                        size={25}
                        onPress={() => nav.navigate("conversations")}
                        iconColor="#fff"
                    />
                </View>
            </View>
            {user === null ? <>
                <View style={[styles.containerRow]}>
                    <View style={styles.left}>
                        <Icon source="account-circle" size={45} color="#fff" />
                    </View>
                    <View style={styles.right}>
                        <TouchableOpacity onPress={onLoginPress}>
                            <Button style={[{
                                borderRadius: 3,
                                borderWidth: 1,
                                borderColor: '#fff',
                                backgroundColor: '#fff'
                            }, MyStyles.m]}>
                                <Text style={{ color: "#fa5230" }}>Đăng nhập</Text>
                            </Button>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onRegisterPress}>
                            <Button style={[MyStyles.m, styles.button]}>
                                <Text style={styles.buttonText}>Đăng ký</Text>
                            </Button>
                        </TouchableOpacity>
                    </View>
                </View>
            </> : <>
                <View style={[styles.containerRow]}>
                    <View style={styles.left}>
                        <View style={{ width: 40, marginRight: 10 }}>
                            <Image source={{ uri: user?.avatar }} style={styles.avatar} />
                        </View>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.titleText}>{user?.first_name} {user?.last_name}</Text>
                        </View>
                    </View>
                    <View style={styles.right}>
                        <TouchableOpacity onPress={onLogoutPress}>
                            <Button style={[{
                                borderRadius: 3,
                                borderWidth: 1,
                                borderColor: '#fff',
                                backgroundColor: '#fff'
                            }, MyStyles.m]}>
                                <Text style={{ color: "#fa5230" }}>Đăng xuất</Text>
                            </Button>
                        </TouchableOpacity>
                    </View>
                </View>
            </>}
        </View>
    )
}

export default HeaderProfile;

const styles = StyleSheet.create({
    containerRow: {
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        paddingTop: 0,
    },
    left: {
        flexDirection: "row",
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
    avatar: {
        width: '100%',
        height: 40,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#fff"
    },
    titleText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleWrapper: {
        justifyContent: 'center'
    }
})