import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContext";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyle from "../../styles/MyStyle";

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

    return (
        <SafeAreaView>
            <View>
                <Text>Chào {user?.first_name} {user?.last_name}!</Text>
                <Button
                    onPress={logout}
                    mode="contained"
                    style={[{ marginTop: 10 }, MyStyle.m, style.button]}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={style.buttonText}>Đăng xuất</Text>
                    )}
                </Button>
            </View>
        </SafeAreaView>
    );
}

const style = StyleSheet.create({
    button: {
        backgroundColor: '#151515',
    },
    buttonText: {
        color: '#ffffff',
    }
})

export default Profile; 