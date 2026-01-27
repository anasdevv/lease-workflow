import { z } from 'zod';

export const applicationFormSchema = z.object({
  listingId: z
    .number({
      error: 'Please select a listing',
    })
    .positive('Please select a valid listing'),

  applicantName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  applicantEmail: z
    .string()
    .email('Please enter a valid email address'),
  
  
  moveInDate: z
    .string()
    .min(1, 'Move-in date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Move-in date must be today or in the future'),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;