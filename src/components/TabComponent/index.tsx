import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Filter from './Filter';
import Sorting from './Sorting';
import Header from './Header';
import Value from './Value';
import '../Components.scss'

export default function TabComponent() {
  const [activeTab, setActiveTab] = useState('home')
  const Contents = [
    {eventKey: 'filter', content: <Filter />},
    {eventKey: 'sorting', content: <Sorting />},
    {eventKey: 'value', content: <Value />},
    {eventKey: 'header', content: <Header />}
  ]

  return (
    <div className='right-side'>
      <div className='top-space' />
      <div className='tab-component'>
        <div className='buttons'>
          <button className={`header-button ${activeTab == 'filter' && 'active'}`} onClick={() => setActiveTab('filter')}>Filter</button>
          <button className={`header-button ${activeTab == 'sorting' && 'active'}`} onClick={() => setActiveTab('sorting')}>Sorting</button>
          <button className={`header-button ${activeTab == 'value' && 'active'}`} onClick={() => setActiveTab('value')}>Value</button>
          <button className={`header-button ${activeTab == 'header' && 'active'}`} onClick={() => setActiveTab('header')}>Header</button>
        </div>
        <Tabs
          activeKey={activeTab}
          defaultActiveKey='home'
          className="mb-3"
        >
          {Contents.map(item => 
            <Tab eventKey={item.eventKey}>
              {item.content}
            </Tab>
            )}
        </Tabs>
      </div>
    </div>
  )
}