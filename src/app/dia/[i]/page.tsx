import { DayView } from "@/components/DayView";
export default async function Page({ params }: { params: Promise<{ i: string }> }) { const { i } = await params; return <DayView index={Math.min(6, Math.max(0, +i || 0))} />; }
