import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../configs/Apis";
 
const CartReducer = (cart, action) => {
    switch(action.type) {
        case 'user_logged_in':
            return {
                ...cart,total_quantity: action.payload
            };

        default:
            return cart;
    }

}

export default CartReducer
