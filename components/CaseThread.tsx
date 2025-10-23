interface ThreadMessage {
  id: string;
  subject: string;
  from?: string;
  to?: string;
  date?: string;
  snippet?: string;
  bodyPlain?: string;
}

export default function CaseThread({ messages }: { messages: ThreadMessage[] }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      {messages.map((message) => (
        <article key={message.id} className="rounded-md border border-slate-200 bg-white p-3">
          <header className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">{message.subject}</span>
            <span className="text-xs text-slate-500">
              {message.date ? new Date(message.date).toLocaleString() : ""}
            </span>
          </header>
          <p className="mt-2 text-xs text-slate-500">
            From: {message.from ?? "Unknown"} · To: {message.to ?? "Unknown"}
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {message.bodyPlain ?? message.snippet ?? ""}
          </pre>
        </article>
      ))}
    </div>
  );
}
