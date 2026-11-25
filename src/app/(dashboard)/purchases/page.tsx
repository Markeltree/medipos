import { Suspense } from "react";
import { PurchasesView } from "@/components/purchases/purchases-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PurchasesView />
    </Suspense>
  );
}
