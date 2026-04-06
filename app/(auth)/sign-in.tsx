import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignIn = () => {
  return (
    <View className='bg-background flex-1'>
      <Text>Sign In</Text>
      <Link href="/(auth)/sign-up">Sign Up</Link>
      <Link href="/(tabs)">Home</Link>
    </View>
  )
}

export default SignIn

const styles = StyleSheet.create({})