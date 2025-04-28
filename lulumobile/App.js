import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import Home from './components/Home/Home';
import Register from './components/User/Register';
import Login from './components/User/Login';
import { useContext, useReducer } from 'react';
import MyUserReducers from './reducers/MyUserReducers';
import { MyDispatchContext, MyUserContext } from './configs/MyContext';
import { Icon } from 'react-native-paper';
import Profile from './components/User/Profile';

const Tab = createBottomTabNavigator();
function MyTabs() {
  const user = useContext(MyUserContext);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBarStyle, tabBarHideOnKeyboard: true }}>
      <Tab.Screen name="home" component={Home} options={{ tabBarIcon: () => <Icon size={30} source="home" /> }} />

      {user === null ? <>
        <Tab.Screen name="login" component={Login} options={{ tabBarIcon: () => <Icon size={30} source="account" /> }} />
        <Tab.Screen name="register" component={Register} options={{ tabBarIcon: () => <Icon size={30} source="account-plus" /> }} />
      </> : <>
        <Tab.Screen name="account" component={Profile} options={{ tabBarIcon: () => <Icon size={30} source="account" /> }} />
      </>}
    </Tab.Navigator>
  )
}

export default function App() {
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
  },
});
