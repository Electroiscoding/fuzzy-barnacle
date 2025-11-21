import { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, View, FlatList, Text, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [text, setText] = useState('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const addTodo = async () => {
    if (text.trim().length > 0) {
      setTodos([...todos, { id: Date.now().toString(), text, completed: false }]);
      await schedulePushNotification(text);
      setText('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Todo App</ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
          placeholder="Add a new todo"
          placeholderTextColor={themeColors.icon}
          value={text}
          onChangeText={setText}
        />
        <Button title="Add" onPress={addTodo} />
      </View>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoContainer}>
            <TouchableOpacity onPress={() => toggleTodo(item.id)}>
              <Text style={[styles.todoText, { color: themeColors.text }, item.completed && styles.completedTodoText]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <Button title="Delete" onPress={() => deleteTodo(item.id)} />
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
  },
  todoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todoText: {
    fontSize: 18,
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
});

async function schedulePushNotification(todoText: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got a new todo!",
      body: todoText,
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;

  return token;
}
