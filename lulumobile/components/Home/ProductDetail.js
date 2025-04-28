import { useEffect, useState } from "react"
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";

const Product = () => {
    const [product, setProduct] = useState([]);
    const pId = 1;

    const loadProduct = async () => {
        try {
            let res = await Apis.get(endpoints['product'](pId));
            setProduct(res.data);
        } catch (error) {
            console.error("Failed to load product:", error);
        }
    }

    useEffect(() => {
        loadProduct();
    }, []);

    return (
        <SafeAreaView>
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
        </SafeAreaView>
    )
}

export default Product;