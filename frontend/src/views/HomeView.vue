<template>
    <div class="home">
        <h1>GuessIt!</h1>
        <p>Your ultimate guessing game experience.</p>
    </div>
    <div class="auth-links">
        <router-link to="/auth/register">Join Us</router-link>
        <router-link to="/auth/login">Already have an account? Log in</router-link>
    </div>
</template>
<script setup lang="ts">

</script>

<style scoped>
.home {
    text-align: center;
    margin-top: 50px;
}

.auth-links {
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: 20px;
    margin-top: 30px;
}
</style>