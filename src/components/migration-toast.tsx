"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface MigrationToastProps {
  count: number | undefined;
}

export default function MigrationToast({ count }: MigrationToastProps) {
  useEffect(() => {
    if (count && count > 0) {
      toast.success(`Successfully migrated ${count} bingo${count !== 1 ? "s" : ""}!`, {
        duration: 5000,
      });
    }
  }, [count]);

  return null;
}
