import { View, Text, StyleSheet, Pressable, TouchableOpacity, Image, TextInput, Animated, Easing, Keyboard, Alert  } from "react-native"
import { useState, useRef, useEffect, useContext, use } from "react";
import CheckBox from "react-native-check-box";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSwipe } from "../utils/useSwipe";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { CartContext } from "../../configs/MyContext";
import { Cart_Action_Type } from "../../reducers/CartReducer";
import ModalCartMessage from "./modalCartMessage";
import CustomModalProduct from "../utils/CustomModalProduct";
import BottomModal from "../ui/productDetail/BottomModal";
import { useNavigation, useRoute } from "@react-navigation/native";

const CartProduct = ({ cartProduct, isFixButtonPressed, toggleTickCart, handleSetCartProducts, isCheckCartProduct, handleRemoveCartDetail, handleAddTickCart }) => {
    const { cartDispatch } = useContext(CartContext)
    const translateX = useRef(new Animated.Value(0)).current
    const widthRemoveSimilarBtn = useRef(new Animated.Value(0)).current
    const { onTouchStart, onTouchEnd } = useSwipe(handleSwipeLeft, handleSwipeRight)
    const [quantityInput, setQuantityInput] = useState(cartProduct.quantity)
    const [isShift, setIsShift] = useState(false)
    const [modalCartRemoveMsgVisible, setModalCartRemoveMsgVisible] = useState(false)
    const [modalCartMaxMsgVisible, setModalCartMaxMsgVisible] = useState(false)
    const timerId = useRef(null)
    const productForNavigate = useRef(null)
    const nav = useNavigation()
    const route = useRoute()

    const getAttributes = (attributes) => {
        return attributes.reduce((str, attr, index) => {
            if (index != 0) {
                str += ", "
            }
            return str += attr.value
        }, "")
    }

    function handleSwipeLeft() {
        setIsShift(true)
    }

    function handleSwipeRight() {
        setIsShift(false)
    }

    const handleSetQuantityInput = (value, cartDetailId) => {
        if (quantityInput === '') {
            setQuantityInput(cartProduct.quantity)
        }
        else {
            if (quantityInput + value === 0) {
                // Hien modal
                setModalCartRemoveMsgVisible(true)
            }
            else {
                if (quantityInput + value === cartProduct.product_variant.stock_quantity) {
                    setModalCartMaxMsgVisible(true)
                }
                setQuantityInput(prev => prev + value)
            }
        }
        handleAddTickCart(cartDetailId.toString())
    }

    const handleDeleteCartDetail = async (cartDetailId) => {
        try {
            //console.log("remove cart detail ", cartDetailId)
            const token = await AsyncStorage.getItem('token')
            let res = await authApis(token).delete(endpoints["removeCartDetail"](cartDetailId))
            let updateCart = await authApis(token).get(endpoints.cart_basic_info);
            cartDispatch({ type: Cart_Action_Type.UPDATE_CART, payload: updateCart.data })
            handleSetCartProducts(res.data)
            handleRemoveCartDetail(cartDetailId.toString())
        }
        catch (err) {
            console.log("Fail to delete cart detail ", err)
        }
    }

    const handleEnterQuantityInput = (newText) => {
        // Thay thế các kí tự không phải số thành ''
        let input = Number(newText.replace(/[^0-9]/g, ''))
        if (newText === '') {
            setQuantityInput('');
        } else {
            if (input > cartProduct.product_variant.stock_quantity) {
                setQuantityInput(input)
                setTimeout(() => {
                    setModalCartMaxMsgVisible(true)
                    setQuantityInput(cartProduct.product_variant.stock_quantity)
                }, 500)
            } else if (input === 0) {
                setModalCartRemoveMsgVisible(true)
                setQuantityInput(cartProduct.quantity)
            }
            else {
                setQuantityInput(input)
            }
        }
        handleAddTickCart(cartProduct.cart_detail.toString())
    }

    const handlePatchCartDetail = async (dataToPatch) => {
        try {
            const token = await AsyncStorage.getItem("token")
            let res = await authApis(token).patch(endpoints["patchCartDetail"](cartProduct.cart_detail), dataToPatch)
            //console.log("res patch cart detail ", res.data)

            let updateCart = await authApis(token).get(endpoints.cart_basic_info);
            cartDispatch({ type: Cart_Action_Type.UPDATE_CART, payload: updateCart.data })
            handleSetCartProducts(res.data)
        }
        catch (err) {
            console.log("Fail to patch cart detail")
        }
    }

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: isFixButtonPressed || isShift ? -180 : 0,
            duration: 400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true
        }).start(),
            Animated.timing(widthRemoveSimilarBtn, {
                toValue: isFixButtonPressed || isShift ? 170 : 0,
                duration: 400,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: false
            }).start()

    }, [isFixButtonPressed, isShift])

    // Debounce
    useEffect(() => {
        if (quantityInput != cartProduct.quantity && quantityInput != '' && !(quantityInput > cartProduct.product_variant.stock_quantity)) {
            timerId.current = setTimeout(() => {
                handlePatchCartDetail({ quantity: quantityInput })
            }, 1500)
        }
        // Lắng nghe sự kiện bàn phím đóng kiểm tra xem nguwoif dùng đã nhập liệu hay chưa
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            if (quantityInput === '') {
                Alert.alert('Bạn chưa nhập dữ liệu!', 'Vui lòng nhập trước khi thoát.');
                setQuantityInput(cartProduct.quantity)
            }
        });

        return () => {
            clearTimeout(timerId.current)
            keyboardDidHideListener.remove()
        }
    }, [quantityInput])

    const getProductById = async (pId) => {
        try {
            let res = await Apis.get(endpoints["getProductById"](pId))
            productForNavigate.current = res.data
        }catch(err) {
            console.log("Fail to load product from cart Product ", err)
        }
    }

    const handleGoToPageProductDetail = () => {
        nav.navigate('productDetail', {productId:productForNavigate.current.id, productLogo:productForNavigate.current.logo,
             prevScreen: {previousRoute: route.name, prevRouteParams: route.params}})
    }

    // Update quantity input 
    useEffect(() => {
        setQuantityInput(cartProduct.quantity)
    }, [cartProduct])
   
    /////////////////////////////////////////////////////////////// Modal  ///////////////////////////////////////////////////////////
    const [openModalCart, setOpenModalCart] = useState(false)

    // Product dùng để mở modal
    const [product, setProduct] = useState(null);
    const pathOptions = useRef(setUpInitialPathOptions())
    const mainAttr = useRef(null)
    const mainAttrDisable = useRef(null)
    const [selected, setSelected] = useState(setUpInitialSelected())
    const processMainAttrDisable = useRef(null)
    const [disableAttr, setDisableAttr] = useState(null)
    const [variantId, setVariantId] = useState(cartProduct.product_variant.id)

    const handleSelected = (keyChoose, index) => {
        setSelected(prev => ({ ...prev, [keyChoose]: index }))
    }

    const handleSetDisableAttr = (attr, value) => {
        if (!disableAttr[attr].includes(value)) {
            setDisableAttr(prev => ({ ...prev, [attr]: [...prev[attr], value] }))
        }
    }

    const handleSetDisableAttrWithValue = (value) => {
        setDisableAttr(value)
    }

    const handleSetVariantId = (value) => {
        setVariantId(value)
    }

    function setUpInitialPathOptions() {
        let tmp = []
        cartProduct.product_variant.attributes.forEach(attr => {
            tmp.push(attr.value)
        })
        return tmp
    }

    function setUpInitialSelected() {
        return cartProduct.product_variant.attributes.reduce((select, attr, index) => {
            select[attr.attribute_name] = index
            return select
        }, {})
    }

    const setUpInitialDisableAttr = () => {
        const attributesKey = Object.keys(product.attributes)

        let tmpDisableAttr = attributesKey.reduce((acc, attr) => {
            if (attr === mainAttr.current) {
                acc[attr] = mainAttrDisable.current
            }
            else {
                acc[attr] = [];
            }
            return acc;
        }, {})

        let tmpSelectedRebuild = attributesKey.reduce((acc, attr) => {
            acc[attr] = "";
            return acc;
        }, {})

        // Lặp lại cho để build ra kết quả 
        for (let i = 0; i < pathOptions.current.length; i++) {
            // // Lấy attr của của vị trí i 
            var currentAttr = Object.keys(selected).find(key => selected[key] === i)

            tmpSelectedRebuild = { ...tmpSelectedRebuild, [currentAttr]: i }
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

    const setUpInitialConfig = () => {
        pathOptions.current = setUpInitialPathOptions()
        setSelected(setUpInitialSelected())
        setUpInitialDisableAttr()
        setVariantId(cartProduct.product_variant.id)
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

    const handleSetTempDisableAttr = (attr, value, tmpDisableAttr) => {
        if (!tmpDisableAttr[attr].includes(value)) {
            tmpDisableAttr[attr] = [...tmpDisableAttr[attr], value];
        }
    }

    const loadProductDetail = async (productId) => {
        try {
            let res = await Apis.get(endpoints['product'](productId));
            // batching 
            setProduct(res.data);
        } catch (error) {
            throw error;
        }
    }

    const handleUpdateCartProVariant = (quantityInput) => {
        if (!(quantityInput > cartProduct.product_variant.stock_quantity - cartProduct.quantity)) {
            handlePatchCartDetail({
                product_variant: variantId,
                quantity: quantityInput
            })
        }
        else
            console.log("Khong the update cart pro variant vi so luong vuot qua gioi han ", quantityInput)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    useEffect(() => {
        // Call API to get product id
        //console.log("... loading product ")
        loadProductDetail(cartProduct.product_variant.product_id).catch(err => console.log("Fail to load product ", err))
        getProductById(cartProduct.product_variant.product_id)
    }, [])

    useEffect(() => {
        if (product != null) {
            //console.log("... Build config")
            processMainAttrDisable.current = () => {
                // Xử lý những sản phẩm có main attr mà bị hết hàng => disable nó
                var arrayDisable = []
                const mainAttrValues = product.attributes[mainAttr.current]

                // Kiểm tra cho từng main attr value
                mainAttrValues.forEach(element => {
                    let stockQuantity = 0
                    product.productvariant_set.forEach(variant => {
                        const tmpMainAttr = variant.attributes.find(attr => attr.attribute_name === mainAttr.current)
                        if (tmpMainAttr) {
                            var valueMainAttr = tmpMainAttr.value
                            if (valueMainAttr === element) {
                                stockQuantity += variant.quantity
                            }
                        }
                    })
                    stockQuantity === 0 && arrayDisable.push(element)
                });
                //console.log("array disable", arrayDisable)
                return arrayDisable
            }

            mainAttr.current = Object.keys(product.attributes)[0]
            mainAttrDisable.current = processMainAttrDisable.current()

            // set up disable attr
            setUpInitialDisableAttr()
        }
    }, [product])

    // if (product === null || productForNavigate.current === null) {
    //     return null
    // }

    return (
        <View style={[cartProdutStyles.container]}>
            <Animated.View style={[cartProdutStyles.mainContentContainer, { transform: [{ translateX }] }]}
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            >
                <View style={[{ justifyContent: "center", alignItems: "center" }, !cartProduct.active && { opacity: 0.4 }]}>
                    <CheckBox
                        isChecked={isCheckCartProduct(cartProduct.cart_detail)}
                        onClick={() => toggleTickCart(cartProduct.cart_detail.toString())}
                        checkedCheckBoxColor="#fa5230"
                        uncheckedCheckBoxColor="#ccc"
                        style={cartProdutStyles.checkbox}
                    />
                </View>
                <View style={[cartProdutStyles.imageContainer, !cartProduct.active && { opacity: 0.4 }]}>
                    <Pressable onPress={handleGoToPageProductDetail} disabled={!cartProduct.active}>
                        <Image source={{ uri: cartProduct.product_variant.logo }} style={cartProdutStyles.variantImage} />
                    </Pressable>
                </View>
                <View style={[{ justifyContent: "space-between", flex: 1 }, !cartProduct.active && { opacity: 0.4 }]}>
                    <View>
                        <Pressable onPress={handleGoToPageProductDetail} disabled={!cartProduct.active}>
                            <Text style={{ fontSize: 12 }}> {cartProduct.product_variant.product_name} </Text>
                        </Pressable>
                        <Pressable style={[cartProdutStyles.btnChangeVariant, { marginTop: 4 }]}
                            disabled={!cartProduct.active} onPress={() => { setOpenModalCart(true); handleAddTickCart(cartProduct.cart_detail.toString())}}>
                            <Text style={{ fontSize: 12 }}> {getAttributes(cartProduct.product_variant.attributes)} </Text>
                            <Icon name="arrow-drop-down" size={16} color="#555" />
                        </Pressable>
                    </View>
                    <View style={cartProdutStyles.priceAndQuantityBox}>
                        <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 700 }}>
                            <Text style={{ color: "#fa5230", fontSize: 12, padding: 8, fontWeight: 700, textDecorationLine: 'underline' }}>đ</Text>
                            {cartProduct.product_variant.price.toLocaleString("vi-VN")}
                        </Text>

                        <View style={[cartProdutStyles.quantityBox]}>
                            <TouchableOpacity
                                style={[cartProdutStyles.decreaseBtn]}
                                onPress={() => { handleSetQuantityInput(-1, cartProduct.cart_detail) }}
                                disabled={!cartProduct.active}
                            >
                                <Text>-</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={cartProdutStyles.textInput}
                                value={String(quantityInput)}
                                keyboardType="numeric"
                                onChangeText={handleEnterQuantityInput}
                                maxLength={10}
                                editable={cartProduct.active}
                            />
                            <TouchableOpacity
                                style={[cartProdutStyles.increaseBtn, quantityInput === cartProduct.product_variant.stock_quantity && { opacity: 0.4 }]}
                                onPress={() => { handleSetQuantityInput(1, cartProduct.cart_detail) }}
                                disabled={!cartProduct.active || quantityInput === cartProduct.product_variant.stock_quantity}
                            >
                                <Text>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={[cartProdutStyles.removeAndFindSimilarBtn, { width: widthRemoveSimilarBtn }]}>
                <Pressable onPress={() => console.log("san pham tuong tu")} style={cartProdutStyles.findSimilarBtn} disabled={!cartProduct.active}>
                    <Text style={{ fontSize: 14, color: "#fff", textAlign: "center" }}>Sản phẩm tương tự</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteCartDetail(cartProduct.cart_detail)} style={cartProdutStyles.removeBtn} disabled={!cartProduct.active}>
                    <Text style={{ fontSize: 14, color: "#fff" }}>Xóa</Text>
                </Pressable>
            </Animated.View>

            <ModalCartMessage visible={modalCartRemoveMsgVisible} message={"Bạn có chắc muốn bỏ sản phẩm này?"} handleCloseModalCartMsg={() => setModalCartRemoveMsgVisible(false)}
                handleRemoveCartDetail={() => handleDeleteCartDetail(cartProduct.cart_detail)} />
            <ModalCartMessage visible={modalCartMaxMsgVisible} message={`Rất tiếc bạn chỉ có thể mua tối đa ${cartProduct.product_variant.stock_quantity} sản phẩm này`}
                showBtnNo={false} handleCloseModalCartMsg={() => setModalCartMaxMsgVisible(false)} handleRemoveCartDetail={() => { }} />

            <BottomModal visible={openModalCart} handleOnbackDrop={() => { setOpenModalCart(false) }}>
                <CustomModalProduct
                    product={product}
                    pathOptions={pathOptions}
                    handleOnPressClose={() => setOpenModalCart(false)}
                    mainAttr={mainAttr}
                    mainAttrDisable={mainAttrDisable}
                    selected={selected}
                    handleSelected={handleSelected}
                    disableAttr={disableAttr}
                    handleSetDisableAttr={handleSetDisableAttr}
                    handleSetDisableAttrWithValue={handleSetDisableAttrWithValue}
                    variantId={variantId}
                    handleSetVariantId={handleSetVariantId}
                    handleOnpressConfirm={handleUpdateCartProVariant}
                    initQuantityInput={cartProduct.quantity}
                    setUpInitialConfig={setUpInitialConfig}
                    handleOpenmodalCartRemoveMsgVisible={() => setModalCartRemoveMsgVisible(true)}
                ></CustomModalProduct>
            </BottomModal>

        </View>

    )
}

