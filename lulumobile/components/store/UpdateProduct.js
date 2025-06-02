import { useEffect, useState } from "react";
import { Text, View, TextInput, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Modal, TouchableWithoutFeedback, FlatList, Pressable } from "react-native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import * as ImagePicker from 'expo-image-picker';
import MyStyles from "../../styles/MyStyles";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AddDetailBtn from "../ui/storePage/AddDetailBtn";

const UpdateProduct = ({ route }) => {
    const pId = route.params?.productId;
    const nav = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);

    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [logo, setLogo] = useState(null);
    const [selectedCate, setSelectedCate] = useState([]);
    const [variants, setVariants] = useState([]);

    const loadProduct = async () => {
        try {
            let res = await Apis.get(endpoints['product'](pId));
            let p = res.data;
            let cate = await Apis.get(endpoints['categories']);
            setCategories(cate.data);

            setProduct(p);
            setName(p.name);
            setDescription(p.description);
            setSelectedCate(p.category_set);
            setVariants(p.productvariant_set);
        } catch (error) {
            console.error("Failed to load product:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProduct();
    }, []);

    useEffect(() => {
        console.log(JSON.stringify(product, null, 2));
    }, [product]);

    const pick = async (setFunc) => {
        let { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setFunc(result.assets[0]);
            }
        }
    }

    const handleAddCate = () => {
        setModalVisible(true);
    };

    const selectCategory = (id, name) => {
        let newSelected;
        if (selectedCate.find(c => c.id === id)) {
            newSelected = selectedCate.filter(c => c.id !== id);
        } else {
            newSelected = [...selectedCate, { id, name }];
        }
        setSelectedCate(newSelected);
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);

            if (logo) {
                formData.append("logo", {
                    uri: logo.uri,
                    name: "product-logo.jpg",
                    type: "image/jpeg"
                });
            }

            formData.append("category_set", selectedCate.map(i => i.id));

            if (variants.length > 0) {
                variants.forEach((v, i) => {
                    formData.append(`variants[${i}][price]`, v.price);
                    formData.append(`variants[${i}][quantity]`, v.quantity);
                    formData.append(`variants[${i}][attributes]`, JSON.stringify(v.attributes));
                    if (v.logo && v.logo.uri) {
                        formData.append(`variants[${i}][logo]`, {
                            uri: v.logo.uri,
                            name: v.logo.fileName || `variant-${i}.jpg`,
                            type: v.logo.mimeType || "image/jpeg"
                        });
                    } else {
                        formData.append(`variants[${i}][logo_url]`, v.logo);
                    }
                });
            }

            for (let pair of formData.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
            }

            const token = await AsyncStorage.getItem("token");

            let res = await authApis(token).patch(endpoints['update_product'](pId), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            if (res.status === 200)
                alert("Cập nhật sản phẩm thành công!");

            nav.reset({
                index: 0,
                routes: [{ name: 'storeMain' }],
            })
        } catch (err) {
            console.log(err);
            alert("Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    if (!product) return (
        <ActivityIndicator style={{ marginTop: 50 }} />
    );

    return (
        <ScrollView style={{ padding: 10 }}>

            {/* Nhập ảnh sản phẩm */}
            <View style={styles.viewContainer}>
                <Text style={styles.label}>
                    Ảnh sản phẩm <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.imageBlank}>
                    <TouchableOpacity onPress={() => pick(setLogo)} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        {logo ? (
                            <Image source={{ uri: logo.uri }} style={{ width: '100', height: '100', resizeMode: 'contain' }} />
                        ) : (
                            <Image source={{ uri: product.logo }} style={{ width: 100, height: 100 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Nhập tên sản phẩm */}
            <View style={styles.viewContainer}>
                <Text style={styles.label}>
                    Tên sản phẩm <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập tên sản phẩm"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Nhập mô tả sản phẩm */}
            <View style={styles.viewContainer}>
                <Text style={styles.label}>
                    Mô tả sản phẩm <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    placeholder="Mô tả sản phẩm"
                    placeholderTextColor="#aaa"
                    value={description}
                    multiline
                    onChangeText={setDescription}
                />
            </View>

            <View style={styles.viewContainer}>
                <TouchableOpacity onPress={handleAddCate}>
                    <AddDetailBtn label="Chọn thể loại" onPress={handleAddCate} />
                    {selectedCate.map((cate) => (
                        <View key={cate.id} style={{ backgroundColor: '#fff', padding: 3, marginLeft: 10 }}>
                            <Text style={{ fontSize: 14 }}>  {cate.name} </Text>
                        </View>
                    ))}
                </TouchableOpacity>
                <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={styles.modalContainer}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.modal}>
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Chọn thể loại</Text>
                                    <FlatList
                                        data={categories}
                                        keyExtractor={(item) => item.id.toString()}
                                        renderItem={({ item }) => {
                                            const isSelected = selectedCate.find(cate => cate.id === item.id);
                                            return (
                                                <Pressable onPress={() => selectCategory(item.id, item.name)} style={[styles.pressable]}>
                                                    <Text style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{item.name}</Text>
                                                </Pressable>
                                            )
                                        }}
                                    />
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
                                            <Text style={{ color: 'red', textAlign: 'right', padding: 10 }}>Đóng</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>

            <Text style={{ marginTop: 10 }}>Biến thể:</Text>
            {variants.map((v, i) => (
                <View key={i} style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            {v.logo && v.logo.uri ? <>
                                <View style={styles.image}>
                                    <TouchableOpacity onPress={() => console.log(1)}>
                                        <Image source={{ uri: v.logo.uri }} style={{ width: 100, height: 100 }} />
                                    </TouchableOpacity>
                                </View>
                            </> : <>

                                <View style={styles.image}>
                                    <TouchableOpacity onPress={() => console.log(1)}>
                                        <Image source={{ uri: v.logo }} style={{ width: 100, height: 100 }} />
                                    </TouchableOpacity>
                                </View>
                            </>}

                        </View>

                        <View style={{ marginRight: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ minWidth: 80 }}>Giá:  </Text>
                                <TextInput
                                    placeholder="Nhập giá"
                                    keyboardType="numeric"
                                    value={v.price?.toString() || ''}
                                    onChangeText={(text) => handleVariantChange(i, 'price', text)}
                                    style={{ minWidth: 70 }}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ minWidth: 80 }}>Số lượng:  </Text>
                                <TextInput
                                    placeholder="Số lượng"
                                    keyboardType="numeric"
                                    value={v.quantity?.toString() || ''}
                                    onChangeText={(text) => handleVariantChange(i, 'quantity', text)}
                                    style={{ minWidth: 70 }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            ))}

            <View style={{ marginTop: 15 }}>
                <TouchableOpacity onPress={() => {
                    Alert.alert("Xác nhận", "Lưu thông tin", [{
                        text: "Cancel",
                        style: 'cancel',
                    }, {
                        text: 'OK',
                        onPress: () => handleUpdate(),
                    }])
                }}>
                    <Button style={[MyStyles.m, styles.button]}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Xác nhận</Text>
                        )}
                    </Button>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    Alert.alert("Thoát", "Bạn muốn hủy", [{
                        text: "Cancel",
                        style: 'cancel',
                    }, {
                        text: 'OK',
                        onPress: () => nav.reset({
                            index: 0,
                            routes: [{ name: 'storeMain' }],
                        }),
                    }])
                }}>
                    <Button style={[{
                        borderRadius: 3,
                        borderWidth: 1,
                        borderColor: '#fff',
                        backgroundColor: '#fff'
                    }, MyStyles.m]}>
                        <Text style={{ color: "#fa5230" }}>Hủy</Text>
                    </Button>
                </TouchableOpacity>
            </View>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    viewContainer: {
        backgroundColor: '#fff',
        marginVertical: 4,
        padding: 7
    },
    label: {
        fontSize: 13,
        color: '#000',
    },
    input: {
        borderRadius: 4,
        fontSize: 14,
    },
    required: {
        color: 'red',
    },
    imageBlank: {
        width: 100,
        height: 100,
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        margin: 5,
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#fff'
    },
    buttonText: {
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modal: {
        width: '90%',
        height: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5
    },
    pressable: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    image: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        marginVertical: 5
    },
})

export default UpdateProduct;
