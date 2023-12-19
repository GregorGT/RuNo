const Header = () => {
  const data = [
    {key: 1, content: "Header of a text file" },
    {key: 2, content: "Formating" },
    {key: 3, content: "[Entry][]{*}[Name]{Name = Entry Name}:[TextField]{Max etc}" },
    {key: 4, content: "[Date][]{*}[modified]{Name = Date modified}:[Date{*,Ranges = Allow, Format = MM/DD/YY}]" },
    {key: 5, content: "[***]{R}:[Entry break]" },
    {key: 6, content: "[Total]:[Formula]" },
    {key: 7, content: "" },
    {key: 8, content: "Sorting" },
    {key: 9, content: "Filters" },
  ]
  return (
    <div className="header-tab">
      <div className="code-snippet">
        <div className="sidebar">
          {data.map(data =>
            <div>{data.key}</div>
          )}
        </div>
        <div className="code">
          {data.map(data =>
            <div>## {data.content}</div>
          )}
        </div>
      </div>
      <button className="add-btn mt-3">Apply</button>
    </div>
  )
}

export default Header