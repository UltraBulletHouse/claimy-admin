import { useState } from "react";
import toast from "react-hot-toast";
import { useAdminApi } from "../hooks/useAdminApi";
import ConfirmDialog from "./ConfirmDialog";
import CaseThread from "./CaseThread";
import Spinner from "./Spinner";
import type { CaseRecord } from "../types/case";

interface Props {
  caseData: CaseRecord;
  onCaseUpdate: (caseRecord: CaseRecord) => void;
  onDeleted: () => void;
}

export default function CaseDetailActions({ caseData, onCaseUpdate, onDeleted }: Props) {
  const api = useAdminApi();
  const [analysis, setAnalysis] = useState(caseData.manualAnalysis?.text ?? "");
  const [emailDraft, setEmailDraft] = useState({
    subject: "",
    body: "",
    to: caseData.storeName || caseData.store
      ? `${(caseData.storeName ?? caseData.store) ?? "Store"} <store@example.com>`
      : ""
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [includeProduct, setIncludeProduct] = useState(true);
  const [includeReceipt, setIncludeReceipt] = useState(true);
  const [threadView, setThreadView] = useState<any[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [requestInfoMessage, setRequestInfoMessage] = useState("");
  const [resolutionCode, setResolutionCode] = useState(caseData.resolution?.code ?? "");
  const [rejectNote, setRejectNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [viewingThread, setViewingThread] = useState(false);
  const [replying, setReplying] = useState(false);
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveAnalysis() {
    try {
      setSavingAnalysis(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/analysis`,
        { text: analysis }
      );
      onCaseUpdate(updated);
      toast.success("Manual analysis saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save analysis");
    } finally {
      setSavingAnalysis(false);
    }
  }

  async function handleGeneratePrompt() {
    try {
      setGeneratingPrompt(true);
      const { prompt } = await api.post<{ prompt: string }>(
        `/api/local-admin/cases/${caseData._id}/generate-prompt`,
        {}
      );
      setGeneratedPrompt(prompt);
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate prompt");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleSaveDraft() {
    try {
      setSavingDraft(true);
      await api.post(`/api/admin/cases/${caseData._id}/email/draft`, emailDraft);
      toast.success("Draft saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSendEmail() {
    try {
      setSendingEmail(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/email/send`,
        {
          subject: emailDraft.subject,
          body: emailDraft.body,
          to: emailDraft.to,
          attachProduct: includeProduct,
          attachReceipt: includeReceipt
        }
      );
      onCaseUpdate(updated);
      toast.success("Email sent");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleViewThread() {
    try {
      setViewingThread(true);
      const { messages } = await api.get<{ messages: any[] }>(
        `/api/admin/cases/${caseData._id}/thread`
      );
      setThreadView(messages);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load thread");
    } finally {
      setViewingThread(false);
    }
  }

  async function handleReplyThread() {
    try {
      setReplying(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/thread/reply`,
        { body: replyBody }
      );
      setReplyBody("");
      onCaseUpdate(updated);
      toast.success("Reply sent");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reply");
    } finally {
      setReplying(false);
    }
  }

  async function handleRequestInfo() {
    try {
      setRequestingInfo(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/request-info`,
        { message: requestInfoMessage }
      );
      onCaseUpdate(updated);
      toast.success("Status set to need more info");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update status");
    } finally {
      setRequestingInfo(false);
    }
  }

  async function handleApprove() {
    try {
      setApproving(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/approve`,
        { code: resolutionCode }
      );
      onCaseUpdate(updated);
      toast.success("Case approved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to approve case");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    try {
      setRejecting(true);
      const updated = await api.post<CaseRecord>(
        `/api/admin/cases/${caseData._id}/reject`,
        { note: rejectNote }
      );
      onCaseUpdate(updated);
      toast.success("Case rejected");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reject case");
    } finally {
      setRejecting(false);
      setConfirmReject(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await api.del(`/api/admin/cases/${caseData._id}`, {
        deleteAssets: true
      });
      toast.success("Case deleted");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete case");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Case overview</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-700">Store</dt>
            <dd>{caseData.storeName ?? caseData.store ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-700">Product</dt>
            <dd>{caseData.productName ?? caseData.product ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-700">User email</dt>
            <dd>{caseData.userEmail ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-700">Description</dt>
            <dd className="max-w-xs text-right">{caseData.description ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Manual analysis</h3>
        <textarea
          value={analysis}
          onChange={(e) => setAnalysis(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Enter notes from manual review…"
        />
        <button
          onClick={handleSaveAnalysis}
          disabled={savingAnalysis}
          className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingAnalysis ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Saving…</span>) : 'Save analysis'}
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">AI prompt helper</h3>
          <button
            onClick={handleGeneratePrompt}
            disabled={generatingPrompt}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingPrompt ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Generating…</span>) : 'Generate prompt & copy'}
          </button>
        </div>
        {generatedPrompt && (
          <pre className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {generatedPrompt}
          </pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Email draft</h3>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            placeholder="Subject"
            value={emailDraft.subject}
            onChange={(e) => setEmailDraft((prev) => ({ ...prev, subject: e.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="email"
            placeholder="Recipient email"
            value={emailDraft.to}
            onChange={(e) => setEmailDraft((prev) => ({ ...prev, to: e.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            rows={8}
            placeholder="Email body"
            value={emailDraft.body}
            onChange={(e) => setEmailDraft((prev) => ({ ...prev, body: e.target.value }))}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="mt-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeProduct}
              onChange={(e) => setIncludeProduct(e.target.checked)}
            />
            Attach product image
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeReceipt}
              onChange={(e) => setIncludeReceipt(e.target.checked)}
            />
            Attach receipt image
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingDraft ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Saving…</span>) : 'Save draft'}
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingEmail ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Sending…</span>) : 'Send email'}
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Email thread</h3>
          <button
            onClick={handleViewThread}
            disabled={viewingThread}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {viewingThread ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Loading…</span>) : 'View thread'}
          </button>
        </div>
        <CaseThread messages={threadView} />
        <div className="mt-4 space-y-2">
          <textarea
            rows={4}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Reply to store…"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleReplyThread}
            disabled={replying || !replyBody.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {replying ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Replying…</span>) : 'Reply in thread'}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Request information</h3>
        <textarea
          rows={3}
          value={requestInfoMessage}
          onChange={(e) => setRequestInfoMessage(e.target.value)}
          placeholder="Describe what additional info is required…"
          className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={handleRequestInfo}
          disabled={requestingInfo}
          className="mt-3 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {requestingInfo ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Requesting…</span>) : 'Request info & mark status'}
        </button>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Approve resolution</h3>
        <input
          type="text"
          value={resolutionCode}
          onChange={(e) => setResolutionCode(e.target.value)}
          placeholder="Enter resolution code"
          className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={handleApprove}
          disabled={approving}
          className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approving ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Approving…</span>) : 'Approve & save code'}
        </button>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Reject case</h3>
        <textarea
          rows={3}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Reason for rejection (optional)"
          className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => setConfirmReject(true)}
          disabled={rejecting}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rejecting ? (<span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Rejecting…</span>) : 'Reject case'}
        </button>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-800">Danger zone</h3>
        <p className="mt-2 text-sm text-slate-600">
          Permanently delete this case. Optionally remove Cloudinary assets.
        </p>
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-3 rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete permanently
        </button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete case permanently?"
        body="This action cannot be undone. Images will also be removed from Cloudinary."
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmReject}
        title="Reject this case?"
        body="The user will not receive reimbursement. You can include a note for the history."
        confirmLabel="Reject"
        confirmTone="danger"
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}
