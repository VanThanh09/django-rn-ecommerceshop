import { Alert, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-paper";
import MyStyles from "../../../styles/MyStyles";

const PendingOrder = ({ handlePressShipping, handlePressChat, orderDetail }) => {
    return (
        <SectionList
            sections={orderDetail}
            keyExtractor={item => item.id.toString()}
            style={{ backgroundColor: '#fff' }}
            renderItem={({ item }) => (
                <View style={styles.orderItem}>
                    <Image
                        source={{ uri: item.product_variant.logo }}
                        style={styles.productImage}
                    />
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginEnd: 10 }}>
                            <Text style={styles.productName}>{item.product.name}</Text>
                            <Text style={styles.orderId}> Mã đơn: #{item.id}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginEnd: 10 }}>
                            <View>
                                {item.product_variant.attributes.map(
                                    (attr, index) => <Text key={index}>{attr.attribute_name}: {attr.value}</Text>
                                )}
                            </View>
                            <View>
                                <Text>Số lượng: {item.quantity}</Text>
                                <Text >Giá: <Text style={{ color: '#fa5230' }}>{item.product_variant.price.toLocaleString()} đ</Text></Text>
                            </View>

                        </View>
                    </View>
                </View>
            )}

            renderSectionHeader={({ section: { customer } }) => (
                <View style={styles.customerHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text>Người đặt: <Text style={styles.username}>{customer.lastname} {customer.firstname}</Text></Text>
                        <Text style={{ fontSize: 12, fontWeight: "400", color: 'red' }}> (Đang chờ) </Text>
                    </View>
                </View>
            )}

            renderSectionFooter={({ section }) => (
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.chatBtn, MyStyles.m]} onPress={() => handlePressChat(section.customer.id)}>
                        <Icon
                            source="chat-processing-outline"
                            size={20}
                            color="#fa5230"
                        />
                        <Text style={{ color: '#fa5230' }}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            const orderIds = section.data.map(item => item.id);
                            Alert.alert("Xác nhận", "Bạn đã gửi hàng", [{
                                text: "Hủy",
                            }, {
                                text: "OK",
                                onPress: () => handlePressShipping(orderIds),
                            }])

                        }}
                        style={[MyStyles.m, { backgroundColor: '#fa5230', borderRadius: 3, borderColor: '#fa5230', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 }]}
                    >
                        <Text style={{ color: '#fff' }}>Đã gửi hàng</Text>
                    </TouchableOpacity>
                </View>
            )}
        />
    )
}

const styles = StyleSheet.create({
    customerHeader: {
        paddingTop: 15,
        paddingStart: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontSize: 15,
        fontWeight: "500",
    },
    orderItem: {
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 0.2,
        borderColor: "#ccc",
    },
    productImage: {
        width: 70,
        height: 70,
        marginRight: 10,
        borderRadius: 10,
    },
    productName: {
        fontWeight: "600",
        fontSize: 15,
        marginEnd: 5,
    },
    orderId: {
        fontSize: 12,
        fontWeight: "400",
        fontStyle: 'italic',
    },
    footer: {
        marginTop: 10,
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    chatBtn: {
        backgroundColor: '#fff',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#fa5230',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    }
});

export default PendingOrder;
