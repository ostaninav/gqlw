<template>
  <div id="app">
    <MessageList />
  </div>
</template>

<script setup lang="ts">
import MessageList from './components/MessageList.vue'
import { provide } from 'vue'
import apolloClient from './apollo'

// Предоставляем Apollo Client в корневом компоненте
provide('apollo-client', apolloClient)
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 20px;
}
</style>