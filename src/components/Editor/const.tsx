export const textStyle = [
  {
    value: "Paragraph",
    label: "Paragraph",
    isActive: (editor: any) => editor.isActive("paragraph"),
    onclick: (editor: any) => editor.chain().focus().toggleParagraph().run(),
  },
  {
    value: "heading 1",
    label: "heading 1",
    isActive: (editor: any) => editor.isActive("heading", { level: 1 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    value: "heading 2",
    label: "heading 2",
    isActive: (editor: any) => editor.isActive("heading", { level: 2 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    value: "heading 3",
    label: "heading 3",
    isActive: (editor: any) => editor.isActive("heading", { level: 3 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    value: "heading 4",
    label: "heading 4",
    isActive: (editor: any) => editor.isActive("heading", { level: 4 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    value: "heading 5",
    label: "heading 5",
    isActive: (editor: any) => editor.isActive("heading", { level: 5 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    value: "heading 6",
    label: "heading 6",
    isActive: (editor: any) => editor.isActive("heading", { level: 6 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },
];

export const tableAcions = [
  {
    label: "Add Row Below",
    value: "Add Row Below",
    onClick: (editor: any) => editor.chain().focus().addRowAfter().run(),
  },
  {
    label: "Add Column After",
    value: "Add Column After",
    onClick: (editor: any) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    label: "Delete Row",
    value: "Delete Row",
    onClick: (editor: any) => editor.chain().focus().deleteRow().run(),
  },
  {
    label: "Delete Column",
    value: "Delete Column",
    onClick: (editor: any) => editor.chain().focus().deleteColumn().run(),
  },
  {
    label: "Delete Table",
    value: "Delete Table",
    onClick: (editor: any) => editor.chain().focus().deleteTable().run(),
  },
];
