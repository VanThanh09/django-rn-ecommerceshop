import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableWithoutFeedback, Pressable, ScrollView, TouchableOpacity,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CartContext } from "../../../configs/MyContext"
import ModalMessage from './ModalMessage';
import ToastMessage from './ToastMessage';
import { authApis, endpoints } from '../../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart_Action_Type } from '../../../reducers/CartReducer';
const BoxOption = ({ logo = undefined, name, onPress, isDisable, choosen }) => (
    <Pressable style={[styles.optionBox, isDisable && styles.disabled, choosen && { borderColor: "#fa5230", borderWidth: 1 }]} onPress={onPress} disabled={isDisable}>
        {
            logo && <Image source={{ uri: logo }} style={[styles.optionImage, isDisable && styles.disabledImage]} />
        }
        <Text style={[styles.optionText, isDisable && styles.disabledText, !logo && { paddingHorizontal: 18, paddingVertical: 5 }]}>{name}</Text>
    </Pressable>
);

const ModalProductContent = ({ product, handleOnPressClose, pathOptions, mainAttr, mainAttrDisable,
    selected, handleSelected, disableAttr, handleSetDisableAttr,
    handleSetDisableAttrWithValue, variantId, handleSetVariantId }) => {

    const { cart, cartDispatch } = useContext(CartContext)
    // useEffect(() => {
    //     console.log("Mounted")
    //     return () => {
    //         console.log("Unmounted")
    //     }
    // }, [])

    const dataToRender = useRef(
        Object.entries({
            ...product.attributes, [mainAttr.current]: Array.from(
                new Map(
                    product.productvariant_set
                        .map(variant => {
                            let MainAttr = variant.attributes.find(attr => attr.attribute_name === mainAttr.current);
                            return [MainAttr?.value, { name: MainAttr?.value, logo: variant.logo }];
                        })
                ).values()
            )
        })
    )
    const [stockQuantity, setStockQuantity] = useState(
        pathOptions.current.length === 0 ? (product.productvariant_set.reduce((totalStock, variant) => {
            return variant.active ? totalStock += variant.quantity : totalStock
        }, 0)) : getCurrentTotalStock(pathOptions.current)
    )
    const [price, setPrice] = useState(
        pathOptions.current.length === 0 ? (product.productvariant_set[0].price) : getPrice(pathOptions.current))
    const attributesKey = useRef(Object.keys(product.attributes))
    const [mainImage, setMainImage] = useState(getCurrentMainImage())
    const [quantityInput, setQuantityInput] = useState(1)
    const [showMsg, setShowMsg] = useState(false)
    const [isOptionFull, setIsOptionFull] = useState(pathOptions.current.length === attributesKey.current.length)
    const [isMaxQuantity, setIsMaxQuantity] = useState(false)
    const [isMinQuantity, setIsMinQuantity] = useState(true)
    const lastText = useRef(null)
    const remainStock = useRef(null)
    const cartBasic = useRef(null)
    const currentPutInCart = useRef({})
    const [openModalMsg, setOpenModalMsg] = useState(false)
    const [quantityModalMsg, setQuantityModalMsg] = useState(null)
    const [toastVisible, setToastVisible] = useState(false);

    const handleSetTempDisableAttr = (attr, value, tmpDisableAttr) => {
        if (!tmpDisableAttr[attr].includes(value)) {
            tmpDisableAttr[attr] = [...tmpDisableAttr[attr], value];
        }
    }

    const variantHasQuantity = (mappingValues) => {
        let stockQuantity = 0
        let active = false
        const filteredVariants = product.productvariant_set.forEach(variant => {
            // Map value of variant to easy search
            const attrOfVariant = variant.attributes.map(attr => attr.value)
            if (mappingValues.every(v => attrOfVariant.includes(v))) {
                stockQuantity += variant.quantity
                active = active || variant.active
            }
        });

        return stockQuantity > 0 && active
    }

    function getCurrentTotalStock(mappingValues) {
        return product.productvariant_set.reduce((totalStock, variant) => {
            // Map value of variant to easy search
            if (variant.active) {
                const attrOfVariant = variant.attributes.map(attr => attr.value)
                if (mappingValues.every(v => attrOfVariant.includes(v))) {
                    return totalStock += variant.quantity
                }
            }
            return totalStock
        }, 0)
    }

    function getPrice(mappingValues) {
        let variantMatch = product.productvariant_set.find(variant => {
            const attrOfVariant = variant.attributes.map(attr => attr.value)
            return mappingValues.every(v => attrOfVariant.includes(v))
        })

        return variantMatch?.price
    }

    function getCurrentMainImage() {
        if (pathOptions.current.length > 0) {
            // Tìm nếu có thuộc tính chính trong pathOption hiện tại
            var result = Object.fromEntries(dataToRender.current)[mainAttr.current].find(item => pathOptions.current.includes(item.name))
            if (result) {
                return result.logo
            }
        }
        // Nếu chưa có chọn thuộc tính chính thì hiển thị mặc định
        return product.productvariant_set[0].logo
    }

    function getIdByMappingValues(mappingValues) {
        let variant = product.productvariant_set.find(variant => {
            const attrs = variant.attributes.map(attr => attr.value)
            return (mappingValues.every(v => attrs.includes(v)))
        })

        return variant && String(variant.id)
    }

    // Xử lý khi người dùng bấm vào thuộc tính
    const handleOnPressAttrValue = (keyChoose, valueChoose) => {
        if (selected[keyChoose] === "") {

            // Xử lý những option không thể chọn tiếp
            var index = pathOptions.current.push(valueChoose) - 1

            const tmpSelected = { ...selected, [keyChoose]: index }
            var remaindingAttrs = Object.keys(tmpSelected).filter(key => tmpSelected[key] === "")

            remaindingAttrs.forEach(attr => {
                // Danh sách value trong thuộc tính
                const values = product.attributes[attr]

                values.forEach(val => {
                    // vd Đỏ 39 ...
                    let mappingValues = [...pathOptions.current.slice(0, index + 1), val];
                    if (!variantHasQuantity(mappingValues)) {
                        handleSetDisableAttr(attr, val)
                    }
                }
                )
            })

            // Xử lý những trường hợp thay đổi đổi lựa chọn -> có i -1 cách thay đổi
            for (let i = 0; i < index; i++) {
                // Lấy attr của của vị trí i
                let currentAttr = Object.keys(selected).find(key => selected[key] === i)
                const values = product.attributes[currentAttr]

                values.forEach(val => {
                    // vd Đỏ 39 ...
                    let mappingValues = pathOptions.current.filter(val => val != pathOptions.current[i])
                    mappingValues = [...mappingValues, val]
                    if (!variantHasQuantity(mappingValues)) {
                        handleSetDisableAttr(currentAttr, val)
                    }
                }
                )
            }

            // set selected  [keyChoose] : index
            handleSelected(keyChoose, index)
        }
        else {
            var index = selected[keyChoose]

            pathOptions.current[index] = valueChoose

            let tmpDisableAttr = attributesKey.current.reduce((acc, attr) => {
                if (attr === mainAttr.current) {
                    acc[attr] = mainAttrDisable.current
                }
                else {
                    acc[attr] = [];
                }
                return acc;
            }, {})

            let tmpSelectedRebuild = attributesKey.current.reduce((acc, attr) => {
                acc[attr] = "";
                return acc;
            }, {})

            // Lặp lại cho để build ra kết quả 
            for (let i = 0; i < pathOptions.current.length; i++) {
                // // Lấy attr của của vị trí i 
                var currentAttr = Object.keys(selected).find(key => selected[key] === i)

                tmpSelectedRebuild = { ...tmpSelectedRebuild, [currentAttr]: index }
                var remaindingAttrs = Object.keys(tmpSelectedRebuild).filter(key => tmpSelectedRebuild[key] === "")

                remaindingAttrs.forEach(attr => {
                    // Danh sách value trong thuộc tính
                    const values = product.attributes[attr]

                    values.forEach(val => {
                        // vd xanh 39 ...
                        let mappingValues = [...pathOptions.current.slice(0, i + 1), val];
                        if (!variantHasQuantity(mappingValues)) {
                            handleSetTempDisableAttr(attr, val, tmpDisableAttr)
                        }
                    }
                    )
                })

                // Xử lý những trường hợp thay đổi đổi lựa chọn -> có i -1 cách thay đổi

                for (let j = 0; j < i; j++) {
                    // Lấy attr của của vị trí i 
                    let currentAttr = Object.keys(selected).find(key => selected[key] === j)

                    const values = product.attributes[currentAttr]

                    values.forEach(val => {
                        // vd Đỏ 39 ...
                        let mappingValues = pathOptions.current.filter(val => val != pathOptions.current[j])
                        mappingValues = [...mappingValues, val]
                        if (!variantHasQuantity(mappingValues)) {
                            handleSetTempDisableAttr(currentAttr, val, tmpDisableAttr)
                        }
                    }
                    )
                }

            }
            handleSetDisableAttrWithValue(tmpDisableAttr)
        }

        // Nếu đã chọn hết các thuộc tính
        if (pathOptions.current.length === attributesKey.current.length) {
            setPrice(getPrice(pathOptions.current))
            setIsOptionFull(true)
            // set variant id
            handleSetVariantId(getIdByMappingValues(pathOptions.current))
        }
        // update stock quantity
        setStockQuantity(getCurrentTotalStock(pathOptions.current))
    }

    const processInputQuantity = (input) => {
        if (stockQuantity === 1) {
            setIsMaxQuantity(true)
            setIsMinQuantity(true)

        } else {
            if (input === stockQuantity) {
                setIsMaxQuantity(true)
                setIsMinQuantity(false)
            }

            if (input === 1) {
                setIsMinQuantity(true)
                setIsMaxQuantity(false)
            }
        }


        if (input > remainStock.current || input === remainStock.current) {
            setShowMsg(true)
        }
        else {
            setShowMsg(false)
        }
    }

    // Xử lý khi bấm nút tăng sản phẩm
    const handleOnpressIncrease = () => {
        if (quantityInput === '') {
            setQuantityInput(1)
            lastText.current = 1
        }
        else {
            if (quantityInput + 1 === remainStock.current) {
                setShowMsg(true)
            }

            if (quantityInput === 1) {
                setIsMinQuantity(false)
            }

            if (quantityInput + 1 === stockQuantity) {
                setIsMaxQuantity(true)
            }
            setQuantityInput(quantityInput + 1)
            lastText.current = quantityInput + 1
        }
    }

    // Xử lý khi bấm nút giảm sản phẩm
    const handleOnpressDecrease = () => {
        if (quantityInput === 2) {
            setIsMinQuantity(true)
        }

        if (quantityInput - 1 < remainStock.current) {
            setShowMsg(false)
        }

        if (quantityInput === stockQuantity) {
            setIsMaxQuantity(false)
        }

        setQuantityInput(quantityInput - 1)
        lastText.current = quantityInput - 1
    }

    const handleOnTextChange = (newText) => {
        // Thay thế các kí tự không phải số thành ''
        let input = Number(newText.replace(/[^0-9]/g, ''))
        if (newText === '') {
            lastText.current = ''

            setQuantityInput('');
            setIsMaxQuantity(false)
            setIsMinQuantity(true)
            setShowMsg(false)
        } else {
            if (input > stockQuantity || input === 0) {
                setQuantityInput(lastText.current)
            }
            else {
                processInputQuantity(input)
                lastText.current = input
                setQuantityInput(input)
            }
        }
    }

    const handleOnpressAddToCart = () => {
        if (quantityInput > remainStock.current) {
            setQuantityModalMsg(cartBasic.current[variantId])
            handleOpenModalMsg()
        }
        else {
            // Xử lý cart basic sync with real cart
            if (cartBasic.current[variantId]) {
                cartBasic.current[variantId] += quantityInput
            }
            else {
                console.log("cap nhat cart")
                cartBasic.current[variantId] = quantityInput
                cartDispatch({ type: 'cartAddAVariant' })
            }

            console.log("cart basic", cartBasic)
            // Xử lý tạm put in cart
            if (currentPutInCart.current[variantId]) {
                currentPutInCart.current[variantId] += quantityInput
            }
            else {
                currentPutInCart.current[variantId] = quantityInput
            }

            console.log("current in cart", currentPutInCart.current)

            remainStock.current = remainStock.current - quantityInput
            setToastVisible(true);
        }
    }

    const handleOpenModalMsg = () => {
        setOpenModalMsg(true)
    }

    const handleCloseModalMsg = () => {
        setOpenModalMsg(false)
    }

    const postDataToCart = async () => {
        try {
            let product_variants = Object.keys(currentPutInCart.current).reduce((acc, key) => {
                acc.push({
                    id: key,
                    quantity: currentPutInCart.current[key]
                })

                return acc
            }, [])

            //console.log("pr v post api ", product_variants)
            let dataSentToCart = {
                cart_id: cart.id,
                product_variants
            }
            //console.log("dat to send over api ", dataSentToCart)

            const token = await AsyncStorage.getItem('token');
            let newCartRes = await authApis(token).post(endpoints['postProductsToCart'], dataSentToCart)
            //console.log("cart res", newCartRes.data)

            cartDispatch({type: Cart_Action_Type.UPDATE_CART_AFTER_POST, payload: newCartRes.data})
            console.log("update cart after post")
        }
        catch(err) {
            console.log("error post data to cart", err)
        }
    }


    useEffect(() => {
        // Chạy mỗi lần khi mounted
        // Biến đổi cart object qua dạng basic để dễ xử lý và tìm kiếm
        cartBasic.current = cart.product_variants.reduce((acc, variant) => {
            acc[variant.variant_id] = variant.quantity
            return acc
        }, {})

    }, [])

    useEffect(() => {
        // Chạy mỗi khi mounted và variantId thay đổi
        if (variantId) {
            remainStock.current = stockQuantity - (cartBasic.current?.[variantId] ?? 0)
            lastText.current = 1
            setShowMsg(remainStock.current === 0 || stockQuantity === 1)
            setIsMaxQuantity(stockQuantity === 1)
            setQuantityInput(1)
        }
    }, [variantId])

    useEffect(() => {
        // Gọi API cập nhật cart khi unmount
        return () => {
            postDataToCart()
        }
    }, [])
    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <View style={styles.header}>
                    <View>
                        <Pressable>
                            <Image source={{ uri: mainImage }} style={styles.headerImage} />
                        </Pressable>

                    </View>

                    <View style={{ flex: 2, justifyContent: "flex-end", alignItems: "flex-start", paddingHorizontal: 18, gap: 10 }}>
                        <Text style={{ color: "#fa5230", fontSize: 20, fontWeight: 650 }}>
                            <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 500, textDecorationLine: 'underline' }}>đ</Text>
                            {price.toLocaleString("vi-VN")}
                        </Text>
                        <Text style={{ color: "#ccc", fontSize: 16 }}>Kho: {stockQuantity}</Text>
                    </View>

                    <View>
                        <Pressable style={styles.btn} onPress={handleOnPressClose}>
                            <Icon name="close" size={30} color="rgba(0,0,0,0.5)"></Icon>
                        </Pressable>
                    </View>
                </View>
                <ScrollView style={styles.bodyContent}>
                    {
                        dataToRender.current.map(([key, value]) => {
                            // Kiem tra key == MainAttr thi hien logo
                            return (
                                <View key={key} style={styles.attributeGroupContainer}>
                                    <Text style={{ fontSize: 16 }}>{key}</Text>
                                    <View style={styles.subAttrGroupContainer}>
                                        {
                                            key === mainAttr.current ? (
                                                // Render the array of objects for mainAttr
                                                Array.isArray(value) && value.map((item, index) => {
                                                    return (
                                                        // Kiểm tra nếu nằm trong ds disable hay không
                                                        <BoxOption key={index} isDisable={disableAttr[key].includes(item.name)} logo={item.logo} name={item.name} choosen={pathOptions.current.includes(item.name)} onPress={() => { setMainImage(item.logo); handleOnPressAttrValue(key, item.name, selected) }}></BoxOption>
                                                    )
                                                })
                                            ) : (
                                                // Render regular array of strings
                                                Array.isArray(value) && value.map((item, index) =>
                                                (
                                                    // Kiểm tra nếu nằm trong ds disable hay không
                                                    <BoxOption key={index} isDisable={disableAttr[key].includes(item)} name={item} choosen={pathOptions.current.includes(item)} onPress={() => handleOnPressAttrValue(key, item, selected)}></BoxOption>
                                                )
                                                )
                                            )
                                        }
                                    </View>
                                </View>
                            )
                        })
                    }

                    <View style={styles.quantityStepperContainer}>
                        <View style={styles.textBox}>
                            <Text style={{ fontSize: 16 }}>Số lượng</Text>
                        </View>
                        <View style={[styles.quantityBox, !isOptionFull && { opacity: 0.4 }]}>
                            <TouchableOpacity
                                style={[styles.decreaseBtn, isMinQuantity && { opacity: 0.4 }]}
                                disabled={!isOptionFull || isMinQuantity}
                                onPress={handleOnpressDecrease}
                            >
                                <Text>-</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.textInput}
                                value={quantityInput.toString()}
                                keyboardType="numeric"
                                onChangeText={handleOnTextChange}
                                maxLength={10}
                                editable={isOptionFull}
                            />
                            <TouchableOpacity
                                style={[styles.increaseBtn, isMaxQuantity && { opacity: 0.4 }]}
                                disabled={!isOptionFull || isMaxQuantity}
                                onPress={handleOnpressIncrease}
                            >
                                <Text>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {
                        showMsg && (<Text style={{ marginTop: 10, fontSize: 12, color: "#fa5230" }}>Số lượng bạn chọn đã đạt mức tối đa của sản phẩm này</Text>)
                    }

                </ScrollView>
            </View>

            <View style={[styles.bigBtnContainer, { margin: 0 }]}>
                <View style={[styles.bigBtn, , { backgroundColor: isOptionFull ? "#fa5230" : "#d3d3d3" }]}>
                    <Pressable disabled={!isOptionFull} onPress={handleOnpressAddToCart}>
                        <Text style={[styles.bigBtnText, { color: isOptionFull ? "#fff" : "rgba(255,255,255,0.7)" }]}>Thêm vào Giỏ hàng</Text>
                    </Pressable>
                </View>
            </View>

            <ToastMessage
                message="Đã thêm vào giỏ"
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
            />

            <ModalMessage
                visible={openModalMsg}
                handleCloseModalMsg={handleCloseModalMsg}
                quantity={quantityModalMsg}
            />
        </View>
    )
};

