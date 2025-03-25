import './App.css'

import {useAppContext} from './contexts/AppContext.tsx'
import NetworkGraph from './components/NetworkGraph.tsx';

function App() {
  const { data } = useAppContext()

  console.log(data);

  return (
    <NetworkGraph />
  )
}

export default App
