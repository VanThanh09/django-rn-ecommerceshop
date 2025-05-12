import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Home from './components/home/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import { useContext, useReducer } from 'react';
import MyUserReducers from './reducers/MyUserReducers';
import { MyDispatchContext, MyUserContext } from './configs/MyContext';
import { Icon } from 'react-native-paper';
import Profile from './components/user/Profile';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreRegister from './components/user/StoreRegister';
import ProductDetail from './components/home/ProductDetail';
import AddProduct from './components/store/AddProduct';

const ProfileStack = createNativeStackNavigator();
function MyProfileStack() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="profileMain" component={Profile} options={{ title: "Tài khoản", headerShown: false }} />
      <ProfileStack.Screen name="login" component={Login} options={{ title: "Đăng nhập" }} />
      <ProfileStack.Screen name="register" component={Register} options={{ title: "Đăng ký" }} />
      <ProfileStack.Screen name="storeRegister" component={StoreRegister} options={{ title: "Đăng ký cửa hàng" }} />
      <ProfileStack.Screen name='addProduct' component={AddProduct} options={{ title: "Thêm sản phẩm" }} />
    </ ProfileStack.Navigator>
  )
}

const HomeStack = createNativeStackNavigator();
function MyHomeStack() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="homeMain" component={Home} options={{ headerShown: false }} />
      <HomeStack.Screen name="productDetail" component={ProductDetail} options={{ title: "" }} />
    </HomeStack.Navigator>
  )
}

const Tab = createBottomTabNavigator();
function MyTabs() {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarStyle, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="home" component={MyHomeStack} options={{ tabBarIcon: () => <Icon size={30} source="home" /> }} />
      <Tab.Screen name="account" component={MyProfileStack} options={{ tabBarIcon: () => <Icon size={30} source="account" /> }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Ngăn mặc định
            e.preventDefault();
            // Reset lại stack navigator để luôn quay về "index"
            navigation.navigate('account', {
              screen: 'profileMain',
            });
          },
        })}
      />
      {user === null ? <>

      </> : <>

      </>}
    </Tab.Navigator>
  )
}

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducers, null)

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          <MyTabs />
        </NavigationContainer>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarStyle: {
    borderTopWidth: 1,
    backgroundColor: '#fff',
  }
});
