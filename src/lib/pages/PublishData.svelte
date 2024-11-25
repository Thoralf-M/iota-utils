<script lang="ts">
    import { Transaction } from "@iota/iota-sdk/transactions";
    import JSONTree from "svelte-json-tree-auto";
    import { getClient } from "../Client.svelte";
    import {
        activeAddress,
        iota_accounts,
        iota_wallets,
    } from "../WebWalletData.svelte";

    let pureInputData = "some data";
    // Will be updated with the result
    let value = {};

    const publishData = async () => {
        try {
            const tx = new Transaction();
            tx.pure("string", pureInputData);

            let txResult = await $iota_wallets[0].signAndExecuteTransaction({
                transaction: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
                account: $iota_accounts.filter(
                    (account) => account.address == $activeAddress,
                )[0],
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
    Publish data as input to a tx
    <br />
    <span>
        pure input data:
        <input bind:value={pureInputData} placeholder="string" size="60" />
    </span>
    <br />

    <button on:click={() => publishData()}> publish data in tx </button>

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
