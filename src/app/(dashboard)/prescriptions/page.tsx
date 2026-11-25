import { Suspense } from "react";
import { PrescriptionsView } from "@/components/prescriptions/prescriptions-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrescriptionsView />
    </Suspense>
  );
}
