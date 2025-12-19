export type SmartWellKnownConfiguration = {
  authorization_endpoint?: string
  token_endpoint?: string
  jwks_uri?: string
  grant_types_supported?: string[]
  scopes_supported?: string[]
  response_types_supported?: string[]
  capabilities?: string[]
  [k: string]: unknown
}

function normalizeIssuer(issuer: string) {
  return issuer.replace(/\/$/, '')
}

export async function fetchSmartWellKnown(issuer: string): Promise<SmartWellKnownConfiguration> {
  const iss = normalizeIssuer(issuer)
  const res = await fetch(`${iss}/.well-known/smart-configuration`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SMART discovery failed: ${res.status} ${text}`)
  }

  return (await res.json()) as SmartWellKnownConfiguration
}
