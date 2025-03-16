import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notification, User } from '@/api/entities';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds, but with error backoff
    const interval = setInterval(() => {
      if (!error) {
        loadNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [error]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // First check if the user is authenticated
      let user;
      try {
        user = await User.me();
        if (!user) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          return;
        }
      } catch (userError) {
        // User not authenticated, just quietly fail
        setNotifications([]);
        setUnreadCount(0);
        setError(false);
        setLoading(false);
        return;
      }

      // Now try to get notifications
      try {
        const userNotifications = await Notification.filter(
          { user_id: user.id },
          "-created_date",
          10
        );
        
        setNotifications(userNotifications || []);
        setUnreadCount((userNotifications || []).filter(n => !n.read).length);
        setError(false);
      } catch (notifError) {
        console.error('Error loading notifications:', notifError);
        // Don't show an error state to the user, just keep the old notifications
        setError(true);
      }
    } catch (error) {
      console.error('Error in notification component:', error);
      setError(true);
    }
    setLoading(false);
  };

  const markAsRead = async (notification) => {
    try {
      await Notification.update(notification.id, { read: true });
      // Update local state to prevent flickering
      setNotifications(
        notifications.map(n => 
          n.id === notification.id ? {...n, read: true} : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Silent fail - don't disturb the user experience
    }
  };

  const getNotificationIcon = (type) => {
    // Default icon
    return <Bell className="w-4 h-4" />;
  };

  // If there's an error, still render the bell but without a count
  // This way the UI doesn't break
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {!error && unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-2 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-gray-500">
            Unable to load notifications
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${!notification.read ? 'bg-gray-50' : ''}`}
                onClick={() => markAsRead(notification)}
              >
                <Link 
                  to={notification.listing_id ? createPageUrl(`Listing?id=${notification.listing_id}`) : '#'}
                  className="flex items-start gap-3 w-full"
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_date), 'MMM d, h:mma')}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Link
                to={createPageUrl("Notifications")}
                className="w-full text-center p-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View All Notifications
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}