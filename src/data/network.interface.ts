
export interface VPC {
  vpcId: string
  name: string
  region: string
  accountId: string
}

export interface Asset {
  addressIP: string
  resourceName?: string
  resourceType?: string
}

export interface PortAssetMap {
  [port: string]: {
    assets: Asset[]
  }
}

export interface ProtocolMap {
  TCP?: PortAssetMap
  UDP?: PortAssetMap
}

export interface Baseline {
  PRIVATE_INBOUND: {
    ports: ProtocolMap
  }
  PRIVATE_OUTBOUND: {
    ports: ProtocolMap
  }
}

export interface VPCConnection {
  accountId: string
  vpcId: string
  networkInterfaceId: string
  resourceName: string
  resourceARN: string | null
  isConnectedToThreat: boolean | null
  isRequestingThreatDomain: boolean
  baseline: Baseline
  version: number
}

export interface NetworkData {
  vpcs: VPC[]
  vpcConnections: VPCConnection[]
}
