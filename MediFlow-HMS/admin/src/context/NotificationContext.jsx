import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StaffContext } from "./StaffContext";
import { AppContext } from "./AppContext";

export const NotificationContext = createContext();

const NotificationContextProvider = (props) => {
    const { sToken } = useContext(StaffContext);
    const { backendUrl } = useContext(AppContext);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getNotifications = async () => {
        if (!sToken) return;
        try {
            const { data } = await axios.get(backendUrl + '/api/staff/notifications', { headers: { sToken } });
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/mark-notification-read', { notificationId }, { headers: { sToken } });
            if (data.success) {
                setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error("Error marking notification as read");
        }
    };

    useEffect(() => {
        if (sToken) {
            getNotifications();
            // In a real app, we'd setup socket.io here
            const interval = setInterval(getNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [sToken]);

    const value = {
        notifications,
        unreadCount,
        getNotifications,
        markAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {props.children}
        </NotificationContext.Provider>
    );
};

export default NotificationContextProvider;
