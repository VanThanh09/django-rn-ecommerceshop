import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, Icon, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStyle from "../../styles/MyStyle";
import * as ImagePicker from 'expo-image-picker';
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from 'expo-auth-session';

const Register = () => {
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: '845623906398-asd5ud30cpg573vroa0b28at336eiakk.apps.googleusercontent.com',
            scopes: ['openid', 'profile', 'email'],
            redirectUri: AuthSession.makeRedirectUri({ useProxy: false }),
        },
        {
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        }
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            console.log('ID Token:', authentication?.idToken);
        }
    }, [response]);

    const info = [{
        label: "Họ",
        field: "last_name",
        securityTextEntry: false,
        autoCapitalize: "words"
    }, {
        label: "Tên",
        field: "first_name",
        securityTextEntry: false,
        autoCapitalize: "words"
    }, {
        label: "Email",
        field: "email",
        securityTextEntry: false,
        autoCapitalize: "none"
    }, {
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
    }, {
        label: "Xác thực mật khẩu",
        field: "confirm",
        securityTextEntry: true,
        rIcon: "eye",
        autoCapitalize: "none"
    }];


    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirm: false
    });
    const [msg, setMsg] = useState(null);
    const nav = useNavigation();


    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const viewPassword = (field) => {
        setShowPassword({ ...showPassword, [field]: !showPassword[field] })
    };


    const pick = async () => {
        let { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result =
                await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled)
                console.info(result.assets[0])
            setState(result.assets[0], "avatar");
        }
    }


    const validate = () => {
        for (let i of info)
            if (!(i.field in user) || user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }

        if (user.password !== user.confirm) {
            setMsg("Mật khẩu không khớp!");
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(user.email)) {
            setMsg("Vui lòng nhập email hợp lệ!");
            return false;
        }

        if (!("avatar" in user) || user["avatar"] === '') {
            setMsg("Vui lòng chọn avatar");
            return false;
        }

        return true;
    }

    const register = async () => {
        if (validate()) {
            try {

                setLoading(true);
                setMsg(null);
                console.info(1)

                let form = new FormData();
                for (let key in user) {
                    if (key != "confirm") {
                        if (key === 'avatar') {
                            let fileType = user.avatar.uri.split('.').pop(); // lấy phần đuôi file (ví dụ jpg, png)
                            let mimeType = `image/${fileType}`;

                            form.append(key, {
                                uri: user.avatar.uri,
                                name: user.avatar.name || 'avatar.jpg',
                                type: mimeType || 'image/jpeg',
                            });
                        } else
                            form.append(key, user[key]);
                    }
                }

                console.info(form);

                await Apis.post(endpoints['register'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                nav.navigate('home');
            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const result = await promptAsync({ useProxy: false });
            console.log("Result from Google Login:", result);
        } catch (error) {
            console.error("Error in Google Login:", error);
        }
    };

    return (
        <SafeAreaView style={[style.container, { paddingBottom: 0 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[style.title]}>Đăng Ký Tài Khoản</Text>

                {/* Register with username password */}
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
                    right={i.rIcon ? <TextInput.Icon icon={showPassword[i.field] ? "eye-off" : "eye"} onPress={() => viewPassword(i.field)} size={20} /> : null}
                />)}

                <View style={[{ flexDirection: 'row', alignItems: 'center' }, MyStyle.m]}>
                    {user.avatar ? <Image source={{ uri: user.avatar.uri }} style={[style.avatar, { width: '25%' }]} /> : <Icon source="account-circle-outline" size={80} />}
                    <TouchableOpacity style={[style.pickButton, { width: '70%' }]} onPress={pick}>
                        <Text style={style.pickButtonText}>Chọn ảnh đại diện...</Text>
                    </TouchableOpacity>
                </View>

                <Button
                    onPress={register}
                    disabled={loading}
                    mode="contained"
                    style={[{ marginTop: 10 }, MyStyle.m, style.button]}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={style.buttonText}>Đăng ký</Text>
                    )}
                </Button>


                {/* Register with social account */}
                {/* <View style={style.orContainer}>
                    <View style={style.line} />
                    <Text style={style.orText}>Hoặc</Text>
                    <View style={style.line} />
                </View>

                <View style={{ marginTop: 10 }}>
                    <TouchableOpacity style={style.socialButton} onPress={handleGoogleLogin}>
                        <Image source={require('../../assets/google.png')} style={[style.socialIcon]} />
                        <Text style={[style.socialButtonText]}>Đăng ký với Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={style.socialButton} onPress={() => console.log('Đăng ký với Facebook')}>
                        <Image source={require('../../assets/facebook.png')} style={[style.socialIcon]}></Image>
                        <Text style={style.socialButtonText}>Đăng ký với Facebook</Text>
                    </TouchableOpacity>
                </View> */}

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

export default Register;