import { Button, Checkbox } from 'antd'
import './Components.scss'

export default function Entries() {
  return (
    <div className='entries'>
      <div className='entries-header'>
        <Checkbox />
        <span>ENTRIES</span>
        <Button className='add'>Add an entry</Button>
      </div>
    </div>
  )
}