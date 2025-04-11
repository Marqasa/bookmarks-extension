/**
 * Represents a bookmark folder structure where keys are folder names and values are subfolders
 */
export type FolderStructure = {
  [folderName: string]: FolderStructure;
};
