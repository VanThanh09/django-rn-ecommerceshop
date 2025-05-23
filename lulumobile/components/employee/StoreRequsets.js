import AsyncStorage from "@react-native-async-storage/async-storage"
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { authApis, endpoints } from "../../configs/Apis";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

const StoreRequests = () => {
    const [requests, setRequests] = useState();
    const nav = useNavigation();
    const [refreshing, setRefreshing] = useState(false);

    const loadRequest = async () => {
        try {
            let token = await AsyncStorage.getItem("token");

            let res = await authApis(token).get(endpoints['verification_seller']);

            setRequests(res.data);
        } catch (ex) {
            console.error(ex);
        } finally {

        }
    }

    useEffect(() => {
        loadRequest();
    }, [])

    useEffect(() => {
        console.log(requests)
    }, [requests])

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRequest();
        setRefreshing(false);
    };

    const ProductItem = ({ item }) => (
        <View style={styles.info}>
            <View>
                <Image source={{ uri: item.temp_store_logo }} style={styles.image} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.name}>{item.temp_store_name}</Text>
                <Text style={styles.description} numberOfLines={1}>Mô tả: {item.temp_store_description}</Text>
                <Text style={styles.description}>Ngày tạo: {new Date(item.created_date).toLocaleString('vi-VN')}</Text>
                {item.status === 'PE' && <Text style={styles.description}>Trạng thái: <Text style={{ color: 'red' }}>đang chờ kiểm duyệt</Text></Text>}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={requests}
                numColumns={1}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                onRefresh={onRefresh}
                refreshing={refreshing}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => nav.navigate('requestDetail', { "requestId": item.id })}>
                        <ProductItem item={item} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>Không có yêu cầu nào</Text>
                )}
            />
        </View>
    )
}

export default StoreRequests;

const styles = StyleSheet.create({
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
    image: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    card: {
        backgroundColor: '#fff',
        margin: 5,
        borderWidth: 1,
        elevation: 3,
    },
})