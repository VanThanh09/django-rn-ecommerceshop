import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    TouchableWithoutFeedback, Pressable,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BoxOption = ({ logo = undefined, name, onPress, isDisable, choosen }) => (
    <Pressable style={[styles.optionBox, isDisable && styles.disabled, choosen && { borderColor: "#fa5230", borderWidth: 1 }]} onPress={onPress} disabled={isDisable}>
        {
            logo && <Image source={{ uri: logo }} style={[styles.optionImage, isDisable && styles.disabledImage]} />
        }
        <Text style={[styles.optionText, isDisable && styles.disabledText, !logo && { paddingHorizontal: 18, paddingVertical: 5 }]}>{name}</Text>
    </Pressable>
);

const ModalProductContent = ({ product, handleOnPressClose }) => {
    const [stockQuantity, setStockQuantity] = useState(0)
    const [price, setPrice] = useState(350000)
    const attributesKey = useRef(Object.keys(product.attributes))

    // build selected
    const [selected, setSelected] = useState(
        attributesKey.current.reduce((acc, attr) => {
            acc[attr] = "";
            return acc;
        }, {})
    );

    const mainAttr = useRef(Object.keys(product.attributes)[0])

    // build disable
    const processMainAttrDisable = () => {
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

    const mainAttrDisable = useRef(processMainAttrDisable())

    const [disableAttr, setDisableAttr] = useState(
        attributesKey.current.reduce((acc, attr) => {
            if (attr === mainAttr.current) {
                acc[attr] = mainAttrDisable.current
            }
            else {
                acc[attr] = [];
            }
            return acc;
        }, {})
    )

    // build data to render  attr

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

    const handleSetDisableAttr = (attr, value) => {

        if (!disableAttr[attr].includes(value)) {
            setDisableAttr(prev => ({ ...prev, [attr]: [...prev[attr], value] }))
        }
    }

    const handleSetTempDisableAttr = (attr, value, tmpDisableAttr) => {
        if (!tmpDisableAttr[attr].includes(value)) {
            tmpDisableAttr = { ...tmpDisableAttr, [attr]: [...tmpDisableAttr[attr], value] }
        }
    }

    const resetDisableAttr = () => {
        setDisableAttr(attributesKey.current.reduce((acc, attr) => {
            if (attr === mainAttr.current) {
                acc[attr] = mainAttrDisable.current
            }
            else {
                acc[attr] = [];
            }
            return acc;
        }, {}))
    }

    const variantHasQuantity = (mappingValues) => {
        let stockQuantity = 0
        const filteredVariants = product.productvariant_set.forEach(variant => {
            // Map value of variant to easy search
            const attrOfVariant = variant.attributes.map(attr => attr.value)
            if (mappingValues.every(v => attrOfVariant.includes(v))) {
                stockQuantity += variant.quantity
            }
        });

        return stockQuantity > 0
    }

    // Nơi lưu thông tin đã chọn
    const pathOptions = useRef([])

    const handleOnPressAttrValue = (keyChoose, valueChoose, selected, tmpDisableAttr = undefined, rebuild = false) => {
        if (pathOptions.current.length < attributesKey.current.length) {
            if (selected[keyChoose] === "") {

                // Xử lý những option không thể chọn tiếp

                var index = pathOptions.current.push(valueChoose) - 1

                console.log("index", index)

                const tmpSelected = { ...selected, [keyChoose]: index }
                console.log("tmpSelected", tmpSelected)
                var remaindingAttrs = Object.keys(tmpSelected).filter(key => tmpSelected[key] === "")

                remaindingAttrs.forEach(attr => {
                    // Danh sách value trong thuộc tính
                    const values = product.attributes[attr]
                    console.log("values", values)
                    values.forEach(val => {
                        // vd Đỏ 39 ...
                        let mappingValues = [...pathOptions.current.slice(0, index + 1), val];

                        console.log("mapping values", mappingValues)
                        if (!variantHasQuantity(mappingValues)) {
                            if (!rebuild) {
                                handleSetDisableAttr(attr, val)
                            }
                            else {
                                handleSetTempDisableAttr(attr, val, tmpDisableAttr)
                            }
                        }
                    }
                    )
                })

                // Xử lý những trường hợp thay đổi đổi lựa chọn -> có i -1 cách thay đổi
                for (let i = 0; i < index; i++) {
                    let mappingValues = pathOptions.current.filter(val => val != pathOptions.current[i])
                    // Lấy attr của của vị trí i 
                    let currentAttr = Object.keys(selected).find(key => selected[key] === i)

                    const values = product.attributes[currentAttr]
                    values.forEach(val => {
                        // vd Đỏ 39 ...
                        if (!variantHasQuantity(mappingValues)) {
                            if (!rebuild) {
                                handleSetDisableAttr(attr, val)
                            }
                            else {
                                handleSetTempDisableAttr(attr, value, tmpDisableAttr)
                            }
                        }
                    }
                    )
                }
                if (!rebuild) {
                    // set selected  [keyChoose] : index
                    setSelected(prev => ({ ...prev, [keyChoose]: index }))
                }
                else {
                    // Trường hợp build lại từ đầu
                    selected = { ...selected, [keyChoose]: index }
                }
            }
            else {
                //  // Đã có thuộc tính đó trong pathoptions và chưa chọn hết
                var index = selected[keyChoose]
                // Thay đổi giá trị [Đỏ, 39] -> [xanh , 39]
                pathOptions.current[index] = valueChoose
                // Build lại từ đầu
                // const tmpPathOptions = pathOptions.current
                // pathOptions.current = []

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
                    var value = pathOptions.current[i]

                    //var index = pathOptions.current.push(valueChoose) - 1

                    //console.log("index", index)
                    tmpSelectedRebuild = { ...tmpSelectedRebuild, [currentAttr]: index }
                    console.log("tmpSelectedRebuild", tmpSelectedRebuild)
                    var remaindingAttrs = Object.keys(tmpSelectedRebuild).filter(key => tmpSelectedRebuild[key] === "")

                    remaindingAttrs.forEach(attr => {
                        // Danh sách value trong thuộc tính
                        const values = product.attributes[attr]
                        console.log("values", values)
                        values.forEach(val => {
                            // vd xanh 39 ...
                            let mappingValues = [...pathOptions.current.slice(0, i + 1), val];

                            console.log("mapping values", mappingValues)
                            if (!variantHasQuantity(mappingValues)) {
                                handleSetTempDisableAttr(attr, val, tmpDisableAttr)
                            }
                        }
                        )
                    })

                }

                setDisableAttr(tmpDisableAttr)

            }
        }
        else {
            // Trường hợp đã chọn hết -> n -1 trường hợp có thể thay đổi
            var index = selected[keyChoose]
            // Thay đổi giá trị [Đỏ, 39] -> [xanh , 39]
            pathOptions.current[index] = valueChoose
            // 
            for (let i = 0; i < pathOptions.current.length - 1; i++) {
                let mappingValues = pathOptions.current.filter(val => pathOptions[i] != val)
                var currentAttr = Object.keys(selected).find(key => selected[key] === i)

                const values = product.attributes[currentAttr]
                values.forEach(val => {
                    // vd Đỏ 39 ...
                    if (!variantHasQuantity(mappingValues)) {
                        handleSetDisableAttr(attr, val)
                    }
                })
            }
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <TouchableWithoutFeedback>
                        <Image source={{ uri: product.productvariant_set[0].logo }} style={styles.headerImage} />
                    </TouchableWithoutFeedback>

                </View>

                <View style={{ flex: 2, justifyContent: "flex-end", alignItems: "flex-start", paddingHorizontal: 18, gap: 10 }}>
                    <Text style={{ color: "#fa5230", fontSize: 20, fontWeight: 650 }}>
                        <Text style={{ color: "#fa5230", fontSize: 15, fontWeight: 500, textDecorationLine: 'underline' }}>đ</Text>
                        {price.toLocaleString("vi-VN")}
                    </Text>
                    <Text style={{ color: "#ccc", fontSize: 16 }}>Kho: {stockQuantity}</Text>
                </View>

                <View>
                    <TouchableWithoutFeedback style={styles.btn} onPress={handleOnPressClose}>
                        <Icon name="close" size={30} color="rgba(0,0,0,0.5)"></Icon>
                    </TouchableWithoutFeedback>
                </View>
            </View>
            <ScrollView style={styles.bodyContent}>
                {
                    dataToRender.current.map(([key, value]) => {
                        // Kiem tra key == MainAttr thi hien logo
                        return (
                            <View key={key} style={styles.attributeGroupContainer}>
                                <Text>{key}</Text>
                                <View style={styles.subAttrGroupContainer}>
                                    {
                                        key === mainAttr.current ? (
                                            // Render the array of objects for mainAttr
                                            Array.isArray(value) && value.map((item, index) => {
                                                return (
                                                    // Kiểm tra nếu nằm trong ds disable hay không
                                                    <BoxOption key={index} isDisable={disableAttr[key].includes(item.name)} logo={item.logo} name={item.name} choosen={pathOptions.current.includes(item.name)} onPress={() => handleOnPressAttrValue(key, item.name, selected)}></BoxOption>
                                                )
                                            })
                                        ) : (
                                            // Render regular array of strings
                                            Array.isArray(value) && value.map((item, index) =>
                                            (
                                                // Kiểm tra nếu nằm trong ds disable hay không
                                                <BoxOption key={index} isDisable={disableAttr[key].includes(item)} name={item} choosen={pathOptions.current.includes(item.name)} onPress={() => handleOnPressAttrValue(key, item, selected)}></BoxOption>
                                            )
                                            )
                                        )
                                    }
                                </View>
                            </View>
                        )
                    })
                }
            </ScrollView>


            <View>

            </View>
        </View>
    )
};

// MAI DONE CODING STYLE , BÀI TOÁN CON ĐƯỜNG ĐỌC LẠI IDEA


export default ModalProductContent

const styles = StyleSheet.create({
    container: {
        margin: 10
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
        marginTop: 0
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
    logoAttr: {

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
});
