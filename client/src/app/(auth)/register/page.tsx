'use client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { ArrowRight } from 'lucide-react';
import AuthLayoutContent from '@/app/components/AuthLayoutContent';
import { useRegisterMutation } from '@/query/authMutation';
import { parseDjangoError } from '@/lib/utils';
import { useState } from 'react';
import { SpinnerInfinity } from 'spinners-react';
import { useAppDispatch } from '@/redux/hooks';
import { useRouter } from 'next/navigation';
import { setUser } from '@/redux/slice/userSlice';
const formSchema = z
  .object({
    email: z.email(),
    username: z
      .string()
      .min(6, { message: 'username must be at least 6 chars' }),
    password: z
      .string()
      .min(8, { message: 'your password should be at leaset 8 charachters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'your password should be at leaset 8 charachters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });
export default function Register() {
  const registerMutation = useRegisterMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { confirmPassword, ...payload } = values;
    registerMutation.mutate(payload, {
      onSuccess: (data) => {
        dispatch(
          setUser({
            id: data.user,        
            email: data.email,
            username: data.username,
            firstName: data.firstName, 
            lastName: data.lastName,
            role: data.role,      
          }),
        );
        router.replace('/complete-profile');
      },
      onError: (error) => {
        const err = parseDjangoError(error);

        if (err.global && err.global.length > 0) {
          setGlobalError(err.global.join(', '));
        }

        if (err.fieldErrors) {
          Object.entries(err.fieldErrors).forEach(([field, messages]) => {
            form.setError(field as keyof typeof values, {
              type: 'server',
              message: messages.join(', '),
            });
          });
        }
      },
    });
  }

  return (
    <AuthLayoutContent pageType="Register">
      {registerMutation.isPending ? (
        <div className="flex items-center justify-center h-[60vh]">
          <SpinnerInfinity
            thickness={100}
            secondaryColor="var(--muted)"
            color="var(--primary)"
            size={90}
          />
        </div>
      ) : (
        <div className="mx-auto mt-6 sm:mt-10 px-4 sm:px-0">
          <div className="flex flex-col items-center">
            <h1 className="font-sans font-medium text-xl sm:text-2xl text-foreground text-center">
              Welcome to Talkit
            </h1>
            <p className="font-sans text-muted-foreground text-sm sm:text-md text-center mt-1">
              Please enter your details to sign up
            </p>
          </div>
          {globalError && (
            <div className="text-danger text-sm font-medium capitalize  form-sans text-center mt-4">
              {globalError}
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 max-w-[380px] mx-auto mt-2 flex flex-col justify-center"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-md font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jhondoe@gmail.com"
                        className="py-5 text-lg placeholder:capitalize"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-md font-medium">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="jhonfs"
                        className="py-5 text-lg placeholder:capitalize"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-md font-medium ">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="*********"
                        className="py-5 text-lg placeholder:text-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans text-md font-medium ">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="*********"
                        className="py-5 text-lg placeholder:text-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 font-sans text-primary-foreground py-5 text-sm"
              >
                Sign up <ArrowRight />
              </Button>
            </form>
          </Form>
        </div>
      )}
    </AuthLayoutContent>
  );
}
