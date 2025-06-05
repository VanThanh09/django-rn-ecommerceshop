import { Dimensions} from 'react-native';
import { useRef } from 'react';
const windowWidth = Dimensions.get('window').width;


export function useSwipe(onSwipeLeft, onSwipeRight, rangeOffset = 6) {
    let firstPosition = 0

    // Contain ref to outer scope
    function onTouchStart (e) {
        firstPosition = e.nativeEvent.pageX
    }

    function onTouchEnd(e) {
        let positionX = e.nativeEvent.pageX
        const range = windowWidth/rangeOffset  // min width that recognize as a swipe gesture
        if (positionX - firstPosition > range) {
            // Swipe right
            onSwipeRight && onSwipeRight()  // goi call back onSwipeRight
        } 
        else if (firstPosition - positionX > range) {
            // Swipe left
            onSwipeLeft && onSwipeLeft()
        }
    }

    return {onTouchStart, onTouchEnd}
} 
