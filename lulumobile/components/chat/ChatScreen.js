import { useContext, useEffect, useState } from "react";
import { MyUserContext } from "../../configs/MyContext";
import { FlatList, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { sendMsg, subscribeToMsg } from "../../services/serviceChat";
import MyStyles from "../../styles/MyStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon, IconButton } from "react-native-paper";

const ChatScreen = ({ route }) => {
    const recieverUser = route.params?.recieverUser;
    const chatId = route.params?.chatId;

    const user = useContext(MyUserContext);
    const senderId = user.id;
    const recieverId = recieverUser.id;

    const nav = useNavigation();

    const [messages, setMessages] = useState([]);
    const [textSend, setTextSend] = useState()
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);

        const unsub = subscribeToMsg(chatId, (msgs) => {
            setMessages(msgs);
            setLoading(false); // loading = false when load the first msg
        });

        return () => unsub();
    }, [])

    const handleSend = async () => {
        if (textSend.trim() === '') return;
        try {
            setTextSend('');
            await sendMsg(senderId, recieverId, textSend);
        } catch (ex) {
            console.error(ex);
        }
    }

    return (
        <SafeAreaView style={[MyStyles.container]}>
            <View style={[MyStyles.container]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <IconButton icon="arrow-left" size={25} onPress={() => nav.goBack()} />
                        <Image source={{ uri: recieverUser.avatar }} style={styles.avatar} />
                        <Text style={styles.fullName}>
                            {recieverUser.last_name} {recieverUser.first_name}
                        </Text>
                    </View>

                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={[styles.msg, {
                                alignSelf: item.senderId === senderId ? 'flex-end' : 'flex-start',
                                backgroundColor: item.senderId === senderId ? '#DCF8C6' : '#FFF',
                            }]}>
                                <Text style={{ fontSize: 15, color: '#000', flexWrap: 'wrap' }}>
                                    {item.text}
                                </Text>
                            </View>
                        )}
                        contentContainerStyle={{ padding: 10 }}
                        style={{ flex: 1 }}
                        inverted
                        showsVerticalScrollIndicator={false}
                    />
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={textSend}
                            onChangeText={setTextSend}
                            placeholder="Nhập tin nhắn..."
                            style={styles.textInput}
                        />
                        <TouchableOpacity onPress={handleSend}>
                            <Icon source="send" size={30} color="#1e1e1e" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    msg: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginVertical: 2,
        maxWidth: '80%',
        elevation: 2, // bóng nhẹ cho Android
        shadowColor: '#000', // bóng cho iOS
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 2,
        backgroundColor: '#f0f0f0',
        marginVertical: 5,
        marginHorizontal: 7
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#fff',
        marginRight: 10,
    },
    sendBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        paddingStart: 0,
        backgroundColor: '#f2f2f2',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    backText: {
        fontSize: 18,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    fullName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
})

export default ChatScreen;