import { Suspense } from "react";
import { ProductsView } from "@/components/products/products-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProductsView />
    </Suspense>
  );
}
