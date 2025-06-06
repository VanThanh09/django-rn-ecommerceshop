import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, NavigationContainer } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import Home from './components/home/Home';
import Register from './components/user/Register';
import Login from './components/user/Login';
import { useContext, useReducer } from 'react';
import MyUserReducers from './reducers/MyUserReducers';
import { CartContext, MyDispatchContext, MyUserContext } from './configs/MyContext';
import { Icon } from 'react-native-paper';
import Profile from './components/user/Profile';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreRegister from './components/user/StoreRegister';
import ProductDetail from './components/home/ProductDetail';
import AddProduct from './components/store/AddProduct';
import Store from './components/store/Store';
import StoreRequests from './components/employee/StoreRequsets';
import RequestDetail from './components/employee/RequestDetail';
import Conversations from './components/chat/Conversations';
import ChatScreen from './components/chat/ChatScreen';
import UpdateProduct from './components/store/UpdateProduct';
import CartReducer from './reducers/CartReducer';
import Cart from './components/cart/Cart';
import ManageOrders from './components/store/ManageOrders';
import Orders from './components/user/Orders';
import Revenue from './components/store/Revenue';

const ProfileStack = createNativeStackNavigator();
function MyProfileStack() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="profileMain" component={Profile} options={{ title: "Tài khoản", headerShown: false }} />
      <ProfileStack.Screen name="login" component={Login} options={{ title: "Đăng nhập" }} />
      <ProfileStack.Screen name="register" component={Register} options={{ title: "Đăng ký" }} />
      <ProfileStack.Screen name="storeRegister" component={StoreRegister} options={{ title: "Đăng ký cửa hàng" }} />
      <ProfileStack.Screen name="conversations" component={Conversations} options={{ title: "Chat" }} />
      <ProfileStack.Screen name="chat" component={ChatScreen} options={{ title: "Chat", headerShown: false }} />
      <ProfileStack.Screen name="orders" component={Orders} options={{ title: "Danh sách đơn hàng" }} />
    </ ProfileStack.Navigator>
  )
}

const HomeStack = createNativeStackNavigator();
function MyHomeStack() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="homeMain" component={Home} options={{ headerShown: false }} />
      <HomeStack.Screen name="productDetail" component={ProductDetail} options={{ headerShown: false }} />
      <HomeStack.Screen name="cartPage" component={Cart} />
    </HomeStack.Navigator>
  )
}

const StoreStack = createNativeStackNavigator();
function MyStoreStack() {
  return (
    <StoreStack.Navigator>
      <StoreStack.Screen name="storeMain" component={Store} options={{ title: "Cửa hàng của bạn", headerShown: false }} />
      <StoreStack.Screen name='addProduct' component={AddProduct} options={{ title: "Thêm sản phẩm" }} />
      <StoreStack.Screen name="updateProduct" component={UpdateProduct} options={{ title: "Sửa sản phẩm" }} />
      <StoreStack.Screen name="manageOrders" component={ManageOrders} options={{ title: "Quản lý đơn hàng" }} />
      <StoreStack.Screen name="revenue" component={Revenue} options={{ title: "Thống kê" }} />
    </StoreStack.Navigator>
  )
}

const EmployeeStack = createNativeStackNavigator();
function MyEmployeeStack() {
  return (
    <EmployeeStack.Navigator>
      <EmployeeStack.Screen name="employeeMain" component={StoreRequests} options={{ title: "Danh sách yêu cầu" }} />
      <EmployeeStack.Screen name='requestDetail' component={RequestDetail} options={{ title: "Thông tin yêu cầu" }} />
    </EmployeeStack.Navigator>
  )
}

const Tab = createBottomTabNavigator();
function MyTabs() {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarStyle, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="home"
        component={MyHomeStack}
        options={({ route }) => {
          const tabHidden = ['productDetail', 'cartPage'];
          const routeName = getFocusedRouteNameFromRoute(route);
          return {
            tabBarIcon: () => <Icon size={30} source="home" color="#797979" />,
            tabBarStyle: tabHidden.includes(routeName) ? { display: 'none' } : styles.tabBarStyle
          };
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Ngăn mặc định
            e.preventDefault();
            // Reset lại stack navigator để luôn quay về "index"
            navigation.navigate('home', {
              screen: 'homeMain',
            });
          },
        })}
      />

      {user !== null && user.user_role === 'SE' && <>
        <Tab.Screen name="store" component={MyStoreStack} options={{ tabBarIcon: () => <Icon size={30} source="store" color="#797979" />, title: "Cửa hàng" }} />
      </>}

      {user !== null && user.user_role === 'EM' && <>
        <Tab.Screen name="requests" component={MyEmployeeStack} options={{ tabBarIcon: () => <Icon size={30} source="format-list-bulleted" color="#797979" />, title: "Yêu cầu" }} />
      </>}

      <Tab.Screen
        name="account"
        component={MyProfileStack}

        options={({ route }) => {
          const tabHidden = ['chat'];
          const routeName = getFocusedRouteNameFromRoute(route);
          return {
            tabBarIcon: () => <Icon size={30} source="account" color="#797979" />,
            title: "Người dùng",
            tabBarStyle: tabHidden.includes(routeName)
              ? { display: 'none' }
              : styles.tabBarStyle,
          };
        }}

        listeners={({ navigation }) => ({
          tabPress: e => {
            // Ngăn mặc định
            e.preventDefault();
            // Reset lại stack navigator để luôn quay về "profileMain"
            navigation.navigate('account', {
              screen: 'profileMain',
            });
          },
        })}
      />

    </Tab.Navigator>
  )
}

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducers, null);
  const [cart, cartDispatch] = useReducer(CartReducer, null);

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
