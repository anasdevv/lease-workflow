'use client';
import AdminApplicationCard from '@/components/application/application-card';
import ApplicationStats from '@/components/application/application-stats';
import { NewApplicationModal } from '@/components/application/new-application-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications, useApplicationStats, useUpdateApplicationStatus } from '@/hooks/use-applications';
import { useDebounce } from '@/hooks/use-debounce';
import { useListings } from '@/hooks/use-listings';
import { useNewlyCreatedApplicationsPolling } from '@/hooks/use-newly-created-applications';
import type { Listing } from '@/types';
import { Filter, Loader2, Plus, Search, Shield } from "lucide-react";
import { useCallback, useState } from 'react';
import { toast } from "sonner";

export default function AdminLeaseReview() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [page, setPage] = useState(1);
    const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
    const {data: listings , isLoading: listingsLoading} = useListings();
    

    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data: statsData, isLoading: statsLoading } = useApplicationStats();

    const { data, isLoading, error , refetch } = useApplications({
        searchQuery: debouncedSearch,
        status: statusFilter,
        riskLevel: riskFilter, page,
    });

    const { trackedAppIds, trackApplication , removeTrackedApplication } = useNewlyCreatedApplicationsPolling();


    const applications = data?.data || [];
    const pagination = data?.pagination;

    const handleApplicationCreated = useCallback((applicationId: number) => {
                refetch();
        trackApplication(applicationId);
        toast.success('Application created! Monitoring for updates...');
    }, [trackApplication]);
    console.log('Tracked Application IDs for Polling:', trackedAppIds);
  
const handleRemoveTracking = useCallback((applicationId: number) => {
        removeTrackedApplication(applicationId);
        console.log('Stopped tracking application ID:', applicationId);
    }, [removeTrackedApplication]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl shadow-lg">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">
                                    Lease Application Review
                                </h1>
                                <p className="text-slate-600">Review and approve lease applications with fraud detection</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowNewApplicationModal(true)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Application
                        </button>
                    </div>

                    <ApplicationStats stats={statsData?.data} isLoading={statsLoading} />
                </div>

                {/* Applications List */}
                <Card className="border-0 shadow-xl">
                    {/* <div className='flex items-center justify-between'> */}
                        <CardHeader className="border-b bg-white">
                            <CardTitle className="text-lg font-semibold text-slate-800">Applications</CardTitle>
                            <CardDescription className="text-slate-500">
                                {pagination ? `${pagination.total} application${pagination.total !== 1 ? 's' : ''} found` : 'Loading...'}
                            </CardDescription>
                        </CardHeader>
                       
                    {/* </div> */}

                    <CardContent className="p-6">
                        {/* Filters */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name, email, or address..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1); // Reset to first page on search
                                    }}
                                    className="pl-10 border-slate-300"
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-slate-400" />
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value) => {
                                            setStatusFilter(value);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-40 border-slate-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Select
                                    value={riskFilter}
                                    onValueChange={(value: any) => {
                                        setRiskFilter(value);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-40 border-slate-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Risk Levels</SelectItem>
                                        <SelectItem value="high">High Risk (70+)</SelectItem>
                                        <SelectItem value="medium">Medium Risk (40-69)</SelectItem>
                                        <SelectItem value="low">Low Risk (&lt;40)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Applications */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-500">Loading applications...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <Shield className="w-12 h-12 text-red-300 mx-auto mb-4" />
                                    <h3 className="font-semibold text-slate-700 mb-2">Error loading applications</h3>
                                    <p className="text-sm text-slate-500">Please try again</p>
                                </div>
                            ) : applications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="font-semibold text-slate-700 mb-2">No applications found</h3>
                                    <p className="text-sm text-slate-500">
                                        Try adjusting your filters or search query
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {applications.map((app) => (
                                        <AdminApplicationCard
                                            key={app.id}
                                            application={app}
                                            shouldPoll={trackedAppIds.includes(app.id)}
                                            onRemoveTracking={handleRemoveTracking}
                                        />
                                    ))}

                                    {pagination && pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-slate-600">
                                                Page {page} of {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                disabled={page === pagination.totalPages}
                                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {!listingsLoading && (
                    <NewApplicationModal
                        open={showNewApplicationModal}
                        onOpenChange={setShowNewApplicationModal}
                        listings={listings as Listing[]}
                        onApplicationCreated={handleApplicationCreated}
                    />
                )}
            </div>
        </div>
    );
}