'use client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AuthLayoutContent from '@/app/components/AuthLayoutContent';
import { useState } from 'react';
import { useResetPasswordMutation } from '@/query/authMutation';
import { error } from 'console';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { parseDjangoError } from '@/lib/utils';
import { SpinnerInfinity } from 'spinners-react';
import { useAppDispatch } from '@/redux/hooks';
import { action } from '@/redux/slice/authSlice';

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'your password should be at leaset 8 charachters' }),
  confirPassword: z
    .string()
    .min(8, { message: 'your password should be at leaset 8 charachters' }),
});
export default function NewPassword() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const resetPassword = useResetPasswordMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirPassword: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      new_password: values.password,
      confirm_password: values.confirPassword,
    };
    resetPassword.mutate(data, {
      onSuccess: (data) => {
        dispatch(action.clearEmail());
        toast.success(data.message, {
          style: {
            background: 'linear-gradient(to right, var(--danger), var(--warning))',
            color: 'var(--primary-foreground)',
            fontWeight: 'bold',
            fontSize: '16px',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          position: 'top-right',
        });
        setIsRedirecting(true);
        router.replace('/login');
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
    <>
      {resetPassword.isPending || isRedirecting ? (
        <div className="flex items-center justify-center h-[80vh]">
          <SpinnerInfinity
            thickness={100}
            secondaryColor="var(--muted)"
            color="var(--primary)"
            size={90}
          />
        </div>
      ) : (
        <div>
          <div className="flex justify-between p-4">
            <h1 className="bg-primary bg-clip-text text-transparent text-xl">
              Talkit
            </h1>
            <div className="flex space-x-0.5 text-md"></div>
          </div>
          <div className="  mx-auto mt-10">
            <div className="flex flex-col items-center">
              <h1 className="font-sans font-medium text-2xl text-shadow-2xs">
                You can add your new password
              </h1>
              <p className="font-sans text-gray-500 text-md">
                Please make sure the passwords match
              </p>
            </div>
            {globalError && (
              <div className="text-danger text-sm font-medium   form-sans text-center mt-4">
                {globalError}
              </div>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 max-w-[380px] mx-auto mt-4 flex flex-col justify-center"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sans text-md font-medium ">
                        New password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="*********"
                          className="py-5 text-lg placeholder:text-md"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sans text-md font-medium ">
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="*********"
                          className="py-5 text-lg placeholder:text-md"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary py-5 text-sm "
                >
                  Confirm
                  <ArrowRight />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
