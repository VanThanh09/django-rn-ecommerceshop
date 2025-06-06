import { StyleSheet, View, Text, Image } from "react-native";
import MyStyles from "../../../styles/MyStyles";

const HeaderStore = ({ store }) => {
    if (!store) return null;

    return (
        <View style={[styles.container, MyStyles.bgPrimaryColor]}>
            <Image source={{ uri: store.logo }} style={styles.logo} />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{store.name}</Text>
                {/* <Text style={styles.owner}>Owner: {store.owner}</Text> */}
                <Text style={styles.description}>{store.description}</Text>
            </View>
        </View>
    );
};

export default HeaderStore;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderColor: "#ddd"
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 15
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff"
    },
    owner: {
        fontSize: 14,
        color: "#fff",
        marginTop: 2
    },
    description: {
        fontSize: 13,
        color: "#fff",
        marginTop: 5
    }
});
