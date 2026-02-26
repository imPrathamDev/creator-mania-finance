"use client";

import { Dot } from "lucide-react";
import moment from "moment";
import React, { useState } from "react";

const Header = () => {
  const [date] = useState(new Date());
  return (
    <div className="flex items-center justify-between px-6">
      <div className="font-semibold -space-y-0.5">
        <div className="flex items-center gap-1">
          <h3 className="text-3xl">
            {moment(date).format("dddd")} {moment(date).date()}{" "}
          </h3>
          <Dot className="size-10 text-red-500 stroke-3" />
        </div>
        <p className="text-xl text-muted-foreground">
          {moment(date).format("MMMM")}
        </p>
      </div>
    </div>
  );
};

export default Header;
