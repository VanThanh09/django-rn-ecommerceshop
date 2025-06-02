import { ActivityIndicator, FlatList, Keyboard, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { useEffect, useMemo, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import ProductCard from "../ui/homePage/ProductCard";
import HeaderHome from "../ui/homePage/HeaderHome";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoriesBox from "../ui/homePage/CategoriesBox";
import { IconButton } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";

function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [selectedCate, setSelectedCate] = useState([]);
    const [searchQuery, setSearchQuery] = useState();
    const [page, setPage] = useState(1);
    const [filterPrice, setFilterPrice] = useState();
    const [minPrice, setMinPrice] = useState();
    const [maxPrice, setMaxPrice] = useState();

    const [refreshing, setRefreshing] = useState(false);
    const [loadMore, setLoadMore] = useState(false)

    const nav = useNavigation();
    const [showFilter, setShowFilter] = useState(false);

    const loadCates = async () => {
        let res = await Apis.get(endpoints['categories']);
        setCategories(res.data)
    }

    useEffect(() => {
        loadCates();
        // loadProducts();
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

                if (searchQuery) {
                    url = `${url}&q=${searchQuery}`;
                }

                if (minPrice) {
                    url = `${url}&price_min=${minPrice}`;
                }

                if (maxPrice) {
                    url = `${url}&price_max=${maxPrice}`;
                }

                if (filterPrice === 1) {
                    url = `${url}&order_price=${filterPrice}`;
                } else if (filterPrice === -1) {
                    url = `${url}&order_price=${filterPrice}`;
                }

                console.log("load");

                let res = await Apis.get(url);

                if (page === 1)
                    setProducts(res.data.results);
                else
                    setProducts((prev) => [...prev, ...res.data.results]);

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
        setMinPrice(null);
        setMaxPrice(null);
        setFilterPrice(null);
        setSelectedCate([]);
        setSearchQuery(null);
        await loadCates();
        setRefreshing(false);
    };

    const onLoadMore = async () => {
        if (!loadMore && page > 0) {
            setPage(page + 1);
        }
    }

    useEffect(() => {
        // console.log(page)
        loadProducts();
    }, [page]);


    useEffect(() => {
        if (page !== 1) {
            let timer = setTimeout(() => {
                setPage(1);
            }, 500);
            return () => clearTimeout(timer);
        }
        else {
            let timer = setTimeout(() => {
                loadProducts();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, selectedCate, minPrice, maxPrice, filterPrice]);

    const orderMinToMax = () => {
        if (filterPrice === 1)
            setFilterPrice(null);
        else
            setFilterPrice(1)
    }

    const orderMaxToMin = () => {
        if (filterPrice === -1)
            setFilterPrice(null);
        else
            setFilterPrice(-1)
    }

    const handleResetFilter = () => {
        setMinPrice(null);
        setMaxPrice(null);
        setFilterPrice(null);
        setSelectedCate([]);
    }



    const headerCategories = useMemo(() => (
        <View style={{ margin: 5, backgroundColor: "#fff", borderRadius: 5, padding: 5 }}>
            <Text style={{ textAlign: "center", margin: 10, fontWeight: 'bold', fontSize: 16, color: '#372e2c' }}>Danh sách danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((c) => (
                    <CategoriesBox category={c} setSelectedCate={setSelectedCate} selectedCate={selectedCate} key={c.id} />
                ))}
            </ScrollView>
        </View>
    ), [categories, selectedCate]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={{ paddingBottom: 20 }}>
                <HeaderHome value={searchQuery} onChangeText={setSearchQuery} showBackButton={false} />

                <TouchableOpacity
                    style={[styles.filterButton]}
                    onPress={() => setShowFilter(true)}
                >
                    <IconButton
                        icon='filter-outline'
                        size={35}
                        iconColor='rgba(53, 53, 53, 0.45)'
                    />
                </TouchableOpacity>

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
                        ListHeaderComponent={headerCategories}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={{ width: '50%', padding: 5 }} onPress={() => nav.navigate('productDetail', { productId: item.id, productLogo: item.logo, prevScreen: { previousRoute: "homeMain" } })}>
                                <ProductCard product={item} />
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <Modal visible={showFilter} animationType="fade" transparent>
                    <TouchableWithoutFeedback onPress={() => setShowFilter(false)}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0)', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableWithoutFeedback>
                                <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 5 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Bộ lọc</Text>

                                    <TouchableOpacity onPress={() => orderMinToMax()}>
                                        <Text style={{ paddingVertical: 15, fontWeight: filterPrice === 1 ? 'bold' : 'normal' }}>
                                            Giá tăng dần
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => orderMaxToMin()}>
                                        <Text style={{ paddingVertical: 15, fontWeight: filterPrice === -1 ? 'bold' : 'normal' }}>
                                            Giá giảm dần
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.inputPriceBtn}>
                                        <Text >Giá thấp nhất</Text>
                                        <TextInput
                                            style={{ borderBottomWidth: 1, width: 150 }}
                                            placeholder="Nhập"
                                            value={minPrice}
                                            onChangeText={setMinPrice}
                                        ></TextInput>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.inputPriceBtn}>
                                        <Text style={{ paddingVertical: 10 }}>Giá cao nhất</Text>
                                        <TextInput
                                            style={{ borderBottomWidth: 1, width: 150 }}
                                            placeholder="Nhập"
                                            value={maxPrice}
                                            onChangeText={setMaxPrice}
                                        ></TextInput>
                                    </TouchableOpacity>

                                    <View style={{ marginTop: 10, justifyContent: 'flex-end', flexDirection: 'row' }}>

                                        <TouchableOpacity onPress={() => handleResetFilter()} style={[{ padding: 8, borderRadius: 2, borderWidth: 1, borderColor: '#fa5230' }]}>
                                            <Text style={{ textAlign: 'right', color: '#fa5230' }}>Xóa lọc</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => setShowFilter(false)} style={[{ marginStart: 10, padding: 8, borderRadius: 2 }, MyStyles.bgPrimaryColor]}>
                                            <Text style={{ textAlign: 'right', color: '#fff' }}>Đóng</Text>
                                        </TouchableOpacity>

                                    </View>

                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
        </TouchableWithoutFeedback >
    );

}

const styles = StyleSheet.create({
    container: {
        padding: 1,
        paddingBottom: 0
    },
    baseText: {
        fontFamily: 'Cochin',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterButton: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(177, 163, 163, 0)',
        position: 'absolute',
        right: 3,
        top: 130,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1
    },
    inputPriceBtn: {
        paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    }
});

export default Home;