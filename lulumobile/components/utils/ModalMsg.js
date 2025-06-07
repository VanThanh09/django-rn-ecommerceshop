import Modal from "react-native-modal"
import { View, StyleSheet, TouchableOpacity, Text } from "react-native"

const ModalMsg = ({ visible, message, handleCloseModalMsg, handleOnpressConfirm, showBtnNo = true }) => {
    return (
        <Modal
            transparent isVisible={visible}
            style={[styles.modalMsgContainer, { zIndex: 100 }]}
            unmountOnClose={false}
            animationIn="fadeIn"
            animationOut="fadeOut"
            backdropOpacity={0.5}>

            <View style={styles.msgContainer}>
                <View style={styles.msgTextContainer}>
                    <Text style={styles.msgText}>
                        {message}
                    </Text>
                </View>
                <View style={styles.btnContainer}>
                    {
                        showBtnNo && (
                            <TouchableOpacity style={styles.btnNo} onPress={() => { handleCloseModalMsg() }}>
                                <Text style={styles.btnNoText}>Không</Text>
                            </TouchableOpacity>
                        )
                    }
                    <TouchableOpacity style={styles.btnYes} onPress={() => { handleOnpressConfirm(); handleCloseModalMsg() }}>
                        <Text style={styles.btnYesText}>Đồng ý</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default ModalMsg;

const styles = StyleSheet.create({
    modalMsgContainer: {
        justifyContent: "center",
        alignItems: "center", // 
    },
    msgContainer: {
        width: '90%',
        backgroundColor: "white",
        borderRadius: 8,
        overflow: "hidden",
    },
    msgTextContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderBottomColor: "#rgba(0,0,0,0.3)",
        borderBottomWidth: 1
    },
    msgText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
    },
    btnContainer: {
        flexDirection: "row",
    },
    btnYes: {
        paddingVertical: 12,
        flex: 1,
    },
    btnNo: {
        paddingVertical: 12,
        flex: 1,
        borderRightColor: "#rgba(0,0,0,0.3)",
        borderRightWidth: 1
    },
    btnYesText: {
        textAlign: "center",
        color: "#fa5230",
        fontSize: 16,
    },
    btnNoText: {
        textAlign: "center",
        color: "#666",
        fontSize: 16,
    }
});