import React, { Suspense } from "react";
import OfferDetailsInner from "./page";

export default function OfferDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfferDetailsInner />
    </Suspense>
  );
}
