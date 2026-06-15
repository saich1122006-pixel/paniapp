import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: typeof NotificationsType | null = null;
try {
  if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    Notifications = require('expo-notifications');
  }
} catch (e) {
  console.warn('expo-notifications could not be loaded', e);
}

export interface PushNotificationState {
  expoPushToken?: NotificationsType.ExpoPushToken;
  notification?: NotificationsType.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldShowAlert: true,
        shouldSetBadge: false,
      }),
    });
  }

  const [expoPushToken, setExpoPushToken] = useState<
    NotificationsType.ExpoPushToken | undefined
  >();

  const [notification, setNotification] = useState<
    NotificationsType.Notification | undefined
  >();

  const notificationListener = useRef<NotificationsType.EventSubscription>();
  const responseListener = useRef<NotificationsType.EventSubscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (!Notifications) return token;
    
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification');
        return;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn('Project ID not found in app config');
        }
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
      } catch (e) {
        console.warn('Failed to get push token.', e);
      }
    } else {
      console.log('Must be using a physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    if (Notifications) {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          // Handle notification tap
          console.log('Notification tapped:', response.notification.request.content.data);
        });
    }

    return () => {
      if (Notifications) {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
