'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import Link from 'next/link';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { useVerifyOTPMutation } from '@/query/authMutation';
import { toast } from 'sonner';
import { parseDjangoError } from '@/lib/utils';
import { SpinnerInfinity } from 'spinners-react';

const formSchema = z.object({
  otp: z
    .string()
    .regex(/^\d+$/, 'OTP must contain only numbers')
    .min(6, 'OTP must be 6 digits')
    .max(6),
});

export default function OtpPage() {
  const [globalError, setGlobalError] = useState<string | null>(null);

  const router = useRouter();
  const disapatch = useAppDispatch();
  const verfiyOTP = useVerifyOTPMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
    mode: 'onChange',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const code = Number(values.otp);
    verfiyOTP.mutate(
      { code },
      {
        onSuccess: (data) => {
          toast.success(data.message, {
            style: {
              background: 'linear-gradient(to right, var(--danger), var(--warning))',
              WebkitBackgroundClip: 'text',
              fontWeight: 'bold',
              fontSize: '16px',
            },
            position: 'top-right',
          });
          router.replace('/new-password');
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
      }
    );
  }

  return (
    <>
      {verfiyOTP.isPending ? (
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
          {globalError && (
            <div className="text-danger text-sm font-medium   form-sans text-center mt-4">
              {globalError}
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 w-full max-w-md mx-auto p-2 md:p-10 font-sans"
            >
              <div className="flex flex-col space-y-2.5 mb-10 md:mb-5 mt-10 md:mt-0 text-center ">
                <h1 className="font-medium text-foreground text-3xl font-sans">
                  Enter the OTP{' '}
                </h1>
                <p className="text-muted-foreground font-sans">
                  Please enter the 6-digit code sent to your email address
                </p>
              </div>
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={(e) => {
                          const numericValue = e.replace(/\D/g, '');
                          field.onChange(numericValue);
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      >
                        <InputOTPGroup className="mx-auto">
                          <InputOTPSlot index={0} className="p-5" />
                          <InputOTPSlot index={1} className="p-5" />
                          <InputOTPSeparator className="text-primary">
                            -
                          </InputOTPSeparator>
                          <InputOTPSlot index={2} className="p-5" />
                          <InputOTPSlot index={3} className="p-5" />
                          <InputOTPSeparator className="text-primary">
                            -
                          </InputOTPSeparator>
                          <InputOTPSlot index={4} className="p-5" />
                          <InputOTPSlot index={5} className="p-5" />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary  text-primary-foreground font-medium font-sans  py-5 text-sm "
              >
                Verify OTP <ArrowRight />
              </Button>

              <div className="flex justify-center align-middle font-sans gap-2">
                <p className="text-md font-sans font-normal ">
                  Didn't receive the OTP?
                </p>
                <Link
                  href="/forgot-password"
                  className="text-md text-primary  font-medium font-sans"
                >
                  Resend OTP
                </Link>
              </div>
            </form>
          </Form>
        </div>
      )}
    </>
  );
}
