import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    View,
    ActivityIndicator,
    StyleSheet,
    SectionList,
    Image,
    Text,
    TouchableOpacity,
    Alert,
} from "react-native";
import { authApis, endpoints } from "../../configs/Apis";
import { Icon } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";
import { useParentRoute } from "../utils/RouteProvider";
import PendingOrder from "../ui/storePage/PendingOrder";
import ListOrderDetail from "../ui/storePage/ListOrderDetail";

const ManageOrders = ({ route }) => {
    const [orderDetail, setOrderDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderStatus, setOrderStatus] = useState('PE');
    const nav = useNavigation();

    const listStatus = [
        { label: 'Đang chờ', value: 'PE' },
        { label: 'Đang vận chuyển', value: 'SH' },
        { label: 'Thành công', value: 'SU' },
    ]


    const loadOrderDetail = async (status) => {
        setOrderDetail([])
        try {
            setLoading(true);

            let token = await AsyncStorage.getItem("token");
            let res = await authApis(token).get(endpoints["orderOfStore"](status));

            setOrderDetail(res.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePressChat = (customerId) => {
        const parentNav = nav.getParent();
        const nestedScreen = parentNav?.getState()?.routeNames[parentNav?.getState().index];
        if (customerId && nestedScreen) {
            nav.navigate('account', {
                screen: 'chat', params: {
                    "storeOwnerId": customerId,
                    nestedScreen: nestedScreen,
                    previousRoute: route.name,
                    prevRouteParams: route.params,
                }
            })
        }
    }

    const handlePressShipping = async (orderDetailId) => {
        let token = await AsyncStorage.getItem('token')
        let allUpdated = true;

        for (let o of orderDetailId) {
            try {
                let res = await authApis(token).patch(endpoints["update_order_detail"](o), {
                    "order_status": "SH"
                })
                if (res.status !== 200) {
                    allUpdated = false;
                    Alert.alert("Lỗi", "Lỗi không xác định");
                    return;
                }
            } catch (err) {
                isSuccessful = false;
                Alert.alert("Lỗi", "Lỗi kết nối hoặc máy chủ");
                return;
            }
        }
        if (allUpdated) {
            Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
            loadOrderDetail("PE");
        }
    }

    const handleSuccessOrder = async (orderDetailId) => {
        let token = await AsyncStorage.getItem('token')

        try {
            let res = await authApis(token).patch(endpoints["update_order_detail"](orderDetailId), {
                "order_status": "SU"
            })

            if (res.status === 200) {
                loadOrderDetail(orderStatus);
                return;
            } else {
                Alert.alert("Lỗi", "Lỗi kết nối hoặc máy chủ");
            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        loadOrderDetail(orderStatus);
    }, []);

    // useEffect(() => {
    //     console.log(JSON.stringify(orderDetail, null, 2));
    // }, [orderDetail]);

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {listStatus.map((item) => (
                    <TouchableOpacity
                        key={item.value}
                        style={[
                            styles.statusButton,
                            orderStatus === item.value && styles.activeStatusButton,
                            item.value === "SH" ? { flex: 1.5 } : { flex: 1 },
                        ]}
                        onPress={() => {
                            if (loading || orderStatus === item.value) return;
                            setOrderStatus(item.value);
                            loadOrderDetail(item.value);
                        }}
                    >
                        <Text style={[
                            styles.statusButtonText,
                            orderStatus === item.value && styles.activeStatusButtonText,
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>

                ))}
            </View>

            <View style={{ flex: 1 }}>
                {!loading ? <>

                    {orderDetail.length === 0 &&
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Không có đơn hàng</Text>
                        </View>
                    }

                    {orderDetail.length > 0 && orderStatus === 'PE' && <>
                        <PendingOrder handlePressShipping={handlePressShipping} handlePressChat={handlePressChat} orderDetail={orderDetail} />
                    </>
                    }

                    {orderDetail.length > 0 && (orderStatus === 'SH' || orderStatus === 'SU') && <>
                        <ListOrderDetail handlePressChat={handlePressChat} orderDetail={orderDetail} isSeller={true} handleSuccessOrder={handleSuccessOrder} />
                    </>}

                </> : <>
                    <ActivityIndicator size="large" style={{ marginTop: 100 }} />
                </>}
            </View>

        </View>
    )
};

const styles = StyleSheet.create({
    statusButton: {
        paddingVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRightWidth: 0.5,
        borderBottomWidth: 0.4,
    },
    activeStatusButton: {
        backgroundColor: '#fa5230',
    },
    statusButtonText: {
        color: '#fa5230',
        fontWeight: '500',
        textAlign: 'center',
    },
    activeStatusButtonText: {
        color: '#fff',
    }
});

export default ManageOrders;
