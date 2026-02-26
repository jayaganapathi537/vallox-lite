'use client';

import { firebaseConfigErrorMessage, isFirebaseConfigured } from '@/lib/firebase';

export default function FirebaseConfigNotice() {
  if (isFirebaseConfigured) {
    return null;
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-6xl rounded-2xl border border-sunrise-200 bg-sunrise-50 px-4 py-3 text-sm text-sunrise-800 sm:px-6 lg:px-8">
      <p className="font-semibold">Firebase configuration required</p>
      <p className="mt-1">{firebaseConfigErrorMessage}</p>
      <p className="mt-1">Add the `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`, then restart the dev server.</p>
    </div>
  );
}
