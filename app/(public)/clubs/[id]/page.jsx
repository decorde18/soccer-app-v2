"use client";
import { use } from "react";
import ClubPage from "./ClubPage";

function page({ params, searchParams }) {
  const { id } = use(params);
  const resolvedSearchParams = use(searchParams);

  return <ClubPage id={id} searchParams={resolvedSearchParams} />;
}

export default page;
