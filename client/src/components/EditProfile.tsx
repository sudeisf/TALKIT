'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Edit3 } from 'lucide-react';
import { Form, FormDescription, FormMessage } from './ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { getCurrentUser, updateCurrentUserProfile } from '@/lib/api/authApi';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SkillsInput } from './helper/skillsTagInput';
import { useAppSelector } from '@/redux/hooks';

const formSchema = z.object({
  first_name: z.string().max(50).optional().or(z.literal('')),
  last_name: z.string().max(50).optional().or(z.literal('')),
  profession: z.string().max(100).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone_number: z.string().max(20).optional().or(z.literal('')),
  city: z
    .string()
    .max(50, 'City name is too long')
    .regex(/^[a-zA-Z\s\-']*$/, 'Please enter a valid city name')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .max(50, 'Country name is too long')
    .regex(/^[a-zA-Z\s\-']*$/, 'Please enter a valid country name')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export function EditProfile() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const selectedSkillsRef = useRef<string[]>([]);
  const [profileTagMap, setProfileTagMap] = useState<Record<string, number>>({});

  interface Tag {
    id: number | string;
    label: string;
  }

  interface ProTagsState {
    [key: string]: Tag[];
  }

  interface RootState {
    proTags: ProTagsState;
  }

  const reduxTagMap = useAppSelector((state: RootState) => {
    const map: Record<string, number> = {};
    Object.values(state.proTags).forEach((container: Tag[]) => {
      container.forEach((tag: Tag) => {
        const parsedId = Number(tag?.id);
        if (!Number.isNaN(parsedId) && tag?.label) {
          map[tag.label.trim().toLowerCase()] = parsedId;
        }
      });
    });
    return map;
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      profession: '',
      bio: '',
      phone_number: '',
      city: '',
      country: '',
    },
  });

  const handleSkillsChange = useCallback((skills: string[]) => {
    const deduped = Array.from(new Set(skills.map((s) => s.trim()))).filter(Boolean);
    selectedSkillsRef.current = deduped;
    setSelectedSkills(deduped);
  }, []);

  const normalizeTagKey = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (!open) return;

    getCurrentUser()
      .then((data) => {
        const incomingTags = Array.isArray(data?.tags) ? data.tags : [];
        const incomingTagMap: Record<string, number> = {};
        const incomingSkillNames: string[] = [];

        incomingTags.forEach((tag: any) => {
          const tagName =
            typeof tag === 'string'
              ? tag.trim()
              : typeof tag?.name === 'string'
              ? tag.name.trim()
              : '';

          if (tagName) {
            incomingSkillNames.push(tagName);
            if (tag?.id) incomingTagMap[normalizeTagKey(tagName)] = Number(tag.id);
          }
        });

        const dedupedIncomingSkills = Array.from(new Set(incomingSkillNames));
        selectedSkillsRef.current = dedupedIncomingSkills;
        setSelectedSkills(dedupedIncomingSkills);
        setProfileTagMap(incomingTagMap);

        form.reset({
          first_name: data?.first_name || '',
          last_name: data?.last_name || '',
          profession: data?.profession || '',
          bio: data?.bio || '',
          phone_number: data?.phone_number || '',
          city: data?.city || '',
          country: data?.country || '',
        });
      })
      .catch((error) => {
        console.error(error?.response?.data || error);
        toast.error('Failed to load profile data');
      });
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);

      const normalizedSkills = selectedSkillsRef.current
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      const uniqueSkills = Array.from(new Set(normalizedSkills));

      const tagIds = uniqueSkills
        .map(
          (name) =>
            reduxTagMap[normalizeTagKey(name)] ||
            profileTagMap[normalizeTagKey(name)]
        )
        .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id));

      await updateCurrentUserProfile({
        ...data,
        tags_id: tagIds,
        tags_name: uniqueSkills,
      });

      const updated = await getCurrentUser();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('profile-updated', { detail: { profile: updated } })
        );
      }

      toast.success('Profile updated successfully');
      setOpen(false);
    } catch (error: any) {
      console.error(error?.response?.data || error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-gradient-to-r text-sm font-sans bg-primary px-4 text-primary-foreground rounded-full mt-2 shadow-xs">
        Edit Profile
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogTitle className="text-sm font-sans font-medium flex gap-3">
          Edit Your Profile <Edit3 className="w-4 h-4" />
        </DialogTitle>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profession */}
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+251..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Addis Ababa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Ethiopia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us about yourself" className="min-h-[110px]" {...field} />
                      </FormControl>
                      <FormDescription>Maximum 500 characters.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Skills */}
              <div className="md:col-span-2">
                <FormItem>
                  <FormLabel>Skills / Tags</FormLabel>
                  <FormControl>
                    <SkillsInput value={selectedSkills} onChange={handleSkillsChange} />
                  </FormControl>
                  <FormDescription>Add tags to update your profile skills.</FormDescription>
                </FormItem>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-sm bg-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update Information'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}