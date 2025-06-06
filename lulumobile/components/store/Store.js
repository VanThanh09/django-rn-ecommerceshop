import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import FeatureButton from "../ui/profilePage/FeatureButton"
import { useNavigation } from "@react-navigation/native"
import { useContext, useEffect, useState } from "react"
import { MyUserContext } from "../../configs/MyContext"
import HeaderStore from "../ui/storePage/HeaderStore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authApis, endpoints } from "../../configs/Apis"


const Store = () => {
    const nav = useNavigation();
    const user = useContext(MyUserContext);
    const [refreshing, setRefreshing] = useState(false);

    const [store, setStore] = useState();
    const [myProducts, setMyProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [countOrderPending, setCountOrderPending] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadStore = async () => {
        let token = await AsyncStorage.getItem("token");
        let url = `${endpoints['store']}my_store/`;

        let res = await authApis(token).get(url);

        setStore(res.data);
    }

    const loadProducts = async () => {
        if (page > 0) {
            try {
                setLoading(true)

                let token = await AsyncStorage.getItem("token");
                let url = `${endpoints['store']}products?page=${page}`;

                let res = await authApis(token).get(url);

                if (Array.isArray(res.data.results)) {
                    if (page === 1)
                        setMyProducts(res.data.results)
                    else
                        setMyProducts((prev) => [...prev, ...res.data.results])
                }

                let total_pending = await authApis(token).get(endpoints["count_order_pending"]);
                if (total_pending.data.count) {
                    setCountOrderPending(total_pending.data.count)
                }
                if (res.data.next === null)
                    setPage(0)
            } catch {

            } finally {
                setLoading(false)
            }

        }
    }

    const handleAddProduct = () => (nav.navigate('addProduct'));
    const handleManageOrders = () => (nav.navigate('manageOrders'));
    const handleRevenue = () => (nav.navigate('revenue', { "store": store }));

    useEffect(() => {
        loadStore();
    }, [])

    const loadMore = () => {
        if (!loading && page > 0 && myProducts.length > 1)
            setPage(page + 1)
    }

    useEffect(() => {
        loadProducts();
    }, [page])

    const sellerFeatures = [{
        label: "Thêm sản phẩm",
        icon: "plus-box",
        color: "#3585c5",
        handle: handleAddProduct,
        count: 0,
    }, {
        label: "Quản lý đơn hàng",
        icon: "order-bool-ascending",
        color: "#8b5763",
        handle: handleManageOrders,
        count: countOrderPending,
    }, {
        label: "Thống kê cửa hàng",
        icon: "cash-multiple",
        color: "#4CAF50",
        handle: handleRevenue,
        count: 0,
    }]

    const ProductItem = ({ item }) => (
        <View style={styles.info}>
            <View>
                <Image source={{ uri: item.logo }} style={styles.image} />
            </View>
            <View style={{ marginHorizontal: 10, justifyContent: 'center', flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.description}>{item.description}</Text>
                <Text style={styles.price}>{item.price}đ</Text>
            </View>
            <TouchableOpacity style={[styles.editButton]} onPress={() => nav.navigate('updateProduct', { "productId": item.id })}>
                <Text style={styles.editText}>Sửa</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, paddingBottom: -46 }}>
            {/* Header của cửa hàng */}
            <HeaderStore store={store} />

            {user !== null && user.user_role === 'SE' && (
                <View style={{ flex: 1 }}>
                    {/* Các nút chức năng của người bán */}
                    <View style={styles.viewContainer}>
                        {sellerFeatures.map(i => (
                            <FeatureButton
                                label={i.label}
                                icon={i.icon}
                                color={i.color}
                                onPress={i.handle}
                                key={i.label}
                                count={i.count}
                            />
                        ))}
                    </View>


                    {/* Tiêu đề */}
                    <View style={styles.title}>
                        <Text style={styles.titleText}>Sản phẩm của shop</Text>
                    </View>

                    {/* Danh sách sản phẩm */}
                    <FlatList
                        data={myProducts}
                        keyExtractor={item => item.id.toString()}
                        numColumns={1}
                        showsVerticalScrollIndicator={false}
                        onRefresh={() => nav.reset({
                            index: 0,
                            routes: [{ name: 'storeMain' }],
                        })}
                        refreshing={refreshing}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={loading && <ActivityIndicator />}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.card} onPress={() => console.log(item.id)}>
                                <ProductItem item={item} />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    viewContainer: {
        backgroundColor: '#fff',
        marginTop: 5,
    },
    title: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 3,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        margin: 5,
        borderRadius: 10,
        borderWidth: 1,
        elevation: 3,
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    info: {
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    description: {
        fontSize: 12,
        color: '#555',
        marginBottom: 6,
    },
    price: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#44518c',
    },
    editButton: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: '#44518c',
        top: 5,
        right: 8,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    editText: {
        color: '#44518c',
        fontSize: 12,
    },
})

export default Store;