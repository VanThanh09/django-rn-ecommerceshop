import { FlatList, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import ProductCard from "../ui/homePage/ProductCard";

function Home() {
    const [products, setProducts] = useState([]);

    const loadProducts = async () => {
        let res = await Apis.get(endpoints['products']);
        setProducts(res.data.results);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    return (
        <View style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
            <View>
                <Text style={[styles.baseText, styles.titleText,]}>Xin chào</Text>
            </View>
            <View>
                <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <TouchableOpacity>
                            <View style={{ width: '50%', padding: 5 }}>
                                <ProductCard product={item} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }, baseText: {
        fontFamily: 'Cochin',
    }, titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default Home;