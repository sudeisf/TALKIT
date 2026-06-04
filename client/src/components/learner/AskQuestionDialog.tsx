'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { QuestionTags } from './QuestionTags';
import {
  useCreateQuestionMutation,
  useModifyQuestionDescriptionMutation,
} from '@/query/questionMutation';
import { toast } from 'sonner';
import { parseDjangoError } from '@/lib/utils';
import { WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';


const questionFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  tags: z
    .array(z.string().min(1, 'Tag cannot be empty'))
    .min(1, 'At least one tag is required')
    .max(5, 'No more than 5 tags'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters'),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;
type ASkQuestionProps = {
  btnChild: React.ReactElement;
};

export default function AskQuestion({ btnChild }: ASkQuestionProps) {
  const [open, setOpen] = useState(false);
  const createQuestionMutation = useCreateQuestionMutation();
  const modifyDescriptionMutation = useModifyQuestionDescriptionMutation();
  const router = useRouter()
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: [],
    },
  });

  const onSubmit = async (data: QuestionFormData) => {
    form.clearErrors();

    try {
      const response = await createQuestionMutation.mutateAsync(data);
      toast.success('Question submitted successfully');
      setOpen(false);
      form.reset();

       if (response && response.id) {
         router.push(`/chat/${response.id}`);
      }

    } catch (error) {
      const parsedError = parseDjangoError(error);

      Object.entries(parsedError.fieldErrors ?? {}).forEach(([field, messages]) => {
        if (field === 'title' || field === 'description' || field === 'tags') {
          form.setError(field, {
            type: 'server',
            message: messages[0],
          });
        }
      });

      const fallbackMessage =
        parsedError.global?.[0] ?? 'Failed to submit question. Please try again.';
      toast.error(fallbackMessage);
    }
  };

  const handleImproveDescription = async () => {
    const currentDescription = form.getValues('description')?.trim();

    if (!currentDescription || currentDescription.length < 10) {
      form.setError('description', {
        type: 'manual',
        message: 'Please write at least 10 characters before using AI.',
      });
      return;
    }

    try {
      const result = await modifyDescriptionMutation.mutateAsync({
        description: currentDescription,
      });
      form.setValue('description', result.improved_description, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.clearErrors('description');
      toast.success('Description improved with AI');
    } catch (error) {
      const parsedError = parseDjangoError(error);
      const message =
        parsedError.global?.[0] ??
        'Unable to improve description right now. Please try again.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{btnChild}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px] rounded-xl shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-primary font-sans">
            Ask a Question
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-6">
            {/* Title */}
            <FormField
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-medium text-gray-700">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. How do I optimize my React app?"
                      className="rounded-lg border-gray-300 focus:ring-2 focus-visible:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500">
                    Enter a short, descriptive title.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-medium text-gray-700">
                    Tags
                  </FormLabel>
                  <FormControl>
                    <QuestionTags
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500">
                    Add up to 5 tags to categorize your question.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-md font-medium text-gray-700">
                      Description
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImproveDescription}
                      disabled={
                        modifyDescriptionMutation.isPending ||
                        createQuestionMutation.isPending
                      }
                    >
                      <WandSparkles className="h-4 w-4" />
                      {modifyDescriptionMutation.isPending
                        ? 'Improving...'
                        : 'Improve with AI'}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Explain your question in detail..."
                      className="resize-none min-h-[120px] rounded-lg border-gray-300 focus:ring-2 focus-visible:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500">
                    Provide as much detail as possible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                disabled={createQuestionMutation.isPending}
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary text-primary-foreground rounded-lg"
                disabled={form.formState.isSubmitting || createQuestionMutation.isPending}
              >
                {form.formState.isSubmitting || createQuestionMutation.isPending
                  ? 'Submitting...'
                  : 'Submit Question'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
