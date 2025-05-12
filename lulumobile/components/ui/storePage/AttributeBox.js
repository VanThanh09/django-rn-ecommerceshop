import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

const AttributeBox = ({ attribute, index, removeAttribute, setAttributes }) => {
    const handleNameChange = (text) => {
        setAttributes(prev => {
            const updated = [...prev];
            updated[index].name = text;
            return updated;
        });
    };

    const handleAddValue = () => {
        setAttributes(prev => {
            const updated = [...prev];
            updated[index].values = [...(updated[index].values || []), '']; // thêm giá trị rỗng
            return updated;
        });
    };

    const handleValueChange = (valueIndex, text) => {
        setAttributes(prev => {
            const updated = [...prev];
            updated[index].values[valueIndex] = text;
            return updated;
        });
    };

    const handleRemoveValue = (valueIndex) => {
        setAttributes(prev => {
            const updated = [...prev];
            updated[index].values.splice(valueIndex, 1);
            return updated;
        });
    };

    return (
        <View style={{ borderWidth: 1, borderColor: '#d9d9d9', margin: 3, padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextInput
                    style={{ fontSize: 14, paddingLeft: 10, flex: 1 }}
                    placeholder="Tên thuộc tính"
                    placeholderTextColor="#aaa"
                    value={attribute.name}
                    onChangeText={handleNameChange}
                />
                <TouchableOpacity style={{ padding: 5 }} onPress={removeAttribute}>
                    <Text style={{ color: 'red' }}>Xóa</Text>
                </TouchableOpacity>
            </View>

            {/* Hiển thị các giá trị */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 }}>

                {(attribute.values || []).map((val, i) => (
                    <View key={i} style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        paddingHorizontal: 10,
                        borderRadius: 5,
                        margin: 3,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <TextInput
                            value={val}
                            onChangeText={(text) => handleValueChange(i, text)}
                            style={{ minWidth: 50 }}
                        />
                        <TouchableOpacity onPress={() => handleRemoveValue(i)}>
                            <Text style={{ marginLeft: 5, color: '#5f5f5f' }}>x</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity onPress={handleAddValue}
                    style={{
                        borderWidth: 1,
                        borderColor: '#aaa',
                        borderRadius: 5,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        margin: 3,
                        justifyContent: 'center'
                    }}>
                    <Text>+ Thêm</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

export default AttributeBox;

const styles = StyleSheet.create({
    buttonAdd: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'red',
        padding: 3,
        marginLeft: 12
    }
})