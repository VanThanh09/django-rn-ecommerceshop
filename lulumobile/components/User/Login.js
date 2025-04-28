import { useContext, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStyle from "../../styles/MyStyle";
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
                    'client_id': 'bKbCdqsy9J5Gm2wv9I0Gjz5RRdelnDKMHjgXBSwU',
                    'client_secret': 'XPGdUEqjDIu1lLgb3CPEkqwYYRwZaKuMAoapbe8Q9AJPK5pPTi15EGzCHh69uvduBUdcbIX0No3oW8brFELKyxCBwYoEVjMIuM6wTnY7G4uXLvNrsh4aCwJxWdQyCJCa',
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
        <SafeAreaView style={[style.container, { paddingBottom: 0 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[style.title]}>Đăng Nhập</Text>

                <HelperText style={MyStyle.m} type="error" visible={msg}>
                    {msg}
                </HelperText>

                {info.map(i => <TextInput key={i.field}
                    label={i.label}
                    value={user[i.field]}
                    style={[MyStyle.m, style.input]}
                    outlineStyle={{ borderRadius: 17, }}
                    onChangeText={text => setState(text, i.field)}
                    secureTextEntry={i.securityTextEntry && !showPassword[i.field]}
                    autoCapitalize={i.autoCapitalize}
                    cursorColor="#5d6d75"
                    activeOutlineColor="#5d6d75"
                    mode="outlined"
                    right={i.rIcon ? <TextInput.Icon icon={showPassword[i.field] ? "eye-off" : "eye"} onPress={() => viewPassword()} size={20} /> : null}
                />)}

                <Button
                    onPress={login}
                    disabled={loading}
                    mode="contained"
                    style={[{ marginTop: 10 }, MyStyle.m, style.button]}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={style.buttonText}>Đăng nhập</Text>
                    )}
                </Button>
            </ScrollView>
        </SafeAreaView >
    )
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 15
    },
    input: {
        backgroundColor: '#fff',
        fontSize: 14,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#151515',
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
        borderRadius: 50,
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