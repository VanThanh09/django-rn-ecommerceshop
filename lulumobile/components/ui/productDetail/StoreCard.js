import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../../configs/Apis";
import { Button, View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";

const StoreInfo = ({ storeInfo }) => {
    return (
        <View style={styles.storeInfo}>
            <View style={{ flex: 1 }}>
                <Image source={{ uri: storeInfo.logo }} style={styles.storeLogo}></Image>
            </View>
            <View style={styles.storeName}>
                <Text style={{ fontWeight: 700 }}>{storeInfo.name}</Text>
                <Text style={{ color: 'rgba(0,0,0,0.5)' }}>{storeInfo.store_address}</Text>
            </View>
            <View style={{ flex: 2, alignItems: 'flex-end' }}>
                <TouchableOpacity style={styles.btn}>
                    <Text style={{ color: '#fa5230' }}>Xem shop</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const StoreStats = ({ rating, totalProduct }) => {
    return (
        <View style={styles.storeStatsContainer}>
            <View style={styles.avgRatingContainer}>
                <Text>{rating.average_rating_store} <Icon source="star" size={18} color='#fa5230' /></Text>
                <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>{rating.hasRating ? "Đánh giá" : "Chưa có đánh giá"}</Text>
            </View>
            <View style={styles.totalProductContainer}>
                <Text>{totalProduct}</Text>
                <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>Sản phẩm</Text>
            </View>
        </View>
    )
}

const StoreCard = ({ storeId }) => {
    const [store, setStore] = useState(null)

    const getStoreInfo = async () => {
        try {
            let res = await Apis.get(endpoints['productStoreInfo'](storeId))
            setStore(res.data)
        }
        catch (error) {
            throw error
        }
    }

    useEffect(() => {
        getStoreInfo().catch(error => console.log("Fail to load product store info", error))
    }, [storeId])


    if (store === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#fa5230"></ActivityIndicator>
            </View>
        )
    }

    return (
        <View style={styles.storeContainer}>
            <StoreInfo storeInfo={store.store_info} />
            <StoreStats rating={store.rating} totalProduct={store.total_product} />
        </View>
    )
}

export default StoreCard

const styles = StyleSheet.create({
    storeContainer: {
        backgroundColor: '#fff',
        marginTop: 8,
        padding: 8
    },
    storeInfo: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    storeLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ccc'
    },
    storeName: {
        fontSize: 16,
        flex: 3
    },
    btn: {
        borderColor: '#fa5230',
        borderWidth: 2,
        borderRadius: 5,
        width: '80%',
        height: 30,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    storeStatsContainer: {
        flexDirection: 'row',
    },
    avgRatingContainer: {
        marginTop: 3,
        flex: 1,
        borderRightWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    totalProductContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    }
})