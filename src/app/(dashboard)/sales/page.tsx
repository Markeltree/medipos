import { Suspense } from "react";
import { SalesView } from "@/components/sales/sales-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SalesView />
    </Suspense>
  );
}
