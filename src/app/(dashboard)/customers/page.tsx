import { Suspense } from "react";
import { CustomersView } from "@/components/customers/customers-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomersView />
    </Suspense>
  );
}
