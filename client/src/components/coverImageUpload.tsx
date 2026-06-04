'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { useDroppable } from '@dnd-kit/core';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, File as FileIcon, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { uploadCoverImage } from '@/lib/api/authApi';
import { toast } from 'sonner';

// Define the form schema with proper typing
const formSchema = z.object({
  coverImage: z
    .instanceof(File, { message: 'No file provided' })
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'Only JPEG or PNG images are allowed'
    )
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      'File size must be less than 2MB'
    ),
});

type FormData = z.infer<typeof formSchema>;

interface UploadCoverImageProps {
  onUploaded?: (url: string) => void;
}

export default function UploadCoverImage({ onUploaded }: UploadCoverImageProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'dropzone',
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        try {
          form.setValue('coverImage', file);
          const imageUrl = URL.createObjectURL(file);
          setPreviewUrl(imageUrl);
          setDroppedFile(file);
          form.trigger('coverImage'); // Validate immediately
        } catch (error) {
          console.error('Error handling dropped file:', error);
        }
      }
    },
    [form]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        try {
          form.setValue('coverImage', file);
          const imageUrl = URL.createObjectURL(file);
          setPreviewUrl(imageUrl);
          setDroppedFile(file);
          form.trigger('coverImage');
        } catch (error) {
          console.error('Error handling file input:', error);
        }
      }
    },
    [form]
  );

  const onSubmit = async (data: FormData) => {
    try {
      setIsUploading(true);
      const response = await uploadCoverImage(data.coverImage);

      const uploadedUrl =
        response?.cover_image_url ||
        response?.cover_image?.secure_url ||
        response?.cover_image?.url ||
        (typeof response?.cover_image === 'string' ? response.cover_image : null);

      if (uploadedUrl && onUploaded) {
        const cacheBustedUrl = uploadedUrl.includes('?')
          ? `${uploadedUrl}&t=${Date.now()}`
          : `${uploadedUrl}?t=${Date.now()}`;
        onUploaded(cacheBustedUrl);
      }

      if (!uploadedUrl) {
        toast.error('Uploaded, but image URL was not returned by API');
        return;
      }

      toast.success('Cover image uploaded successfully');
      form.reset();
      setDroppedFile(null);
      setPreviewUrl(null);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to upload cover image');
      console.error((error as any)?.response?.data || error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex itesm-center">
        <div className="flex items-center justify-center bg-white hover:bg-gray-100 rounded-full w-10 h-10">
          <Edit className="w-4 h-4 text-black" />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle></DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
            <FormField
              name="coverImage"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Cover Image</FormLabel>
                  <FormControl>
                    <div
                      ref={setNodeRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragOver || isOver
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() =>
                        document.getElementById('file-input')?.click()
                      }
                    >
                      <Input
                        id="file-input"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      {droppedFile ? (
                        <div>
                          <p className="text-sm text-gray-600">
                            Selected: {droppedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Size: {(droppedFile.size / 1024 / 1024).toFixed(2)}{' '}
                            MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">
                            Drag and drop an image here, or click to select
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            JPEG, PNG up to 2MB
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select or drag and drop your cover image file.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {droppedFile && previewUrl ? (
              <div>
                <div className="flex justify-between items-center-safe p-2 border rounded-md shadow-2xs">
                  <div className="flex gap-3">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={50}
                      height={50}
                      className="rounded-lg object-center border"
                    />
                    <div>
                      <p className="text-md text-gray-700">
                        {droppedFile.name}
                      </p>
                      <p className="text-xs">
                        {(droppedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setDroppedFile(null);
                      setPreviewUrl(null);
                      form.reset();
                    }}
                    variant={'ghost'}
                    disabled={isUploading}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              </div>
            ) : null}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50"
              disabled={!droppedFile || !form.formState.isValid || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