export default CartProduct

const cartProdutStyles = StyleSheet.create({
    container: {
        marginVertical: 4,
        backgroundColor: '#fff',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    checkbox: {
        width: 30,
        height: 30,
        marginRight: 0,
    },
    mainContentContainer: {
        flexDirection: "row",
        marginVertical: 10,
    },
    variantImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    imageContainer: {
        marginRight: 10
    },
    btnChangeVariant: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 6,
        borderRadius: 5,
        flexWrap: 'nowrap',
        alignSelf: "flex-start" // ensure that it just have it just take space of it own content
    },
    priceAndQuantityBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end"
    },
    quantityBox: {
        flexDirection: "row",
        justifyContent: "center",
        borderColor: "rgba(0,0,0,0.3)",
        borderWidth: 0.5,
        borderRadius: 2
    },
    decreaseBtn: {
        paddingHorizontal: 8,
        alignSelf: "center",
        borderRightColor: "rgba(0,0,0,0.3)",
        borderRightWidth: 1
    },
    increaseBtn: {
        paddingHorizontal: 8,
        alignSelf: "center",
        borderLeftColor: "rgba(0,0,0,0.3)",
        borderLeftWidth: 1
    },
    textInput: {
        paddingHorizontal: 8,
        fontSize: 12,
        textAlign: 'center',
        color: "#fa5230"
    },
    removeAndFindSimilarBtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        marginVertical: 10,
    },
    removeBtn: {
        width: 85,
        backgroundColor: "#fa5230",
        justifyContent: "center",
        alignItems: "center",
    },
    findSimilarBtn: {
        width: 85,
        backgroundColor: "#ffbf00",
        justifyContent: "center",
        alignItems: "center",
    }
})


// Mai: Xử lý input nhập bằng cơm xử lý modal khoai nhấttttt