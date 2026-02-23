import React from "react";

const AddTransaction = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <div className="grid gap-2 justify-center items-center text-center">
        <span className="text-sm uppercase font-medium text-primary">
          Amount
        </span>
        <div className="flex items-center justify-center text-4xl w-fit">
          <span>₹</span>
          <input
            type="number"
            className="outline-none field-sizing-content font-semibold font-mono"
            placeholder="0000"
          />
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
