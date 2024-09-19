<script lang="ts">
    import {
        getWallets,
        isWalletWithRequiredFeatureSet,
    } from "@iota/wallet-standard";
    const features = {
        CONNECT: "standard:connect",
        EVENTS: "standard:events",
        SIGN_AND_EXECUTE_TRANSACTION_BLOCK:
            "iota:signAndExecuteTransactionBlock",
        SIGN_MESSAGE: "iota:signMessage",
        SIGN_PERSONAL_MESSAGE: "iota:signPersonalMessage",
        SIGN_TRANSACTION_BLOCK: "iota:signTransactionBlock",
    };

    const iota_wallets = getWallets()
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
                    [features.SIGN_PERSONAL_MESSAGE]: { signPersonalMessage },
                    [features.SIGN_TRANSACTION_BLOCK]: { signTransactionBlock },
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
            }),
        );

    if (iota_wallets.length == 0) {
        console.log("no wallet found");
    }

    iota_wallets[0].on("change", console.log);
    iota_wallets[0].connect();

    import { TransactionBlock } from "@iota/iota-sdk/transactions";
    import { IotaClient } from "@iota/iota-sdk/client";

    const client = new IotaClient({
        url: "https://api.iota-rebased-alphanet.iota.cafe",
    });
    client.queryTransactionBlocks({}).then(console.log);

    const executeMoveCall = () => {
        const tx = new TransactionBlock();
        tx.pure(data, "string");
        const coin = tx.splitCoins(tx.gas, [parseInt(amount)]);
        tx.transferObjects([coin], address);

        iota_wallets[0].signAndExecuteTransactionBlock(
            {
                transactionBlock: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                },
            },
            {
                onSuccess: (tx) => {
                    client
                        .waitForTransactionBlock({ digest: tx.digest })
                        .then(() => {
                            console.log("tx block available via api");
                            console.log(tx);
                        });
                },
            },
        );
    };

    let address =
        "0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215";
    let amount = "10";
    let data = "some data";
</script>

<main>
    <span>
        address:
        <input bind:value={address} placeholder="address" size="60" />
    </span>
    <br />
    <span>
        amount:
        <input bind:value={amount} placeholder="amount" size="60" />
    </span>
    <br />
    <span>
        data:
        <input bind:value={data} placeholder="data" size="60" />
    </span>
    <br />

    <button on:click={() => executeMoveCall()}> execute move call </button>
</main>
