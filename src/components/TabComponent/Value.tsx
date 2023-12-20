const Value = () => {
  return (
    <div className="value">
      <div>Formula</div>
      <textarea className="editor"/>
      <div>Value</div>
      <textarea className="editor"/>
      <div className="flex justify-between">
        <button className="apply-filtered mt-3">Apply single</button>
        <button className="apply-filtered mt-3">Apply filtered</button>
      </div>
    </div>
  )
}

export default Value