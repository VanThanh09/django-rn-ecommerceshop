import { Image, StyleSheet, Text, View } from "react-native";

const ProductCard = ({ product }) => {
    return (
        <View style={styles.card}>
            <Image source={{ uri: product.logo }} style={styles.image} />
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.priceContainer}>
                <Text style={styles.discountedPrice}>{product.price}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        backgroundColor: '#fff',
        padding: 10,
        elevation: 3,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 12,
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