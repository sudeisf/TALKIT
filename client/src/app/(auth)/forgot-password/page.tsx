'use client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { email, z } from 'zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowBigLeft, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayoutContent from '@/app/components/AuthLayoutContent';
import { useRouter } from 'next/navigation';
import { useVerifyEmailMutation } from '@/query/authMutation';
import { toast } from 'sonner';
import { error } from 'console';
import { parseDjangoError } from '@/lib/utils';
import { useState } from 'react';
import { verify } from 'crypto';
import { SpinnerInfinity } from 'spinners-react';
import { useAppDispatch } from '@/redux/hooks';
import { action } from '@/redux/slice/authSlice';
const formSchema = z.object({
  email: z.email(),
});
export default function ForgotPassword() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });
  const VerifyEmail = useVerifyEmailMutation();
  const router = useRouter();
  const disapatch = useAppDispatch();

  function onSubmit(values: z.infer<typeof formSchema>) {
    setGlobalError(null);
    VerifyEmail.mutate(values, {
      onSuccess: (data) => {
        disapatch(action.setEmail(values.email));
        toast.success(data.message, {
          style: {
            background: 'linear-gradient(to right, var(--danger), var(--warning))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: '16px',
          },
        });
        router.replace('/verify-otp');
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
      {VerifyEmail.isPending ? (
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
            <h1 className="bg-primary font-sans bg-clip-text text-transparent text-xl">
              Talkit
            </h1>
            <div className="flex space-x-0.5 text-md"></div>
          </div>

          <div className="  mx-auto mt-20 max-w-[400px]">
            <div className="flex flex-col items-left space-y-2">
              <h1 className="font-sans font-medium text-2xl text-shadow-2xs">
                Verify your email first
              </h1>
              <p className="font-sans text-gray-500 text-md">
                One time pass code will be sent to your email after confirmation
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
                className="space-y-6  mx-auto mt-2 flex flex-col justify-center"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="jhondoe@gmail.com"
                          className="py-5 text-lg placeholder:capitalize"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-sans  py-5 text-sm "
                >
                  Verify email <ArrowRight />
                </Button>
                <Button
                  onClick={() => router.replace('/login')}
                  variant={'ghost'}
                  className="font-sans  items-center flex justify-center text-md hover:bg-white"
                >
                  <ArrowLeft /> <span>Remembered Password</span>
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
