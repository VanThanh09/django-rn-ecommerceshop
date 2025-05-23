import { sendMsg, subscribeToMsg, subscribeToConversations } from "./serviceChat.js";

const user1 = 2;
const user2 = 3;

// Test gửi tin nhắn
sendMsg(user2, user1, "")
    .then(() => console.log("Message sent"))
    .catch((error) => console.error("Error sending message:", error));

// // Test subscribe tin nhắn
// const unsubscribeMsg = subscribeToMsg("1_3", (messages) => {
//     console.log("Messages:", messages);
// });

// // Test subscribe cuộc trò chuyện
// const unsubscribeConversations = subscribeToConversations(1, (conversations) => {
//     console.log("Conversations:", conversations);
// });