import { redirect } from "next/navigation";

interface WorkoutSessionPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { clientId } = await params;
  redirect(`/workout?active=${clientId}`);
}
