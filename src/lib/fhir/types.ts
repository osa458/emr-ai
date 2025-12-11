export interface FhirClientConfig {
  baseUrl: string
  accessToken?: string
}

export interface FhirBundle<T> {
  resourceType: 'Bundle'
  type: string
  total?: number
  entry?: Array<{
    resource: T
    fullUrl?: string
  }>
}

export interface FhirResource {
  resourceType: string
  id?: string
}
