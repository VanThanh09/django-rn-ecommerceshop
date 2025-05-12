import { ActivityIndicator, FlatList, Keyboard, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import ProductCard from "../ui/homePage/ProductCard";
import HeaderHome from "../ui/homePage/HeaderHome";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoriesBox from "../ui/homePage/CategoriesBox";

function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCate, setSelectedCate] = useState([]);

    const [searchQuery, setSearchQuery] = useState();
    const [page, setPage] = useState(1);

    const [refreshing, setRefreshing] = useState(false);
    const [loadMore, setLoadMore] = useState(false)

    const nav = useNavigation();

    const loadCates = async () => {
        let res = await Apis.get(endpoints['categories']);
        setCategories(res.data)
    }

    useEffect(() => {
        loadCates();
        loadProducts();
    }, []);

    const loadProducts = async () => {
        if (page > 0) {
            try {
                setLoadMore(true)

                let url = `${endpoints['products']}?page=${page}`;

                if (selectedCate.length > 0) {
                    selectedCate.forEach(cate => {
                        url = `${url}&category_id=${cate}`;
                    })
                }

                let res = await Apis.get(url);

                if (page === 1)
                    setProducts(res.data.results);
                else
                    setProducts([...products, ...res.data.results]);

                if (res.data.next === null)
                    setPage(0);
            } catch {

            } finally {
                setLoadMore(false)
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        setSelectedCate([]);
        setPage(1);
        await loadCates();
        setRefreshing(false);
    };

    const onLoadMore = async () => {
        if (!loadMore && page > 0) {
            setPage(page + 1);
        }
    }

    useEffect(() => {
        console.log(page)
        const fetchData = async () => {
            await loadProducts();
        };
        fetchData();
    }, [page]);

    useEffect(() => {
        console.log(selectedCate)
        // if (page === 1)
        loadProducts();
        // else
        //     setPage(1);
    }, [selectedCate]);

    useEffect(() => {
        console.log(products)
    }, [products])

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={{ paddingBottom: 20 }}>
                <HeaderHome value={searchQuery} onChangeText={setSearchQuery} />

                <View style={[styles.container]}>
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 70 }}
                        data={products}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        ListFooterComponent={loadMore && <ActivityIndicator size={30} style={{ marginTop: 20, paddingBottom: 50 }} />}
                        onEndReached={onLoadMore}
                        ListHeaderComponent={() => (
                            <View style={{ margin: 5, backgroundColor: "#fff", borderRadius: 5, padding: 5 }}>
                                <Text style={{ textAlign: "center", margin: 10, fontWeight: 'bold', fontSize: 16, color: '#372e2c' }}>Danh sách danh mục</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {categories.map((c) => (
                                        <CategoriesBox category={c} setSelectedCate={setSelectedCate} key={c.id} />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity key={item.id} style={{ width: '50%', padding: 5 }} onPress={() => nav.navigate('productDetail', { "productId": item.id })}>
                                <ProductCard product={item} />
                            </TouchableOpacity>
                        )}
                    />
                </View>

            </SafeAreaView>
        </TouchableWithoutFeedback >

    );

}

const styles = StyleSheet.create({
    container: {
        padding: 5,
        paddingBottom: 0
    },
    baseText: {
        fontFamily: 'Cochin',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default Home;