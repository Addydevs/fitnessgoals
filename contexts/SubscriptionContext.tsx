import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Alert } from 'react-native'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/utils/supabase'

// Minimal product shape to keep UI compatibility
type IAPProduct = { productId: string; price?: string; title?: string; _rcPackage?: any }

type PurchaseInfo = { productId: string; purchaseTime: number | null; orderId?: string | null; receipt?: string | null; purchaseToken?: string | null }

interface SubscriptionContextType {
  initialized: boolean
  products: IAPProduct[]
  monthly?: IAPProduct
  purchasing: boolean
  isSubscribed: boolean
  latestPurchase?: PurchaseInfo | null
  init: () => Promise<void>
  purchaseMonthly: () => Promise<void>
  restore: () => Promise<void>
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const AS_KEY_RECEIPT = 'iap.latestReceipt'
const AS_KEY_PRODUCT = 'iap.lastProductId'

const getExtra = () => (Constants?.expoConfig as any)?.extra || {}
const EX = getExtra()
const DEBUG = (process.env.EXPO_PUBLIC_IAP_DEBUG === 'true') || (EX.EXPO_PUBLIC_IAP_DEBUG === 'true')
const dlog = (...args: any[]) => { if (DEBUG) console.log('[IAP]', ...args) }
const IS_EXPO_GO = (Constants as any)?.appOwnership === 'expo'
const PURCHASE_TIMEOUT_MS = 20000
const MONTHLY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY || EX.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY || 'om.capturefit.monthly_premium'
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY || EX.EXPO_PUBLIC_RC_IOS_KEY || ''
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || EX.EXPO_PUBLIC_RC_ANDROID_KEY || ''
const RC_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || EX.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'pro'

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [products, setProducts] = useState<IAPProduct[]>([])
  const [purchasing, setPurchasing] = useState(false)
  const [latestPurchase, setLatestPurchase] = useState<PurchaseInfo | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const RCRef = useRef<any | null>(null)
  const inFlightRef = useRef(false)

  const monthly = useMemo(() => products.find(p => p.productId === MONTHLY_PRODUCT_ID), [products])

  const validateWithServer = useCallback(async (info: Partial<PurchaseInfo>) => {
    try {
      if (!info || !info.productId) return false
      if (!info.receipt && !info.purchaseToken) return false
      dlog('validateWithServer payload', { platform: Platform.OS, productId: info.productId, hasReceipt: !!info.receipt, hasToken: !!info.purchaseToken })
      const payload: any = { platform: Platform.OS, productId: info.productId, receipt: info.receipt || null, purchaseToken: info.purchaseToken || null }
      const { data, error } = await supabase.functions.invoke('validate-subscription', { body: payload })
      dlog('validateWithServer result', { data, error })
      if (error) throw error
      const active = !!data?.active
      setIsSubscribed(active)
      return active
    } catch {
      dlog('validateWithServer failed')
      return false
    }
  }, [])

  const loadCached = useCallback(async () => {
    try {
      const [pid, receipt] = await Promise.all([AsyncStorage.getItem(AS_KEY_PRODUCT), AsyncStorage.getItem(AS_KEY_RECEIPT)])
      dlog('loadCached', { pid, hasReceipt: !!receipt })
      if (pid && receipt) {
        const info = { productId: pid, receipt, purchaseTime: null }
        setLatestPurchase(info)
        validateWithServer(info).catch(() => {})
      }
    } catch {}
  }, [validateWithServer])

