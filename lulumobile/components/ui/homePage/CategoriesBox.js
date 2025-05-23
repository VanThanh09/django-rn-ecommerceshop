import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const CategoriesBox = ({ category, setSelectedCate, selectedCate }) => {
    const isSelected = selectedCate.includes(category.id);

    const handleSelectCate = () => (
        setSelectedCate(prev => prev.includes(category.id) ? prev.filter(c => c !== category.id) : [...prev, category.id])
    )

    return (
        <TouchableOpacity onPress={handleSelectCate}>
            <View style={[styles.box, isSelected && styles.selectedBox]}>
                <Image source={{ uri: category.logo }} style={styles.image} resizeMode="contain" />
                <Text style={styles.text} numberOfLines={2}>{category.name}</Text>
            </View>
        </TouchableOpacity >
    );
}

export default CategoriesBox;

const styles = StyleSheet.create({
    box: {
        width: 100,
        height: 120,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // Android shadow
    },
    image: {
        width: 60,
        height: 60,
        marginBottom: 6,
    },
    text: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
    selectedBox: {
        borderColor: '#ff6600',
        backgroundColor: '#fff7f0',
    }
});