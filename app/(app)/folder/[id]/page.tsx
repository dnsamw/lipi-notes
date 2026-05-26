import { FileExplorer } from "@/components/explorer/FileExplorer";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="h-dvh flex flex-col">
      <FileExplorer initialFolderId={id} />
    </div>
  );
}
