import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import productCard from "../ui/ProductCard"

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
        <SafeAreaView>
            <ScrollView>
                <View>
                    <Text style={[styles.baseText, styles.titleText,]}>Xin chào</Text>
                </View>
                <View>
                    <FlatList
                        data={products}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        renderItem={({ item }) => <View style={{ width: '50%', padding: 5 }}> {productCard(item)} </View>} />
                </View>
            </ScrollView>
        </SafeAreaView>
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