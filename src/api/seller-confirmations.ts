/**
 * Seller Confirmation API
 *
 * Public endpoints — no JWT Authorization header is sent.
 * All requests are authenticated via the signed magic link token embedded
 * in the URL / request body.
 *
 * These functions are used exclusively by SellerConfirmationPage (the public
 * page opened when a seller clicks their magic link email).
 */
import { API_BASE_URL, API_ROUTES } from '../config'
import type {
  SellerConfirmationDataResponse,
  SellerConfirmationSubmitRequest,
  SellerConfirmationSubmitResponse,
} from '../types/api'

/**
 * Fetch PO data for the seller confirmation form.
 *
 * Validates the token server-side and returns the PO header + all line items
 * pre-populated with original ordered values (and any previously saved
 * confirmed values if the seller is re-opening the link).
 *
 * @param poId      - Purchase order ID (from the URL path)
 * @param token     - Signed magic link token (from ?token= query param)
 * @param actionKey - Action the link was generated for (from ?action_key=)
 */
export async function getSellerConfirmationData(
  poId: number,
  token: string,
  actionKey: string
): Promise<SellerConfirmationDataResponse> {
  const url = new URL(`${API_BASE_URL}${API_ROUTES.SELLER_CONFIRMATION(poId)}`)
  url.searchParams.set('token', token)
  url.searchParams.set('action_key', actionKey)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    // No Authorization header — public endpoint
  })

  const body = await response.json()

  if (!response.ok) {
    // Surface the server's error message so the page can display it
    const message = body?.error || 'Failed to load order details'
    throw new Error(message)
  }

  return body as SellerConfirmationDataResponse
}

/**
 * Submit the seller's confirmation (or rejection).
 *
 * Sends the signed token + all line item confirmed values to the backend.
 * The backend determines whether this is a full confirm or partial confirm
 * based on whether any quantity / price differs from the original.
 *
 * @param poId    - Purchase order ID
 * @param payload - Token + action_key + comment + line_items array
 */
export async function submitSellerConfirmation(
  poId: number,
  payload: SellerConfirmationSubmitRequest
): Promise<SellerConfirmationSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.SELLER_CONFIRMATION(poId)}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // No Authorization header — public endpoint
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body?.error || 'Submission failed'
    throw new Error(message)
  }

  return body as SellerConfirmationSubmitResponse
}
