<template>
  <div id="app">
    <MessageList />
  </div>
</template>

<script>
import MessageList from './components/MessageList.vue'

export default {
  name: 'App',
  components: {
    MessageList
  },
  provide() {
    return {
      'apollo-client': this.$apollo
    }
  }
}
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