'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, Home, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { applicationFormSchema, type ApplicationFormValues } from '@/schemas/application-schema';
import { useDocumentUpload } from '@/hooks/use-document-upload';
import { DOCUMENT_TYPES } from '@/constants/documents';
import type { Listing } from '@/types';
import { DocumentUploadField } from '../document-upload-field';
import { createApplication } from '@/actions/application/action';
import { useQueryClient } from '@tanstack/react-query';
import { ApplicationQueryTag } from '@/hooks/use-applications';

interface ApplicationFormProps {
    listings: Listing[];
    onSuccess?: () => void;
    onApplicationCreated?: (applicationId: number) => void;
}

export default function ApplicationForm({ listings, onSuccess, onApplicationCreated }: ApplicationFormProps) {
    const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle');
    const queryClient = useQueryClient();
    console.log('listings', listings);
    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            listingId: 0,
            applicantName: '',
            applicantEmail: '',
        },
    });


    const {
        documents,
        isUploading,
        uploadDocument,
        removeDocument,
        hasRequiredDocuments,
    } = useDocumentUpload();

    const requiredDocumentTypes = DOCUMENT_TYPES
        .filter((dt) => dt.required)
        .map((dt) => dt.label);


    console.log('formState ', form.formState.isValid, form.formState.errors, requiredDocumentTypes, hasRequiredDocuments(requiredDocumentTypes), submitStatus, isUploading);
    const canSubmit =
        form.formState.isValid &&
        hasRequiredDocuments(requiredDocumentTypes) &&
        !isUploading &&
        submitStatus !== 'submitting';
    console.log('canSubmit ', canSubmit);
    const handleFormSubmit = async (values: ApplicationFormValues) => {
        if (!hasRequiredDocuments(requiredDocumentTypes)) {
            toast.error('Missing required documents', {
                description: 'Please upload all required documents before submitting',
            });
            return;
        }

        setSubmitStatus('submitting');

        try {
            const result = await createApplication({
                formData: values,
                listingId: values.listingId,
                documents,
            });

            if (result.success) {
                setSubmitStatus('success');
                toast.success('Application submitted successfully!', {
                    description: `Application ID: ${result.data?.id}`,
                });
                
                // Track the newly created application for polling
                if (result.data?.id) {
                    onApplicationCreated?.(result.data.id);
                }
                
                queryClient.invalidateQueries({
                    queryKey: [ApplicationQueryTag.APPLICATIONS, ApplicationQueryTag.APPLICATION_STATS]
                })

                form.reset();
                onSuccess?.();
            } else {
                setSubmitStatus('idle');
                toast.error('Submission failed', {
                    description: result.error || 'Please try again',
                });
            }
        } catch (error) {
            setSubmitStatus('idle');
            console.error('Submission failed:', error);
            toast.error('Submission failed', {
                description: error instanceof Error ? error.message : 'Please try again',
            });
        }
    };



    return (
        <Card className="border-0 shadow-xl">

            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        {/* Listing Selection */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                                Select Property
                            </h3>
                            <FormField
                                control={form.control}
                                name="listingId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Available Listings *</FormLabel>
                                        <Select value={field.value ? field.value.toString() : ''} onValueChange={(value) => field.onChange(parseInt(value))}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a property to apply for" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {listings.map((listing) => (
                                                    <SelectItem key={listing.id} value={listing.id.toString()}>
                                                        {listing.address}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        {/* Personal Information */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="applicantName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="applicantEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>


                        {/* Document Upload */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                                Required Documents
                            </h3>
                            <div className="space-y-4">
                                {DOCUMENT_TYPES.map((docType) => {
                                    const uploadedDoc = documents.find(
                                        (d) => d.documentType === docType.label
                                    );
                                    return (
                                        <DocumentUploadField
                                            key={docType.id}
                                            documentType={docType}
                                            uploadedDocument={uploadedDoc}
                                            isUploading={isUploading}
                                            onUpload={uploadDocument}
                                            onRemove={removeDocument}
                                        />
                                    );
                                })}
                            </div>
                        </section>

                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitStatus === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}