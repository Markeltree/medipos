import { Suspense } from "react";
import { CategoriesView } from "@/components/categories/categories-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoriesView />
    </Suspense>
  );
}
