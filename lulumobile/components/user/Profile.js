import { useContext, useState } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HearderProfile from "../ui/profilePage/HeaderProfile";
import FeatureButton from "../ui/profilePage/FeatureButton";
import { SafeAreaView } from "react-native-safe-area-context";

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

    const sellerFeatures = [{
        label: "Thêm sản phẩm",
        icon: "plus-box",
        color: "#3a5998"
    }]

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
    const handleStoreRegister = () => (nav.navigate("storeRegister"))
    const handleAddProduct = () => (nav.navigate('addProduct'))

    return (
        <SafeAreaView>
            {/* <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}> */}
            <HearderProfile onLoginPress={pressLogin} onRegisterPress={pressRegister} onLogoutPress={logout} />
            <ScrollView contentContainerStyle style={[styles.container]}>

                {/* Hiện tính năng cho người bán */}
                {user !== null && user.user_role === 'SE' && (
                    <View style={styles.viewContainer}>
                        {sellerFeatures.map(i => <FeatureButton label={i.label} icon={i.icon} color={i.color} onPress={handleAddProduct} key={i.label} />)}
                    </View>
                )}

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