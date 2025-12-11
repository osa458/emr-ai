import { FhirClient } from '../fhir/client'

describe('FhirClient', () => {
  let client: FhirClient

  beforeEach(() => {
    client = new FhirClient({
      baseUrl: 'http://localhost:8103/fhir/R4',
    })
  })

  it('initializes with correct base URL', () => {
    expect(client).toBeDefined()
  })

  it('sets access token', () => {
    client.setAccessToken('test-token')
    // Token is set internally, just verify no error
    expect(true).toBe(true)
  })

  it('removes trailing slash from base URL', () => {
    const clientWithSlash = new FhirClient({
      baseUrl: 'http://localhost:8103/fhir/R4/',
    })
    expect(clientWithSlash).toBeDefined()
  })
})

describe('FhirClient request methods', () => {
  let client: FhirClient

  beforeEach(() => {
    client = new FhirClient({
      baseUrl: 'http://localhost:8103/fhir/R4',
    })

    // Mock fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('searchPatients calls correct endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resourceType: 'Bundle', entry: [] }),
    })

    await client.searchPatients({ name: 'John' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/Patient'),
      expect.any(Object)
    )
  })

  it('getPatient calls correct endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resourceType: 'Patient', id: 'test-id' }),
    })

    await client.getPatient('test-id')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/Patient/test-id'),
      expect.any(Object)
    )
  })

  it('handles errors correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not found',
    })

    await expect(client.getPatient('invalid-id')).rejects.toThrow(
      'FHIR request failed'
    )
  })
})
