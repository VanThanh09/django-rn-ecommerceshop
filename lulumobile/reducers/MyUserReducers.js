import AsyncStorage from "@react-native-async-storage/async-storage";

// action: {
//     "type": "",
//     "payload": "",
// }

export default (current, action) => {
    switch (action.type) {
        case "login":
            return action.payload;
        case "logout":
            return null;
        case "updateAddress":
            return action.payload
        default:
            return current;
    }
}

