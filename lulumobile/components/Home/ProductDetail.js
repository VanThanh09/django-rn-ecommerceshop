import { useEffect, useState, useRef, useCallback } from "react"
import { ScrollView, Text, View, StyleSheet, Image, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import HeaderHome from "../ui/homePage/HeaderHome";
import { ActivityIndicator } from "react-native-paper";
import GestureRecognizer from "react-native-swipe-gestures";
import CommentProductDetail from "../comment/commentProductDetail"
import StoreCard from "../ui/productDetail/StoreCard";
import { RouteProvider } from "../utils/RouteProvider"
import { PendingActionProvider } from "../utils/PendingActionProvider";
import ViewMoreText from "../utils/ViewMoreText";
import TabBarProduct from "../ui/productDetail/tabBar";
import BottomModal from "../ui/productDetail/BottomModal";
import ModalProductContent from "../ui/productDetail/ModalProductContent";

function formatNumber(value) {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + "M";
    } else if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + "k";
    }
    return value.toString();
}

export const ACTION_TYPES = {
    LIKE_CMT: "like_comment",
    ADD_PRODUCT_CART: "add_product_to_cart"
}

const ProductDescription = ({ description }) => {
    return (
        <View style={styles.productDes}>
            <View style={{ padding: 16, borderBottomColor: 'rgba(0, 0, 0, .09)', borderBottomWidth: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: 600 }}>Chi tiết sản phẩm</Text>
            </View>
            <View>
                <Text style={{ paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, fontWeight: 600 }}>Mô tả sản phẩm</Text>
                <ViewMoreText>{description}</ViewMoreText>
            </View>
        </View>
    )
}

