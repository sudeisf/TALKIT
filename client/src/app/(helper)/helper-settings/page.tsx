'use client';

import { useState } from 'react';
import { Settings, User, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppearanceSettings from '@/components/learner/Apperance';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  return (
    <div className="container mx-auto p-6 max-w-4xl text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2  rounded-lg">
          <Settings className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Helper Settings</h1>
          <p className="text-muted-foreground">Customize your helper workspace and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card className="shadow-none border-b border-x-0 border-t-0 rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="sudiesfed@gmail.com"
                />
              </div>
            </div>
            <Button variant={'outline'}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-none border-b border-x-0 border-t-0 rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Study Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Daily reminders to study
                </p>
              </div>
              <input
                type="checkbox"
                checked={studyReminders}
                onChange={(e) => setStudyReminders(e.target.checked)}
                className="w-4 h-4 rounded"
              />
            </div>
          </CardContent>
        </Card>

        <AppearanceSettings />

        {/* Study Settings */}
        <Card className="shadow-none border-b border-x-0 border-t-0 rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-goal">Daily Study Goal</Label>
              <select className="w-full p-2 border border-input rounded-md bg-background text-foreground">
                <option value="5">5 questions per day</option>
                <option value="10">10 questions per day</option>
                <option value="15">15 questions per day</option>
                <option value="20">20 questions per day</option>
                <option value="25">25 questions per day</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">
                  Play sounds during study sessions
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
