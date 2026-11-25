import { Suspense } from "react";
import { InventoryView } from "@/components/inventory/inventory-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InventoryView />
    </Suspense>
  );
}
