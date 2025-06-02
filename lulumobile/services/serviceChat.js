import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "../configs/firebaseConfig.js";

export const getChatId = (u1, u2) => [u1, u2].sort((a, b) => a - b).join('_');

// Structure of database (firestore)
// chats (collection)
//     ->1_2 (document ID) 
//         ->users: [1, 2]
//         ->lastMsg: "Hi"
//         ->messages (subcollection)
//             ->msg
//             ->msg
//             ->msg

/**
 * 
 * @param {int} senderId 
 * @param {int} receiverId 
 * @param {string} text 
 */
export const sendMsg = async (senderId, receiverId, text) => {
    // creat chat id 
    const chatId = getChatId(senderId, receiverId);

    // a message
    const msg = {
        senderId,
        text,
        createdAt: serverTimestamp(),
    };

    try {
        // add a message
        await addDoc(collection(db, "chats", chatId, "messages"), msg);

        // add metadata for chatId
        await setDoc(doc(db, "chats", chatId), {
            users: [senderId, receiverId],
            lastMsg: text,
            updateAt: serverTimestamp(),
        }, { merge: true }) // merger = not overwrite messages

    } catch (err) {
        console.error(err);
    }
}

/**
 * 
 * @param {string} chatId 
 * @param {function} callback 
 * @returns 
 */
export const subscribeToMsg = (chatId, callback) => {
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages); // setMsgs - useState
    })

    return unsub;
}

/**
 * 
 * @param {int} userId 
 * @param {function} callback 
 * @returns 
 */
export const subscribeToConversations = (userId, callback) => {
    const q = query(
        collection(db, "chats"),
        where("users", "array-contains", userId),
        orderBy("updateAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        callback(conversations);
    })

    return unsub;
}

