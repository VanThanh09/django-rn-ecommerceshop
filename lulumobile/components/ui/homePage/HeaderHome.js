import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MyStyles from "../../../styles/MyStyles"
import { Button, Icon, IconButton, Searchbar } from "react-native-paper"
import { useContext, useState } from "react"
import { MyUserContext } from "../../../configs/MyContext"

const HeaderHome = ({ value, onChangeText }) => {
    return (
        <View style={MyStyles.bgPrimaryColor}>
            <View style={styles.containerRow}>
                <View style={[styles.left]}>
                    <Searchbar
                        placeholder="Search"
                        style={styles.searchbar}
                        inputStyle={styles.input}
                        iconColor="#888"
                        onChangeText={onChangeText}
                        value={value}
                    />
                </View>
                <View style={styles.right}>
                    <IconButton
                        icon="cart-outline"
                        size={25}
                        onPress={() => console.log('Pressed')}
                        iconColor="#fff"
                    />
                    <IconButton
                        icon="chat-processing-outline"
                        size={25}
                        onPress={() => console.log('Pressed')}
                        iconColor="#fff"
                    />
                </View>
            </View>
        </View>
    )
}

export default HeaderHome;

const styles = StyleSheet.create({
    containerRow: {
        flexDirection: "row",
        justifyContent: 'space-between',
    },
    left: {
        flexDirection: "row",
        flex: 1,
    },
    right: {
        flexDirection: "row",
    },
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#fff'
    },
    buttonText: {
        color: '#fff',
    },
    searchbar: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginVertical: 8,
        marginLeft: 10,
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        height: 40,
    },

    input: {
        fontSize: 14,
        marginTop: -8,
    },

})