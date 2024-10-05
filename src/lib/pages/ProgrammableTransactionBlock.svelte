<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import { IotaClient } from "@iota/iota-sdk/client";
    import {
        getWallets,
        isWalletWithRequiredFeatureSet,
        type Wallet,
    } from "@iota/wallet-standard";
    import JSONTree from "svelte-json-tree-auto";

    const features = {
        CONNECT: "standard:connect",
        EVENTS: "standard:events",
        SIGN_AND_EXECUTE_TRANSACTION_BLOCK:
            "iota:signAndExecuteTransactionBlock",
        SIGN_MESSAGE: "iota:signMessage",
        SIGN_PERSONAL_MESSAGE: "iota:signPersonalMessage",
        SIGN_TRANSACTION_BLOCK: "iota:signTransactionBlock",
    };

    let address =
        "0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215";
    let amount = "10";
    let pureInputData = "some data";
    // Will be updated with the result
    let value = {};

    let iota_wallets: Wallet[] = [];

    const client = new IotaClient({
        url: "https://api.iota-rebased-alphanet.iota.cafe",
    });

    try {
        iota_wallets = getWallets()
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
                        [features.CONNECT]: { connect },
                        [features.EVENTS]: { on },
                        [features.SIGN_AND_EXECUTE_TRANSACTION_BLOCK]: {
                            signAndExecuteTransactionBlock,
                        },
                        [features.SIGN_MESSAGE]: { signMessage },
                        [features.SIGN_PERSONAL_MESSAGE]: {
                            signPersonalMessage,
                        },
                        [features.SIGN_TRANSACTION_BLOCK]: {
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
            );

        if (iota_wallets.length == 0) {
            throw new Error("no web wallet found");
        }
        iota_wallets[0].on("change", console.log);
        iota_wallets[0].connect();
    } catch (err) {
        value = err.toString();
        console.error(err);
    }

    const executeMoveCall = async () => {
        try {
            if (address.length != 64 && address.length != 66) {
                throw new Error("address has an invalid length");
            }
            const tx = new Transaction();
            tx.pure("string", pureInputData);
            const coin = tx.splitCoins(tx.gas, [parseInt(amount)]);
            tx.transferObjects([coin], address);

            let txResult = await iota_wallets[0].signAndExecuteTransactionBlock(
                {
                    transactionBlock: tx,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                    },
                },
            );
            console.log(txResult);
            value = txResult;
            // result = JSON.stringify(txResult, null, 2);
            client.waitForTransaction({ digest: txResult.digest }).then(() => {
                console.log("tx block available via api");
            });
        } catch (err) {
            value = err.toString();
            console.error(err);
        }
    };
    let showJsonTree = true;
</script>

<main>
    <span>
        address:
        <input bind:value={address} placeholder="address" size="67" />
    </span>
    <br />
    <span>
        amount:
        <input bind:value={amount} placeholder="amount" size="60" />
    </span>
    <br />
    <span>
        pure input data:
        <input bind:value={pureInputData} placeholder="string" size="60" />
    </span>
    <br />

    <button on:click={() => executeMoveCall()}> execute move call </button>

    <div class="value" hidden={Object.keys(value).length == 0}>
        <button on:click={() => (showJsonTree = !showJsonTree)}>
            toggle JSON tree
        </button>
        <div hidden={!showJsonTree}>
            <JSONTree {value} />
        </div>
        <pre hidden={showJsonTree}>{JSON.stringify(value, null, 2)}</pre>
    </div>
</main>

<style>
    .value,
    pre {
        text-align: left;
    }
    button {
        margin: 0.5rem;
    }
</style>
