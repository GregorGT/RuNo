const Value = () => {
  return (
    <div className="value">
      <div>Formula</div>
      <div className="editor">Entry: Sum( Modification Date)</div>
      <div>Value</div>
      <div className="editor">-</div>
      <div className="flex justify-between">
        <button className="apply-single mt-3">Apply single</button>
        <button className="apply-filtered mt-3">Apply filtered</button>
      </div>
    </div>
  )
}

export default Value