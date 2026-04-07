import { View, Text } from 'react-native'
import React from 'react'

import { Link, useLocalSearchParams } from 'expo-router'

const SubscriptionDetails = () => {
 const { id } = useLocalSearchParams<{id: string}>();
  return (
    <View>
      <Text>Subscription Details: {id}</Text>
      <Link href="/" className="mt-4 rounded bg-primary text-white p-3">
        <Text>Back to Home</Text>
      </Link>
    </View>   
  )
}

export default SubscriptionDetails