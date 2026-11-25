import { Suspense } from "react";
import { ReportsView } from "@/components/reports/reports-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportsView />
    </Suspense>
  );
}
