import { Image, StyleSheet, Text, View } from "react-native";

const ProductCard = ({ product }) => {
    return (
        <View style={styles.card}>
            <Image source={{ uri: product.logo }} style={styles.image} />
            <View style={{ padding: 8, paddingTop: 0 }}>
                <Text style={styles.name}>{product.name}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.discountedPrice}>{product.price}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        elevation: 2,
        position: 'relative',
        borderRadius: 2,
    },
    image: {
        width: '100%',
        height: 150,
        padding: 0
    },
    heartIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        elevation: 2,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    discountedPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    originalPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
        color: '#888',
        marginLeft: 6,
    },
});

export default ProductCard;