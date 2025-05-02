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

const Stack = createNativeStackNavigator();
function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="index" component={Profile} options={{ title: "Tài khoản", headerShown: false }} />
      <Stack.Screen name="login" component={Login} options={{ title: "Đăng nhập" }} />
      <Stack.Screen name="register" component={Register} options={{ title: "Đăng ký" }} />
    </ Stack.Navigator>
  )
}

const Tab = createBottomTabNavigator();
function MyTabs() {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarStyle, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="home" component={Home} options={{ tabBarIcon: () => <Icon size={30} source="home" /> }} />
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
