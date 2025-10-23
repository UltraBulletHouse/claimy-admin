export default function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="text-center text-slate-500">
        <svg
          className="mx-auto h-8 w-8 animate-spin text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
        <p className="mt-3 text-sm">{message ?? "Loading…"}</p>
      </div>
    </div>
  );
}
