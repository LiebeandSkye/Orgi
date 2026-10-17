
export default function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="group flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#203B35] bg-[#0D211B] text-[#55E6B0] transition-all duration-200 group-hover:border-[#55E6B0]/40 group-hover:bg-[#123126]">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#74818D]">
          {label}
        </p>

        <p className="break-words text-sm font-medium leading-6 text-[#E4E9ED]">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}
