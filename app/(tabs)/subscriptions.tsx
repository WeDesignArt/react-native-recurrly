import { Ionicons } from "@expo/vector-icons";
import { styled } from "nativewind";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "@/components/SubscriptionCard";
import { colors } from "@/constant/theme";
import { useSubscriptions } from "@/context/subscriptions";

const SafeAreaView = styled(RNSafeAreaView);

export default function Subscriptions() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { subscriptions } = useSubscriptions();

  // filter by name, category, or plan — case-insensitive
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.plan?.toLowerCase().includes(q)
    );
  }, [search, subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/*
        KeyboardAvoidingView wraps the FlatList so the list shrinks (iOS) or
        shifts (Android) when the keyboard opens, keeping content visible.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          extraData={expandedId}
          // ── sticky header: heading + search bar ──────────────────────────
          ListHeaderComponent={
            <>
              {/* Page heading — dark text */}
              <Text className="mb-5 mt-2 text-2xl font-sans-bold text-primary">
                Subscriptions
              </Text>

              {/* Search bar */}
              <View className="mb-5 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4">
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <TextInput
                  value={search}
                  onChangeText={(v) => {
                    setSearch(v);
                    // collapse any open card so stale expanded state doesn't linger
                    setExpandedId(null);
                  }}
                  placeholder="Search subscriptions…"
                  // dark placeholder + dark typed text to match requirement
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 16,
                    fontFamily: "sans-medium",
                    color: colors.primary,
                  }}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            </>
          }
          // ── subscription cards ────────────────────────────────────────────
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() =>
                setExpandedId((curr) => (curr === item.id ? null : item.id))
              }
            />
          )}
          ItemSeparatorComponent={() => <View className="h-4" />}
          // ── empty state ───────────────────────────────────────────────────
          ListEmptyComponent={
            <Text className="home-empty-state">
              No results for "{search}"
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
