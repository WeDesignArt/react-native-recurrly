import { Link } from "expo-router";
import "@/global.css"
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";


const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      
      <Link href="/(auth)/sign-in" className="mt-4 rounded bg-primary text-white p-3">Go to Sign In</Link>
      <Link href="/(auth)/sign-up" className="mt-4 rounded bg-primary text-white p-3">Go to Sign Up</Link>
      <Link href="/subscriptions/spotify" className="mt-4 rounded bg-primary text-white p-3">Go to Spotify Subscriptions</Link>
      <Link 
      href={{
        pathname:"/subscriptions/[id]",
        params:{
          id:"claude"
        }}
        } className="mt-4 rounded bg-primary text-white p-3">Go to Claude Max Subscription</Link>
    </SafeAreaView>
    </View>
  );
}