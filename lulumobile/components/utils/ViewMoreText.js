import { children, useCallback, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons'; // or Feather, Ionicons, etc.

const NUM_OF_LINES = 4

export default ViewMoreText = ({ children }) => {
    const [showMore, setShowMore] = useState(false)
    //const [numberOfLines, setNumberOfLines] = useState(0)
    const [expand, setExpand] = useState(false)

    const onTextLayout = useCallback(e => {
        if (e.nativeEvent.lines.length > NUM_OF_LINES) {
            setShowMore(true);
        }
    }, []);

    const toggleExpand = () => {
        setExpand(!expand)
    }

    return (
        <View>
            <Text numberOfLines={showMore ? expand ? undefined : NUM_OF_LINES : undefined} onTextLayout={onTextLayout} style={{
                color: 'rgba(0,0,0,.8)', fontSize: 15,
                lineHeight: 23,
                paddingHorizontal: 16,
            }}>
                {children}
            </Text>
            {showMore && (
                <View style={styles.btnContainer}>
                    <TouchableOpacity style={{ paddingVertical: 8, flexDirection: 'row', justifyContent: "center", alignItems: 'center' }}
                        onPress={toggleExpand}
                    >
                        <Text style={{ color: 'rgba(0,0,0,0.8)' }}>{expand ? "Thu gọn" : "Xem thêm"}</Text>
                        <Icon
                            name={expand ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                            size={20}
                            color="rgba(0,0,0,0.8)" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}


const styles = StyleSheet.create({
    btnContainer: {
        marginTop: 10,
        borderTopColor: 'rgba(0, 0, 0, .09)',
        borderTopWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})

// Don mo ta => tab bar modal ... ,cart, add product to cart;