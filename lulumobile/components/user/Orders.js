import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { authApis, endpoints } from "../../configs/Apis";
import ListOrderDetail from "../ui/storePage/ListOrderDetail";
import { Button, IconButton } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContext";
import MyStyles from "../../styles/MyStyles";

const Orders = ({ route }) => {
    const [orderDetail, setOrderDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderStatus, setOrderStatus] = useState('PE');

    const [page, setPage] = useState(1);
    const [loadMore, setLoadMore] = useState(false);

    const nav = useNavigation();
    const user = useContext(MyUserContext);

    const listStatus = [
        { label: 'Đang chờ', value: 'PE' },
        { label: 'Đang vận chuyển', value: 'SH' },
        { label: 'Đã nhận', value: 'SU' },
    ]

    const loadOrderDetail = async (status, isFirstPage) => {

        try {
            setLoadMore(true);

            if (isFirstPage) {
                setOrderDetail([]);
            }

            let token = await AsyncStorage.getItem('token');
            let currentPage = isFirstPage ? 1 : page;

            let url = `${endpoints['orderOfUser']}?status=${status}&page=${currentPage}`;

            let res = await authApis(token).get(url);

            let data = res.data.results ?? res.data;

            if (isFirstPage)
                setOrderDetail(data);
            else {
                setOrderDetail(prev => [...prev, ...data]);
            }

            if (res.data.next)
                setPage(currentPage + 1);
            else
                setPage(0);

            // console.log(JSON.stringify(res.data, null, 2));
        } catch (err) {
            console.log(err);
        } finally {
            setLoadMore(false);
        }
    }

    const handleLoadMore = () => {
        if (!loadMore && page !== 0 && orderDetail.length > 0) {
            loadOrderDetail(orderStatus);
        }
    };

    // useEffect(() => { console.log(page) }, [page])

    const handlePressChat = (storeOwnerId) => {
        const parentNav = nav.getParent();
        const nestedScreen = parentNav?.getState()?.routeNames[parentNav?.getState().index];
        if (storeOwnerId && nestedScreen) {
            nav.navigate('account', {
                screen: 'chat', params: {
                    "storeOwnerId": storeOwnerId,
                    nestedScreen: nestedScreen,
                    previousRoute: route.name,
                    prevRouteParams: route.params,
                }
            })
        }
    }

    const handleCancelOrder = async (orderDetailId) => {
        let token = await AsyncStorage.getItem('token');

        try {
            let res = await authApis(token).patch(endpoints["cancel_order_detail"](orderDetailId));

            if (res.status === 200) {
                Alert.alert("Thông báo", "Đã hủy đơn hàng thành công");
                loadOrderDetail(orderStatus, true);
                return;
            } else {
                Alert.alert("Lỗi", "Lỗi kết nối hoặc máy chủ");

            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        loadOrderDetail(orderStatus, true);
        try {
            nav.setOptions({
                headerLeft: () => (
                    <IconButton icon="arrow-left" size={26} iconColor="#333" style={{ marginLeft: -10 }}
                        onPress={() => nav.navigate('account', { screen: 'profileMain' })} />
                )
            })
        } catch (err) {
            console.log(err);
        }

    }, [])

    if (user === null) return (
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
    )

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
                            if (orderStatus === item.value) return;
                            setOrderStatus(item.value);
                            setPage(1);
                            loadOrderDetail(item.value, true);
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
                {/* {!loadMore ? <> */}
                {orderDetail?.length === 0 && !loadMore &&
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Không có đơn hàng</Text>
                    </View>
                }

                {orderDetail?.length === 0 && loadMore && <ActivityIndicator size="large" style={{ marginTop: 100 }} />}

                {orderDetail?.length > 0 && <>
                    <ListOrderDetail
                        handlePressChat={handlePressChat}
                        orderDetail={orderDetail}
                        handleCancelOrder={handleCancelOrder}
                        isSeller={false}
                        canComment={orderStatus === 'SU'}
                        orderStatus={orderStatus}
                        loadOrderDetail={loadOrderDetail}
                        onEndReached={handleLoadMore}
                        loadMore={loadMore} />
                </>}

                {/* {orderDetail?.length > 0 && (orderStatus === 'SH' || orderStatus === 'PE') && <>
                        <ListOrderDetail handlePressChat={handlePressChat} orderDetail={orderDetail} handleCancelOrder={handleCancelOrder} isSeller={false} onEndReached={handleLoadMore} loadMore={loadMore} />
                    </>} */}
                {/* </> : <>
                    <ActivityIndicator size="large" style={{ marginTop: 100 }} />
                </>} */}
            </View>

        </View>
    )
}

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
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 1,
    },
});

export default Orders;