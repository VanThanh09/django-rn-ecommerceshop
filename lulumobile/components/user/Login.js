import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, IconButton, TextInput } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext, MyDispatchContext } from "../../configs/MyContext";
import { CommonActions } from '@react-navigation/native';

const Login = ({ route }) => {
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

    const { cartDispatch } = useContext(CartContext);

    useEffect(() => {
        // Khi route, nav thay đổi thì useEffect sẽ tạo call back với closure mới => các biến sẽ được truy xuất mới nhấtAdd commentMore actions
        const { prevScreen } = route.params || {}

        if (prevScreen) {
            const handleGoBack = () => {
                if (prevScreen.nestedScreen) {
                    nav.navigate(prevScreen.nestedScreen, { screen: prevScreen.previousRoute, params: { ...prevScreen.prevRouteParams } })
                }
                else {
                    nav.navigate(prevScreen.previousRoute, { ...prevScreen.prevRouteParams })
                }

                // Sau khi quay trở về thì xóa trang login vừa rồi đi
                nav.dispatch(state => {
                    // Case 1: Login is the only route → replace entire stack
                    if (state.routes.length === 1 && state.routes[0].name === 'login') {
                        return CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'profileMain' }], // Fallback to index screen (màn hình Tài khoản)
                        });
                    }

                    // Case 2: Have something exist in account stack
                    const routes = state.routes.filter(r => r.name !== 'login');
                    return CommonActions.reset({
                        ...state,
                        routes,
                        index: routes.length - 1, // Prevent index overflow, active the last screen visitedAdd commentMore actions
                    });
                })
            }

            nav.setOptions({
                headerLeft: () => (
                    <IconButton icon="arrow-left" size={25} iconColor="#333" onPress={handleGoBack} style={{ marginLeft: -12 }} />
                )
            });
        }

    }, [route, nav]);

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
                    'client_id': 'sBSm4JuvTR5IuZXxQ7JIFXzHG6u5yWiJp6YPjR8e',
                    'client_secret': 'p4oY40jrnztZ4XroNsxRD24dqso6DhoKlgSUR0LZ6upNwiuqu2abdM614IvutkyNUhyBpSg03AtHWNUR238lF6Ji46i5EYSUPiHnonnnw8G5uq5yZubVgc2f962Bsu3u',
                    'grant_type': 'password'
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                await AsyncStorage.setItem('token', res.data.access_token);

                const token = await AsyncStorage.getItem('token');
                let u = await authApis(token).get(endpoints['current_user']);

                dispatch({
                    "type": "login",
                    "payload": u.data
                });

                // cart- infomation
                let cart = await authApis(token).get(endpoints.cart_basic_info);

                cartDispatch({ type: 'user_logged_in', payload: cart.data })

                //// /// const { nestedScreen, previousRoute, prevRouteParams } = route.params || {}
                const { screenAfterLogin } = route.params || {}

                // Login thành công
                if (screenAfterLogin) {
                    if (screenAfterLogin.nestedScreen) {
                        nav.navigate(screenAfterLogin.nestedScreen, { screen: screenAfterLogin.route, params: { ...screenAfterLogin.params } })
                    } else {
                        nav.navigate(screenAfterLogin.previousRoute, { ...screenAfterLogin.params })
                    }

                    // Reset account stack (Mystack) to active the Profile screen wipe the screen login in the history state
                    nav.dispatch(state => {
                        // Case 1: Login is the only route → replace entire stack
                        if (state.routes.length === 1 && state.routes[0].name === 'login') {
                            return CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'index' }], // Fallback to index screen
                            });
                        }

                        // Case 2: Have something exist in account stack
                        const routes = state.routes.filter(r => r.name !== 'login');
                        return CommonActions.reset({
                            ...state,
                            routes,
                            index: routes.length - 1, // Prevent index overflow, active the last screen visited
                        });
                    })
                }
                else
                    nav.navigate('account', {
                        screen: 'profileMain',
                    })
            } catch (ex) {
                if (ex.response && ex.response.status === 400) {
                    setMsg("Sai tên đăng nhập hoặc mật khẩu");
                } else {
                    setMsg("Đã có lỗi xảy ra thử lại sau")
                }
                // console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.container]} contentContainerStyle={{ paddingBottom: 70 }}>
            <HelperText style={[MyStyles.m, { textAlign: 'center', marginTop: 10 }]} type="error" visible={msg}>
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