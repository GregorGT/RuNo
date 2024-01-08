import Editor from "../Editor";

const Value = () => {
  return (
    <div className="value">
      <div>Formula</div>
      <Editor editorName="VALUE_FORMULA" />
      <div>Value</div>
      <Editor editorName="VALUE" />
      <div className="flex justify-between">
        <button className="apply-filtered mt-3">Apply single</button>
        <button className="apply-filtered mt-3">Apply filtered</button>
      </div>
    </div>
  );
};

export default Value;