export default ModalProductContent

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    subContainer: {
        flex: 1,
        margin: 10,
    },
    header: {
        flexDirection: "row",
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.3)"
    },
    headerImage: {
        width: 130,
        height: 130,
        borderRadius: 16
    },
    bodyContent: {
        marginTop: 0,
    },
    attributeGroupContainer: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.3)"
    },
    subAttrGroupContainer: {
        marginTop: 10,
        flexDirection: "row",
        gap: 5
    },
    btnAttrValue: {
        flexDirection: "row",
        backgroundColor: "#ccc",
    },
    smallImage: {
        width: 30,
        height: 30,
        borderRadius: 3
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10
    },
    stockText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    optionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderRadius: 6,
        padding: 3,
        margin: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    optionImage: {
        width: 30,
        height: 30,
        borderRadius: 4,
        marginRight: 6,
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    disabled: {
        opacity: 0.7,
    },
    disabledImage: {
        // Optional: desaturate with opacity or grayscale (if using SVG or styled images)
        opacity: 0.8,
    },
    disabledText: {
        color: '#888',
    },
    quantityStepperContainer: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textInput: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        fontSize: 14,
        minWidth: 50,
        textAlign: 'center',
        color: "#fa5230"
    },
    quantityBox: {
        flexDirection: "row",
        justifyContent: "center",
        borderColor: "rgba(0,0,0,0.3)",
        borderWidth: 0.5,
        borderRadius: 10
    },
    decreaseBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: "center",
        borderRightColor: "rgba(0,0,0,0.3)",
        borderRightWidth: 1
    },
    increaseBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: "center",
        borderLeftColor: "rgba(0,0,0,0.3)",
        borderLeftWidth: 1
    },
    bigBtnContainer: {
        height: 100,
        backgroundColor: "white",
        borderTopColor: "rgba(0,0,0,0.1)",
        borderTopWidth: 8
    },
    bigBtn: {
        height: 50,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10
    },
    bigBtnText: {
        fontSize: 16
    }
});

// Xong theem vao gio tren front con back end
// Done:   gọi API thêm vào giỏ (kHI đã chọn đủ mới cho gọi API)

// TO DO LISTTTTT: Xử lý trang chi tiết giỏ hàng , nút bấm mua ngay