const ProductDetail = ({ route }) => {
    const { productId, productLogo} = route.params
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState(productLogo)
    const [productAttrName, setProductAttrName] = useState('')
    const [price, setPrice] = useState(null)
    const [soldItems, setSoldItem] = useState(null)
    const [index, setIndex] = useState(-1)
    const [comments, setComments] = useState(null)
    const [pendingAction, setPendingAction] = useState(null)
    const pathOptions = useRef([])

    const [openModalCart, setOpenModalCart] = useState(false)
    const [openModalBuyNow, setOpenModalBuyNow] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const addPendingAction = (actionType, payload) => {
        const currentAction = {
            type: actionType,
            payload,
        };
        setPendingAction(currentAction)
    }

    const resetPendingAction = () => {
        setPendingAction(null)
    }

    const loadProductDetail = async () => {
        try {
            let res = await Apis.get(endpoints['product'](productId));
            let soldItems = await Apis.get(endpoints['soldProducts'](productId))
            let mainAttr = Object.keys(res.data.attributes)[0]
            // console.log(mainAttr)
            const images = Array.from(
                new Map(
                    res.data.productvariant_set
                        .map(variant => {
                            let MainAttr = variant.attributes.find(attr => attr.attribute_name === mainAttr);
                            return [MainAttr?.value, { name: MainAttr?.value, logo: variant.logo }];
                        })
                ).values()
            );

            //console.log(images)
            // batching 
            setProduct(res.data);
            setPrice(res.data.productvariant_set[0].price)
            setSoldItem(soldItems.data.sold_items)
            setImages(images)
        } catch (error) {
            throw error;
        }
    }

    const loadProductTop5comments = async () => {
        try {
            let comments = await Apis.get(endpoints['top5CommentsProduct'](productId));
            setComments(comments.data)
        }
        catch (error) {
            throw error
        }
    }

    function swipeLeft() {
        if ((index + 1) == images.length) {
            setSelectedImage(productLogo)
            setProductAttrName('')
            //setPrice(product.productvariant_set[0].price)
        }
        else {
            //product.productvariant_set[(index + 1) % (product.productvariant_set.length + 1)]
            setSelectedImage(images[(index + 1) % (images.length + 1)].logo)
            setProductAttrName(images[(index + 1) % (images.length + 1)].name)
            //setPrice(product.productvariant_set[(index + 1) % (product.productvariant_set.length + 1)].price)
        }

        setIndex((index + 1) % (images.length + 1))
    }

    function swipeRight() {
        // Nếu đang ở logo chính thì sẽ quay về logo của phần tử cuối cùng, set index là phần tử cuối
        if (index == -1) {
            setSelectedImage(images[images.length - 1].logo)
            setProductAttrName(images[images.length - 1].name)
            setIndex(images.length - 1)
            return;
        }

        if (index - 1 == -1) {
            setSelectedImage(productLogo)
            setProductAttrName('')
        }
        else {
            setSelectedImage(images[(index - 1) % (images.length + 1)].logo)
            setProductAttrName(images[(index - 1) % (images.length + 1)].name)
            //setPrice(product.productvariant_set[(index - 1) % (product.productvariant_set.length + 1)].price)
        }

        setIndex((index - 1) % (images.length + 1))
    }

    // Refresh page useCallback to prevent the RefreshControl re-render unnecessaryly
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        const fetchData = async () => {
            try {
                await Promise.all([
                    loadProductDetail(),
                    loadProductTop5comments()
                ]);
            }
            catch (err) {
                console.log("Failed to refresh product or comments", err);
            }
        }

        fetchData().finally(() => setRefreshing(false))
    }, [])

    /////////////////////////////////////////////////////////////// Modal  ///////////////////////////////////////////////////////////
    const mainAttr = useRef(null)
    const mainAttrDisable = useRef(null)
    // build selected
    const [selected, setSelected] = useState(null)

    const handleSelected = (keyChoose, index) => {
        setSelected(prev => ({ ...prev, [keyChoose]: index }))
    }

    const processMainAttrDisable = useRef(null)

    const [disableAttr, setDisableAttr] = useState(null)

    const handleSetDisableAttr = (attr, value) => {
        if (!disableAttr[attr].includes(value)) {
            setDisableAttr(prev => ({ ...prev, [attr]: [...prev[attr], value] }))
        }
    }

    const handleSetDisableAttrWithValue = (value) => {
        setDisableAttr(value)
    }

    const [variantId, setVariantId] = useState(null)

    const handleSetVariantId = (value) => {
        setVariantId(value)
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    useEffect(() => {
        if (product != null) {
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
            setSelected(
                Object.keys(product.attributes).reduce((acc, attr) => {
                    acc[attr] = "";
                    return acc;
                }, {})
            );

            setDisableAttr(
                Object.keys(product.attributes).reduce((acc, attr) => {
                    if (attr === mainAttr.current) {
                        acc[attr] = processMainAttrDisable.current()
                    }
                    else {
                        acc[attr] = [];
                    }
                    return acc;
                }, {})
            )
        }

    }, [product])

    useEffect(() => {
        loadProductDetail().catch(err => console.log("Fail to load product ", err))
        loadProductTop5comments().catch(err => console.log("Fail to load 5 comments", err))
    }, [productId]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {product === null ?
                (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator color={"#fa5230"} />
                    </View>
                ) :
                (
                    <PendingActionProvider pendingAction={pendingAction} addPendingAction={addPendingAction} resetPendingAction={resetPendingAction}>
                        <RouteProvider route={route}>
                            <ScrollView stickyHeaderIndices={[0]}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                }>
                                <HeaderHome value={searchQuery} onChangeText={setSearchQuery} showBackButton={true} showHomeButton={true} />
                                <View style={styles.productContainer}>
                                    <GestureRecognizer
                                        onSwipeLeft={() => swipeLeft()}
                                        onSwipeRight={() => swipeRight()}
                                    >
                                        <View>
                                            <Image source={{ uri: selectedImage }} style={styles.mainImage}></Image>
                                        </View>
                                    </GestureRecognizer>

                                    <View>
                                        <Text style={{ color: 'rgba(0, 0, 0, .87)', paddingTop: 8, paddingLeft: 8 }}>{productAttrName}</Text>
                                    </View>
                                    <ScrollView horizontal style={styles.subImageContainer} contentContainerStyle={{ paddingLeft: 8, marginTop: 5 }}>
                                        {
                                            images.length > 0 && images.map(i => {
                                                return (
                                                    <View key={i.name} style={[styles.subImageWrapper, i.logo == selectedImage && { borderColor: '#fa5230', borderWidth: 1 }]}>
                                                        <Pressable onPress={() => { setSelectedImage(i.logo); setProductAttrName(i.name); }}>
                                                            <Image source={{ uri: i.logo }} style={styles.subImage} resizeMode="contain"></Image>
                                                        </Pressable>
                                                    </View>
                                                )
                                            })
                                        }
                                    </ScrollView>
                                    <View style={styles.priceSoldContainer}>
                                        <Text style={{ color: "#fa5230", fontSize: 20, padding: 8, fontWeight: 700 }}>
                                            <Text style={{ color: "#fa5230", fontSize: 15, padding: 8, fontWeight: 500, textDecorationLine: 'underline' }}>đ</Text>
                                            {price.toLocaleString("vi-VN")}
                                        </Text>
                                        <Text style={{ padding: 11 }}>Đã bán {formatNumber(soldItems)}</Text>
                                    </View>
                                </View>

                                <View style={styles.commentContainer}>
                                    <CommentProductDetail commentsInfo={comments}></CommentProductDetail>
                                </View>

                                <View>
                                    <StoreCard storeId={product.store.id} />
                                </View>

                                <View style={{ marginTop: 8 }}>
                                    <ProductDescription description={product.description}></ProductDescription>
                                </View>

                            </ScrollView>
                            {
                                product && (
                                    <BottomModal visible={openModalCart} handleOnbackDrop={() => { setOpenModalCart(false) }}>
                                        <ModalProductContent
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
                                        ></ModalProductContent>
                                        {/* <ModalMessage
                                            visible={openModalMsg}
                                            handleCloseModalMsg={handleCloseModalMsg}
                                            quantity={3}
                                        /> */}
                                    </BottomModal>
                                )}
                            <SafeAreaView>
                                <TabBarProduct style={styles.tabBarProduct} price={price}
                                    openModalCart={() => { setOpenModalCart(true) }}
                                    openModalBuyNow={() => { setOpenModalBuyNow(true) }}>
                                </TabBarProduct>
                            </SafeAreaView>
                        </RouteProvider>
                    </PendingActionProvider>
                )
            }
        </SafeAreaView>
    );
}

export default ProductDetail;

const styles = StyleSheet.create({
    productContainer: {
        paddingTop: 10,
        backgroundColor: '#fff'
    },
    mainImage: {
        width: '100%',
        height: 400
    },
    subImageContainer: {
        flexDirection: 'row',
    },
    subImageWrapper: {
        width: 50, // Fixed width for each image
        height: 50, // Fixed height for each image
        overflow: 'hidden', // Hide anything that overflows the container
        marginRight: 10
    },
    subImage: {
        width: '100%', // Take full width of the container
        height: '100%', // Take full height of the container
    },
    priceSoldContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    commentContainer: {
        marginTop: 8,
        backgroundColor: '#fff'
    },
    productDes: {
        backgroundColor: '#fff'
    },
    tabBarProduct: {

    }
})

