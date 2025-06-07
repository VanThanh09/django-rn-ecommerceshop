import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, FlatList, Modal, TextInput, ScrollView, ActivityIndicator, ActivityIndicatorBase } from "react-native";
import { Icon } from "react-native-paper";
import StarRating from "react-native-star-rating-widget";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../../configs/Apis";

const ListOrderDetail = ({ handlePressChat = () => { }, orderDetail, handleCancelOrder = () => { }, handleSuccessOrder = () => { }, isSeller, canComment, orderStatus, loadOrderDetail, onEndReached, loadMore }) => {

    const [commentVisible, setCommentVisible] = useState(false);

    const [productRating, setProductRating] = useState(0);
    const [storeRating, setStoreRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [currentItem, setCurrentItem] = useState(null);

    const [loading, setLoading] = useState(false);

    const pick = async () => {
        if (images.length >= 3) {
            Alert.alert("Thông báo", "Tối đa 3 ảnh !");
        } else {
            let { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert("Permissions denied!");
            } else {
                const result = await ImagePicker.launchImageLibraryAsync();
                if (!result.canceled) {
                    setImages([...images, result.assets[0]]);
                }
            }
        }
    }

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    }

    function validate() {
        if (productRating === 0) {
            Alert.alert("Thông báo", "Vui lòng đánh sao cho sản phẩm!")
            return false;
        }
        return true;
    }

    const handleComment = async () => {
        if (validate()) {
            try {
                setLoading(true);

                const form = new FormData();
                form.append('product_variant', currentItem.product_variant.id);
                form.append('order_detail', currentItem.id);
                form.append('rating', productRating);
                form.append('content', comment);


                if (images.length > 0)
                    for (let i of images)
                        form.append('image_list', {
                            uri: i.uri,
                            name: i.fileName || 'commentImage.jpg',
                            type: i.mimeType || 'image/jpeg',
                        })

                // for (let pair of form.entries()) {
                //     console.log(`${pair[0]}:`, pair[1]);
                // }

                let token = await AsyncStorage.getItem('token');

                let resProductRating = await authApis(token).post(endpoints['comments'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                })

                if (storeRating != 0) {
                    let resStoreRating = authApis(token).post(endpoints['create_rating_store'], {
                        'store': currentItem.store.id,
                        'rating': storeRating
                    })
                }

                if (resProductRating.status === 201)
                    Alert.alert('Thông báo', 'Đã đánh giá');

                loadOrderDetail(orderStatus);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }
    }

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Thông tin sản phẩm */}
            <View style={styles.productRow}>
                <Image source={{ uri: item.product_variant.logo }} style={styles.productImage} />
                <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ maxWidth: '70%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.productName}>{item.product.name}</Text>
                            <Text style={styles.orderId}> Mã đơn: #{item.id}</Text>
                        </View>
                        <Text style={styles.price}>
                            {item.product_variant.price.toLocaleString()}đ
                        </Text>
                        <Text>Số lượng: {item.quantity}</Text>
                        <Text>
                            {item.product_variant.attributes.map(attr => `${attr.attribute_name}: ${attr.value}`).join('  -  ')}
                        </Text>
                    </View>
                    <View style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                        <TouchableOpacity
                            onPress={() => {
                                if (isSeller) handlePressChat(item.customer.id);
                                else handlePressChat(item.store.owner_id);
                            }}
                            style={styles.chatButton}
                        >
                            <Icon source="chat-processing-outline" size={20} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.statusText}>
                            {item.order_status === "SH" && <Text style={{ color: '#e0884c' }}>Đang vận chuyển</Text>}
                            {item.order_status === "SU" && <Text style={{ color: '#0cbb52' }}>Thành công</Text>}
                            {item.order_status === "PE" && <Text style={{ color: 'red' }}>Đang chờ</Text>}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Hủy đơn hàng khi chưa giao của khách hàng */}
            {!isSeller && item.order_status === 'PE' &&
                <View style={{ alignItems: 'flex-start' }}>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Hủy", "Xác nhận hủy", [{
                                text: 'Cancel'
                            }, {
                                text: 'OK',
                                onPress: () => handleCancelOrder(item.id),
                            }])
                        }}
                        style={[styles.cancelBtn, { borderColor: "red" }]}
                    >
                        <Text style={{ color: 'red' }}>Hủy đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            }

            {/* Xác nhận giao thành công của shop */}
            {isSeller && item.order_status === 'SH' &&
                <View style={{ alignItems: 'flex-start' }}>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Xác nhận", "Khách đã nhận hàng", [{
                                text: 'Cancel'
                            }, {
                                text: 'OK',
                                onPress: () => handleSuccessOrder(item.id),
                            }])
                        }}
                        style={[styles.cancelBtn, { borderColor: "#0e9900" }]}
                    >
                        <Text style={{ color: '#0e9900' }}>Giao thành công</Text>
                    </TouchableOpacity>
                </View>
            }

            {/* Khách hàng comment sau khi nhận hàng */}
            {canComment && item.is_commented === false ? <>
                <View style={{ alignItems: 'flex-start' }}>
                    <TouchableOpacity
                        onPress={() => {
                            setCurrentItem(item)
                            setCommentVisible(true)
                        }}
                        style={[styles.cancelBtn, , { borderColor: "#fff", backgroundColor: '#fa5230' }]}
                    >
                        <Text style={{ color: '#fff' }}>🌟 Đánh giá sản phẩm</Text>
                    </TouchableOpacity>
                </View>
            </> : <>
                {canComment && item.is_commented === true &&
                    <View style={{ alignItems: 'flex-start' }}>
                        <Text style={{ color: '#ccc' }}>Đã đánh giá</Text>
                    </View>
                }
            </>}
        </View>
    );

    return (
        <View>
            <FlatList
                data={orderDetail}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 10 }}
                onEndReached={onEndReached}
                ListFooterComponent={loadMore && <ActivityIndicator size={30} style={{ marginTop: 20, paddingBottom: 50 }} />}
            />

            {commentVisible && currentItem && canComment && (
                <Modal animationType="slide" transparent={true} visible={commentVisible} onRequestClose={() => setCommentVisible(false)}>
                    <View style={styles.modalContainer}>

                        <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={() => setCommentVisible(false)}>
                            {/* Đóng nếu chạm phần còn lại */}
                        </TouchableOpacity>

                        <View style={styles.modal}>
                            <View style={[styles.productRow, { borderWidth: 0.5, padding: 10, borderRadius: 10, borderColor: '#ccc' }]}>
                                <Image source={{ uri: currentItem.product_variant.logo }} style={styles.productImage} />
                                <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.productName}>{currentItem.product.name}</Text>
                                            <Text style={styles.orderId}> Mã đơn: #{currentItem.id}</Text>
                                        </View>
                                        <Text style={styles.price}>
                                            {currentItem.product_variant.price.toLocaleString()}đ
                                        </Text>
                                        <Text>Số lượng: {currentItem.quantity}</Text>

                                    </View>

                                </View>
                            </View>

                            {/* Đánh giá sản phẩm */}
                            <View style={[styles.section, { borderBottomWidth: 0.5, borderColor: '#ccc' }]}>

                                <View style={{ flexDirection: 'row', marginVertical: 12, alignItems: 'center' }}>
                                    <Text>Đánh giá: </Text>
                                    <StarRating
                                        rating={productRating}
                                        onChange={setProductRating}
                                        enableHalfStar={false}
                                        style={{ marginStart: 20 }}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', marginVertical: 12 }}>
                                    <Text style={{ marginTop: 10, width: 75 }}>Bình luận:  </Text>
                                    <TextInput
                                        placeholder="Nhập bình luận sản phẩm..."
                                        multiline
                                        numberOfLines={4}
                                        style={styles.input}
                                        value={comment}
                                        onChangeText={setComment}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', marginVertical: 12, width: '100%' }}>
                                    <Text style={{ marginTop: 10, width: 75 }}>Ảnh:  </Text>

                                    {images.length > 0 ? <>
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{ backgroundColor: '#fff' }} keyboardShouldPersistTaps="handled">
                                            <View style={[styles.imageBlank]}>
                                                <TouchableOpacity onPress={pick} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text>Thêm ảnh</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {images.map((i, index) => (
                                                <View key={index} style={styles.image}>
                                                    <Image source={{ uri: i.uri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                                    <TouchableOpacity style={styles.deleteButton} onPress={() => removeImage(index)}>
                                                        <Text style={styles.deleteText}>X</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </> : <>
                                        <View style={styles.imageBlank}>
                                            <TouchableOpacity onPress={pick} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                <Text>Chọn ảnh</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>}
                                </View>

                            </View>

                            {/* Đánh giá cửa hàng */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Đánh giá cửa hàng</Text>

                                <View style={{ borderRadius: 10, marginTop: 5, flexDirection: 'row' }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Image source={{ uri: currentItem.store?.logo }} style={{ width: 70, height: 70, borderRadius: 8 }} />
                                        <Text style={{ marginTop: 10, fontWeight: "bold" }}>{currentItem.store?.name}</Text>
                                    </View>
                                    <StarRating
                                        rating={storeRating}
                                        onChange={setStoreRating}
                                        enableHalfStar={false}
                                    />
                                </View>

                            </View>

                            <View style={{ alignItems: 'flex-end', marginBottom: 10, marginEnd: 15 }}>
                                <TouchableOpacity disabled={loading} onPress={() => handleComment()} style={{ backgroundColor: '#fa5230', borderRadius: 10 }}>
                                    {loading ? <ActivityIndicator /> : <Text style={styles.sentBtn}>Gửi</Text>}
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        flex: 1,
        fontSize: 16,
        fontWeight: "bold",
    },
    chatButton: {
        backgroundColor: "#fa5230",
        padding: 6,
        borderRadius: 6,
        height: 30,
        width: 32,
    },
    productRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: "500",
        marginEnd: 5
    },
    price: {
        color: "#fa5230",
    },
    statusText: {
        marginTop: 4,
        color: "#666",
    },
    shipButton: {
        backgroundColor: "#28a745",
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: "center",
    },
    cancelBtn: {
        backgroundColor: "#fff",
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1.5,
    },
    orderId: {
        fontSize: 13,
        fontWeight: "400",
        fontStyle: 'italic',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modal: {
        flexShrink: 0,
        width: '100%',
        maxHeight: '90%',
        backgroundColor: 'white',
        borderRadius: 5,
        padding: 10,
        elevation: 5,
    },
    section: {
        paddingBottom: 20,
        paddingTop: 10,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        textAlignVertical: 'top',
        width: '80%'
    },
    sentBtn: {
        color: 'red',
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 25,
        color: '#fff'
    },
    image: {
        width: 80,
        height: 80,
        borderWidth: 1,
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        margin: 5,
    },
    imageBlank: {
        width: 80,
        height: 80,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        margin: 5,
    },
    deleteButton: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#666666',
        borderRadius: 50,
        paddingHorizontal: 7,
        paddingVertical: 1,
        zIndex: 1,
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ListOrderDetail;
