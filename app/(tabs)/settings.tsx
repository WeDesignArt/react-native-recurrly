import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import images from "@/constant/images";

const SafeAreaView = styled(RNSafeAreaView);

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.fullName ?? user?.firstName ?? "Account";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatar;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      {/* Page title */}
      <Text className="mb-6 text-2xl font-sans-bold text-primary">
        Settings
      </Text>

      {/* Account card */}
      <View className="rounded-3xl border border-border bg-card p-5 gap-4">
        {/* User info row */}
        <View className="flex-row items-center gap-4">
          <Image
            source={avatarSource}
            className="size-16 rounded-full"
          />
          <View className="flex-1 min-w-0">
            <Text
              className="text-lg font-sans-bold text-primary"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {!!email && (
              <Text
                className="text-sm font-sans-medium text-muted-foreground"
                numberOfLines={1}
              >
                {email}
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-border" />

        {/* Sign-out button */}
        <Pressable
          className="items-center rounded-2xl bg-primary py-4"
          style={({ pressed }) => ({ opacity: pressed || signingOut ? 0.6 : 1 })}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text className="text-base font-sans-bold text-background">
            {signingOut ? "Signing out…" : "Sign out"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
