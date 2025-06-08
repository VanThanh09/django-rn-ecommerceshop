import { View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import { Icon } from 'react-native-paper';
import Apis, { endpoints } from '../configs/Apis';


function formatNumber(value) {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + "M";
    } else if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + "k";
    }
    return value.toString();
}

const Item = ({item}) => {
    return (
        <View style={itemStyles.card}>
            <Image source={{ uri: item.logo }} style={itemStyles.image} />
            <View style={{ padding: 8, paddingTop: 0 }}>
                <Text style={itemStyles.name}>{item.name}</Text>
                <View style={itemStyles.priceContainer}>
                    <Text style={{ color: "#fa5230", fontSize: 18, fontWeight: 500 }}>
                        <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                        {item.avg_price.toLocaleString("vi-VN")}
                    </Text>
                </View>
                <View style={itemStyles.bottomItem}>
                    <View style={{ flexDirection: "row", alignItems: "center", borderRightWidth: 1, borderRightColor: "#ccc", paddingRight: 10 }}>
                        <Icon source="star" color="#FFD700" size={14} ></Icon>
                        <Text>{item.avg_star.average_rating}</Text>
                    </View>
                    <Text>Đã bán {formatNumber(item.total_sold)}</Text>
                </View>
            </View>
        </View>
    )
}

const itemStyles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        elevation: 2,
        position: 'relative',
        borderRadius: 2,
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: 150,
        padding: 0
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14
    },
    bottomItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    }
})

const FindProductsMatch = ({ route }) => {
    const { productId } = route.params || {}
    const [product, setProduct] = useState(null)
    const cates = useRef(null)
    const [selected, setSelected] = useState("similar")
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)

    const loadProduct = async () => {
        try {
            let res = await Apis.get(endpoints['getProductBasicInfo'](productId))
            setProduct(res.data)
            cates.current = getListCates(res.data.category_set)
        }
        catch(err) {
            console.log("Fail to load product basic from similar", err)
        }
    }

    const getListCates = (category_set) => {
        return category_set.reduce((cateList, cate) => {
            if (cateList != "")
                cateList +=","
            cateList += cate.id
            return cateList
        }, "")

    }

    const loadProductsSimilar = async () => {
        try {
            let res = await Apis.get(endpoints['getProductsSimilar'](cates.current, product.store))
            setData(res.data.results)
        }
        catch(err) {
            console.log("Fail to load product basic from similar", err)
        }
    }

    const loadProductsBetterPrice = async () => {
        try {
            let res = await Apis.get(endpoints['getProductsBetterPrice'](cates.current, product.store, product.avg_price))
            setData(res.data.results)
        }
        catch(err) {
            console.log("Fail to load product basic from similar", err)
        }
    }

    // load product
    useEffect(() => {
        try {
            setLoading(true)
            loadProduct()
        }
        catch(err) {
            console.log("Fail to load product basic from similar", err)
        }
        finally {
            setLoading(false)
        }
    }, [productId])

    // load product similar
    useEffect(() => {
        try {
        if (product != null) 
                loadProductsSimilar()
        }
        catch(err) {
            console.log("fail to load product simimilar ",err)
        }
    }, [product])

    useEffect(() => {
        try {
            if (product != null) {
                setLoading(true)
                if (selected === "similar") {
                    loadProductsSimilar()
                } else {
                    loadProductsBetterPrice()
                }
            }
        }
        catch (err) {
            console.log("fail to load product similar ", err)
        }
        finally {
            setLoading(false)
        }
        
    }, [selected])

    if (loading || product === null || data === null) {
         return (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator color={"#fa5230"} />
                </View>)
    }

    return (
        <View style={{flex: 1}}>
            <View style={styles.headerContainer}>
                <Pressable style={styles.imageContainer}>
                    <Image style={styles.mainProductImage} source={{ uri: product.logo }}></Image>
                </Pressable>
                <View style={styles.headerInfoContainer}>
                    <View>
                        <Text>{product.name}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: "#fa5230", fontSize: 18, fontWeight: 500 }}>
                            <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                            {product.avg_price.toLocaleString("vi-VN")}
                        </Text>
                        <View style={styles.headerBottomRight}>
                            {
                                product.avg_star.hasRating && (<StarRatingDisplay
                                rating={product.avg_star.average_rating} starSize={11}
                                color='#FFD700'           // Vàng
                                emptyColor='#E0E0E0'
                                starStyle={{
                                    marginHorizontal: 0,
                                    padding: 0
                                }}    // Xám nhạt
                            />)
                            }
                            <Text>Đã bán {formatNumber(product.total_sold)}</Text>
                        </View>
                    </View>

                </View>
            </View>

            <View style={styles.bodyContainer}>
                <View style={styles.bodyFirstPart}>
                    <Pressable style={styles.btnSimilar(selected)} onPress={() => setSelected("similar")}>
                        <Text style={{ textAlign: "center" }}>Sản phẩm tương tự</Text>
                    </Pressable>
                    <Pressable style={styles.btnBetterPrice(selected)} onPress={() => setSelected("betterPrice")}>
                        <Text style={{ textAlign: "center" }}>Gía tốt hơn</Text>
                    </Pressable>
                </View>

        
            </View>

            <View style={styles.bodyContent}>
                    <FlatList
                        //contentContainerStyle={{ paddingBottom: 70 }}
                        data={data}
                        keyExtractor={item => item.id}
                        numColumns={data.length > 1 ? 2 : 1}
                        key={data.length > 1 ? 'two-columns' : 'one-column'} // Force re-render
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={{
                                flex: 1, // Chia đều width
                                margin: 8, // Khoảng cách giữa các item
                                //aspectRatio: 1, // Giữ tỉ lệ vuông (tuỳ chọn)
                                backgroundColor: 'white',
                                borderRadius: 8,
                                }}>
                                {/* Nội dung item */}
                                <Item item={item}></Item>
                            </View>                            
                        )}
                    />
                </View>

            
        </View>
    )
}

