import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, Icon, TextInput } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import * as ImagePicker from 'expo-image-picker';
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const Register = () => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirm: false
    });
    const [msg, setMsg] = useState(null);
    const nav = useNavigation();

    // const [token, setToken] = useState([]);

    // const [request, response, promptAsync] = AuthSession.useAuthRequest(
    //     {
    //         expoClientId: "845623906398-asd5ud30cpg573vroa0b28at336eiakk.apps.googleusercontent.com",
    //         androidClientId: "845623906398-1j0di4t3lr5366sq598va7u3oleip69b.apps.googleusercontent.com",
    //         iosClientId: "845623906398-dlpr00vebtmliibkct1v8ebtd4sst062.apps.googleusercontent.com"
    //     }
    // );


    // useEffect(() => {
    //     if (response?.type == "success") {
    //         console.info(response.authentication.accessToken);
    //         setToken(response.authentication.accessToken);
    //     }
    // }, [response]);


    // Info register new account
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

    // Set state for user
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
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setState(result.assets[0], "avatar");
            }
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

                let form = new FormData();
                for (let key in user) {
                    if (key != "confirm") {
                        if (key === 'avatar') {
                            form.append(key, {
                                uri: user.avatar.uri,
                                name: user.avatar.fileName || 'avatar.jpg',
                                type: user.avatar.mimeType || 'image/jpeg',
                            });
                        } else
                            form.append(key, user[key]);
                    }
                }

                await Apis.post(endpoints['register'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                nav.navigate('login');
            } catch (ex) {
                if (ex.response && ex.response.status === 400) {
                    setMsg("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác!")
                } else {
                    setMsg("Lỗi không xác định!")
                }
            } finally {
                setLoading(false);
            }
        }
    }

    // const handleGoogleLogin = async () => {
    //     const result = await promptAsync({ useProxy: true });
    // };


    return (
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.container]} contentContainerStyle={{ paddingBottom: 70 }}>
            {/* Register with username password */}
            {msg === null ? <>
            </> : <>
                <HelperText style={[MyStyles.m]} type="error">
                    {msg}
                </HelperText>
            </>}
            {
                info.map(i => <TextInput key={i.field}
                    label={i.label}
                    value={user[i.field]}
                    style={[MyStyles.m, styles.input]}
                    // outlineStyle={{ borderRadius: 17, }}
                    onChangeText={text => setState(text, i.field)}
                    secureTextEntry={i.securityTextEntry && !showPassword[i.field]}
                    autoCapitalize={i.autoCapitalize}
                    cursorColor="#5d6d75"
                    activeOutlineColor="#5d6d75"
                    activeUnderlineColor="#151515"
                    // mode="outlined"
                    right={i.rIcon ? <TextInput.Icon icon={showPassword[i.field] ? "eye-off" : "eye"} onPress={() => viewPassword(i.field)} size={20} /> : null}
                />)
            }

            <View style={[{ flexDirection: 'row', alignItems: 'center' }, MyStyles.m]}>
                {user.avatar ? <Image source={{ uri: user.avatar.uri }} style={[styles.avatar, { marginRight: 10 }]} /> : <Icon source="account-circle-outline" size={75} />}
                <TouchableOpacity style={[styles.pickButton, { width: '70%' }]} onPress={pick}>
                    <Text style={styles.pickButtonText}>Chọn ảnh đại diện...</Text>
                </TouchableOpacity>
            </View>

            <Button
                onPress={register}
                disabled={loading}
                mode="contained"
                style={[{ marginTop: 10 }, MyStyles.m, styles.button]}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Đăng ký</Text>
                )}
            </Button>

            {/* Register with social account */}
            {/* <View style={styles.orContainer}>
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
            </View> */}
        </ScrollView >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
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
        backgroundColor: '#fa5230',
        borderRadius: 1
    },
    buttonText: {
        color: '#ffffff',
    },
    pickButton: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 1,
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
        width: 75,
        height: 72,
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

export default Register;