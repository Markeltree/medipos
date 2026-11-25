import { Suspense } from "react";
import { OverviewView } from "@/components/dashboard/overview-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OverviewView />
    </Suspense>
  );
}
