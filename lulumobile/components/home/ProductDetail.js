import { useEffect, useState } from "react"
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";

const ProductDetail = ({ route }) => {
    const productId = route.params?.productId;

    const [product, setProduct] = useState([]);

    const loadProduct = async () => {
        try {
            let res = await Apis.get(endpoints['product'](productId));
            setProduct(res.data);
            console.info(res.data)
        } catch (error) {
            console.error("Failed to load product:", error);
        }
    }

    useEffect(() => {
        loadProduct();
    }, []);

    return (
        <View>
            <Text>{product.name}</Text>
            <Text>{product.description}</Text>
            {product.attributes &&
                Object.entries(product.attributes).map(([key, values]) => (
                    <Text key={key}>
                        {key}: {values.join(', ')}
                    </Text>
                ))
            }
        </View>
    )
}

export default ProductDetail;