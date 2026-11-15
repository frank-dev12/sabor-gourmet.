import { LoadingRows } from "@/components/ui/States";

export default function ReservasLoading() {
  return (
    <div className="space-y-6">
      <div className="h-14 w-72 animate-pulse rounded-lg bg-stone-200" />
      <LoadingRows rows={5} />
    </div>
  );
}
