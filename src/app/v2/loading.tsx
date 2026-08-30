export default function V2Loading() {
  return (
    <div className="mx-auto max-w-[1480px] animate-pulse space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-64 rounded bg-[#e4e8e4]" />
      <div className="h-4 w-full max-w-xl rounded bg-[#ecefec]" />
      <div className="grid gap-4 pt-6 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 rounded-md bg-[#e7ebe7]" />)}
      </div>
    </div>
  );
}
