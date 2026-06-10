import React from 'react';

export const BlogBrowse: React.FC = () => {
  return (
    <main className="container mx-auto px-6 py-20 text-center text-white min-h-[calc(100vh-88px)] flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-4">All Posts</h1>
        <p className="text-lg text-white/80">
          This section is ready for Developer C to migrate the search forms, genre filters, and paginated lists of approved articles.
        </p>
      </div>
    </main>
  );
};
