import { Suspense } from "react";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuppliersView />
    </Suspense>
  );
}
