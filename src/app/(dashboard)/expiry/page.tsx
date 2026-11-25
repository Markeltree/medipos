import { Suspense } from "react";
import { ExpiryView } from "@/components/expiry/expiry-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ExpiryView />
    </Suspense>
  );
}