  const init = useCallback(async () => {
    try {
      dlog('init start', { platform: Platform.OS, productFallback: MONTHLY_PRODUCT_ID, entitlement: RC_ENTITLEMENT_ID, rcIOS: !!RC_IOS_KEY, rcAndroid: !!RC_ANDROID_KEY })
      if (initialized) return
      if (IS_EXPO_GO) {
        dlog('Expo Go detected; skipping Purchases.configure. Use a Dev Build to test IAP.')
        setInitialized(true)
        return
      }
      // Dynamic require so Metro doesn't break if module missing
      try {
        const mod = require('react-native-purchases')
        RCRef.current = mod?.default ?? mod
        dlog('react-native-purchases loaded')
      } catch {
        RCRef.current = null
        dlog('react-native-purchases not available')
      }
      const RC = RCRef.current
      if (!RC) { setInitialized(true); return }

      const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY
      if (!apiKey) {
        // No API key at runtime → purchases won't function
        setInitialized(true)
        dlog('missing apiKey for platform')
        return
      }

      try {
        const { data } = await supabase.auth.getUser()
        const appUserID = data?.user?.id || undefined
        if (typeof RC.configure === 'function') {
          await RC.configure({ apiKey, appUserID })
        } else if (RC?.default && typeof RC.default.configure === 'function') {
          await RC.default.configure({ apiKey, appUserID })
        } else {
          throw new Error('Purchases.configure not available')
        }
        dlog('Purchases.configure ok', { appUserID: !!appUserID })
      } catch {
        if (typeof RC.configure === 'function') {
          await RC.configure({ apiKey })
        } else if (RC?.default && typeof RC.default.configure === 'function') {
          await RC.default.configure({ apiKey })
        }
        dlog('Purchases.configure fallback ok')
      }

      // Offerings → monthly package
      try {
        if (DEBUG && typeof RC.setLogLevel === 'function') {
          try { RC.setLogLevel('debug') } catch {}
        }
        const offerings = await RC.getOfferings()
        const current = offerings?.current
        let monthlyPkg: any = current?.monthly
        if (!monthlyPkg && current?.availablePackages?.length) {
          monthlyPkg = current.availablePackages.find((p: any) => (p?.packageType || '').toString().toLowerCase() === 'monthly')
        }
        if (monthlyPkg) {
          const prod = monthlyPkg.product || monthlyPkg.storeProduct || {}
          const priceString = prod.priceString || prod.localizedPriceString || ''
          const productId = prod.identifier || prod.productIdentifier || prod.sku || MONTHLY_PRODUCT_ID
          setProducts([{ productId, price: priceString, title: prod.title, _rcPackage: monthlyPkg }])
          dlog('offerings resolved', { productId, priceString })
        } else {
          dlog('no monthly package found in offerings')
        }
      } catch {}

      // Entitlements
      try {
        const info = await RC.getCustomerInfo()
        const entKeys = Object.keys(info?.entitlements?.active || {})
        const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
        dlog('customerInfo', { entKeys, active })
        setIsSubscribed(active)
      } catch {}

      // Manual premium bypass via profiles table
      try {
        const { data: userRes } = await supabase.auth.getUser()
        const uid = userRes?.user?.id
        if (uid) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('premium_access')
            .eq('id', uid)
            .single()
          const manualPremium = !!((prof as any)?.premium_access === true)
          if (manualPremium) {
            dlog('manual premium override from profiles table')
            setIsSubscribed(true)
          }
        }
      } catch {}

      await loadCached()
    } finally {
      setInitialized(true)
      dlog('init finished')
    }
  }, [initialized, loadCached])

  const purchaseMonthly = useCallback(async () => {
    if (!MONTHLY_PRODUCT_ID) return
    if (inFlightRef.current) { dlog('purchaseMonthly: already in progress'); return }
    inFlightRef.current = true
    setPurchasing(true)
    try {
      const RC = RCRef.current
      if (!RC) {
        setPurchasing(false)
        Alert.alert('Purchases unavailable', 'In‑app purchases are not available on this build.')
        dlog('purchaseMonthly: RC missing')
        return
      }
      if (!RC_IOS_KEY && Platform.OS === 'ios') {
        setPurchasing(false)
        Alert.alert('Purchases misconfigured', 'Missing RevenueCat iOS API key. Please rebuild with the correct environment variables.')
        dlog('purchaseMonthly: iOS key missing')
        return
      }
      let pkg = products.find(p => p._rcPackage)?._rcPackage
      if (!pkg) {
        try { const o = await RC.getOfferings(); pkg = o?.current?.monthly } catch {}
      }
      dlog('purchaseMonthly begin', { hasPkg: !!pkg, MONTHLY_PRODUCT_ID })
      const call = pkg ? RC.purchasePackage(pkg) : RC.purchaseProduct(MONTHLY_PRODUCT_ID)
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timed out waiting for App Store response')), PURCHASE_TIMEOUT_MS))
      const res = await Promise.race([call, timeout]) as any
      dlog('purchaseMonthly result', { productIdentifier: res?.productIdentifier, transactionIdentifier: res?.transactionIdentifier })

      const info = await RC.getCustomerInfo()
      const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
      dlog('customerInfo after purchase', { active })
      setIsSubscribed(active)

      try {
        const prodId = res?.productIdentifier || MONTHLY_PRODUCT_ID
        const receipt = res?.transactionIdentifier || 'rc'
        setLatestPurchase({ productId: prodId, purchaseTime: Date.now(), receipt })
        await AsyncStorage.multiSet([[AS_KEY_PRODUCT, prodId], [AS_KEY_RECEIPT, String(receipt)]])
        dlog('saved latest purchase', { prodId, hasReceipt: !!receipt })
        await validateWithServer({ productId: prodId, receipt: String(receipt) })
      } catch {}
    } catch (e: any) {
      const code = e?.code || e?.userInfo?.code
      const userCancelled = e?.userCancelled === true || String(code).toLowerCase().includes('cancel')
      if (userCancelled) {
        dlog('purchaseMonthly cancelled by user')
      } else {
        const msg = e?.message || 'Purchase failed. Please try again.'
        dlog('purchaseMonthly error', { code, message: e?.message })
        try { Alert.alert('Purchase failed', String(msg)) } catch {}
      }
    } finally {
      setPurchasing(false)
      inFlightRef.current = false
    }
  }, [products, validateWithServer])

  const restore = useCallback(async () => {
    try {
      const RC = RCRef.current
      if (!RC) return
      const info = await RC.restorePurchases()
      const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
      dlog('restore result', { active })
      setIsSubscribed(active)
      if (active) {
        await AsyncStorage.multiSet([[AS_KEY_PRODUCT, MONTHLY_PRODUCT_ID], [AS_KEY_RECEIPT, 'restored']])
        dlog('restore saved tokens')
      }
    } catch {}
  }, [])

  useEffect(() => {
    init()
  }, [init])

  const value: SubscriptionContextType = useMemo(() => ({ initialized, products, monthly, purchasing, isSubscribed, latestPurchase, init, purchaseMonthly, restore }), [initialized, products, monthly, purchasing, isSubscribed, latestPurchase, init, purchaseMonthly, restore])

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
