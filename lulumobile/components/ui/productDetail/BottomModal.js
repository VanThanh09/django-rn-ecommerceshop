import Modal from "react-native-modal"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"

const BottomModal = ({ children, visible, handleOnbackDrop }) => {
    return (
        <Modal transparent animationType="slide" isVisible={visible}
            onBackdropPress={handleOnbackDrop}
            style={styles.modalContainer}
            unmountOnClose={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
            >
                <View style={styles.modalContent}>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>

    )
}

export default BottomModal

const styles = StyleSheet.create({
    modalContainer: {
        justifyContent: "flex-end",
        margin: 0,
    },
    modalContent: {
        height: "78%", // nửa màn hình
        backgroundColor: "white",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 12
    }
})