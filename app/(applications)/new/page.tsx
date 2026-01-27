import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ApplicationForm from '@/components/forms/new-application-form';
import { getAllListings } from '@/actions/application/action';

function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

async function ApplicationContent() {
  const result = await getAllListings();

  if (!result.success || !result.data) {
    return <div>No listings available</div>;
  }

  return <ApplicationForm listings={result.data} />;
}

export default async function ApplicationPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Rental Application
              </h1>
              <p className="text-slate-600 mt-1">
                Complete your application to secure your new home
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Secure & Encrypted</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-600">Application Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<FormSkeleton />}>
          <ApplicationContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Application Process
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Fill out application form</li>
                <li>✓ Upload required documents</li>
                <li>✓ Automated verification</li>
                <li>✓ Receive decision within 24-48 hours</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Security & Privacy
              </h3>
              <p className="text-sm text-slate-600">
                Your data is encrypted and stored securely. We comply with all 
                data protection regulations and never share your information 
                without consent.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Need Help?
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                Contact our support team if you have any questions about the 
                application process.
              </p>
              <a 
                href="mailto:support@example.com" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                support@example.com
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            © 2025 Rental Application System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata() {
  return {
    title: 'Rental Application',
    description: 'Submit your rental application',
  };
}