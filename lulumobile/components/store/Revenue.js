import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import { authApis, endpoints } from "../../configs/Apis";

const Revenue = ({ route }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const store = route.params?.store;


    const loadData = async () => {
        try {
            setLoading(true);
            let token = await AsyncStorage.getItem('token');

            let res = await authApis(token).get(endpoints['revenue_store']);
            if (res.status === 200) {
                setData(res.data);
            } else {
                Alert.alert("Lỗi", "Có lỗi xảy ra!");
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [])

    if (loading || !data) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <ActivityIndicator size={'large'} style={{ marginTop: 100 }} />
            </View>
        )
    }

    const mainData = [{
        label: "Sản phẩm đã bán",
        data: `${data.orders_count}`,
        icon: '📦',
    }, {
        label: "Đánh giá cửa hàng",
        data: data.store_rating?.toFixed(1),
        icon: '🌟',
    },]

    const Card = ({ data, lable, icon }) => {
        return (
            <View style={styles.cardItem}>
                <View>
                    <Text style={[styles.cardText, { fontSize: 20 }]} >{icon}</Text>
                    <Text style={[styles.cardText, { marginVertical: 8, color: '#c0c8d9', fontWeight: '500' }]}>{lable}</Text>
                    <Text style={[styles.cardText, { fontSize: 15, fontWeight: 'bold' }]}>{data}</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1 }}>

            <ScrollView style={styles.container}>

                <View style={styles.card}>
                    <View style={styles.cardItem}>
                        <View>
                            <Text style={[styles.cardText, { fontSize: 20 }]} >💵</Text>
                            <Text style={[styles.cardText, { marginVertical: 8, color: '#c0c8d9', fontWeight: '500' }]}>Tổng doanh thu</Text>
                            <Text style={[styles.cardText, { fontSize: 15, fontWeight: 'bold' }]}>{data.total_revenue} đ</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    {mainData.map((item, index) => <Card data={item.data} lable={item.label} icon={item.icon} color={item.color} key={index} />)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Doanh thu theo tháng</Text>
                    {data.chart_data?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemDate}>{item.date}</Text>
                            <Text style={styles.itemRevenue}>{item.revenue.toLocaleString()} đ</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Sản phẩm bán chạy</Text>
                    {data.top_product?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemProduct}>
                                {item.product_variant__product__name}
                            </Text>
                            <Text style={styles.itemSold}>{item.total_sold} đã bán</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    card: {
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    cardItem: {
        padding: 18,
        backgroundColor: '#313861',
        borderRadius: 10,
        flex: 1,
    },
    cardText: {
        color: "#fff",
    },
    section: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        backgroundColor: '#313861',
        marginVertical: 8,
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 12,
        color: '#fff',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#a5acd2',
    },
    itemDate: {
        fontSize: 16,
        color: '#fff',
    },
    itemRevenue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    itemProduct: {
        fontSize: 16,
        color: '#fff',
    },
    itemSold: {
        fontSize: 15,
        fontWeight: '500',
        color: '#fff',
    },
});

export default Revenue;