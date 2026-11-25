import { Suspense } from "react";
import { StaffView } from "@/components/staff/staff-view";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StaffView />
    </Suspense>
  );
}
