import { TransactionsTable } from "@/components/custom/tabsles/TransactionsTable";
import React, { Suspense } from "react";

function TransactionPage() {
  return (
    <div className="p-6">
      <Suspense>
        <TransactionsTable />
      </Suspense>
    </div>
  );
}

export default TransactionPage;
