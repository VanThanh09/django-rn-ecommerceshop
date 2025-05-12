import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const VariantInput = ({ variant, index, updateVariant }) => {
    const pickImage = async () => {
        let { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                updateVariant(index, { ...variant, logo: result.assets[0] });
            }
        }
    };

    return (
        <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ddd' }}>
            <Text style={{ fontWeight: 'bold' }}>
                Biến thể {index + 1}: {variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(' - ')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                <View>

                    {variant.logo ? <>
                        <View key={index} style={styles.image}>
                            <TouchableOpacity onPress={pickImage}>
                                <Image source={{ uri: variant.logo.uri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                            </TouchableOpacity>
                        </View>
                    </> : <>
                        <View style={styles.imageBlank}>
                            <TouchableOpacity onPress={pickImage} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text>Chọn ảnh</Text>
                            </TouchableOpacity>
                        </View>
                    </>}

                </View>

                <View style={{ marginRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ minWidth: 80 }}>Giá:  </Text>
                        <TextInput
                            placeholder="Nhập giá"
                            keyboardType="numeric"
                            value={variant.price?.toString() || ''}
                            onChangeText={(text) => updateVariant(index, { ...variant, price: text })}
                            style={{ minWidth: 70 }}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ minWidth: 80 }}>Số lượng:  </Text>
                        <TextInput
                            placeholder="Số lượng"
                            keyboardType="numeric"
                            value={variant.quantity?.toString() || ''}
                            onChangeText={(text) => updateVariant(index, { ...variant, quantity: text })}
                            style={{ minWidth: 70 }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default VariantInput;

const styles = StyleSheet.create({
    image: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        marginVertical: 5
    },
    imageBlank: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#cfcfcf',
        backgroundColor: '#ffffff',
        marginVertical: 5
    }
})