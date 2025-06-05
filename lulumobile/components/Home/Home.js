import { FlatList, Keyboard, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import ProductCard from "../ui/homePage/ProductCard";
import HeaderHome from "../ui/homePage/HeaderHome";
import { useNavigation } from "@react-navigation/native";

function Home() {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const nav = useNavigation()
    const loadProducts = async () => {
        let res = await Apis.get(endpoints['products']);
        setProducts(res.data.results);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        console.info(searchQuery);
    }, [searchQuery]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }} >
                <HeaderHome value={searchQuery} onChangeText={setSearchQuery} showBackButton={false}/>
                <View style={[styles.container]}>
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 70 }}
                        data={products}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={{ width: '50%', padding: 5 }} onPress = {() => nav.navigate('productDetail', 
                            {productId:item.id, productLogo:item.logo, prevScreen: {previousRoute: "index"}})}>
                                <ProductCard product={item}/>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View >
        </TouchableWithoutFeedback>
    );

}

const styles = StyleSheet.create({
    container: {
        padding: 10,
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