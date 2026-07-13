import { ref } from 'vue'
import { get } from '@/api/http'
import type { AddressResolution, Client, ResolvedClient } from '@/types'

/**
 * Address resolution for the Avior daemons.
 *
 * Every client in the Mongo registry carries several candidate Addresses (LAN, VPN,
 * WAN). At most one answers at any moment, so the live one is found by racing
 * `GET <address>/alive` across all of them and keeping the first that responds.
 *
 * The four pages that did this inline were NOT running the same algorithm, despite
 * looking near-identical. There are two, and both are kept:
 *
 *   resolveClient()      per-client race. index.vue and config.vue need to know which
 *                        address EACH client lives at, and which clients are offline,
 *                        because they render one card / one config per client.
 *
 *   resolveAnyAddress()  global race. jobs.vue and globalconfig.vue flatten every
 *                        address of every client into ONE Promise.any and keep the
 *                        single first responder. They only ever need one reachable
 *                        daemon to talk to, because /jobs, /clients and /fields are
 *                        cluster-wide (all daemons front the same database) -- so any
 *                        live daemon will do, and the fastest one is the best one.
 *
 * Collapsing these into one would have been a regression either way round.
 */

/** Probe a single address. Resolves with the address on success; the rejection value is inert. */
function probe(address: string): Promise<AddressResolution> {
  return new Promise<AddressResolution>((resolve, reject) => {
    get(address + '/alive').then(
      (response) => resolve({ address, response }),
      () => reject({ address: 'none', response: {} }),
    )
  })
}

export function useClientResolution() {
  const loading = ref(false)

  /** The Mongo registry, via Express. Relative path: same origin in dev and prod. */
  function fetchClients(): Promise<Client[]> {
    return get<Client[]>('/api/clients')
  }

  /**
   * Race one client's own addresses.
   *
   * Never rejects. When nothing answers, Reachable is false and Address falls back to
   * Addresses[0] -- which is NOT a real resolve, and callers must not treat it as one.
   */
  async function resolveClient(client: Client): Promise<ResolvedClient> {
    const promises = client.Addresses.map(probe)
    try {
      const resolution = await Promise.any(promises)
      return { HostName: client.Name, Reachable: true, Address: resolution.address }
    } catch {
      return { HostName: client.Name, Reachable: false, Address: client.Addresses[0] }
    }
  }

  /**
   * Race EVERY address of EVERY client and return the single first responder.
   *
   * Rejects with an AggregateError when no daemon at all is reachable; callers surface
   * that as their "no client reachable" state.
   */
  async function resolveAnyAddress(): Promise<AddressResolution> {
    const unresolvedClients = await fetchClients()
    const promises: Promise<AddressResolution>[] = []
    for (const client of unresolvedClients) {
      for (const address of client.Addresses) {
        promises.push(probe(address))
      }
    }
    return await Promise.any(promises)
  }

  return { loading, fetchClients, resolveClient, resolveAnyAddress }
}
