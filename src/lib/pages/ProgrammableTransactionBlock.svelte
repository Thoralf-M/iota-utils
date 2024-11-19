<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "svelte-json-tree-auto";
    import { getClient } from "../Client.svelte";
    import { iota_wallets } from "../WebWalletData.svelte";

    // let address =
    // "0x111111111504e9350e635d65cd38ccd2c029434c6a3a480d8947a9ba6a15b215";
    // let amount = "10";
    let pureInputData = "some data";
    // Will be updated with the result
    let value = {};

    const executeMoveCall = async () => {
        try {
            // if (address.length != 64 && address.length != 66) {
            //     throw new Error("address has an invalid length");
            // }
            const tx = new Transaction();
            tx.pure("string", pureInputData);
            // const coin = tx.splitCoins(tx.gas, [parseInt(amount)]);
            // tx.transferObjects([coin], address);

            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
            });
            console.log(txResult);
            value = txResult;
            let client = await getClient();
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
    Send data
    <br />
    <!-- <span>
        address:
        <input bind:value={address} placeholder="address" size="67" />
    </span>
    <br />
    <span>
        amount:
        <input bind:value={amount} placeholder="amount" size="60" />
    </span> -->
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
