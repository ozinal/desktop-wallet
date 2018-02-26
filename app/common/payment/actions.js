import { sendPayment, getPaymentOperationList } from '../../services/networking/horizon'
import { fetchAccountDetails, setCurrentAccount } from '../account/actions'
import { getCurrentAccount, getAccountByPublicKey } from '../account/selectors'
import * as Types from './types'

export function sendPaymentToAddress ({ destination, amount }) {
  return async (dispatch, getState) => {
    let currentAccount = getCurrentAccount(getState())

    const {
      pKey: publicKey,
      sKey: secretKey,
      sequence
    } = currentAccount

    dispatch(paymentSendRequest())

    try {
      // 1. Start the payment process
      await sendPayment({
        publicKey,
        secretKey,
        sequence,
        destinationId: destination,
        amount
      })

      // 2. Fetch the account details to get the updated balance
      await dispatch(fetchAccountDetails({ publicKey, secretKey }))

      // 3. Update the current account (as this would not be automatically done otherwise)
      currentAccount = getAccountByPublicKey(getState(), publicKey)
      await dispatch(setCurrentAccount(currentAccount))

      // 4. And we're done!
      return dispatch(paymentSendSuccess({
        destination,
        amount
      }))
    } catch (e) {
      return dispatch(paymentSendFailure(e))
    }
  }
}

export function fetchPaymentOperationList() {
  return async (dispatch, getState) => {
    let currentAccount = getCurrentAccount(getState())

    const {
      pKey: publicKey,
    } = currentAccount

    dispatch(paymentOperationListRequest())

    try {
      await getPaymentOperationList({
        publicKey
      })

      return dispatch(paymentOperationListSuccess({
        destination,
        amount
      }))
    } catch (e) {
      return dispatch(paymentOperationListFailure(e))
    }
  }
}

export function paymentSendRequest () {
  return {
    type: Types.PAYMENT_SEND_REQUEST
  }
}

export function paymentSendSuccess (payment) {
  return {
    type: Types.PAYMENT_SEND_SUCCESS,
    payload: { payment }
  }
}

export function paymentSendFailure (error) {
  return {
    type: Types.PAYMENT_SEND_FAILURE,
    payload: error,
    error: true
  }
}

export function paymentOperationListRequest () {
  return {
    type: Types.PAYMENT_LIST_REQUEST
  }
}

export function paymentOperationListSuccess (list) {
  return {
    type: Types.PAYMENT_LIST_SUCCESS,
    payload: list
  }
}

export function paymentOperationListFailure (error) {
  return {
    type: Types.PAYMENT_LIST_FAILURE,
    payload: error,
    error: true
  }
}

