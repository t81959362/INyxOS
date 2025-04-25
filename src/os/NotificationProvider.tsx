import React, { createContext, useContext, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  timestamp?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  push: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = (n: Omit<Notification, 'id' | 'timestamp'>) => {
    setNotifications(list => [
      ...list,
      { ...n, id: Math.random().toString(36).slice(2), timestamp: Date.now() }
    ]);
  };

  const remove = (id: string) => setNotifications(list => list.filter(n => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notifications, push, remove }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
