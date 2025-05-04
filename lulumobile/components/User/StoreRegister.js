import { useContext, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, Icon, PaperProvider, TextInput } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import { MyUserContext } from "../../configs/MyContext";
import * as ImagePicker from 'expo-image-picker';
import Stepper from "../ui/profilePage/Stepper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StoreRegister = () => {
    const info = [{
        label: "Tên cửa hàng",
        field: "temp_store_name",
        securityTextEntry: false,
    }, {
        label: "Mô tả của hàng",
        field: "temp_store_description",
        securityTextEntry: false,
    }];

    const ident = [{
        label: "Họ tên chủ cửa hàng",
        field: "temp_owner_name",
        securityTextEntry: false,
    }, {
        label: "Căn cước công dân",
        field: "temp_owner_ident",
        securityTextEntry: false,
    }, {
        label: "Địa chỉ cửa hàng",
        field: "temp_store_address",
        securityTextEntry: false,
    }];

    const steps = [
        "Thông tin shop",
        "Thông tin định danh",
        "Hoàn tất"
    ]


    const [tempStore, setTempStore] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const user = useContext(MyUserContext);
    const nav = useNavigation();
    const [currentStep, setCurrentStep] = useState(0);

    const setState = (value, field) => {
        setTempStore({ ...tempStore, [field]: value });
    };


    const validate = () => {
        for (let i of info)
            if (!(i.field in tempStore) || tempStore[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }
        for (let i of ident)
            if (!(i.field in tempStore) || tempStore[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }

        return true;
    }

    const pickImage = async () => {
        let { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setState(result.assets[0], "temp_store_logo");
            }
        }
    }

    const handleStoreRegister = async () => {
        if (validate()) {
            try {
                setMsg(null);
                setLoading(true);

                let form = new FormData();
                for (let key in tempStore) {
                    if (key === 'temp_store_logo') {
                        form.append(key, {
                            uri: tempStore.temp_store_logo.uri,
                            name: tempStore.temp_store_logo.fileName || 'temp_store_logo.jpg',
                            type: tempStore.temp_store_logo.mimeType || 'image/jpeg',
                        });
                    } else
                        form.append(key, tempStore[key]);
                }

                const token = await AsyncStorage.getItem('token');

                try {
                    let res = await authApis(token).post(endpoints['verification_seller'], form, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    })
                    setCurrentStep(prev => prev + 1);
                } catch (ex) {
                    if (ex.response && ex.response.data) {
                        console.error("Lỗi từ server:", ex.response.data);
                        if (ex.response.data.detail === "The request already exists.")
                            setMsg("Bạn đã gửi thông tin rồi vui lòng chờ phản hồi từ nhân viên!");
                    } else {
                        console.error("Lỗi không xác định:", ex);
                        setMsg("Đã có lỗi xảy ra.");
                    }
                }

            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    const onNextStepPress = () => {
        let check = true;
        for (let i of info)
            if (!(i.field in tempStore) || tempStore[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                check = false;
            }

        if (!("temp_store_logo" in tempStore) || tempStore["temp_store_logo"] === '') {
            setMsg("Vui lòng chọn logo cho cửa hàng!");
            return false;
        }

        if (check) {
            setMsg(null);
            setCurrentStep(prev => prev + 1);
        }
    }

    const onPrevStepPress = () => {
        setMsg(null);
        setCurrentStep(prev => prev - 1);
    }

    return (
        <View style={[styles.container]}>
            {user === null ? <>
                <View style={[{ justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
                    <Text style={{ textAlign: 'center' }}>
                        Vui lòng đăng nhập trước
                    </Text>
                    <Button
                        onPress={() => nav.navigate("login")}
                        mode="contained"
                        style={[{ marginTop: 10 }, MyStyles.m, styles.button]}>
                        <Text style={styles.buttonText}>Đăng nhập</Text>
                    </Button>
                </View>

            </> : <>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 70 }}>
                    <Stepper steps={steps} currentStep={currentStep} />
                    {msg === null ? <>
                    </> : <>
                        <HelperText style={MyStyles.m} type="error" visible={msg}>
                            {msg}
                        </HelperText>
                    </>}
                    {currentStep === 0 ? <>
                        <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, MyStyles.m]}>
                            {tempStore.temp_store_logo ? <Image source={{ uri: tempStore.temp_store_logo.uri }} style={[styles.avatar]} /> : <Icon source="incognito-circle" size={75} />}
                            <TouchableOpacity style={[styles.pickButton, { width: '70%' }]} onPress={pickImage}>
                                <Text style={styles.pickButtonText}>Chọn logo cửa hàng...</Text>
                            </TouchableOpacity>
                        </View>
                        {info.map(i => <TextInput key={i.field}
                            label={i.label}
                            value={tempStore[i.field]}
                            style={[MyStyles.m, styles.input]}
                            onChangeText={text => setState(text, i.field)}
                            secureTextEntry={i.securityTextEntry}
                            cursorColor="#5d6d75"
                            activeOutlineColor="#151515"
                            activeUnderlineColor="#151515"
                        />)}

                        <Button
                            onPress={onNextStepPress}
                            disabled={loading}
                            mode="contained"
                            style={[{ marginTop: 20 }, MyStyles.m, styles.button]}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Tiếp theo</Text>
                            )}
                        </Button>

                    </> : <>

                        {currentStep === 1 ? <>
                            {ident.map(i => <TextInput key={i.field}
                                label={i.label}
                                value={tempStore[i.field]}
                                style={[MyStyles.m, styles.input]}
                                onChangeText={text => setState(text, i.field)}
                                secureTextEntry={i.securityTextEntry}
                                cursorColor="#5d6d75"
                                activeOutlineColor="#151515"
                                activeUnderlineColor="#151515"
                            />)}
                            <Text style={[styles.subTitle, { marginTop: 20 }]}>Vui lòng kiểm tra lại thông tin trước khi nhấn đăng ký! Chúng tôi sẽ từ chối yêu cầu của bạn nếu thông tin không chính xác.</Text>

                            <Button
                                onPress={handleStoreRegister}
                                disabled={loading}
                                mode="contained"
                                style={[{ marginTop: 20 }, MyStyles.m, styles.button]}>
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Đăng ký cửa hàng</Text>
                                )}
                            </Button>
                            <Button style={[{
                                borderRadius: 3,
                                borderWidth: 1,
                                borderColor: '#fff',
                                backgroundColor: '#fff'
                            }, MyStyles.m]}
                                onPress={onPrevStepPress}>
                                <Text style={{ color: "#fa5230" }}>Trở lại</Text>
                            </Button>

                        </> : <>

                            <View style={{ alignItems: 'center', marginVertical: 20, }}>
                                <Icon source="check-circle" size={50} color="#4dd074" />
                                <Text style={[styles.title]}>Đăng ký thành công</Text>
                                <Text style={[styles.subTitle]}>Vui lòng chờ nhân viên chúng tôi xác nhận thông tin của bạn</Text>
                                <Button
                                    onPress={() => nav.navigate("home")}
                                    mode="contained"
                                    style={[{ marginTop: 10 }, MyStyles.m, styles.button]}>
                                    <Text style={styles.buttonText}>Quay lại trang chủ</Text>
                                </Button>
                            </View>
                        </>}
                    </>}

                </ScrollView>
            </>}
        </View>
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
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subTitle: {
        fontSize: 15,
        color: '#333',
        textAlign: 'center',
        margin: 10,
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 1,
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
        height: 75,
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

export default StoreRegister;