import * as Types from './types'
import { getOrderBook, manageOffer, getOpenOrders, deleteOffer, getTradeHistory } from '../../services/networking/horizon'
import { getCurrentAccount } from '../account/selectors'
import { getUserPIN } from '../../db'
import * as encryption from '../../services/security/encryption'

import axios from 'axios'

const POLL_FREQUENCY = 30000
var pollOrderBook

export function fetchStellarOrderBook(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer) {
  return async dispatch => {
    dispatch(fetchStellarOrderBookRequest())
    try {
      clearInterval(pollOrderBook)
      pollOrderBook = setInterval( async function() {
        const { payload, error, errorMessage } = await getOrderBook(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer)
        if (error) {
          return dispatch(fetchStellarOrderBookFailure(errorMessage))
        }
        return dispatch(fetchStellarOrderBookSuccess(payload))
      }, POLL_FREQUENCY)
      const { payload, error, errorMessage } = await getOrderBook(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer)
      if (error) {
        return dispatch(fetchStellarOrderBookFailure(errorMessage))
      }
      return dispatch(fetchStellarOrderBookSuccess(payload))
    } catch (e) {
      return dispatch(fetchStellarOrderBookFailure(e))
    }
  }
}

export function fetchStellarOrderBookRequest () {
  return {
    type: Types.TRADE_STELLAR_ORDER_BOOK_REQUEST
  }
}

export function fetchStellarOrderBookSuccess (orderbook) {
  return {
    type: Types.TRADE_STELLAR_ORDER_BOOK_SUCCESS,
    payload: { orderbook }
  }
}

export function fetchStellarOrderBookFailure (error) {
  return {
    type: Types.TRADE_STELLAR_ORDER_BOOK_FAILURE,
    payload: error,
    error: true
  }
}

export function makeTradeOffer(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer, amount, price) {
  return async (dispatch, getState) => {
    dispatch(makeTradeOfferRequest())
    //Fetch PIN
    let currentAccount = getCurrentAccount(getState())
    const { pKey: publicKey, sKey: secretKey } = currentAccount
    const { pin } = await getUserPIN()
    const decryptSK = await encryption.decryptText(secretKey, pin)
    try {
      const trade = await manageOffer(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer, amount, price, decryptSK, publicKey)
      dispatch(makeTradeOfferSuccess(trade))
    } catch (e) {
      dispatch(makeTradeOfferFailure(e))
    }
  }
}

export function makeTradeOfferRequest() {
  return {
    type: Types.TRADE_STELLAR_REQUEST
  }
}

export function makeTradeOfferSuccess(trade) {
  return {
    type: Types.TRADE_STELLAR_SUCCESS,
    payload: trade
  }
}

export function makeTradeOfferFailure(error) {
  return {
    type: Types.TRADE_STELLAR_SUCCESS,
    payload: error,
    error: true
  }
}

export function deleteTradeOffer(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer, price, offerId) {
  return async (dispatch, getState) => {
    dispatch(deleteTradeOfferRequest())
    //Fetch PIN
    let currentAccount = getCurrentAccount(getState())
    const { pKey: publicKey, sKey: secretKey } = currentAccount
    const { pin } = await getUserPIN()
    console.log(`Pin: ${pin}`)
    const decryptSK = await encryption.decryptText(secretKey, pin)
    try {
      const trade = await deleteOffer(sellingAsset, sellingAssetIssuer, buyingAsset, buyingAssetIssuer, price, decryptSK, publicKey, offerId)
      dispatch(deleteTradeOfferSuccess(true))
    } catch (e) {
      dispatch(deleteTradeOfferFailure(e))
    }
  }
}

export function deleteTradeOfferRequest() {
  return {
    type: Types.TRADE_STELLAR_DELETE_OFFER_REQUEST
  }
}

export function deleteTradeOfferSuccess(success) {
  return {
    type: Types.TRADE_STELLAR_DELETE_OFFER_SUCCESS,
    payload: success
  }
}

export function deleteTradeOfferFailure(error) {
  return {
    type: Types.TRADE_STELLAR_DELETE_OFFER_FAILURE,
    payload: error,
    error: true
  }
}

export function fetchOpenOrders() {
  return async (dispatch, getState) => {
    dispatch(fetchOpenOrdersRequest())
    try {
      let currentAccount = getCurrentAccount(getState())
      const { pKey } = currentAccount
      const { payload, error, errorMessage } = await getOpenOrders(pKey)
      if (error) {
        return dispatch(fetchOpenOrdersFailure(errorMessage))
      }
      return dispatch(fetchOpenOrdersSuccess(payload))
    } catch (e) {
      return dispatch(fetchOpenOrdersFailure(e))
    }
  }
}

export function fetchOpenOrdersRequest () {
  return {
    type: Types.TRADE_STELLAR_OPEN_ORDERS_REQUEST
  }
}

export function fetchOpenOrdersSuccess (openOrders) {
  return {
    type: Types.TRADE_STELLAR_OPEN_ORDERS_SUCCESS,
    payload: { openOrders }
  }
}

export function fetchOpenOrdersFailure (error) {
  return {
    type: Types.TRADE_STELLAR_OPEN_ORDERS_FAILURE,
    payload: error,
    error: true
  }
}

export function fetchTradeHistory() {
  return async (dispatch, getState) => {
    dispatch(fetchTradeHistoryRequest())
    try {
      let currentAccount = getCurrentAccount(getState())
      const { pKey } = currentAccount
      const { payload, error, errorMessage } = await getTradeHistory(pKey)
      const recordsWithDate = await parseTradeRecords(payload)

      if (error) {
        return dispatch(fetchTradeHistoryFailure(errorMessage))
      }
      return dispatch(fetchTradeHistorySuccess(recordsWithDate))
    } catch (e) {
      return dispatch(fetchTradeHistoryFailure(e))
    }
  }
}

export async function parseTradeRecords(records) {
  var recordsWithDate = []
  await records.map((record, index) => {
      if (record.type === 'trade') {
        const url = record._links.operation.href
        axios.get(url).then( response => {
          var date = response.data.created_at
          recordsWithDate.push({ ...record, date})
        })
      }
  })

  return recordsWithDate
}

export function fetchTradeHistoryRequest () {
  return {
    type: Types.TRADE_STELLAR_HISTORY_REQUEST
  }
}

export function fetchTradeHistorySuccess (history) {
  return {
    type: Types.TRADE_STELLAR_HISTORY_SUCCESS,
    payload: { history }
  }
}

export function fetchTradeHistoryFailure (error) {
  return {
    type: Types.TRADE_STELLAR_HISTORY_FAILURE,
    payload: error,
    error: true
  }
}