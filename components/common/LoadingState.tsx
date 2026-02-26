export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-sm text-ink-600">
      {message}
    </div>
  );
}
