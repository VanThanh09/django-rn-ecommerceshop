import { useContext, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { MyUserContext } from "../../configs/MyContext";
import { subscribeToConversations } from "../../services/serviceChat";
import MyStyles from "../../styles/MyStyles";
import { Button, IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Conversations = () => {
    const nav = useNavigation();
    const user = useContext(MyUserContext);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            nav.setOptions({
                headerLeft: () => (
                    <IconButton icon="arrow-left" size={26} iconColor="#333" style={{ marginLeft: -10 }}
                        onPress={() => nav.navigate('home', { screen: 'homeMain' })} />
                )
            })
        } catch (error) {
            throw error
        }
    }, [nav])

    useEffect(() => {
        try {
            setLoading(true);

            if (user) {
                const unsub = subscribeToConversations(user.id, async (convs) => {
                    try {
                        const fullConvs = await Promise.all(convs.map(async (c) => {
                            // take another user id in array id
                            let receiverID = c.users.find(id => id != user.id);

                            // call api django get another user info
                            let token = await AsyncStorage.getItem("token");
                            let u = await authApis(token).get(endpoints['info_user'](receiverID));
                            let receiverUser = u.data;

                            c.updateAt = c.updateAt?.toDate();
                            return {
                                ...c,
                                receiverUser,
                            };
                        }))
                        // set conversations
                        setConversations(fullConvs);
                    } catch (ex) {
                        console.error(ex);
                    } finally {
                        setLoading(false);
                    }
                });

                return () => unsub();
            }
        } catch (ex) {
            console.error(ex);
        }
    }, [])

    if (user === null) return (
        <View style={[{ justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
            <Text style={{ textAlign: 'center' }}>
                Vui lòng đăng nhập trước
            </Text>
            <Button
                onPress={() => nav.navigate("login")}
                mode="contained"
                style={[{ marginTop: 10 }, MyStyles.m, styles.button]}>
                <Text style={styles.buttonText}>Đăng nhập</Text>
            </Button>
        </View>
    )

    return (
        <View style={[MyStyles.container, { backgroundColor: '#fff' }]}>
            {loading ? <ActivityIndicator style={{ marginTop: 50 }} /> : <>
                {conversations.length > 0 ? <>
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => nav.navigate('chat', {
                                    "recieverUser": item.receiverUser,
                                    "chatId": item.id,

                                })}
                                style={styles.conv}
                            >
                                <View style={styles.row}>
                                    {/* Avatar */}
                                    <Image
                                        source={{ uri: item.receiverUser.avatar }}
                                        style={styles.avatar}
                                    />

                                    {/* Text Content */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
                                            {item.receiverUser.last_name} {item.receiverUser.first_name}
                                        </Text>
                                        <View style={[styles.row, { justifyContent: 'space-between' }]}>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: '#666',
                                                    marginTop: 2
                                                }}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {item.lastMsg}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: '#666',
                                                    marginTop: 2
                                                }}
                                            >
                                                {item.updateAt?.toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Chưa cập nhật'}
                                            </Text>
                                        </View>
                                    </View>

                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </> : <>
                    <View style={[{ justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
                        <Text style={{ textAlign: 'center' }}>
                            Không có đoạn chat nào
                        </Text>
                    </View>
                </>}

            </>}
        </View>

    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#fa5230',
        borderRadius: 1,
    },
    buttonText: {
        color: '#ffffff',
    }, row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#ccc'
    },
    conv: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee'
    }
})

export default Conversations;