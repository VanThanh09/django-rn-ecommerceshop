import { useContext, useState } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import HearderProfile from "../ui/profilePage/Header";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const [loading, setLoading] = useState(false);

    const logout = async () => {
        try {
            setLoading(true);
            await AsyncStorage.removeItem('token');
            dispatch({
                type: "logout"
            });

            nav.navigate("home")
        } catch (ex) {
            console.error(ex)
        } finally {
            setLoading(false);
        }
    }

    const pressLogin = () => (nav.navigate("login"))
    const pressRegister = () => (nav.navigate("register"))


    return (
        <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <HearderProfile onLoginPress={pressLogin} onRegisterPress={pressRegister} onLogoutPress={logout} />
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#151515',
    },
    buttonText: {
        color: '#ffffff',
    }
})

export default Profile; 