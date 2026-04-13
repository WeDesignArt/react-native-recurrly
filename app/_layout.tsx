import { SplashScreen, Stack } from "expo-router";
import "../global.css";
import {useFonts} from "expo-font"
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
   const [fontsloaded] = useFonts({
      'sans-regular': require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
      'sans-bold': require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
      'sans-light': require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
      'sans-medium': require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
      'sans-semibold': require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
      'sans-extrabold': require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
      
   })

   useEffect(() => {
    if(fontsloaded){
      SplashScreen.hideAsync();
    }
   }, [fontsloaded])

   if (!fontsloaded) {
    return null;
   }

   return <Stack screenOptions={{ headerShown: false }} />;
}
