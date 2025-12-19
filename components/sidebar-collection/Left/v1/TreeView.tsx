import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { TreeProps } from "antd";
import { Tree } from "antd";
import { Edit, FileText, FolderPlus, Trash2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { generateTreeDataBySectionPage, getFileIcon } from "./HelperMethods";
import { EnhancedTreeNode, TreeViewProps } from "../type";

export const TreeView: React.FC<TreeViewProps> = ({ activeSection = "/" }) => {
  // Generate tree data based on active section
  const initialTreeData = useMemo(
    () => generateTreeDataBySectionPage(activeSection),
    [activeSection]
  );

  const [treeData, setTreeData] = useState<EnhancedTreeNode[]>(initialTreeData);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [dragOverKey, setDragOverKey] = useState<string>("");

  // Update tree data when active section changes
  React.useEffect(() => {
    setTreeData(generateTreeDataBySectionPage(activeSection));
    setExpandedKeys([]); // Reset expanded state when section changes
    setSelectedKeys([]); // Reset selection when section changes
  }, [activeSection]);

  // Helper function to find a node by key
  const findNodeByKey = useCallback(
    (nodes: EnhancedTreeNode[], key: string): EnhancedTreeNode | null => {
      for (const node of nodes) {
        if (node.key === key) {
          return node;
        }
        if (node.children) {
          const found = findNodeByKey(node.children, key);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // Generate unique key for new items
  const generateUniqueKey = (): string => {
    return `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add new folder function
  const addNewFolder = useCallback(
    (parentKey?: string) => {
      console.log("addNewFolder called with parentKey:", parentKey);

      const newFolder: EnhancedTreeNode = {
        key: generateUniqueKey(),
        title: "New Folder",
        type: "folder",
        children: [],
      };

      const updateTreeData = (
        nodes: EnhancedTreeNode[]
      ): EnhancedTreeNode[] => {
        if (!parentKey) {
          // Add to root level
          return [...nodes, newFolder];
        }

        return nodes.map((node) => {
          if (node.key === parentKey) {
            return {
              ...node,
              children: [...(node.children || []), newFolder],
            };
          } else if (node.children) {
            return {
              ...node,
              children: updateTreeData(node.children),
            };
          }
          return node;
        });
      };

      const newTreeData = updateTreeData(treeData);
      console.log("Updated tree data:", newTreeData);
      setTreeData(newTreeData);

      // Expand parent if it exists
      if (parentKey && !expandedKeys.includes(parentKey)) {
        setExpandedKeys([...expandedKeys, parentKey]);
      }
    },
    [treeData, expandedKeys]
  );

  // Add new file function
  const addNewFile = useCallback(
    (parentKey?: string) => {
      console.log("addNewFile called with parentKey:", parentKey);

      const getFileTypeForSection = (
        section: string
      ): EnhancedTreeNode["fileType"] => {
        switch (section) {
          case "/blog":
            return "text";
          case "/project":
            return "code";
          case "/flashcard":
            return "text";
          case "/competition":
            return "code";
          case "/showcase":
            return "image";
          case "/store":
            return "other";
          default:
            return "code";
        }
      };

      const newFile: EnhancedTreeNode = {
        key: generateUniqueKey(),
        title: "New File",
        type: "file",
        fileType: getFileTypeForSection(activeSection),
      };

      const updateTreeData = (
        nodes: EnhancedTreeNode[]
      ): EnhancedTreeNode[] => {
        if (!parentKey) {
          // Add to root level
          return [...nodes, newFile];
        }

        return nodes.map((node) => {
          if (node.key === parentKey) {
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          } else if (node.children) {
            return {
              ...node,
              children: updateTreeData(node.children),
            };
          }
          return node;
        });
      };

      const newTreeData = updateTreeData(treeData);
      console.log("Updated tree data:", newTreeData);
      setTreeData(newTreeData);

      // Expand parent if it exists
      if (parentKey && !expandedKeys.includes(parentKey)) {
        setExpandedKeys([...expandedKeys, parentKey]);
      }
    },
    [treeData, expandedKeys, activeSection]
  );

  // Delete item function
  const deleteItem = useCallback(
    (targetKey: string) => {
      // Show confirmation dialog
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      );

      if (!confirmDelete) {
        return;
      }

      const deleteFromTree = (
        nodes: EnhancedTreeNode[]
      ): EnhancedTreeNode[] => {
        return nodes.reduce((acc: EnhancedTreeNode[], node) => {
          if (node.key === targetKey) {
            // Skip this node (delete it)
            return acc;
          }

          if (node.children && node.children.length > 0) {
            // Recursively delete from children
            const updatedChildren = deleteFromTree(node.children);
            acc.push({
              ...node,
              children: updatedChildren,
            });
          } else {
            acc.push(node);
          }

          return acc;
        }, []);
      };

      setTreeData(deleteFromTree(treeData));

      // Remove from expanded keys if it was expanded
      setExpandedKeys(expandedKeys.filter((key) => key !== targetKey));

      // Remove from selected keys if it was selected
      setSelectedKeys(selectedKeys.filter((key) => key !== targetKey));
    },
    [treeData, expandedKeys, selectedKeys]
  );

  // Rename item function
  const renameItem = useCallback(
    (targetKey: string, currentTitle: string) => {
      const newTitle = window.prompt("Enter new name:", currentTitle);

      if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) {
        return;
      }

      const renameInTree = (nodes: EnhancedTreeNode[]): EnhancedTreeNode[] => {
        return nodes.map((node) => {
          if (node.key === targetKey) {
            return {
              ...node,
              title: newTitle.trim(),
            };
          }

          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: renameInTree(node.children),
            };
          }

          return node;
        });
      };

      setTreeData(renameInTree(treeData));
    },
    [treeData]
  );

  // Toggle folder expansion (called when clicking on folder row)
  const toggleFolder = useCallback(
    (key: string, isExpanded: boolean) => {
      if (isExpanded) {
        setExpandedKeys(expandedKeys.filter((k) => k !== key));
      } else {
        setExpandedKeys([...expandedKeys, key]);
      }
    },
    [expandedKeys]
  );

  const onExpand = useCallback((expandedKeys: React.Key[], _info: any) => {
    setExpandedKeys(expandedKeys.map(String));
  }, []);

  const onSelect = useCallback((selectedKeys: React.Key[], _info: any) => {
    setSelectedKeys(selectedKeys.map(String));
  }, []);

  const onDragEnter: TreeProps["onDragEnter"] = useCallback(
    (info: { node: { key: any } }) => {
      const targetNode = findNodeByKey(treeData, String(info.node.key));
      // Only allow drag over folders, not files
      if (targetNode && targetNode.type === "folder") {
        setDragOverKey(String(info.node.key));
      } else {
        setDragOverKey("");
      }
    },
    [treeData, findNodeByKey]
  );

  const onDragLeave = useCallback(() => {
    setDragOverKey("");
  }, []);

  const onDrop: TreeProps["onDrop"] = useCallback(
    (info: {
      node: { key: any; pos: string };
      dragNode: { key: any };
      dropPosition: number;
      dropToGap: any;
    }) => {
      const dropKey = info.node.key;
      const dragKey = info.dragNode.key;
      const dropPos = info.node.pos.split("-");
      const dropPosition =
        info.dropPosition - Number(dropPos[dropPos.length - 1]);

      // Find the target node to check its type
      const targetNode = findNodeByKey(treeData, String(dropKey));

      // Prevent dropping into files - only allow dropping into folders or gaps
      if (!info.dropToGap && targetNode && targetNode.type === "file") {
        console.log("Cannot drop items into files");
        setDragOverKey("");
        return;
      }

      // Prevent dropping a folder into itself or its descendants
      const isDescendant = (
        parentKey: string,
        childKey: string,
        nodes: EnhancedTreeNode[]
      ): boolean => {
        const parent = findNodeByKey(nodes, parentKey);
        if (!parent || !parent.children) return false;

        for (const child of parent.children) {
          if (child.key === childKey) return true;
          if (
            child.children &&
            isDescendant(child.key as string, childKey, nodes)
          ) {
            return true;
          }
        }
        return false;
      };

      if (
        !info.dropToGap &&
        isDescendant(String(dragKey), String(dropKey), treeData)
      ) {
        console.log("Cannot drop a folder into itself or its descendants");
        setDragOverKey("");
        return;
      }

      const loop = (
        data: EnhancedTreeNode[],
        key: React.Key,
        callback: (
          node: EnhancedTreeNode,
          i: number,
          data: EnhancedTreeNode[]
        ) => void
      ) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].key === key) {
            return callback(data[i], i, data);
          }
          if (data[i].children) {
            loop(data[i].children as EnhancedTreeNode[], key, callback);
          }
        }
      };

      const data = [...treeData];
      let dragObj: EnhancedTreeNode;

      loop(data, dragKey, (item, index, arr) => {
        arr.splice(index, 1);
        dragObj = item;
      });

      if (!info.dropToGap) {
        // Dropping into a folder
        loop(data, dropKey, (item) => {
          item.children = item.children || [];
          (item.children as EnhancedTreeNode[]).unshift(dragObj);
        });
      } else {
        // Dropping at the same level (gap between items)
        let ar: EnhancedTreeNode[] = [];
        let i: number;
        loop(data, dropKey, (_item, index, arr) => {
          ar = arr;
          i = index;
        });
        if (dropPosition === -1) {
          ar.splice(i!, 0, dragObj!);
        } else {
          ar.splice(i! + 1, 0, dragObj!);
        }
      }

      setTreeData(data);
      setDragOverKey("");
    },
    [treeData, findNodeByKey]
  );

  // Custom title renderer
  const renderTitle = (node: EnhancedTreeNode) => {
    const isFolder = node.type === "folder";
    const isExpanded = expandedKeys.includes(node.key as string);
    const isSelected = selectedKeys.includes(node.key as string);
    const isDragOver = dragOverKey === node.key;
    const nodeKey = node.key as string;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md group transition-all duration-200 cursor-pointer",
              "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              isSelected &&
                "bg-sidebar-primary/10 text-sidebar-primary font-medium",
              isDragOver && "bg-accent/20 ring-1 ring-accent/50"
            )}
            style={{ maxWidth: "220px" }}
            onClick={(e) => {
              e.stopPropagation();
              if (isFolder) {
                toggleFolder(nodeKey, isExpanded);
              }
            }}
          >
            {/* File/Folder Icon */}
            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {getFileIcon(node.fileType, isFolder, isExpanded)}
            </div>

            {/* Title with strict width constraints */}
            <span
              className=" truncate text-sm flex-1 min-w-0 max-w-[160px]"
              title={node.title as string}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {typeof node.title == "string" && node.title.length > 25
                ? `${(node.title as string).slice(0, 22)}...`
                : node.title}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-12 text-sm">
          {isFolder && (
            <>
              <ContextMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  addNewFile(nodeKey);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  addNewFolder(nodeKey);
                }}
                className="flex items-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              renameItem(nodeKey, node.title as string);
            }}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(nodeKey);
            }}
            className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-300 dark:focus:bg-red-950"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable tree container */}
      <div className="flex-1 py-2 px-2 overflow-y-auto">
        <div className="custom-tree-view">
          <Tree
            blockNode
            draggable={{
              icon: false,
              nodeDraggable: (node) => !node.key.toString().startsWith("root-"),
            }}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={onExpand}
            onSelect={onSelect}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            treeData={treeData}
            titleRender={renderTitle}
            className="!bg-transparent"
            // Make the entire node clickable for folders
            style={
              {
                "--ant-tree-node-hover-bg": "transparent",
                "--ant-tree-node-selected-bg": "transparent",
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
};
