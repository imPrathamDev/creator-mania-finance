"use client";

import { TransactionsTable } from "@/components/custom/tabsles/TransactionsTable";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";

function TransactionPage() {
  const router = useRouter();
  return (
    <div className="p-6">
      <Suspense>
        <TransactionsTable
          onCreateTransaction={() => {
            router.push("/add-transaction");
          }}
        />
      </Suspense>
    </div>
  );
}

export default TransactionPage;
