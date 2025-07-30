<script setup>
import { ref } from 'vue';
import PhaserGame from './PhaserGame.vue';

const phaserRef = ref();
</script>

<template>
    <PhaserGame ref="phaserRef"/>
</template>