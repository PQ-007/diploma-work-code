import { File, Folder, FolderOpen } from "lucide-react";

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

function TreeNode({ node, level = 0 }: { node: FileTreeNode; level?: number }) {
  const isFolder = node.type === "folder";

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded-md
                   hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {isFolder ? (
          <Folder className="w-4 h-4 text-primary" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground" />
        )}
        <span
          className={`text-sm font-mono ${
            isFolder ? "font-semibold text-foreground" : "text-muted-foreground"
          }`}
        >
          {node.name}
        </span>
      </div>

      {isFolder && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree }: { tree: FileTreeNode[] }) {
  return (
    <div className="my-8 rounded-xl border border-border bg-card p-4 shadow-sm overflow-x-auto">
      {tree.map((node, index) => (
        <TreeNode key={index} node={node} />
      ))}
    </div>
  );
}
