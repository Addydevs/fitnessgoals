import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
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

const MONTHLY_PRODUCT_ID = process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY || 'com.addyde.capturefit.pro.monthly'
const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY || ''
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY || ''
const RC_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID || 'pro'

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [products, setProducts] = useState<IAPProduct[]>([])
  const [purchasing, setPurchasing] = useState(false)
  const [latestPurchase, setLatestPurchase] = useState<PurchaseInfo | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const RCRef = useRef<any | null>(null)

  const monthly = useMemo(() => products.find(p => p.productId === MONTHLY_PRODUCT_ID), [products])

  const validateWithServer = useCallback(async (info: Partial<PurchaseInfo>) => {
    try {
      if (!info || !info.productId) return false
      if (!info.receipt && !info.purchaseToken) return false
      const payload: any = { platform: Platform.OS, productId: info.productId, receipt: info.receipt || null, purchaseToken: info.purchaseToken || null }
      const { data, error } = await supabase.functions.invoke('validate-subscription', { body: payload })
      if (error) throw error
      const active = !!data?.active
      setIsSubscribed(active)
      return active
    } catch {
      return false
    }
  }, [])

  const loadCached = useCallback(async () => {
    try {
      const [pid, receipt] = await Promise.all([AsyncStorage.getItem(AS_KEY_PRODUCT), AsyncStorage.getItem(AS_KEY_RECEIPT)])
      if (pid && receipt) {
        const info = { productId: pid, receipt, purchaseTime: null }
        setLatestPurchase(info)
        validateWithServer(info).catch(() => {})
      }
    } catch {}
  }, [validateWithServer])

  const init = useCallback(async () => {
    try {
      if (initialized) return
      // Dynamic require so Metro doesn't break if module missing
      try {
        const mod = require('react-native-purchases')
        RCRef.current = mod?.default ?? mod
      } catch {
        RCRef.current = null
      }
      const RC = RCRef.current
      if (!RC) { setInitialized(true); return }

      const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY
      if (!apiKey) { setInitialized(true); return }

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
      } catch {
        if (typeof RC.configure === 'function') {
          await RC.configure({ apiKey })
        } else if (RC?.default && typeof RC.default.configure === 'function') {
          await RC.default.configure({ apiKey })
        }
      }

      // Offerings → monthly package
      try {
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
        }
      } catch {}

      // Entitlements
      try {
        const info = await RC.getCustomerInfo()
        const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
        setIsSubscribed(active)
      } catch {}

      await loadCached()
    } finally {
      setInitialized(true)
    }
  }, [initialized, loadCached])

  const purchaseMonthly = useCallback(async () => {
    if (!MONTHLY_PRODUCT_ID) return
    setPurchasing(true)
    try {
      const RC = RCRef.current
      if (!RC) { setPurchasing(false); return }
      let pkg = products.find(p => p._rcPackage)?._rcPackage
      if (!pkg) {
        try { const o = await RC.getOfferings(); pkg = o?.current?.monthly } catch {}
      }
      const res = pkg ? await RC.purchasePackage(pkg) : await RC.purchaseProduct(MONTHLY_PRODUCT_ID)

      const info = await RC.getCustomerInfo()
      const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
      setIsSubscribed(active)

      try {
        const prodId = res?.productIdentifier || MONTHLY_PRODUCT_ID
        const receipt = res?.transactionIdentifier || 'rc'
        setLatestPurchase({ productId: prodId, purchaseTime: Date.now(), receipt })
        await AsyncStorage.multiSet([[AS_KEY_PRODUCT, prodId], [AS_KEY_RECEIPT, String(receipt)]])
        await validateWithServer({ productId: prodId, receipt: String(receipt) })
      } catch {}
    } catch {
      // ignore
    } finally {
      setPurchasing(false)
    }
  }, [products, validateWithServer])

  const restore = useCallback(async () => {
    try {
      const RC = RCRef.current
      if (!RC) return
      const info = await RC.restorePurchases()
      const active = !!info?.entitlements?.active?.[RC_ENTITLEMENT_ID]
      setIsSubscribed(active)
      if (active) {
        await AsyncStorage.multiSet([[AS_KEY_PRODUCT, MONTHLY_PRODUCT_ID], [AS_KEY_RECEIPT, 'restored']])
      }
    } catch {}
  }, [])

  useEffect(() => {
    init()
  }, [init])

  const value: SubscriptionContextType = useMemo(() => ({ initialized, products, monthly, purchasing, isSubscribed, latestPurchase, init, purchaseMonthly, restore }), [initialized, products, monthly, purchasing, isSubscribed, latestPurchase, init, purchaseMonthly, restore])

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
