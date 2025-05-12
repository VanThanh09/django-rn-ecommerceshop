import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Icon } from "react-native-paper";

const AddDetailBtn = ({ label, onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <View style={[styles.left]}>
            <Text style={styles.text}>{label} <Text style={{ color: 'red' }}>*</Text></Text>
        </View>
        <View style={[styles.right]}>
            <Icon source="chevron-right" color="#151515" style={styles.icon} size={25} />
        </View>
    </TouchableOpacity>
)

export default AddDetailBtn;

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // borderBottomWidth: 1,
        // borderTopWidth: 1,
        // borderColor: '#d3d3d3',
        backgroundColor: '#fff'
    },
    left: {
        flexDirection: 'row',
        alignItems: "center",
    },
    right: {
        flexDirection: 'row',
        alignItems: "center",
    },
    text: {
        marginLeft: 8,
        marginVertical: 3,
        fontSize: 16,
        color: '#000'
    }
});