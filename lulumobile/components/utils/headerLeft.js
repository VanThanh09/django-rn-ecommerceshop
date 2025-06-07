import {View, Pressable} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';

const HeaderLeft = ({ navigation }) => {
    const handleGoBack = () => {
        navigation.goBack()
    }

    return (
        <View style={{
            alignItems: 'flex-start',
            width: 95
        }}>
            <Pressable onPress={handleGoBack}>
                <Icon name="arrow-back" size={25} color="#fa5230" />
            </Pressable>
        </View>
    )
}

export default HeaderLeft