export default FindProductsMatch

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        margin: 8,
        borderRadius: 6,
        padding: 10,
        gap: 12
    },
    mainProductImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    headerInfoContainer: {
        justifyContent: "space-between",
        flex: 1,
    },
    headerBottomRight: {
        flexDirection: "row",
        alignItems: "center"
    },
    bodyContainer: {
        padding: 10,
        borderRadius: 6,
        width: "100%"
    },
    bodyFirstPart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
    },
    btnSimilar: (selected) => ({
        flex: 1,
        padding: 15,
        borderBottomWidth: selected == "similar" ? 1 : 0,
        borderBottomColor: selected == "similar" ? "#fa5230" : "#fff"
    }),
    btnBetterPrice: (selected) => ({
        flex: 1,
        padding: 15,
        borderBottomWidth: selected == "betterPrice" ? 1 : 0,
        borderBottomColor: selected == "betterPrice" ? "#fa5230" : "#fff"
    }),
    bodyContent: {
        backgroundColor: "white",
        marginTop: 8,
        borderRadius: 6,
        paddingTop: 8,
        flex: 1,
        paddingHorizontal: 10
    },
    filterContainer: {
        flexDirection: "row",
        paddingTop: 8,

    }
})


// <View style={styles.filterContainer}>
//                     <View style={{ flex: 1 , flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10}}>
//                         <Pressable style={{padding: 15, backgroundColor: "#ccc", alignSelf: "flex-start", flex: 1}}>
//                             <Text style={{ textAlign: "center", }}>Bán chạy</Text>
//                         </Pressable>
//                         <Pressable style={{padding: 15, backgroundColor: "#ccc", alignSelf: "flex-start", flex: 1}}>
//                             <Text style={{ textAlign: "center",  }}>Gía</Text>
//                         </Pressable>
//                     </View>
// {/* 
//                     <View style={{ flex: 1 , justifyContent: "center", alignItems: "center"}}>
                        
//                     </View> */}


//                 </View>