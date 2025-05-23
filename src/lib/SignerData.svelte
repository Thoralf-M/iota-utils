<script lang="ts" context="module">
    import type { Wallet, WalletAccount } from '@iota/wallet-standard';
    import { writable, type Writable } from 'svelte/store';

    export let iota_wallets: Writable<Wallet[]> = writable([]);
    export let iota_accounts: Writable<WalletAccount[]> = writable([]);
    export let activeAddress: Writable<string> = writable('0x');
</script>
