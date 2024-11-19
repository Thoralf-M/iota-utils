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

    try {
        iota_wallets.set(
            getWallets()
                .get()
                .filter((wallet) => {
                    const raw_features = Object.values(features);
                    // console.log(wallet);
                    let isWalletWithRequired = isWalletWithRequiredFeatureSet(
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
    <button on:click={() => connectWallet()}>
        Connect web wallet (currently experimental)
    </button>
</main>
