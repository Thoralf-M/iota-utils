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
        // TODO: update to signAndExecuteTransaction soon
        SIGN_AND_EXECUTE_TRANSACTION_BLOCK:
            "iota:signAndExecuteTransactionBlock",
        SIGN_MESSAGE: "iota:signMessage",
        SIGN_PERSONAL_MESSAGE: "iota:signPersonalMessage",
        SIGN_TRANSACTION_BLOCK: "iota:signTransactionBlock",
    };

    try {
        iota_wallets.set(
            getWallets()
                .get()
                .filter((wallet) => {
                    const raw_features = Object.values(features);
                    return isWalletWithRequiredFeatureSet(wallet, raw_features);
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
                            [features.SIGN_AND_EXECUTE_TRANSACTION_BLOCK]: {
                                // @ts-ignore
                                signAndExecuteTransactionBlock,
                            },
                            // @ts-ignore
                            [features.SIGN_MESSAGE]: { signMessage },
                            [features.SIGN_PERSONAL_MESSAGE]: {
                                // @ts-ignore
                                signPersonalMessage,
                            },
                            [features.SIGN_TRANSACTION_BLOCK]: {
                                // @ts-ignore
                                signTransactionBlock,
                            },
                        },
                        icon,
                        name,
                        version,
                    }) => ({
                        accounts,
                        chains,
                        icon,
                        name,
                        version,
                        connect,
                        on,
                        signAndExecuteTransactionBlock,
                        signMessage,
                        signPersonalMessage,
                        signTransactionBlock,
                        features,
                    }),
                ),
        );

        console.log(iota_wallets);
        if (iota_wallets.length == 0) {
            throw new Error("no web wallet found");
        }
    } catch (err) {
        console.error(err);
    }

    export const getActiveWallet = () => {
        return $iota_wallets[0];
    };

    let listening = false;

    const connectWallet = async () => {
        await $iota_wallets[0].connect();
        console.log($iota_wallets);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (!listening) {
            $iota_wallets[0].on("change", (c) => {
                console.log("change", c);
                $iota_accounts = c.accounts;
                $activeAddress = c.accounts[0].address;
                console.log("activeAddress", activeAddress);
            });

            // Contains web wallet connection messages
            window.addEventListener("message", (event) => {
                console.log(event);
            });
            listening = true;
        }
    };
</script>

<main>
    Active web wallet address: {$activeAddress}
    <!-- <div>
        Web wallet addresses:
        {#each $iota_accounts as iota_account, i}
            <div>
                {`Wallet ${i}: ` + iota_account.address}
            </div>
        {/each}
    </div> -->
    <button on:click={() => connectWallet()}> Connect web wallet </button>
</main>
