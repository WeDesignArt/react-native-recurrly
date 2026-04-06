import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignUp = () => {
  return (
   <View className='bg-background flex-1'>
      <Text>SignUp</Text>
      <Link href="/(auth)/sign-in">Sign Up</Link>
    </View>
  )
}

export default SignUp

const styles = StyleSheet.create({})