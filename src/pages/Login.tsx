import React from 'react';

export const Login: React.FC = () => {
  return (
    <main className="container mx-auto px-6 py-20 text-center text-white min-h-[calc(100vh-88px)] flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-black/40 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-4">Login</h1>
        <p className="text-sm text-white/60 mb-6">
          This section is ready for Developer C to migrate the Firebase Login form and OAuth flows.
        </p>
      </div>
    </main>
  );
};
