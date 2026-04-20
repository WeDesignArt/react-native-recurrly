import React, { createContext, useContext, useState } from "react";
import { HOME_SUBSCRIPTIONS } from "@/constant/data";

interface SubscriptionsContextValue {
  subscriptions: Subscription[];
  addSubscription: (sub: Subscription) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(
  null
);

export function SubscriptionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(HOME_SUBSCRIPTIONS);

  function addSubscription(sub: Subscription) {
    setSubscriptions((prev) => [sub, ...prev]);
  }

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions(): SubscriptionsContextValue {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx)
    throw new Error(
      "useSubscriptions must be used within SubscriptionsProvider"
    );
  return ctx;
}
