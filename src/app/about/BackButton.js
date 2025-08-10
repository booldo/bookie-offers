"use client";

import Image from "next/image";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="focus:outline-none"
      aria-label="Go back"
    >
      <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
    </button>
  );
}
