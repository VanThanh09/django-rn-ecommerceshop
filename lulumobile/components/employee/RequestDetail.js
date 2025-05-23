import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";

const RequestDetail = ({ route }) => {
    const requestId = route.params?.requestId;
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [reason, setReason] = useState();

    const [request, setRequest] = useState();

    const loadRequest = async () => {
        try {
            let token = await AsyncStorage.getItem("token");

            let res = await authApis(token).get(endpoints['action_verification'](requestId));
            console.log(res.data);
            setRequest(res.data);
        } catch {

        } finally {
        }
    }

    const validate = () => {
        if (!reason || reason.trim() === "") {
            Alert.alert('Thông báo', 'Vui lòng nhập lý do', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                }])
            return false;
        }
        return true;
    }

    const checkReject = () => {
        if (validate()) {
            Alert.alert('Xác nhận', 'Bạn sẽ từ chối yêu cầu', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                }, {
                    text: 'Xác nhận',
                    onPress: () => handleAction("reject"),
                },
            ])
        }
    }

    const checkAccept = () => {
        Alert.alert('Xác nhận', 'Bạn sẽ từ đồng ý cầu. Cửa hàng sẽ được tạo!!', [
            {
                text: 'Cancel',
                style: 'cancel',
            }, {
                text: 'Xác nhận',
                onPress: () => handleAction("accept"),
            },
        ])
    }

    const handleAction = async (action) => {
        try {
            setLoading(true);

            let token = await AsyncStorage.getItem("token");

            let url = `${endpoints['action_verification'](requestId)}${action}/`;

            let res;

            if (action === "reject") {
                res = await authApis(token).patch(url, {
                    'reason': reason,
                });
            } else {
                res = await authApis(token).patch(url);
            }

            if (res.status === 200) {
                const message = action === "accept" ? "chấp nhận" : "từ chối";
                Alert.alert('Xong', `Bạn đã ${message} yêu cầu.`, [{
                    text: "Xong",
                    style: 'cancel',
                }])
                // nav.navigate('requests', {
                //     screen: 'employeeMain',
                // });
                nav.reset({
                    index: 0,
                    routes: [{ name: 'employeeMain' }],
                });
            }
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRequest();
    }, []);

    if (!request) return <ActivityIndicator style={{ marginTop: 50 }} />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Logo: </Text>
                <Image source={{ uri: request.temp_store_logo }} style={styles.logo} />

                <Text style={styles.label}>Tên cửa hàng:</Text>
                <Text style={styles.value}>{request.temp_store_name}</Text>

                <Text style={styles.label}>Chủ sở hữu:</Text>
                <Text style={styles.value}>{request.temp_owner_name} ( Số căn cước: {request.temp_owner_ident} )</Text>

                <Text style={styles.label}>Địa chỉ cửa hàng:</Text>
                <Text style={styles.value}>{request.temp_store_address}</Text>

                <Text style={styles.label}>Mô tả cửa hàng:</Text>
                <Text style={styles.value}>{request.temp_store_description}</Text>

                <Text style={styles.label}>Ngày tạo yêu cầu:</Text>
                <Text style={styles.value}>{new Date(request.created_date).toLocaleString()}</Text>

                <Text style={styles.label}>Trạng thái:</Text>
                <Text style={styles.value}>{request.status === 'PE'}Đang chờ xác thực</Text>

                <Text style={styles.label}>Lý do (nếu từ chối):</Text>
                <TextInput placeholder="Nhập lí do" style={[styles.input]} value={reason} onChangeText={setReason} />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.btn, MyStyles.bgPrimaryColor]} onPress={() => checkAccept()}>
                        {loading ? <ActivityIndicator /> : <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>Chấp nhận</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#fff' }]} onPress={() => checkReject()}>
                        {loading ? <ActivityIndicator /> : <Text style={{ textAlign: 'center', color: '#fa5230', fontWeight: 'bold' }}>Từ chối</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        flex: 1,
    },
    logo: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
        marginBottom: 16,
    },
    label: {
        fontWeight: "bold",
        marginVertical: 8,
    },
    value: {
        marginBottom: 8,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    btn: {
        flex: 1,
        padding: 10,
        margin: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#fa5230',
    },
    input: {
        borderBottomWidth: 1,
    }
});

export default RequestDetail;