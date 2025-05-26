import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Home from './components/home/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import { useContext, useReducer, useLayoutEffect } from 'react';
import MyUserReducers from './reducers/MyUserReducers';
import { CartContext, MyDispatchContext, MyUserContext } from './configs/MyContext';
import { Icon } from 'react-native-paper';
import Profile from './components/user/Profile';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreRegister from './components/user/StoreRegister';
import ProductDetail from './components/home/ProductDetail'
import CartReducer from './reducers/CartReducer';
// Get current name route focused
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Stack = createNativeStackNavigator();
const HomeStackNavigator = createNativeStackNavigator();
function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="index" component={Profile} options={{ title: "Tài khoản", headerShown: true }} />
      <Stack.Screen name="login" component={Login} options={{ title: "Đăng nhập" }} />
      <Stack.Screen name="register" component={Register} options={{ title: "Đăng ký" }} />
      <Stack.Screen name="storeRegister" component={StoreRegister} options={{ title: "Đăng ký cửa hàng" }} />
    </ Stack.Navigator>
  )
}

function HomeStack({ navigation, route }) {
  return (
    <HomeStackNavigator.Navigator>
      <HomeStackNavigator.Screen name="index" component={Home} options={{ headerShown: false }} />
      <HomeStackNavigator.Screen name="productDetail" component={ProductDetail} options={{ headerShown: false }} />
    </HomeStackNavigator.Navigator>
  )
}

const Tab = createBottomTabNavigator();
function MyTabs() {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarStyle, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="home"
        component={HomeStack}
        options={({ route }) => {
          const tabHidden = ['productDetail'];
          const routeName = getFocusedRouteNameFromRoute(route);
          return {
            tabBarIcon: () => <Icon size={30} source="home" />,
            tabBarStyle: tabHidden.includes(routeName)
              ? { display: 'none' }
              : styles.tabBarStyle
          };
        }}
      />
      <Tab.Screen
        name="account"
        component={MyStack}
        options={{ tabBarIcon: () => <Icon size={30} source="account" /> }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Ngăn mặc định
            e.preventDefault();
            // Reset lại stack navigator để luôn quay về "index"
            navigation.navigate('account', {
              screen: 'index',
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
  const [user, dispatch] = useReducer(MyUserReducers, null) // return new state u.data
  const [cart, cartDispatch] = useReducer(CartReducer, { total_quantity: 0 });

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <CartContext.Provider value={{ cart, cartDispatch }}>
          <NavigationContainer>
            <MyTabs />
          </NavigationContainer>
        </CartContext.Provider>
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
