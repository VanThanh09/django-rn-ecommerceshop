import { useEffect, useState } from "react"
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Pressable, FlatList, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AddDetailBtn from "../ui/storePage/AddDetailBtn";
import MyStyles from "../../styles/MyStyles";
import { Button, Icon } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import AttributeBox from "../ui/storePage/AttributeBox";
import VariantInput from "../ui/storePage/VariantInput";

const MAX_ATTRIBUTES = 2;

const AddProduct = () => {
    const [categories, setCategories] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const [images, setImages] = useState([]);
    const [product, setProduct] = useState({});
    const [selectedCate, setSelectedCate] = useState([]);
    const [attributes, setAttributes] = useState([{ "name": "", "values": "" }]);
    const [variants, setVariants] = useState([]);

    // Thêm thuộc tính vào product
    const setStateProduct = (field, value) => {
        setProduct({ ...product, [field]: value });
    }

    // Gửi api lấy categries từ server
    const getCate = async () => {
        try {
            let res = await Apis.get(endpoints['categories']);
            setCategories(res.data);
        } catch (ex) {
            console.log(ex);
        }
    }

    // Lấy hình ảnh và setImages là ảnh đó
    const pick = async () => {
        let { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setImages([result.assets[0]]);
            }
        }
    }

    // Xóa hình ảnh khỏi iamges
    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    }

    useEffect(() => {
        getCate();
    }, [])

    useEffect(() => {
        setStateProduct('logo', images);
    }, [images])

    // Hiện model để chọn categories
    const handleAddCate = () => {
        setModalVisible(true);
    };

    // chọn danh mục
    const selectCategory = (id, name) => {
        let newSelected;
        if (selectedCate.find(c => c.id === id)) {
            newSelected = selectedCate.filter(c => c.id !== id);
        } else {
            newSelected = [...selectedCate, { id, name }];
        }
        setSelectedCate(newSelected);

        // Tạo mảng chỉ gồm id để lưu
        let idCate = newSelected.map(c => c.id);
        setStateProduct('category_set', idCate);
    };

    // Thêm attributes 
    const addAttribute = () => {
        if (attributes.length < MAX_ATTRIBUTES) {
            setAttributes([...attributes, { name: '', values: '' }]);
        } else {
            Alert.alert("Thông báo", "Tối da 2 thuộc tính");
        }
    };

    const removeAttribute = (index) => {
        if (attributes.length > 1) {
            const updated = [...attributes];
            updated.splice(index, 1);
            setAttributes(updated);
        } else {
            setAttributes([{ "name": "", "values": "" }]);
            Alert.alert("Thông báo", "Sản phẩm phải có ít nhất một phân loại");
        }
    };

    // Tạo các biến thể (variant) từ attribute
    const generateVariants = (attributes) => {
        // Bước lọc: chỉ lấy các attribute có name và có ít nhất 1 value hợp lệ
        const validAttributes = attributes
            .filter(attr => attr.name && Array.isArray(attr.values))
            .map(attr => ({
                name: attr.name,
                values: attr.values.filter(value => value !== "")
            }))
            .filter(attr => attr.values.length > 0);

        if (validAttributes) {
            let result = [{}]; // Variants rỗng ban đầu

            // {"name": "Size", "values": ["40", "41"]}
            validAttributes.forEach(attr => {
                let temp = [];
                result.forEach(variant => {
                    attr.values.forEach(value => {
                        temp.push({
                            ...variant,
                            [attr.name]: value
                        });
                    });
                });
                result = temp;
            });
            return result.map(variant => ({
                attributes: Object.entries(variant).map(([name, value]) => ({ name, value }))
            }));
        }
    }

    const updateVariant = (index, updated) => {
        setVariants(prev => {
            const copy = [...prev];
            copy[index] = updated;
            return copy;
        })
    }

    useEffect(() => {
        if (variants.length === 1 && variants[0].attributes.length === 0) {
            setVariants([]);
        } else {
            setStateProduct('variants', variants);
        }
    }, [variants]);

    // useEffect(() => {
    //     console.log(attributes)
    // }, [attributes]);

    // useEffect(() => {
    //     console.log(JSON.stringify(product, null, 2));
    // }, [product])

    const handleInfoVariant = (attributes) => {
        setVariants(generateVariants(attributes));
    }

    function validate() {
        let info = [{
            feild: "logo",
            label: "ảnh sản phẩm"
        }, {
            feild: "name",
            label: "tên sản phẩm"
        }, {
            feild: "description",
            label: "mô tả sản phẩm"
        }]

        if (!Array.isArray(product.logo) || product.logo.length < 1) {
            Alert.alert('Lỗi', `Vui lòng chọn ảnh sản phẩm`, [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]);
            return false;
        }

        for (let i of info)
            if (!(i.feild in product) || product[i.feild] === '') {
                Alert.alert('Lỗi', `Vui lòng điền ${i.label}`, [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]);
                return false;
            }

        if (!Array.isArray(product.category_set) || product.category_set.length === 0) {
            Alert.alert("Kiểm tra", "Phải chọn ít nhất một thể loại");
            return false;
        }

        if (product["variants"].length === 0) {
            Alert.alert("Kiểm tra", "Phải điền ít nhất một biến thể");
            setVariants(generateVariants(attributes));
            return false;
        }

        const totalCombinations = attributes.reduce(
            (acc, attr) => acc * attr.values.length,
            1
        );

        if (product.variants.length !== totalCombinations) {
            setVariants(generateVariants(attributes));
            Alert.alert("Kiểm tra", "Có phân loại hàng chưa nhập thông tin");
            return false; // thiếu hoặc thừa biến thể
        }

        if (product.variants.length > 0) {
            for (let i = 0; i < product.variants.length; i++) {
                let temp = product.variants[i];

                if (!temp.price || !temp.quantity || !temp.logo) {
                    Alert.alert('Lỗi', `Điền đầy đủ thông tin cho từng thuộc tính cho biến thể ${i + 1}`, [{
                        text: 'Cancel',
                        style: 'cancel',
                    }])
                    return false;
                }
            }
        }

        for (let variant of variants) {
            // Kiểm tra đủ thuộc tính
            if (variant.attributes.length !== attributes.length) {
                return false;
            }
        }

        return true;
    }

    const confirmAction = () => {
        if (validate()) {
            Alert.alert('Xác nhận', `Xác nhận để thêm sản phẩm`, [
                {
                    text: 'Cancel',
                    style: 'cancel',
                }, {
                    text: 'Xác nhận',
                    onPress: () => handleAddProduct(),
                },
            ])
        }
    }

    const handleAddProduct = async () => {
        try {
            setLoading(true);
            let form = new FormData();

            for (let key in product) {
                if (key === 'logo') {
                    const logoFile = product.logo?.[0];
                    if (logoFile && logoFile.uri) {
                        form.append(key, {
                            uri: logoFile.uri,
                            name: logoFile.fileName || 'avatar.jpg',
                            type: logoFile.mimeType || 'image/jpeg',
                        });
                    }
                } else if (key === 'variants') {
                    product.variants.map((variant, index) => {
                        form.append(`variants[${index}][price]`, variant.price);
                        form.append(`variants[${index}][quantity]`, variant.quantity);
                        form.append(`variants[${index}][attributes]`, JSON.stringify(variant.attributes));

                        if (variant.logo?.uri) {
                            form.append(`variants[${index}][logo]`, {
                                uri: variant.logo.uri,
                                name: variant.logo.fileName || 'variant.jpg',
                                type: variant.logo.mimeType || 'image/jpeg',
                            });
                        }
                    });
                } else {
                    form.append(key, product[key]);
                }
            }

            // for (let pair of form.entries()) {
            //     console.log(`${pair[0]}:`, pair[1]);
            // }

            const token = await AsyncStorage.getItem('token');

            // for (let i = 1; i < 5; i++) {
            let res = await authApis(token).post(endpoints['create_product'], form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })
            // }


            if (res.status === 201) {
                Alert.alert('Thành công', 'Thêm sản phẩm thành công', [{
                    text: 'Cancel',
                    style: 'cancel'
                }]);
                nav.reset({
                    index: 0,
                    routes: [{ name: 'storeMain' }],
                });
            }
        } catch (ex) {
            console.log(ex)
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                <View style={{ flex: 1 }}>
                    {/* Hình ảnh */}
                    <View style={styles.viewContainer}>
                        {images.length > 0 ? <>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#fff' }}>
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

                    {/* Nhập tên sản phẩm */}
                    <View style={styles.viewContainer}>
                        <Text style={styles.label}>
                            Tên sản phẩm <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập tên sản phẩm"
                            placeholderTextColor="#aaa"
                            value={product["name"]}
                            onChangeText={text => setStateProduct("name", text)}
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
                            value={product["description"]}
                            multiline
                            onChangeText={text => setStateProduct("description", text)}
                        />
                    </View>

                    {/* Chọn categories */}
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


                    {/* Thêm attribute cho sản phẩm */}
                    <View style={[styles.viewContainer, { padding: 7 }]}>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.label, { marginLeft: 12 }]}>Thêm phân loại hàng</Text>
                            <View style={{ alignItems: 'flex-start', margin: 5 }}>
                                <TouchableOpacity style={styles.buttonAdd} onPress={() => addAttribute()}>
                                    <Icon source="plus" color="black" size={15} />
                                    <Text style={{ marginLeft: 3 }}>Thêm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={styles.viewContainer}>
                            {attributes.length > 0 ? <>

                                {attributes.map((attr, index) => (
                                    <AttributeBox
                                        key={index}
                                        index={index}
                                        attribute={attr}
                                        removeAttribute={() => removeAttribute(index)}
                                        setAttributes={setAttributes}
                                    />
                                ))}

                                <TouchableOpacity onPress={() => handleInfoVariant(attributes)} style={{ margin: 3 }}>
                                    <Text style={{ padding: 10, borderColor: "#ddd", borderWidth: 1, textAlign: 'center' }}>Nhập thông tin từng biến thể <Text style={styles.required}>*</Text></Text>
                                </TouchableOpacity>

                                {/* Nhập thông tin cho từng thuộc tính (variant) */}
                                <View style={[styles.viewContainer, { padding: 7 }]}>
                                    {variants.length > 0 && variants.map((variant, index) => (
                                        <VariantInput
                                            key={index}
                                            index={index}
                                            variant={variant}
                                            updateVariant={updateVariant}
                                        />
                                    ))}
                                </View>

                            </> : <>
                                {/* Thêm giá nếu không có thuộc tính */}
                                {/* <Text style={[{ marginBottom: 10, paddingLeft: 5 }]}>
                                    Thêm giá và số lượng nếu sản phẩm không có phân loại <Text style={styles.required}>*</Text>
                                </Text>
                                <Text style={styles.label}>
                                    Giá <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.input]}
                                    placeholder="Nhập giá sản phẩm"
                                    placeholderTextColor="#aaa"
                                    value={product["name"]}
                                    onChangeText={text => setStateProduct("name", text)}
                                />

                                <Text style={styles.label}>
                                    Số lượng <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập số lượng sản phẩm"
                                    placeholderTextColor="#aaa"
                                    value={product["name"]}
                                    onChangeText={text => setStateProduct("name", text)}
                                /> */}
                            </>}
                        </View>
                    </View>

                    {/* Xác nhận gửi api */}
                    <View style={{ marginTop: 15 }}>
                        <TouchableOpacity onPress={confirmAction}>
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
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

export default AddProduct;

const styles = StyleSheet.create({
    viewContainer: {
        backgroundColor: '#fff',
        marginVertical: 4,
        padding: 7
    },
    image: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        margin: 5,
    },
    imageBlank: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        margin: 5,
    },
    pickButton: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 1,
        alignItems: 'center',
        borderWidth: 1,
        margin: 10,
        borderColor: '#5d6d75',
    },
    pickButtonText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
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
    label: {
        fontSize: 15,
        color: '#000',
        marginLeft: 9
    },
    required: {
        color: 'red',
    },
    input: {
        borderRadius: 4,
        fontSize: 14,
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
    buttonAdd: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'red',
        padding: 3,
        marginLeft: 12
    }
})