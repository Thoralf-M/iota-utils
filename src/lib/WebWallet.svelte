<script lang="ts">
    import {
        getWallets,
        isWalletWithRequiredFeatureSet,
    } from "@iota/wallet-standard";
    import {
        iota_wallets,
        iota_accounts,
        activeAddress,
    } from "./WebWalletData.svelte";

    const features = {
        CONNECT: "standard:connect",
        EVENTS: "standard:events",
        SIGN_AND_EXECUTE_TRANSACTION: "iota:signAndExecuteTransaction",
        SIGN_PERSONAL_MESSAGE: "iota:signPersonalMessage",
        SIGN_TRANSACTION: "iota:signTransaction",
    };

    function get_wallets() {
        try {
            iota_wallets.set(
                getWallets()
                    .get()
                    .filter((wallet) => {
                        const raw_features = Object.values(features);
                        // console.log(wallet);
                        let isWalletWithRequired =
                            isWalletWithRequiredFeatureSet(
                                wallet,
                                raw_features,
                            );
                        // console.log(
                        //     "isWalletWithRequiredFeatureSet",
                        //     isWalletWithRequired,
                        // );
                        return isWalletWithRequired;
                    })
                    .map(
                        ({
                            accounts,
                            chains,
                            features: {
                                // @ts-ignore
                                [features.CONNECT]: { connect },
                                // @ts-ignore
                                [features.EVENTS]: { on },
                                // @ts-ignore
                                [features.SIGN_AND_EXECUTE_TRANSACTION]: {
                                    signAndExecuteTransaction,
                                },
                                // @ts-ignore
                                [features.SIGN_PERSONAL_MESSAGE]: {
                                    signPersonalMessage,
                                },
                                // @ts-ignore
                                [features.SIGN_TRANSACTION]: {
                                    // @ts-ignore
                                    signTransaction,
                                },
                            },
                            icon,
                            name,
                            version,
                        }) => {
                            console.log("connect", connect);
                            return {
                                accounts,
                                chains,
                                icon,
                                name,
                                version,
                                connect,
                                on,
                                signAndExecuteTransaction,
                                signPersonalMessage,
                                signTransaction,
                                features,
                            };
                        },
                    ),
            );

            console.log(iota_wallets);
            // @ts-ignore
            if (iota_wallets.length == 0) {
                throw new Error("no web wallet found");
            }
        } catch (err) {
            console.error(err);
        }
    }

    export const getActiveWallet = () => {
        return $iota_wallets[0];
    };

    const connectWallet = async () => {
        get_wallets();
        // @ts-ignore
        let connectResult = await $iota_wallets[0].connect();
        $iota_accounts = connectResult.accounts;
        $activeAddress = connectResult.accounts[0].address;
        console.log("web wallet connect result", connectResult);
        console.log($iota_accounts);
    };
</script>

<main>
    Active web wallet address:
    <select
        bind:value={$activeAddress}
        on:change={() => activeAddress.set($activeAddress)}
    >
        {#each $iota_accounts as account}
            <option value={account.address}>
                {account.address}
            </option>
        {/each}
    </select>
    <button on:click={() => connectWallet()}> Connect web wallet </button>
</main>
