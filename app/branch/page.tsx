import React from "react";
import BranchClient from "./_components/BranchClient";
import { getBranches } from "@/api/branch/actions";

export default async function BranchPage() {
  const branches = await getBranches();

  return <BranchClient initialData={branches} />;
}
