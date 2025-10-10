import GameMenuPage from "./GameMenuPage";

export default async function Page({ params }) {
  const resolvedParams = await params;
  return <GameMenuPage gameId={resolvedParams.id} />;
}
