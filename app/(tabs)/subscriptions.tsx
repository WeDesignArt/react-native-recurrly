import { StyleSheet, Text} from 'react-native'
import React from 'react'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);

const subscription = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>subscription</Text>
    </SafeAreaView>
  )
} 

export default subscription

const styles = StyleSheet.create({})