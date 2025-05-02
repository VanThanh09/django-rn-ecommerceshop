import { useContext, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, Icon, TextInput } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContext";

const Login = () => {
    const info = [{
        label: "Tên đăng nhập",
        field: "username",
        securityTextEntry: false,
        autoCapitalize: "none"
    }, {
        label: "Mật khẩu",
        field: "password",
        securityTextEntry: true,
        rIcon: "eye",
        autoCapitalize: "none"
    }];


    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState(null);
    const nav = useNavigation();
    const dispatch = useContext(MyDispatchContext);


    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const viewPassword = () => {
        setShowPassword(!showPassword)
    };

    const validate = () => {
        for (let i of info)
            if (!(i.field in user) || user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }
        return true;
    }

    const login = async () => {
        if (validate()) {
            try {
                setLoading(true);
                setMsg(null);

                let res = await Apis.post(endpoints['login'], {
                    ...user,
                    'client_id': 'lmshBZpKvz0r3x51CfQ2Hay8f0C0TvVIB8Blb9OJ',
                    'client_secret': 'SWVNeiOP5z4LyZgs8ErBcKZUA6wy6zzBs0A2eDyu7sdHau9uZ60LBNJFdvEbWtbBPw1mHSDlFyT2pqqGfwe8wOUYjfmPGnVqL3cHZkE7AH5EPZWqEJYVBcXykJ6yVBD5',
                    'grant_type': 'password'
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                await AsyncStorage.setItem('token', res.data.access_token);

                const token = await AsyncStorage.getItem('token');
                console.info(token)
                let u = await authApis(token).get(endpoints['current-user']);
                console.info(u.data)

                dispatch({
                    "type": "login",
                    "payload": u.data
                });

                nav.navigate('home');
            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.container]}>
            <HelperText style={MyStyles.m} type="error" visible={msg}>
                {msg}
            </HelperText>

            {info.map(i => <TextInput key={i.field}
                label={i.label}
                value={user[i.field]}
                style={[MyStyles.m, styles.input]}
                // outlineStyle={{ borderRadius: 17, }}
                onChangeText={text => setState(text, i.field)}
                secureTextEntry={i.securityTextEntry && !showPassword}
                autoCapitalize={i.autoCapitalize}
                cursorColor="#5d6d75"
                activeOutlineColor="#151515"
                activeUnderlineColor="#151515"
                // mode="outlined"
                right={i.rIcon ? <TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => viewPassword()} size={20} /> : null}
            />)}

            <Button
                onPress={login}
                disabled={loading}
                mode="contained"
                style={[{ marginTop: 10 }, MyStyles.m, styles.button]}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Đăng nhập</Text>
                )}
            </Button>

            {/* Register with social account */}
            <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>Hoặc</Text>
                <View style={styles.line} />
            </View>

            <View style={{ marginTop: 10 }}>
                <TouchableOpacity style={styles.socialButton} onPress={() => promptAsync({ useProxy: true, showInRecents: true })}>
                    <Image source={require('../../assets/google.png')} style={[styles.socialIcon]} />
                    <Text style={[styles.socialButtonText]}>Đăng ký với Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={() => console.log('Đăng ký với Facebook')}>
                    <Image source={require('../../assets/facebook.png')} style={[styles.socialIcon]}></Image>
                    <Text style={styles.socialButtonText}>Đăng ký với Facebook</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        paddingTop: 0
    },
    input: {
        backgroundColor: '#fff',
        fontSize: 14,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 1
    },
    buttonText: {
        color: '#ffffff',
    },
    pickButton: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 17,
        alignItems: 'center',
        borderWidth: 1,
        margin: 10,
        borderColor: '#5d6d75',
    },
    pickButtonText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#5d6d75',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#151515',
        margin: 5,
        borderRadius: 1,
    },
    socialButtonText: {
        color: '#151515',
        fontSize: 14,
        fontWeight: 'bold',
    },
    socialIcon: {
        width: 18,
        height: 18,
        margin: 10
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        marginTop: 30
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc',
    },
    orText: {
        marginHorizontal: 10,
        fontSize: 14,
        color: '#999',
    },
})

export default Login;