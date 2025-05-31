import { useContext, useState } from "react";
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Icon } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext, CartContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import HearderProfile from "../ui/profilePage/HeaderProfile";
import FeatureButton from "../ui/profilePage/FeatureButton";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const [loading, setLoading] = useState(false);

    const features = [{
        label: "Đăng ký cửa hàng",
        icon: "store",
        color: "#3a5998"
    }]

    const {cartDispatch} = useContext(CartContext)
    const logout = async () => {
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
                screen: "index"
            })
        } catch (ex) {
            console.error(ex)
        } finally {
            setLoading(false);
        }
    }

    const pressLogin = () => (nav.navigate("login"))
    const pressRegister = () => (nav.navigate("register"))
    const handleStoreRegister = () => (nav.navigate("storeRegister"))


    return (
        <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <HearderProfile onLoginPress={pressLogin} onRegisterPress={pressRegister} onLogoutPress={logout} />
            <ScrollView contentContainerStyle={{ paddingBottom: 70 }} style={[styles.container]}>
                {features.map(i => <FeatureButton label={i.label} icon={i.icon} color={i.color} onPress={handleStoreRegister} key={i.label} />)}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 0,
        backgroundColor: '#ffffff',
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