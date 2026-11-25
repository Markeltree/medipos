import { Suspense } from "react";
import { PosView } from "@/components/pos/pos-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PosView />
    </Suspense>
  );
}
