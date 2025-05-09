import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-16 lg:p-24">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">Election Voting System</h1>
      
      <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-md">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Admin Section</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link 
              href="/admin/dashboard" 
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-center"
            >
              Admin Dashboard
            </Link>
            <Link 
              href="/admin/stats" 
              className="px-4 sm:px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-center"
            >
              Admin Statistics
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Viewer Section</h2>
          <Link 
            href="/viewer" 
            className="px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition block text-center"
          >
            Viewer Section
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>A Next.js application for election voting and statistics</p>
      </div>
    </main>
  );
}
