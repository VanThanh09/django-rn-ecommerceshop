
export const Cart_Action_Type = {
    LOG_IN : 'user_logged_in',
    LOG_OUT: 'user_logged_out',
    ADD_NEW_VARIANT: 'cartAddAVariant',
    UPDATE_CART_AFTER_POST: 'updateCartAfterPost',
    UPDATE_CART: 'updateCart'
}

const CartReducer = (cart, action) => {
//     console.log('Current cart state:', cart);
//   console.log('Dispatching action:', action);
    switch (action.type) {
        case 'user_logged_in':
            return {
                ...action.payload
            };
        case 'user_logged_out':
            return null
        case 'cartAddAVariant':
            return {
                ...cart, total_quantity : cart.total_quantity + 1
            }
        case Cart_Action_Type.UPDATE_CART_AFTER_POST:
            return {
                ...action.payload
            }
        case Cart_Action_Type.UPDATE_CART:
            return {
                ...action.payload
            }
        default:
            return cart;
    }

}

export default CartReducer
