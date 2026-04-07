import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import PatientPortalLayout from '../components/PatientPortalLayout';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';

const Notifications = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/notifications`, { headers: { token } });
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async () => {
    try {
      await axios.post(`${backendUrl}/api/user/mark-notifications-read`, {}, { headers: { token } });
      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchNotifications();
    const timeout = setTimeout(markRead, 2500);
    return () => clearTimeout(timeout);
  }, [token]);

  const stats = useMemo(() => {
    const unread = notifications.filter((notification) => !notification.read).length;
    return [
      { label: 'Total', value: notifications.length || '0' },
      { label: 'Unread', value: unread || '0' },
      { label: 'Latest update', value: notifications[0] ? new Date(notifications[0].date).toLocaleDateString() : '--' },
    ];
  }, [notifications]);

  if (!token) {
    return (
      <div className="section-space">
        <EmptyState
          title="Sign in to view notifications"
          description="Appointment reminders and portal updates are stored in your patient account."
          action={<Link to="/login" className="app-button">Go to login</Link>}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState title="Loading notifications" message="Collecting reminders, updates, and account alerts." fullHeight />;
  }

  return (
    <PatientPortalLayout
      title="Notifications"
      description="Notifications now have clearer unread states, more breathing room, and better visibility inside the account area."
      stats={stats}
      actions={
        <button onClick={markRead} className="app-button-secondary">
          Mark all as read
        </button>
      }
    >
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <article
            key={notification._id || `${notification.title}-${notification.date}`}
            className={`app-card px-6 py-5 ${notification.read ? '' : 'ring-1 ring-primary/15'}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  {!notification.read ? <StatusBadge tone="info">Unread</StatusBadge> : <StatusBadge tone="neutral">Read</StatusBadge>}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-secondary">{notification.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{notification.message}</p>
              </div>
              <p className="text-sm text-slate-400">{new Date(notification.date).toLocaleString()}</p>
            </div>
          </article>
        ))
      ) : (
        <EmptyState
          title="No notifications yet"
          description="Appointment reminders, confirmation changes, and account updates will appear here."
        />
      )}
    </PatientPortalLayout>
  );
};

export default Notifications;
