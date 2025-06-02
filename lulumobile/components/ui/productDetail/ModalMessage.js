import Modal from "react-native-modal"
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native"


const ModalMessage = ({ quantity, visible, handleCloseModalMsg }) => {
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
                        Bạn đã có {quantity} sản phẩm này trong giỏ hàng.
                        Không thể thêm số lượng đã chọn vào giỏ hàng vì sẽ
                        vượt quá giới hạn mua hàng của bạn
                    </Text>
                </View>
                <View style={styles.btnContainer}>
                    <TouchableOpacity onPress={handleCloseModalMsg}>
                        <Text style={styles.btn}>Đồng ý</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default ModalMessage

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
        paddingVertical: 12,
        alignItems: "center",
    },
    btn: {
        textAlign: "center",
        color: "#fa5230",
        fontSize: 16,
    }
});