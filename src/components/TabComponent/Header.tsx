import Editor from "../Editor/Editor";

const Header = () => {
  // const data = [
  //   { key: 1, content: "Header of a text file" },
  //   { key: 2, content: "Formating" },
  //   {
  //     key: 3,
  //     content: "[Entry][]{*}[Name]{Name = Entry Name}:[TextField]{Max etc}",
  //   },
  //   {
  //     key: 4,
  //     content:
  //       "[Date][]{*}[modified]{Name = Date modified}:[Date{*,Ranges = Allow, Format = MM/DD/YY}]",
  //   },
  //   { key: 5, content: "[***]{R}:[Entry break]" },
  //   { key: 6, content: "[Total]:[Formula]" },
  //   { key: 7, content: "" },
  //   { key: 8, content: "Sorting" },
  //   { key: 9, content: "Filters" },
  // ];
  return (
    <div className="header-tab">
      <Editor height={300} showToolbar={false} editorName="HEADER" />
      <button className="add-btn mt-3">Apply</button>
    </div>
  );
};

export default Header;
