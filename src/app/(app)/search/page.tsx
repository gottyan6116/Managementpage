import { PageHeader } from "@/components/shared/page-header";
import { SearchResults } from "@/components/search/search-results";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";

  return (
    <>
      <PageHeader title="検索結果" subtitle={query ? `キーワード: ${query}` : undefined} />
      <SearchResults q={query} />
    </>
  );
}
