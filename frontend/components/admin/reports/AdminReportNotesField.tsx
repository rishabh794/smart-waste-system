interface AdminReportNotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function AdminReportNotesField({
  value,
  onChange,
  disabled = false,
}: AdminReportNotesFieldProps) {
  return (
    <div className="rounded-xl border border-[#e6efe9] bg-[#fcfffd] p-3">
      <label className="mb-1 block text-xs font-semibold text-[#21412f]">Admin Notes</label>
      <p className="mb-2 text-xs text-[#6a7d72]">
        Visible to the citizen when you add resolution context.
      </p>
      <textarea
        className="input-clean min-h-24 resize-y"
        placeholder="Add context for the citizen or internal team."
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
