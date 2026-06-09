'use client';

import { useEffect, useState } from 'react';
import { Settings, User, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppearanceSettings from '@/components/learner/Apperance';
import { getCurrentUser, updateCurrentUserProfile } from '@/lib/api/authApi';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setEmail(data?.email || '');
      })
      .catch((error) => {
        console.error('Failed to fetch user:', error);
        toast.error('Failed to load settings');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCurrentUserProfile({ email });
      toast.success('Email updated successfully');
    } catch (error: any) {
      const message = error?.response?.data?.email?.[0] || 'Failed to update email';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2  rounded-lg">
          <Settings className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your learning experience</p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button 
              variant={'outline'} 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
