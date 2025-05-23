import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import FeatureButton from "../ui/profilePage/FeatureButton"
import { useNavigation } from "@react-navigation/native"
import { useContext, useEffect, useState } from "react"
import { MyUserContext } from "../../configs/MyContext"
import HeaderStore from "../ui/storePage/HeaderStore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authApis, endpoints } from "../../configs/Apis"

const { width } = Dimensions.get('window');

const Store = () => {
    const nav = useNavigation();
    const user = useContext(MyUserContext);

    const [store, setStore] = useState();
    const [myProducts, setMyProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadStore = async () => {
        let token = await AsyncStorage.getItem("token");
        let url = endpoints['store'];

        let res = await authApis(token).get(url);
        setStore(res.data.results[0]);
    }

    const loadProducts = async () => {
        if (page > 0) {
            try {
                setLoading(true)

                let token = await AsyncStorage.getItem("token");
                let url = `${endpoints['store']}products?page=${page}`;
                // console.log(url);

                let res = await authApis(token).get(url);

                if (page === 1)
                    setMyProducts(res.data.results)
                else
                    setMyProducts((prev) => [...prev, ...res.data.results])


                if (res.data.next === null)
                    setPage(0)
            } catch {

            } finally {
                setLoading(false)
            }

        }
    }

    const sellerFeatures = [{
        label: "Thêm sản phẩm",
        icon: "plus-box",
        color: "#3a5998"
    }]

    const handleAddProduct = () => (nav.navigate('addProduct'));

    useEffect(() => {
        loadStore();
    }, [])

    const loadMore = () => {
        if (!loading && page > 0)
            setPage(page + 1)
    }

    useEffect(() => {
        loadProducts();
    }, [page])

    const ProductItem = ({ item }) => (
        <View style={styles.info}>
            <View>
                <Image source={{ uri: item.logo }} style={styles.image} />
            </View>
            <View style={{ marginLeft: 10, justifyContent: 'center' }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.price}>{item.price}đ</Text>
            </View>
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
                                onPress={handleAddProduct}
                                key={i.label}
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
        marginTop: 10,
    },
    title: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 5,
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
        color: '#e91e63',
    },
})

export default Store;