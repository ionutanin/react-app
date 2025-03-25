import React, {createContext, useContext} from 'react'

import localData from '../data/network.json'
import {NetworkData} from '../data/network.interface.ts';

type AppContextType = {
  data: NetworkData | null
}

const AppContext = createContext<AppContextType>({
  data: null,
})

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data: NetworkData = localData as NetworkData

  const regions = [...new Set(data.vpcs.map(v => v.region))]
  console.log('Regions:', regions)

  return (
    <AppContext.Provider value={{ data }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
