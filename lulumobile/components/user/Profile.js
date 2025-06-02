import { useContext, useState } from "react";
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext, CartContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderProfile from "../ui/profilePage/HeaderProfile";
import FeatureButton from "../ui/profilePage/FeatureButton";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const [loading, setLoading] = useState(false);

    const features = [{
        label: "Đăng ký cửa hàng",
        icon: "store",
        color: "#3a5998"
    }]

    const { cartDispatch } = useContext(CartContext)

    const logout = async () => {
        if (!loading) {
            try {
                setLoading(true);

                await AsyncStorage.removeItem('token');
                dispatch({
                    type: "logout"
                });

                cartDispatch({
                    type: "user_logged_out"
                })

                nav.navigate("home", {
                    screen: "homeMain"
                })
            } catch (ex) {
                console.error(ex)
            } finally {
                setLoading(false);
            }
        }
    }

    const pressLogout = () => {
        Alert.alert("Đăng xuất", "Bạn chắc chứ?", [{
            text: "Cancel",
            style: 'cancel',
        }, {
            text: "Đăng xuất",
            onPress: () => logout(),
        },
        ])
    }

    const pressLogin = () => (nav.navigate("login"));
    const pressRegister = () => (nav.navigate("register"));
    const handleStoreRegister = () => (nav.navigate("storeRegister"));

    return (
        <SafeAreaView>
            {/* <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}> */}
            <HeaderProfile onLoginPress={pressLogin} onRegisterPress={pressRegister} onLogoutPress={pressLogout} />
            <ScrollView contentContainerStyle style={[styles.container]}>

                {/* Tính năng chung */}
                <View style={styles.viewContainer}>
                    {features.map(i => <FeatureButton label={i.label} icon={i.icon} color={i.color} onPress={handleStoreRegister} key={i.label} />)}
                </View>

            </ScrollView>
            {/* </View> */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 0,
        backgroundColor: '#ffffff',
    },
    viewContainer: {
        backgroundColor: '#fff',
        padding: 7
    },
    button: {
        backgroundColor: '#151515',
    },
    buttonText: {
        color: '#ffffff',
    },
    row: {
        flexDirection: "row"
    },
    centerCol: {
        justifyContent: 'center'
    },
    feature: {

    }
})

export default Profile; 