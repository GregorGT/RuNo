import { Checkbox } from 'antd'
import './Components.scss'

interface BoxProps {
  name?: string
  date?: string
}
export default function Box(props: BoxProps) {
  return (
    <div className='item'>
      <Checkbox />
      <div className='box'>
        <span>{props.name}</span>
        <span>{props.date}</span>
        <span>-</span>
        <span>-</span>
      </div>
    </div>
  )
}