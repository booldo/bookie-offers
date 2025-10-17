"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disableDraftMode } from "../app/actions.js";

export function DisableDraftMode() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const disable = () =>
    startTransition(async () => {
      await disableDraftMode();
      router.refresh();
    });

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg">
      {pending ? (
        <span>Disabling draft mode...</span>
      ) : (
        <button
          type="button"
          onClick={disable}
          className="font-semibold hover:underline"
        >
          Exit Preview Mode
        </button>
      )}
    </div>
  );
}
