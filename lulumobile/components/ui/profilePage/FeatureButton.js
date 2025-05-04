import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Icon } from "react-native-paper";

const FeatureButton = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <View style={[styles.left]}>
            <Icon source={icon} size={35} color={color} style={styles.icon} />
            <Text style={styles.text}>{label}</Text>
        </View>
        <View style={[styles.right]}>
            <Icon source="chevron-right" color="#151515" style={styles.icon} size={35} />
        </View>


    </TouchableOpacity>
)

export default FeatureButton;

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 7,
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    left: {
        flexDirection: 'row',
        alignItems: "center",
    },
    right: {
        flexDirection: 'row',
        alignItems: "center",
    },
    icon: {
        width: 35
    },
    text: {
        marginLeft: 12,
        fontSize: 16,
        color: '#000'
    }
});