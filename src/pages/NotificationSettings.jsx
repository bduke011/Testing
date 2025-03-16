import React, { useState, useEffect } from "react";
import { NotificationPreference, User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bell, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const user = await User.me();
      if (!user) return;

      const userPrefs = await NotificationPreference.filter({ user_id: user.id });
      
      if (userPrefs.length > 0) {
        setPreferences(userPrefs[0]);
      } else {
        // Create default preferences
        const defaultPrefs = await NotificationPreference.create({
          user_id: user.id,
          email_notifications: {
            bid_placed: true,
            outbid: true,
            auction_ending_soon: true,
            auction_won: true,
            auction_lost: true,
            payment_received: true,
            new_listing_in_category: false,
            watched_price_change: true
          },
          push_notifications: {
            bid_placed: true,
            outbid: true,
            auction_ending_soon: true,
            auction_won: true,
            auction_lost: true,
            payment_received: true,
            new_listing_in_category: false,
            watched_price_change: true
          },
          ending_soon_threshold: 24,
          watched_categories: []
        });
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    setLoading(false);
  };

  const handleToggle = async (type, channel, value) => {
    try {
      const updatedPrefs = {
        ...preferences,
        [`${channel}_notifications`]: {
          ...preferences[`${channel}_notifications`],
          [type]: value
        }
      };
      
      await NotificationPreference.update(preferences.id, updatedPrefs);
      setPreferences(updatedPrefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const updateEndingSoonThreshold = async (hours) => {
    try {
      const updatedPrefs = {
        ...preferences,
        ending_soon_threshold: parseInt(hours)
      };
      
      await NotificationPreference.update(preferences.id, updatedPrefs);
      setPreferences(updatedPrefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating threshold:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const notificationTypes = [
    { id: 'bid_placed', label: 'When you place a bid' },
    { id: 'outbid', label: 'When someone outbids you' },
    { id: 'auction_ending_soon', label: 'When auctions are ending soon' },
    { id: 'auction_won', label: 'When you win an auction' },
    { id: 'auction_lost', label: 'When you lose an auction' },
    { id: 'payment_received', label: 'When payment is received' },
    { id: 'new_listing_in_category', label: 'New listings in watched categories' },
    { id: 'watched_price_change', label: 'Price changes on watched items' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-500">Manage your notification preferences</p>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <Label htmlFor={`email-${type.id}`}>{type.label}</Label>
                <Switch
                  id={`email-${type.id}`}
                  checked={preferences.email_notifications[type.id]}
                  onCheckedChange={(checked) => handleToggle(type.id, 'email', checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              In-App Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <Label htmlFor={`push-${type.id}`}>{type.label}</Label>
                <Switch
                  id={`push-${type.id}`}
                  checked={preferences.push_notifications[type.id]}
                  onCheckedChange={(checked) => handleToggle(type.id, 'push', checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="threshold">Send "Ending Soon" notifications</Label>
              <Select
                value={preferences.ending_soon_threshold.toString()}
                onValueChange={updateEndingSoonThreshold}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour before</SelectItem>
                  <SelectItem value="6">6 hours before</SelectItem>
                  <SelectItem value="12">12 hours before</SelectItem>
                  <SelectItem value="24">24 hours before</SelectItem>
                  <SelectItem value="48">48 hours before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}